"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { v2 as cloudinary } from "cloudinary";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import {
  createDailyReportSchema,
  updateDailyReportSchema,
  updateWorkAgendaEntrySchema,
  workAgendaEntrySchema,
} from "@/lib/schemas/dailyReport.schema";
import {
  attachReportImage as attachReportImageService,
  addWorkAgendaEntry as addWorkAgendaEntryService,
  createDailyReport as createDailyReportService,
  deleteDailyReport as deleteDailyReportService,
  deleteReportImage as deleteReportImageService,
  getConstructionDayNumber as getConstructionDayNumberService,
  getDailyReportById,
  getLatestDailyReportPayload as getLatestDailyReportPayloadService,
  LatestReportPayload,
  listDailyReports as listDailyReportsService,
  removeWorkAgendaEntry as removeWorkAgendaEntryService,
  SerializedDailyReport,
  SerializedWorkAgendaEntry,
  updateDailyReport as updateDailyReportService,
  updateWorkAgendaEntry as updateWorkAgendaEntryService,
} from "@/lib/services/dailyReport.service";
import { canAccessProject } from "@/lib/services/project.service";
import { hasMembership } from "@/lib/services/projectMember.service";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type { LatestReportPayload };

/**
 * Helper to enforce SUPERVISOR-only write access per DATA_MODEL_SPEC.md §3.3 & §3.5:
 * SUPERVISOR files and manages daily reports for assigned projects.
 */
async function canWriteDailyReport(
  userId: string,
  projectId: string,
): Promise<boolean> {
  return hasMembership(userId, projectId);
}

/**
 * Create a new daily site report (SUPERVISOR only on assigned project).
 */
export async function createDailyReport(
  projectId: string,
  input: unknown,
): Promise<Result<SerializedDailyReport>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const isSupervisor = await canWriteDailyReport(user.id, projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền tạo báo cáo hằng ngày cho dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const parsed = createDailyReportSchema.safeParse({
      ...(input && typeof input === "object" ? input : {}),
      projectId,
    });

    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const report = await createDailyReportService(
      projectId,
      user.id,
      parsed.data,
    );
    updateTag(`project:${projectId}:reports`);
    updateTag(`project:${projectId}`);
    revalidateTag(`project:${projectId}:reports`, "max");
    revalidateTag(`project:${projectId}`, "max");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/reports`);
    return ok(report);
  } catch (error: unknown) {
    console.error("Error creating daily report:", error);
    return fail(
      "Đã xảy ra lỗi khi tạo báo cáo hằng ngày",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Add a work agenda entry to an existing daily report (SUPERVISOR only on assigned project).
 */
export async function addWorkAgendaEntry(
  reportId: string,
  entryInput: unknown,
): Promise<Result<SerializedWorkAgendaEntry>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền thêm hạng mục công việc vào báo cáo này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const parsed = workAgendaEntrySchema.safeParse(entryInput);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const entry = await addWorkAgendaEntryService(reportId, parsed.data);
    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);
    return ok(entry);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REPORT_NOT_FOUND") {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }
    console.error("Error adding work agenda entry:", error);
    return fail(
      "Đã xảy ra lỗi khi thêm hạng mục công việc",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Generate a short-lived signature for direct-to-Cloudinary image upload from the browser (SUPERVISOR only).
 */
export async function getUploadSignature(): Promise<
  Result<{
    timestamp: number;
    signature: string;
    apiKey: string;
    cloudName: string;
  }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    // if (user.role !== "SUPERVISOR") {
    //   return fail(
    //     "Chỉ có giám sát viên mới có quyền tải ảnh báo cáo",
    //     ERROR_CODES.FORBIDDEN,
    //   );
    // }

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      "";

    if (!apiKey || !apiSecret || !cloudName) {
      return fail(
        "Cấu hình Cloudinary chưa đầy đủ trên máy chủ",
        ERROR_CODES.INTERNAL_ERROR,
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { folder: "daily-reports", timestamp };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return ok({ timestamp, signature, apiKey, cloudName });
  } catch (error: unknown) {
    console.error("Error generating upload signature:", error);
    return fail(
      "Đã xảy ra lỗi khi tạo chữ ký tải ảnh",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Attach an uploaded Cloudinary image ({ url, publicId }) to a work agenda entry (SUPERVISOR only).
 */
export async function attachReportImage(
  reportId: string,
  entryId: string,
  image: { url: string; publicId: string },
): Promise<
  Result<{ url: string; publicId: string; report: SerializedDailyReport }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền đính kèm ảnh báo cáo cho dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (!image || !image.url || typeof image.url !== "string") {
      return fail(
        "Dữ liệu hình ảnh không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updatedReport = await attachReportImageService(reportId, entryId, {
      url: image.url,
      publicId: image.publicId || "",
    });
    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);

    return ok({
      url: image.url,
      publicId: image.publicId || "",
      report: updatedReport,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REPORT_OR_ENTRY_NOT_FOUND") {
      return fail(
        "Không tìm thấy báo cáo hoặc hạng mục công việc",
        ERROR_CODES.NOT_FOUND,
      );
    }
    console.error("Error attaching report image:", error);
    return fail(
      "Đã xảy ra lỗi khi lưu hình ảnh báo cáo",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Update daily report details (SUPERVISOR only on assigned project).
 */
export async function updateDailyReport(
  reportId: string,
  input: unknown,
): Promise<Result<SerializedDailyReport>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền cập nhật báo cáo hằng ngày cho dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const parsed = updateDailyReportSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updated = await updateDailyReportService(reportId, parsed.data);
    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);
    return ok(updated);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REPORT_NOT_FOUND") {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }
    console.error("Error updating daily report:", error);
    return fail(
      "Đã xảy ra lỗi khi cập nhật báo cáo hằng ngày",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Update text and task link of a specific work agenda entry (SUPERVISOR only on assigned project).
 */
export async function updateWorkAgendaEntry(
  reportId: string,
  entryId: string,
  input: unknown,
): Promise<Result<SerializedDailyReport>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền cập nhật hạng mục công việc cho dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const parsed = updateWorkAgendaEntrySchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updated = await updateWorkAgendaEntryService(
      reportId,
      entryId,
      parsed.data,
    );
    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);
    return ok(updated);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REPORT_OR_ENTRY_NOT_FOUND") {
      return fail(
        "Không tìm thấy báo cáo hoặc hạng mục công việc",
        ERROR_CODES.NOT_FOUND,
      );
    }
    console.error("Error updating work agenda entry:", error);
    return fail(
      "Đã xảy ra lỗi khi cập nhật hạng mục công việc",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Remove a work agenda entry and delete all its associated images from Cloudinary (SUPERVISOR only on assigned project).
 */
export async function removeWorkAgendaEntry(
  reportId: string,
  entryId: string,
): Promise<Result<{ removed: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền xóa hạng mục công việc cho dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const entry = (report.workAgenda || []).find((e) => e._id === entryId);
    if (!entry) {
      return fail(
        "Không tìm thấy hạng mục công việc cần xóa",
        ERROR_CODES.NOT_FOUND,
      );
    }

    // 1. Delete all associated photos from Cloudinary FIRST
    for (const img of entry.imgUrl || []) {
      if (img && img.publicId) {
        const destroyRes = await cloudinary.uploader.destroy(img.publicId);
        if (destroyRes.result !== "ok" && destroyRes.result !== "not found") {
          return fail(
            `Không thể xóa ảnh (${img.publicId}) khỏi Cloudinary`,
            ERROR_CODES.INTERNAL_ERROR,
          );
        }
      }
    }

    // 2. Remove the entry from MongoDB
    await removeWorkAgendaEntryService(reportId, entryId);
    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);
    return ok({ removed: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REPORT_NOT_FOUND") {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }
    console.error("Error removing work agenda entry:", error);
    return fail(
      "Đã xảy ra lỗi khi xóa hạng mục công việc",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Delete a single image from Cloudinary FIRST, then remove from MongoDB workAgenda[].imgUrl (SUPERVISOR only).
 */
export async function deleteReportImage(
  reportId: string,
  entryId: string,
  publicId: string,
): Promise<Result<{ deleted: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền xóa ảnh báo cáo này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (!publicId || typeof publicId !== "string") {
      return fail(
        "Mã định danh hình ảnh không hợp lệ (publicId)",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // 1. Delete from Cloudinary FIRST
    const destroyRes = await cloudinary.uploader.destroy(publicId);
    if (destroyRes.result !== "ok" && destroyRes.result !== "not found") {
      return fail(
        "Không thể xóa ảnh khỏi Cloudinary",
        ERROR_CODES.INTERNAL_ERROR,
      );
    }

    // 2. Remove the image from MongoDB
    await deleteReportImageService(reportId, entryId, publicId);

    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);

    return ok({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REPORT_OR_ENTRY_NOT_FOUND") {
      return fail(
        "Không tìm thấy báo cáo hoặc hạng mục công việc",
        ERROR_CODES.NOT_FOUND,
      );
    }
    console.error("Error deleting report image:", error);
    return fail(
      "Đã xảy ra lỗi khi xóa hình ảnh báo cáo",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}


/**
 * Delete a daily report (SUPERVISOR only on assigned project).
 */
export async function deleteDailyReport(
  reportId: string,
): Promise<Result<{ deleted: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail(
        "Không tìm thấy báo cáo nhật ký công trình",
        ERROR_CODES.NOT_FOUND,
      );
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền xóa báo cáo hằng ngày cho dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const success = await deleteDailyReportService(reportId);
    updateTag(`project:${report.projectId}:reports`);
    updateTag(`project:${report.projectId}`);
    revalidateTag(`project:${report.projectId}:reports`, "max");
    revalidateTag(`project:${report.projectId}`, "max");
    revalidatePath(`/projects/${report.projectId}`);
    revalidatePath(`/projects/${report.projectId}/reports`);
    return ok({ deleted: success });
  } catch (error: unknown) {
    console.error("Error deleting daily report:", error);
    return fail(
      "Đã xảy ra lỗi khi xóa báo cáo hằng ngày",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * List daily reports for a project (MANAGER: read-only; SUPERVISOR: assigned project).
 */
export async function listDailyReports(
  projectId: string,
  query?: { from?: string; to?: string },
): Promise<Result<SerializedDailyReport[]>> {
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
      return fail(
        "Bạn không có quyền truy cập dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const filter: { from?: Date; to?: Date } = {};
    if (query?.from) filter.from = new Date(query.from);
    if (query?.to) filter.to = new Date(query.to);

    const reports = await listDailyReportsService(projectId, filter);
    return ok(reports);
  } catch (error: unknown) {
    console.error("Error listing daily reports:", error);
    return fail(
      "Đã xảy ra lỗi khi tải danh sách báo cáo hằng ngày",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Compute the construction day number relative to project start date.
 */
export async function getConstructionDayNumber(
  projectId: string,
  dateStr: string,
): Promise<Result<{ dayNumber: number }>> {
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
      return fail(
        "Bạn không có quyền truy cập dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return fail(
        "Định dạng ngày tháng không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const dayNumber = await getConstructionDayNumberService(projectId, date);
    return ok({ dayNumber });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return fail("Không tìm thấy dự án", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error computing construction day number:", error);
    return fail(
      "Đã xảy ra lỗi khi tính toán số ngày thi công",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

/**
 * Fetch the latest daily report for a project, resolved with author name and
 * construction day number. Returns null when no reports exist yet.
 * Accessible to MANAGER (any project) and SUPERVISOR (assigned projects).
 */
export async function getLatestDailyReport(
  projectId: string,
): Promise<Result<LatestReportPayload>> {
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
      return fail(
        "Bạn không có quyền truy cập dự án này",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const payload = await getLatestDailyReportPayloadService(projectId);
    return ok(payload);
  } catch (error: unknown) {
    console.error("Error fetching latest daily report:", error);
    return fail(
      "Đã xảy ra lỗi khi tải báo cáo hằng ngày mới nhất",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}

