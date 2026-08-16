import { getInstallationDetailCollection, InstallationDetailDoc } from "@/lib/db/collections";
import { CreateInstallationTaskInput, UpdateInstallationTaskInput } from "@/lib/schemas/installationDetail.schema";
import { ObjectId } from "mongodb";

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
  return new ObjectId(id);
}

export type SerializedInstallationTask = Omit<
  InstallationDetailDoc,
  "_id" | "projectId" | "plannedStartDate" | "plannedEndDate" | "createdAt" | "updatedAt"
> & {
  _id: string;
  projectId: string;
  plannedStartDate: string;
  plannedEndDate: string;
  createdAt: string;
  updatedAt: string;
};

export function serializeInstallationTask(doc: InstallationDetailDoc): SerializedInstallationTask {
  return {
    ...doc,
    _id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    plannedStartDate: doc.plannedStartDate.toISOString(),
    plannedEndDate: doc.plannedEndDate.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getInstallationTaskById(
  taskId: string
): Promise<SerializedInstallationTask | null> {
  if (!ObjectId.isValid(taskId)) return null;
  const col = await getInstallationDetailCollection();
  const doc = await col.findOne({ _id: toObjectId(taskId) });
  if (!doc) return null;
  return serializeInstallationTask(doc);
}

export async function createInstallationTask(
  projectId: string,
  data: CreateInstallationTaskInput
): Promise<SerializedInstallationTask> {
  const col = await getInstallationDetailCollection();
  const projObjId = toObjectId(projectId);

  let sequence = data.sequence;
  if (sequence === undefined || sequence === null) {
    const lastTask = await col
      .find({ projectId: projObjId })
      .sort({ sequence: -1 })
      .limit(1)
      .toArray();
    sequence = lastTask.length > 0 ? lastTask[0].sequence + 1 : 1;
  }

  const now = new Date();
  const doc: Omit<InstallationDetailDoc, "_id"> = {
    projectId: projObjId,
    sequence,
    sectionCode: data.sectionCode ?? null,
    agenda: data.agenda,
    qty: data.qty ?? null,
    unit: data.unit ?? null,
    dimension: data.dimension ?? null,
    installationLocation: data.installationLocation ?? null,
    installationEquipments: data.installationEquipments || [],
    installationTools: data.installationTools || [],
    installationPersonel: data.installationPersonel || [],
    plannedStartDate: new Date(data.plannedStartDate),
    plannedEndDate: new Date(data.plannedEndDate),
    installationPeriod: data.installationPeriod ?? null,
    note: data.note ?? null,
    progression: data.progression ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc as InstallationDetailDoc);
  const created = await col.findOne({ _id: result.insertedId });
  if (!created) {
    throw new Error("Failed to retrieve created installation task");
  }
  return serializeInstallationTask(created);
}

export async function updateInstallationTask(
  taskId: string,
  data: UpdateInstallationTaskInput
): Promise<SerializedInstallationTask> {
  const col = await getInstallationDetailCollection();
  const taskObjId = toObjectId(taskId);

  const existing = await col.findOne({ _id: taskObjId });
  if (!existing) {
    throw new Error("TASK_NOT_FOUND");
  }

  const updateFields: Partial<InstallationDetailDoc> = {
    updatedAt: new Date(),
  };

  if (data.sequence !== undefined) updateFields.sequence = data.sequence;
  if (data.sectionCode !== undefined) updateFields.sectionCode = data.sectionCode;
  if (data.agenda !== undefined) updateFields.agenda = data.agenda;
  if (data.qty !== undefined) updateFields.qty = data.qty;
  if (data.unit !== undefined) updateFields.unit = data.unit;
  if (data.dimension !== undefined) updateFields.dimension = data.dimension;
  if (data.installationLocation !== undefined) updateFields.installationLocation = data.installationLocation;
  if (data.installationEquipments !== undefined) updateFields.installationEquipments = data.installationEquipments;
  if (data.installationTools !== undefined) updateFields.installationTools = data.installationTools;
  if (data.installationPersonel !== undefined) updateFields.installationPersonel = data.installationPersonel;
  if (data.plannedStartDate !== undefined) updateFields.plannedStartDate = new Date(data.plannedStartDate);
  if (data.plannedEndDate !== undefined) updateFields.plannedEndDate = new Date(data.plannedEndDate);
  if (data.installationPeriod !== undefined) updateFields.installationPeriod = data.installationPeriod;
  if (data.note !== undefined) updateFields.note = data.note;
  if (data.progression !== undefined) updateFields.progression = data.progression;

  const result = await col.findOneAndUpdate(
    { _id: taskObjId },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update installation task");
  }
  return serializeInstallationTask(result);
}

export async function updateTaskProgress(
  taskId: string,
  progression: number
): Promise<SerializedInstallationTask> {
  const col = await getInstallationDetailCollection();
  const taskObjId = toObjectId(taskId);

  const existing = await col.findOne({ _id: taskObjId });
  if (!existing) {
    throw new Error("TASK_NOT_FOUND");
  }

  const result = await col.findOneAndUpdate(
    { _id: taskObjId },
    {
      $set: {
        progression,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update task progress");
  }
  return serializeInstallationTask(result);
}

export async function reorderInstallationTasks(
  projectId: string,
  orderedTaskIds: string[]
): Promise<boolean> {
  const col = await getInstallationDetailCollection();
  const projObjId = toObjectId(projectId);

  const bulkOps = orderedTaskIds.map((id, index) => ({
    updateOne: {
      filter: { _id: toObjectId(id), projectId: projObjId },
      update: {
        $set: {
          sequence: index + 1,
          updatedAt: new Date(),
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await col.bulkWrite(bulkOps);
  }
  return true;
}

export async function listInstallationTasks(
  projectId: string
): Promise<SerializedInstallationTask[]> {
  const col = await getInstallationDetailCollection();
  const docs = await col
    .find({ projectId: toObjectId(projectId) })
    .sort({ sequence: 1 })
    .toArray();
  return docs.map(serializeInstallationTask);
}

export async function getTaskSummaryForProject(projectId: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  avgProgression: number;
}> {
  const col = await getInstallationDetailCollection();
  const tasks = await col
    .find({ projectId: toObjectId(projectId) })
    .project({ progression: 1 })
    .toArray();

  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return { totalTasks: 0, completedTasks: 0, avgProgression: 0 };
  }

  const completedTasks = tasks.filter((t) => t.progression >= 100).length;
  const totalProgression = tasks.reduce((sum, t) => sum + (t.progression || 0), 0);
  const avgProgression = Math.round(totalProgression / totalTasks);

  return {
    totalTasks,
    completedTasks,
    avgProgression,
  };
}
