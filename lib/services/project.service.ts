import { getProjectMembersCollection, getProjectsCollection, ProjectDoc } from "@/lib/db/collections";
import { CreateProjectInput, UpdateProjectInput } from "@/lib/schemas/project.schema";
import { hasMembership, listMembersByProject, ProjectMemberWithUser } from "@/lib/services/projectMember.service";
import { getTaskSummaryForProject } from "@/lib/services/installationDetail.service";
import { ObjectId } from "mongodb";

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
  return new ObjectId(id);
}

export type SerializedProject = Omit<
  ProjectDoc,
  "_id" | "startDate" | "plannedEndDate" | "actualEndDate" | "createdAt" | "updatedAt"
> & {
  _id: string;
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeProject(doc: ProjectDoc): SerializedProject {
  return {
    ...doc,
    _id: doc._id.toString(),
    startDate: doc.startDate.toISOString(),
    plannedEndDate: doc.plannedEndDate.toISOString(),
    actualEndDate: doc.actualEndDate ? doc.actualEndDate.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Access check helper per DATA_MODEL_SPEC.md §3.3:
 * canAccessProject = user.role === "MANAGER" || hasMembership(user._id, projectId)
 */
export async function canAccessProject(
  user: { id: string; role: string },
  projectId: string
): Promise<boolean> {
  if (user.role === "MANAGER") return true;
  return hasMembership(user.id, projectId);
}

export async function getProjectById(projectId: string): Promise<SerializedProject | null> {
  if (!ObjectId.isValid(projectId)) return null;
  const col = await getProjectsCollection();
  const doc = await col.findOne({ _id: toObjectId(projectId) });
  if (!doc) return null;
  return serializeProject(doc);
}

export async function createProject(data: CreateProjectInput): Promise<SerializedProject> {
  const col = await getProjectsCollection();

  // Check code uniqueness
  const existingCode = await col.findOne({ projectCode: data.projectCode });
  if (existingCode) {
    throw new Error("PROJECT_CODE_EXISTS");
  }

  const now = new Date();
  const doc: Omit<ProjectDoc, "_id"> = {
    projectCode: data.projectCode,
    name: data.name,
    description: data.description,
    factory: data.factory,
    briefPlan: data.briefPlan ?? null,
    startDate: new Date(data.startDate),
    plannedEndDate: new Date(data.plannedEndDate),
    actualEndDate: null,
    status: data.status,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc as ProjectDoc);
  const created = await col.findOne({ _id: result.insertedId });
  if (!created) {
    throw new Error("Failed to retrieve created project");
  }
  return serializeProject(created);
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectInput
): Promise<SerializedProject> {
  const col = await getProjectsCollection();
  const projObjId = toObjectId(projectId);

  const existing = await col.findOne({ _id: projObjId });
  if (!existing) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  if (data.projectCode && data.projectCode !== existing.projectCode) {
    const codeConflict = await col.findOne({
      projectCode: data.projectCode,
      _id: { $ne: projObjId },
    });
    if (codeConflict) {
      throw new Error("PROJECT_CODE_EXISTS");
    }
  }

  const updateFields: Partial<ProjectDoc> = {
    updatedAt: new Date(),
  };

  if (data.projectCode !== undefined) updateFields.projectCode = data.projectCode;
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.factory !== undefined) updateFields.factory = data.factory;
  if (data.briefPlan !== undefined) updateFields.briefPlan = data.briefPlan;
  if (data.startDate !== undefined) updateFields.startDate = new Date(data.startDate);
  if (data.plannedEndDate !== undefined) updateFields.plannedEndDate = new Date(data.plannedEndDate);
  if (data.actualEndDate !== undefined) {
    updateFields.actualEndDate = data.actualEndDate ? new Date(data.actualEndDate) : null;
  }
  if (data.status !== undefined) updateFields.status = data.status;

  const result = await col.findOneAndUpdate(
    { _id: projObjId },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update project");
  }
  return serializeProject(result);
}

export async function listProjectsForUser(user: {
  id: string;
  role: string;
}): Promise<SerializedProject[]> {
  const projectsCol = await getProjectsCollection();

  if (user.role === "MANAGER") {
    // MANAGER has global read-only visibility into ALL projects
    const docs = await projectsCol.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(serializeProject);
  }

  // SUPERVISOR / USER — filter by project_members assignment
  if (!ObjectId.isValid(user.id)) return [];

  const membersCol = await getProjectMembersCollection();
  const memberships = await membersCol
    .find({ userId: toObjectId(user.id) })
    .toArray();

  if (memberships.length === 0) return [];

  const projectIds = memberships.map((m) => m.projectId);
  const docs = await projectsCol
    .find({ _id: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map(serializeProject);
}

export interface ProjectOverview {
  project: SerializedProject;
  members: ProjectMemberWithUser[];
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    avgProgression: number;
  };
}

export async function getProjectOverview(projectId: string): Promise<ProjectOverview | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const members = await listMembersByProject(projectId);
  const taskSummary = await getTaskSummaryForProject(projectId);

  return {
    project,
    members,
    taskSummary,
  };
}
