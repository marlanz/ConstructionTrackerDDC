"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import {
  createInstallationTaskSchema,
  reorderInstallationTasksSchema,
  updateInstallationTaskSchema,
  updateTaskProgressSchema,
} from "@/lib/schemas/installationDetail.schema";
import {
  createInstallationTask as createInstallationTaskService,
  getInstallationTaskById,
  listInstallationTasks as listInstallationTasksService,
  reorderInstallationTasks as reorderInstallationTasksService,
  SerializedInstallationTask,
  updateInstallationTask as updateInstallationTaskService,
  updateTaskProgress as updateTaskProgressService,
} from "@/lib/services/installationDetail.service";
import { canAccessProject } from "@/lib/services/project.service";
import { hasMembership } from "@/lib/services/projectMember.service";
import { revalidateTag } from "next/cache";

/**
 * Helper to enforce SUPERVISOR-only write access per DATA_MODEL_SPEC.md §3.3:
 * MANAGER has read-only access; creating/editing installation plan items requires project membership (SUPERVISOR).
 */
async function canWriteProjectPlan(userId: string, projectId: string): Promise<boolean> {
  return hasMembership(userId, projectId);
}

/**
 * Create a new installation task item (SUPERVISOR only on assigned project).
 */
export async function createInstallationTask(
  projectId: string,
  input: unknown
): Promise<Result<SerializedInstallationTask>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const isSupervisor = await canWriteProjectPlan(user.id, projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền tạo hạng mục công việc cho dự án này",
        ERROR_CODES.FORBIDDEN
      );
    }

    const parsed = createInstallationTaskSchema.safeParse({
      ...(input && typeof input === "object" ? input : {}),
      projectId,
    });

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const task = await createInstallationTaskService(projectId, parsed.data);
    revalidateTag(`project:${projectId}`, "max");
    return ok(task);
  } catch (error: any) {
    console.error("Error creating installation task:", error);
    return fail("Đã xảy ra lỗi khi tạo hạng mục lắp đặt", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Update an existing installation task (SUPERVISOR only on assigned project).
 */
export async function updateInstallationTask(
  taskId: string,
  input: unknown
): Promise<Result<SerializedInstallationTask>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const existingTask = await getInstallationTaskById(taskId);
    if (!existingTask) {
      return fail("Không tìm thấy hạng mục lắp đặt", ERROR_CODES.NOT_FOUND);
    }

    const isSupervisor = await canWriteProjectPlan(user.id, existingTask.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền cập nhật hạng mục công việc cho dự án này",
        ERROR_CODES.FORBIDDEN
      );
    }

    const parsed = updateInstallationTaskSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const updated = await updateInstallationTaskService(taskId, parsed.data);
    revalidateTag(`project:${existingTask.projectId}`, "max");
    return ok(updated);
  } catch (error: any) {
    if (error.message === "TASK_NOT_FOUND") {
      return fail("Không tìm thấy hạng mục lắp đặt", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error updating installation task:", error);
    return fail("Đã xảy ra lỗi khi cập nhật hạng mục lắp đặt", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Update task progression (0–100) (SUPERVISOR only on assigned project).
 */
export async function updateTaskProgress(
  taskId: string,
  progression: number
): Promise<Result<SerializedInstallationTask>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const parsed = updateTaskProgressSchema.safeParse({ taskId, progression });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const existingTask = await getInstallationTaskById(taskId);
    if (!existingTask) {
      return fail("Không tìm thấy hạng mục lắp đặt", ERROR_CODES.NOT_FOUND);
    }

    const isSupervisor = await canWriteProjectPlan(user.id, existingTask.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền cập nhật tiến độ hạng mục",
        ERROR_CODES.FORBIDDEN
      );
    }

    const updated = await updateTaskProgressService(taskId, parsed.data.progression);
    revalidateTag(`project:${existingTask.projectId}`, "max");
    return ok(updated);
  } catch (error: any) {
    if (error.message === "TASK_NOT_FOUND") {
      return fail("Không tìm thấy hạng mục lắp đặt", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error updating task progress:", error);
    return fail("Đã xảy ra lỗi khi cập nhật tiến độ hạng mục", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Reorder installation tasks sequence (SUPERVISOR only on assigned project).
 */
export async function reorderInstallationTasks(
  projectId: string,
  orderedTaskIds: string[]
): Promise<Result<{ reordered: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const parsed = reorderInstallationTasksSchema.safeParse({ projectId, orderedTaskIds });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const isSupervisor = await canWriteProjectPlan(user.id, projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền sắp xếp lại thứ tự hạng mục cho dự án này",
        ERROR_CODES.FORBIDDEN
      );
    }

    await reorderInstallationTasksService(projectId, parsed.data.orderedTaskIds);
    revalidateTag(`project:${projectId}`, "max");
    return ok({ reordered: true });
  } catch (error: any) {
    console.error("Error reordering installation tasks:", error);
    return fail("Đã xảy ra lỗi khi sắp xếp lại thứ tự hạng mục", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * List installation tasks for a project (MANAGER: any project; SUPERVISOR: assigned project).
 */
export async function listInstallationTasks(
  projectId: string
): Promise<Result<SerializedInstallationTask[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const hasAccess = await canAccessProject({ id: user.id, role: user.role }, projectId);
    if (!hasAccess) {
      return fail("Bạn không có quyền truy cập dự án này", ERROR_CODES.FORBIDDEN);
    }

    const tasks = await listInstallationTasksService(projectId);
    return ok(tasks);
  } catch (error: any) {
    console.error("Error listing installation tasks:", error);
    return fail("Đã xảy ra lỗi khi tải danh sách hạng mục lắp đặt", ERROR_CODES.INTERNAL_ERROR);
  }
}
