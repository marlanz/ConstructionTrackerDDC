import { DailyReportDoc, getDailyReportsCollection, getProjectsCollection, WorkAgendaEntryDoc } from "@/lib/db/collections";
import { CreateDailyReportInput, UpdateDailyReportInput, WorkAgendaEntryInput } from "@/lib/schemas/dailyReport.schema";
import { ObjectId } from "mongodb";

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
  return new ObjectId(id);
}

export interface WorkAgendaImage {
  url: string;
  publicId: string;
}

export type SerializedWorkAgendaEntry = Omit<
  WorkAgendaEntryDoc,
  "_id" | "taskId" | "imgUrl"
> & {
  _id: string;
  taskId: string | null;
  imgUrl: WorkAgendaImage[];
};

export type SerializedDailyReport = Omit<
  DailyReportDoc,
  "_id" | "projectId" | "createdBy" | "date" | "workAgenda" | "createdAt" | "updatedAt"
> & {
  _id: string;
  projectId: string;
  createdBy: string;
  date: string;
  workAgenda: SerializedWorkAgendaEntry[];
  createdAt: string;
  updatedAt: string;
};

function serializeWorkAgendaEntry(entry: WorkAgendaEntryDoc): SerializedWorkAgendaEntry {
  const normalizedImages: WorkAgendaImage[] = (entry.imgUrl || []).map((img: any) => {
    if (typeof img === "string") {
      return { url: img, publicId: "" };
    }
    return {
      url: img?.url || "",
      publicId: img?.publicId || "",
    };
  });

  return {
    ...entry,
    _id: entry._id.toString(),
    taskId: entry.taskId ? entry.taskId.toString() : null,
    imgUrl: normalizedImages,
  };
}

export function serializeDailyReport(doc: DailyReportDoc): SerializedDailyReport {
  return {
    ...doc,
    _id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    createdBy: doc.createdBy.toString(),
    date: doc.date.toISOString(),
    workAgenda: (doc.workAgenda || []).map(serializeWorkAgendaEntry),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getDailyReportById(reportId: string): Promise<SerializedDailyReport | null> {
  if (!ObjectId.isValid(reportId)) return null;
  const col = await getDailyReportsCollection();
  const doc = await col.findOne({ _id: toObjectId(reportId) });
  if (!doc) return null;
  return serializeDailyReport(doc);
}

export async function createDailyReport(
  projectId: string,
  createdByUserId: string,
  data: CreateDailyReportInput
): Promise<SerializedDailyReport> {
  const col = await getDailyReportsCollection();
  const projObjId = toObjectId(projectId);
  const userObjId = toObjectId(createdByUserId);

  const workAgendaDocs: WorkAgendaEntryDoc[] = (data.workAgenda || []).map((entry) => ({
    _id: entry._id && ObjectId.isValid(entry._id) ? new ObjectId(entry._id) : new ObjectId(),
    title: entry.title,
    description: entry.description ?? null,
    taskId: entry.taskId && ObjectId.isValid(entry.taskId) ? new ObjectId(entry.taskId) : null,
    imgUrl: entry.imgUrl || [],
  }));

  const now = new Date();
  const doc: Omit<DailyReportDoc, "_id"> = {
    projectId: projObjId,
    date: new Date(data.date),
    createdBy: userObjId,
    workStartTime: data.workStartTime,
    workEndTime: data.workEndTime,
    installationMachine: data.installationMachine || [],
    installationPersonel: data.installationPersonel || [],
    workAgenda: workAgendaDocs,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc as DailyReportDoc);
  const created = await col.findOne({ _id: result.insertedId });
  if (!created) {
    throw new Error("Failed to retrieve created daily report");
  }
  return serializeDailyReport(created);
}

export async function updateDailyReport(
  reportId: string,
  data: UpdateDailyReportInput
): Promise<SerializedDailyReport> {
  const col = await getDailyReportsCollection();
  const reportObjId = toObjectId(reportId);

  const existing = await col.findOne({ _id: reportObjId });
  if (!existing) {
    throw new Error("REPORT_NOT_FOUND");
  }

  const updateFields: Partial<DailyReportDoc> = {
    updatedAt: new Date(),
  };

  if (data.date !== undefined) updateFields.date = new Date(data.date);
  if (data.workStartTime !== undefined) updateFields.workStartTime = data.workStartTime;
  if (data.workEndTime !== undefined) updateFields.workEndTime = data.workEndTime;
  if (data.installationMachine !== undefined) updateFields.installationMachine = data.installationMachine;
  if (data.installationPersonel !== undefined) updateFields.installationPersonel = data.installationPersonel;
  if (data.workAgenda !== undefined) {
    updateFields.workAgenda = data.workAgenda.map((entry) => ({
      _id: entry._id && ObjectId.isValid(entry._id) ? new ObjectId(entry._id) : new ObjectId(),
      title: entry.title,
      description: entry.description ?? null,
      taskId: entry.taskId && ObjectId.isValid(entry.taskId) ? new ObjectId(entry.taskId) : null,
      imgUrl: entry.imgUrl || [],
    }));
  }

  const result = await col.findOneAndUpdate(
    { _id: reportObjId },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update daily report");
  }
  return serializeDailyReport(result);
}

export async function deleteDailyReport(reportId: string): Promise<boolean> {
  const col = await getDailyReportsCollection();
  const result = await col.deleteOne({ _id: toObjectId(reportId) });
  return result.deletedCount > 0;
}

export async function addWorkAgendaEntry(
  reportId: string,
  entry: WorkAgendaEntryInput
): Promise<SerializedWorkAgendaEntry> {
  const col = await getDailyReportsCollection();
  const reportObjId = toObjectId(reportId);

  const entryObjId = new ObjectId();
  const newEntryDoc: WorkAgendaEntryDoc = {
    _id: entryObjId,
    title: entry.title,
    description: entry.description ?? null,
    taskId: entry.taskId && ObjectId.isValid(entry.taskId) ? new ObjectId(entry.taskId) : null,
    imgUrl: entry.imgUrl || [],
  };

  const result = await col.findOneAndUpdate(
    { _id: reportObjId },
    {
      $push: { workAgenda: newEntryDoc },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("REPORT_NOT_FOUND");
  }

  return serializeWorkAgendaEntry(newEntryDoc);
}

export async function attachReportImage(
  reportId: string,
  entryId: string,
  image: { url: string; publicId: string }
): Promise<SerializedDailyReport> {
  const col = await getDailyReportsCollection();
  const reportObjId = toObjectId(reportId);
  const entryObjId = toObjectId(entryId);

  const result = await col.findOneAndUpdate(
    { _id: reportObjId, "workAgenda._id": entryObjId },
    {
      $push: { "workAgenda.$.imgUrl": image } as any,
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("REPORT_OR_ENTRY_NOT_FOUND");
  }

  return serializeDailyReport(result);
}

export async function listDailyReports(
  projectId: string,
  filter?: { from?: Date; to?: Date }
): Promise<SerializedDailyReport[]> {
  const col = await getDailyReportsCollection();
  const query: any = { projectId: toObjectId(projectId) };

  if (filter?.from || filter?.to) {
    query.date = {};
    if (filter.from) query.date.$gte = new Date(filter.from);
    if (filter.to) query.date.$lte = new Date(filter.to);
  }

  const docs = await col.find(query).sort({ date: -1 }).toArray();
  return docs.map(serializeDailyReport);
}

/**
 * Fetch the single most-recent daily report for a project.
 * Returns null when no reports exist yet.
 */
export async function getLatestDailyReport(
  projectId: string
): Promise<SerializedDailyReport | null> {
  const col = await getDailyReportsCollection();
  const doc = await col
    .find({ projectId: toObjectId(projectId) })
    .sort({ date: -1 })
    .limit(1)
    .next();
  return doc ? serializeDailyReport(doc) : null;
}

export async function getConstructionDayNumber(
  projectId: string,
  targetDate: Date
): Promise<number> {
  const projectsCol = await getProjectsCollection();
  const project = await projectsCol.findOne({ _id: toObjectId(projectId) });
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const startMs = new Date(project.startDate).getTime();
  const targetMs = new Date(targetDate).getTime();
  const diffTime = targetMs - startMs;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Day 1 on start date
  return Math.max(1, diffDays + 1);
}
