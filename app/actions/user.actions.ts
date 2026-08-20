"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import { setUserRoleSchema } from "@/lib/schemas/user.schema";
import {
  SerializedUser,
  setUserRole as setUserRoleService,
  searchUsers as searchUsersService,
  UserSearchResult,
} from "@/lib/services/user.service";

export type { UserSearchResult };

/**
 * Grant or revoke MANAGER role for a user (MANAGER only).
 */
export async function setUserRole(
  userId: string,
  role: "MANAGER" | "USER"
): Promise<Result<SerializedUser>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Chỉ có quản lý mới có quyền thay đổi vai trò người dùng", ERROR_CODES.FORBIDDEN);
    }

    const parsed = setUserRoleSchema.safeParse({ userId, role });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const updatedUser = await setUserRoleService(parsed.data.userId, parsed.data.role);
    if (!updatedUser) {
      return fail("Không tìm thấy người dùng", ERROR_CODES.NOT_FOUND);
    }

    return ok(updatedUser);
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return fail("Đã xảy ra lỗi khi cập nhật vai trò người dùng", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Search users by email or name (MANAGER only).
 */
export async function searchUsers(
  query: string
): Promise<Result<UserSearchResult[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail(
        "Chỉ có quản lý mới có quyền tìm kiếm người dùng",
        ERROR_CODES.FORBIDDEN
      );
    }

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return ok([]);
    }

    const results = await searchUsersService(query.trim());
    return ok(results);
  } catch (error: any) {
    console.error("Error searching users:", error);
    return fail(
      "Đã xảy ra lỗi khi tìm kiếm người dùng",
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}

