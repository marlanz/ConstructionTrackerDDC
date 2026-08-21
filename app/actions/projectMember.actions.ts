"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import { addProjectMemberSchema, removeProjectMemberSchema } from "@/lib/schemas/projectMember.schema";
import {
  addProjectMember as addProjectMemberService,
  removeProjectMember as removeProjectMemberService,
  SerializedProjectMember,
} from "@/lib/services/projectMember.service";
import { getProjectMembersCollection } from "@/lib/db/collections";
import { revalidateTag } from "next/cache";
import { ObjectId } from "mongodb";

/**
 * Add a supervisor to a project (MANAGER only).
 */
export async function addProjectMember(
  projectId: string,
  userId: string
): Promise<Result<SerializedProjectMember>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Chỉ có quản lý mới có quyền phân công thành viên dự án", ERROR_CODES.FORBIDDEN);
    }

    const parsed = addProjectMemberSchema.safeParse({ projectId, userId });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const member = await addProjectMemberService(parsed.data.projectId, parsed.data.userId);
    revalidateTag(`project:${projectId}`, "max");
    return ok(member);
  } catch (error: any) {
    if (error.message === "MEMBER_EXISTS") {
      return fail("Người dùng này đã được phân công vào dự án", ERROR_CODES.CONFLICT);
    }
    console.error("Error adding project member:", error);
    return fail("Đã xảy ra lỗi khi thêm thành viên vào dự án", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Remove a supervisor from a project (MANAGER only). Hard delete.
 * Looks up the member's projectId before deletion so we can revalidate the right tag.
 */
export async function removeProjectMember(memberId: string): Promise<Result<{ removed: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Chỉ có quản lý mới có quyền xóa thành viên khỏi dự án", ERROR_CODES.FORBIDDEN);
    }

    const parsed = removeProjectMemberSchema.safeParse({ memberId });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    // Fetch member before deletion to know which project tag to revalidate
    const col = await getProjectMembersCollection();
    const memberDoc = ObjectId.isValid(parsed.data.memberId)
      ? await col.findOne({ _id: new ObjectId(parsed.data.memberId) })
      : null;

    const success = await removeProjectMemberService(parsed.data.memberId);
    if (!success) {
      return fail("Không tìm thấy phân công thành viên dự án", ERROR_CODES.NOT_FOUND);
    }

    if (memberDoc) {
      revalidateTag(`project:${memberDoc.projectId.toString()}`, "max");
    }

    return ok({ removed: true });
  } catch (error: any) {
    console.error("Error removing project member:", error);
    return fail("Đã xảy ra lỗi khi xóa thành viên khỏi dự án", ERROR_CODES.INTERNAL_ERROR);
  }
}
