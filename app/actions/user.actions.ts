"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import { setUserRoleSchema } from "@/lib/schemas/user.schema";
import { SerializedUser, setUserRole as setUserRoleService } from "@/lib/services/user.service";

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
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Only managers can change user roles", ERROR_CODES.FORBIDDEN);
    }

    const parsed = setUserRoleSchema.safeParse({ userId, role });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid input", ERROR_CODES.VALIDATION_ERROR);
    }

    const updatedUser = await setUserRoleService(parsed.data.userId, parsed.data.role);
    if (!updatedUser) {
      return fail("User not found", ERROR_CODES.NOT_FOUND);
    }

    return ok(updatedUser);
  } catch (error: any) {
    console.error("Error setting user role:", error);
    return fail("An error occurred while updating user role", ERROR_CODES.INTERNAL_ERROR);
  }
}
