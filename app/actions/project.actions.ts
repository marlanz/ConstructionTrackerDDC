"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/schemas/project.schema";
import {
  canAccessProject,
  createProject as createProjectService,
  deleteProject as deleteProjectService,
  getProjectById,
  getProjectOverview as getProjectOverviewService,
  listProjectsForUser,
  ProjectOverview,
  SerializedProject,
  updateProject as updateProjectService,
} from "@/lib/services/project.service";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * Create a new project (MANAGER only).
 */
export async function createProject(
  input: unknown,
): Promise<Result<SerializedProject>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Chỉ có quản lý mới có quyền tạo dự án", ERROR_CODES.FORBIDDEN);
    }

    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const project = await createProjectService(parsed.data);
    updateTag("projects");
    revalidateTag("projects", "max");
    revalidatePath("/projects");
    return ok(project);
  } catch (error: any) {
    if (error.message === "PROJECT_CODE_EXISTS") {
      return fail(
        "Mã dự án này đã tồn tại trong hệ thống",
        ERROR_CODES.CONFLICT,
      );
    }
    console.error("Error creating project:", error);
    return fail(
      "Đã xảy ra lỗi khi tạo dự án",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Update an existing project (MANAGER only).
 */
export async function updateProject(
  projectId: string,
  input: unknown,
): Promise<Result<SerializedProject>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail(
        "Chỉ có quản lý mới có quyền cập nhật thông tin dự án",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updated = await updateProjectService(projectId, parsed.data);
    updateTag("projects");
    updateTag(`project:${projectId}`);
    revalidateTag("projects", "max");
    revalidateTag(`project:${projectId}`, "max");
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/plan`);
    revalidatePath(`/projects/${projectId}/reports`);
    return ok(updated);
  } catch (error: any) {
    if (error.message === "PROJECT_NOT_FOUND") {
      return fail("Không tìm thấy dự án", ERROR_CODES.NOT_FOUND);
    }
    if (error.message === "PROJECT_CODE_EXISTS") {
      return fail(
        "Mã dự án này đã tồn tại trong hệ thống",
        ERROR_CODES.CONFLICT,
      );
    }
    console.error("Error updating project:", error);
    return fail(
      "Đã xảy ra lỗi khi cập nhật dự án",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Hard delete a project and all associated resources (MANAGER only).
 * Requires exact confirmation of projectCode.
 */
export async function deleteProject(
  projectId: string,
  confirmationCode: string,
): Promise<Result<{ deleted: true }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail(
        "Chỉ có quản lý mới có quyền xóa dự án",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return fail("Không tìm thấy dự án", ERROR_CODES.NOT_FOUND);
    }

    // Confirmation check (server-side, not just UI):
    // Compare confirmationCode against projectCode
    if (confirmationCode !== project.projectCode) {
      return fail("Mã dự án không khớp", ERROR_CODES.VALIDATION_ERROR);
    }

    await deleteProjectService(projectId);
    updateTag("projects");
    updateTag(`project:${projectId}`);
    revalidateTag("projects", "max");
    revalidateTag(`project:${projectId}`, "max");
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return ok({ deleted: true });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return fail(
      "Đã xảy ra lỗi khi xóa dự án",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * List projects accessible by the caller.
 * - MANAGER: all projects
 * - USER: only projects with a project_members row
 */
export async function listMyProjects(): Promise<Result<SerializedProject[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const projects = await listProjectsForUser({
      id: user.id,
      role: user.role,
    });
    return ok(projects);
  } catch (error: any) {
    console.error("Error listing projects:", error);
    return fail(
      "Đã xảy ra lỗi khi tải danh sách dự án",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Get detailed project overview (MANAGER: any project; SUPERVISOR: assigned projects only).
 */
export async function getProjectOverview(
  projectId: string,
): Promise<Result<ProjectOverview>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const hasAccess = await canAccessProject(
      { id: user.id, role: user.role },
      projectId,
    );
    if (!hasAccess) {
      return fail("Bạn không có quyền truy cập dự án này", ERROR_CODES.FORBIDDEN);
    }

    const overview = await getProjectOverviewService(projectId);
    if (!overview) {
      return fail("Không tìm thấy dự án", ERROR_CODES.NOT_FOUND);
    }

    return ok(overview);
  } catch (error: any) {
    console.error("Error fetching project overview:", error);
    return fail(
      "Đã xảy ra lỗi khi tải thông tin tổng quan dự án",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
