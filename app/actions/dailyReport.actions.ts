"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { ERROR_CODES } from "@/lib/errors";
import { fail, ok, Result } from "@/lib/result";
import {
  addWorkAgendaEntrySchema,
  createDailyReportSchema,
  updateDailyReportSchema,
  workAgendaEntrySchema,
} from "@/lib/schemas/dailyReport.schema";
import {
  addReportImageUrl,
  addWorkAgendaEntry as addWorkAgendaEntryService,
  createDailyReport as createDailyReportService,
  deleteDailyReport as deleteDailyReportService,
  getConstructionDayNumber as getConstructionDayNumberService,
  getDailyReportById,
  getLatestDailyReport as getLatestDailyReportService,
  listDailyReports as listDailyReportsService,
  SerializedDailyReport,
  SerializedWorkAgendaEntry,
  updateDailyReport as updateDailyReportService,
} from "@/lib/services/dailyReport.service";
import { canAccessProject } from "@/lib/services/project.service";
import { hasMembership } from "@/lib/services/projectMember.service";
import { getUserById } from "@/lib/services/user.service";

/**
 * Payload returned by getLatestDailyReport.
 * null when the project has no reports yet.
 */
export type LatestReportPayload =
  | {
      report: SerializedDailyReport;
      dayNumber: number;
      createdByName: string;
    }
  | null;

/**
 * Helper to enforce SUPERVISOR-only write access per DATA_MODEL_SPEC.md §3.3 & §3.5:
 * SUPERVISOR files and manages daily reports for assigned projects.
 */
async function canWriteDailyReport(userId: string, projectId: string): Promise<boolean> {
  return hasMembership(userId, projectId);
}

/**
 * Create a new daily site report (SUPERVISOR only on assigned project).
 */
export async function createDailyReport(
  projectId: string,
  input: unknown
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
        ERROR_CODES.FORBIDDEN
      );
    }

    const parsed = createDailyReportSchema.safeParse({
      ...(input && typeof input === "object" ? input : {}),
      projectId,
    });

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const report = await createDailyReportService(projectId, user.id, parsed.data);
    return ok(report);
  } catch (error: any) {
    console.error("Error creating daily report:", error);
    return fail("Đã xảy ra lỗi khi tạo báo cáo hằng ngày", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Add a work agenda entry to an existing daily report (SUPERVISOR only on assigned project).
 */
export async function addWorkAgendaEntry(
  reportId: string,
  entryInput: unknown
): Promise<Result<SerializedWorkAgendaEntry>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail("Không tìm thấy báo cáo nhật ký công trình", ERROR_CODES.NOT_FOUND);
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền thêm hạng mục công việc vào báo cáo này",
        ERROR_CODES.FORBIDDEN
      );
    }

    const parsed = workAgendaEntrySchema.safeParse(entryInput);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const entry = await addWorkAgendaEntryService(reportId, parsed.data);
    return ok(entry);
  } catch (error: any) {
    if (error.message === "REPORT_NOT_FOUND") {
      return fail("Không tìm thấy báo cáo nhật ký công trình", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error adding work agenda entry:", error);
    return fail("Đã xảy ra lỗi khi thêm hạng mục công việc", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Upload an image to Cloudinary and append its URL to a report entry's imgUrl array (SUPERVISOR only).
 * Accepts base64 image data URI string or Cloudinary-supported image string.
 */
export async function uploadReportImage(
  reportId: string,
  entryId: string,
  fileData: string
): Promise<Result<{ url: string; report: SerializedDailyReport }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail("Không tìm thấy báo cáo nhật ký công trình", ERROR_CODES.NOT_FOUND);
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền tải ảnh hình ảnh báo cáo cho dự án này",
        ERROR_CODES.FORBIDDEN
      );
    }

    if (!fileData || typeof fileData !== "string") {
      return fail("Thiếu dữ liệu tệp hình ảnh", ERROR_CODES.VALIDATION_ERROR);
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImageToCloudinary(fileData);

    // Save image URL to DB
    const updatedReport = await addReportImageUrl(reportId, entryId, uploadResult.url);

    return ok({ url: uploadResult.url, report: updatedReport });
  } catch (error: any) {
    if (error.message === "REPORT_OR_ENTRY_NOT_FOUND") {
      return fail("Không tìm thấy báo cáo hoặc hạng mục công việc", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error uploading report image:", error);
    return fail("Đã xảy ra lỗi khi tải ảnh báo cáo lên hệ thống", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Update daily report details (SUPERVISOR only on assigned project).
 */
export async function updateDailyReport(
  reportId: string,
  input: unknown
): Promise<Result<SerializedDailyReport>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail("Không tìm thấy báo cáo nhật ký công trình", ERROR_CODES.NOT_FOUND);
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền cập nhật báo cáo hằng ngày cho dự án này",
        ERROR_CODES.FORBIDDEN
      );
    }

    const parsed = updateDailyReportSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Dữ liệu nhập không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const updated = await updateDailyReportService(reportId, parsed.data);
    return ok(updated);
  } catch (error: any) {
    if (error.message === "REPORT_NOT_FOUND") {
      return fail("Không tìm thấy báo cáo nhật ký công trình", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error updating daily report:", error);
    return fail("Đã xảy ra lỗi khi cập nhật báo cáo hằng ngày", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Delete a daily report (SUPERVISOR only on assigned project).
 */
export async function deleteDailyReport(reportId: string): Promise<Result<{ deleted: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const report = await getDailyReportById(reportId);
    if (!report) {
      return fail("Không tìm thấy báo cáo nhật ký công trình", ERROR_CODES.NOT_FOUND);
    }

    const isSupervisor = await canWriteDailyReport(user.id, report.projectId);
    if (!isSupervisor) {
      return fail(
        "Chỉ có giám sát viên được phân công mới có quyền xóa báo cáo hằng ngày cho dự án này",
        ERROR_CODES.FORBIDDEN
      );
    }

    const success = await deleteDailyReportService(reportId);
    return ok({ deleted: success });
  } catch (error: any) {
    console.error("Error deleting daily report:", error);
    return fail("Đã xảy ra lỗi khi xóa báo cáo hằng ngày", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * List daily reports for a project (MANAGER: read-only; SUPERVISOR: assigned project).
 */
export async function listDailyReports(
  projectId: string,
  query?: { from?: string; to?: string }
): Promise<Result<SerializedDailyReport[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const hasAccess = await canAccessProject({ id: user.id, role: user.role }, projectId);
    if (!hasAccess) {
      return fail("Bạn không có quyền truy cập dự án này", ERROR_CODES.FORBIDDEN);
    }

    const filter: { from?: Date; to?: Date } = {};
    if (query?.from) filter.from = new Date(query.from);
    if (query?.to) filter.to = new Date(query.to);

    const reports = await listDailyReportsService(projectId, filter);
    return ok(reports);
  } catch (error: any) {
    console.error("Error listing daily reports:", error);
    return fail("Đã xảy ra lỗi khi tải danh sách báo cáo hằng ngày", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Compute the construction day number relative to project start date.
 */
export async function getConstructionDayNumber(
  projectId: string,
  dateStr: string
): Promise<Result<{ dayNumber: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const hasAccess = await canAccessProject({ id: user.id, role: user.role }, projectId);
    if (!hasAccess) {
      return fail("Bạn không có quyền truy cập dự án này", ERROR_CODES.FORBIDDEN);
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return fail("Định dạng ngày tháng không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const dayNumber = await getConstructionDayNumberService(projectId, date);
    return ok({ dayNumber });
  } catch (error: any) {
    if (error.message === "PROJECT_NOT_FOUND") {
      return fail("Không tìm thấy dự án", ERROR_CODES.NOT_FOUND);
    }
    console.error("Error computing construction day number:", error);
    return fail("Đã xảy ra lỗi khi tính toán số ngày thi công", ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Fetch the latest daily report for a project, resolved with author name and
 * construction day number. Returns null when no reports exist yet.
 * Accessible to MANAGER (any project) and SUPERVISOR (assigned projects).
 */
export async function getLatestDailyReport(
  projectId: string
): Promise<Result<LatestReportPayload>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Chưa đăng nhập", ERROR_CODES.UNAUTHENTICATED);
    }

    const hasAccess = await canAccessProject({ id: user.id, role: user.role }, projectId);
    if (!hasAccess) {
      return fail("Bạn không có quyền truy cập dự án này", ERROR_CODES.FORBIDDEN);
    }

    const report = await getLatestDailyReportService(projectId);
    if (!report) {
      return ok(null);
    }

    // Resolve day number and author name server-side so the client
    // receives only plain serializable data.
    const [dayNumber, author] = await Promise.all([
      getConstructionDayNumberService(projectId, new Date(report.date)),
      getUserById(report.createdBy),
    ]);

    return ok({
      report,
      dayNumber,
      createdByName: author?.name ?? report.createdBy,
    });
  } catch (error: any) {
    console.error("Error fetching latest daily report:", error);
    return fail("Đã xảy ra lỗi khi tải báo cáo hằng ngày mới nhất", ERROR_CODES.INTERNAL_ERROR);
  }
}
