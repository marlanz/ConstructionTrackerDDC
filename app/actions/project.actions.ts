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
  getProjectOverview as getProjectOverviewService,
  listProjectsForUser,
  ProjectOverview,
  SerializedProject,
  updateProject as updateProjectService,
} from "@/lib/services/project.service";

/**
 * Create a new project (MANAGER only).
 */
export async function createProject(
  input: unknown,
): Promise<Result<SerializedProject>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail("Only managers can create projects", ERROR_CODES.FORBIDDEN);
    }

    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Invalid input",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const project = await createProjectService(parsed.data);
    return ok(project);
  } catch (error: any) {
    if (error.message === "PROJECT_CODE_EXISTS") {
      return fail(
        "A project with this projectCode already exists",
        ERROR_CODES.CONFLICT,
      );
    }
    console.error("Error creating project:", error);
    return fail(
      "An error occurred while creating the project",
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
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    if (user.role !== "MANAGER") {
      return fail(
        "Only managers can update project details",
        ERROR_CODES.FORBIDDEN,
      );
    }

    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Invalid input",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updated = await updateProjectService(projectId, parsed.data);
    return ok(updated);
  } catch (error: any) {
    if (error.message === "PROJECT_NOT_FOUND") {
      return fail("Project not found", ERROR_CODES.NOT_FOUND);
    }
    if (error.message === "PROJECT_CODE_EXISTS") {
      return fail(
        "A project with this projectCode already exists",
        ERROR_CODES.CONFLICT,
      );
    }
    console.error("Error updating project:", error);
    return fail(
      "An error occurred while updating the project",
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
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    const projects = await listProjectsForUser({
      id: user.id,
      role: user.role,
    });
    return ok(projects);
  } catch (error: any) {
    console.error("Error listing projects:", error);
    return fail(
      "An error occurred while fetching projects",
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
      return fail("Not authenticated", ERROR_CODES.UNAUTHENTICATED);
    }

    const hasAccess = await canAccessProject(
      { id: user.id, role: user.role },
      projectId,
    );
    if (!hasAccess) {
      return fail("Not authorized for this project", ERROR_CODES.FORBIDDEN);
    }

    const overview = await getProjectOverviewService(projectId);
    if (!overview) {
      return fail("Project not found", ERROR_CODES.NOT_FOUND);
    }

    return ok(overview);
  } catch (error: any) {
    console.error("Error fetching project overview:", error);
    return fail(
      "An error occurred while fetching the project overview",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
