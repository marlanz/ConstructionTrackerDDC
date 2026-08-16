import { Collection, Db, ObjectId } from "mongodb";
import clientPromise from "./mongodb";

let dbInstance: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!dbInstance) {
    const client = await clientPromise;
    dbInstance = client.db();
  }
  return dbInstance;
}

/**
 * User document shape (managed by better-auth with additional field 'role')
 */
export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "MANAGER" | "USER";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project document shape per DATA_MODEL_SPEC.md §3.2
 */
export interface ProjectDoc {
  _id: ObjectId;
  projectCode: string;
  name: string;
  description: string;
  factory: {
    name: string;
    location: string;
  };
  briefPlan: string | null;
  startDate: Date;
  plannedEndDate: Date;
  actualEndDate: Date | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProjectMember document shape per DATA_MODEL_SPEC.md §3.3
 */
export interface ProjectMemberDoc {
  _id: ObjectId;
  projectId: ObjectId;
  userId: ObjectId;
}

/**
 * InstallationDetail document shape per DATA_MODEL_SPEC.md §3.4
 */
export interface InstallationDetailDoc {
  _id: ObjectId;
  projectId: ObjectId;

  sequence: number;
  sectionCode: string | null;

  agenda: string;
  qty: number | null;
  unit: string | null;
  dimension: string | null;

  installationLocation: string | null;

  installationEquipments: string[];

  installationTools: {
    party: string;
    name: string;
  }[];

  installationPersonel: {
    party: string;
    role: string;
    amount: number;
    note: string | null;
  }[];

  plannedStartDate: Date;
  plannedEndDate: Date;
  installationPeriod: string | null;

  note: string | null;
  progression: number; // 0-100

  createdAt: Date;
  updatedAt: Date;
}

/**
 * WorkAgendaEntry shape per DATA_MODEL_SPEC.md §3.5
 */
export interface WorkAgendaEntryDoc {
  _id: ObjectId;
  title: string;
  description: string | null;
  taskId: ObjectId | null;
  imgUrl: string[];
}

/**
 * DailyReport document shape per DATA_MODEL_SPEC.md §3.5
 */
export interface DailyReportDoc {
  _id: ObjectId;
  projectId: ObjectId;
  date: Date;
  createdBy: ObjectId;

  workStartTime: string;
  workEndTime: string;

  installationMachine: string[];

  installationPersonel: {
    party: string;
    role: string;
    amount: number;
    note: string | null;
  }[];

  workAgenda: WorkAgendaEntryDoc[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Collection getters
 */
export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>("user");
}

export async function getProjectsCollection(): Promise<Collection<ProjectDoc>> {
  const db = await getDb();
  return db.collection<ProjectDoc>("projects");
}

export async function getProjectMembersCollection(): Promise<Collection<ProjectMemberDoc>> {
  const db = await getDb();
  return db.collection<ProjectMemberDoc>("project_members");
}

export async function getInstallationDetailCollection(): Promise<Collection<InstallationDetailDoc>> {
  const db = await getDb();
  return db.collection<InstallationDetailDoc>("installation_detail");
}

export async function getDailyReportsCollection(): Promise<Collection<DailyReportDoc>> {
  const db = await getDb();
  return db.collection<DailyReportDoc>("daily_reports");
}

/**
 * Ensure MongoDB indexes for Sprint 2 collections.
 */
export async function ensureSprint2Indexes(): Promise<void> {
  const projectsCol = await getProjectsCollection();
  await projectsCol.createIndex({ projectCode: 1 }, { unique: true });
  await projectsCol.createIndex({ status: 1 });

  const membersCol = await getProjectMembersCollection();
  await membersCol.createIndex({ projectId: 1, userId: 1 }, { unique: true });
  await membersCol.createIndex({ userId: 1 });
}

/**
 * Ensure MongoDB indexes for Sprint 3 collections.
 */
export async function ensureSprint3Indexes(): Promise<void> {
  const detailCol = await getInstallationDetailCollection();
  await detailCol.createIndex({ projectId: 1, sequence: 1 }, { unique: true });
  await detailCol.createIndex({ projectId: 1, progression: 1 });
}

/**
 * Ensure MongoDB indexes for Sprint 4 collections.
 */
export async function ensureSprint4Indexes(): Promise<void> {
  const reportsCol = await getDailyReportsCollection();
  await reportsCol.createIndex({ projectId: 1, date: -1 });
  await reportsCol.createIndex({ projectId: 1, "workAgenda.taskId": 1 });
}
