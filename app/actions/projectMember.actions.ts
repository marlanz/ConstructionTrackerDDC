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
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Only managers can assign project members", ERROR_CODES.FORBIDDEN);
    }

    const parsed = addProjectMemberSchema.safeParse({ projectId, userId });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid input", ERROR_CODES.VALIDATION_ERROR);
    }

    const member = await addProjectMemberService(parsed.data.projectId, parsed.data.userId);
    return ok(member);
  } catch (error: any) {
    if (error.message === "MEMBER_EXISTS") {
      return fail("User is already a member of this project", ERROR_CODES.CONFLICT);
    }
    console.error("Error adding project member:", error);
    return fail("An error occurred while adding project member", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Remove a supervisor from a project (MANAGER only). Hard delete.
 */
export async function removeProjectMember(memberId: string): Promise<Result<{ removed: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Only managers can remove project members", ERROR_CODES.FORBIDDEN);
    }

    const parsed = removeProjectMemberSchema.safeParse({ memberId });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid input", ERROR_CODES.VALIDATION_ERROR);
    }

    const success = await removeProjectMemberService(parsed.data.memberId);
    if (!success) {
      return fail("Project member assignment not found", ERROR_CODES.NOT_FOUND);
    }

    return ok({ removed: true });
  } catch (error: any) {
    console.error("Error removing project member:", error);
    return fail("An error occurred while removing project member", ERROR_CODES.INTERNAL_ERROR);
  }
}
