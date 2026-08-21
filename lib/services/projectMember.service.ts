import { UserRoleType } from "@/constants/role";
import {
  getProjectMembersCollection,
  getUsersCollection,
  ProjectMemberDoc,
} from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { cache } from "react";

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
  return new ObjectId(id);
}

export interface SerializedProjectMember {
  _id: string;
  projectId: string;
  userId: string;
}

export interface ProjectMemberWithUser {
  _id: string;
  projectId: string;
  userId: string;
  user: {
    name: string;
    email: string;
    image: string | null;
    role: UserRoleType;
  } | null;
}

function serializeProjectMember(
  doc: ProjectMemberDoc,
): SerializedProjectMember {
  return {
    _id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    userId: doc.userId.toString(),
  };
}

/**
 * Check if a user is a member of a project.
 * Deduplicated per-request via React cache().
 */
export const hasMembership = cache(async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(projectId)) {
    return false;
  }
  const col = await getProjectMembersCollection();
  const count = await col.countDocuments({
    projectId: toObjectId(projectId),
    userId: toObjectId(userId),
  });
  return count > 0;
});

export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<SerializedProjectMember> {
  const col = await getProjectMembersCollection();
  const projObjId = toObjectId(projectId);
  const userObjId = toObjectId(userId);

  // Check if member already exists
  const existing = await col.findOne({
    projectId: projObjId,
    userId: userObjId,
  });
  if (existing) {
    throw new Error("MEMBER_EXISTS");
  }

  const doc: Omit<ProjectMemberDoc, "_id"> = {
    projectId: projObjId,
    userId: userObjId,
  };

  const result = await col.insertOne(doc as ProjectMemberDoc);
  return {
    _id: result.insertedId.toString(),
    projectId,
    userId,
  };
}

export async function removeProjectMember(memberId: string): Promise<boolean> {
  const col = await getProjectMembersCollection();
  const result = await col.deleteOne({ _id: toObjectId(memberId) });
  return result.deletedCount > 0;
}

export async function listMembersByProject(
  projectId: string,
): Promise<ProjectMemberWithUser[]> {
  "use cache";
  cacheTag(`project:${projectId}`);
  cacheLife("minutes");
  const membersCol = await getProjectMembersCollection();
  const usersCol = await getUsersCollection();

  const members = await membersCol
    .find({ projectId: toObjectId(projectId) })
    .toArray();

  if (members.length === 0) return [];

  const userIds = members.map((m) => m.userId);
  const users = await usersCol.find({ _id: { $in: userIds as any } }).toArray();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return members.map((m) => {
    const user = userMap.get(m.userId.toString());
    return {
      _id: m._id.toString(),
      projectId: m.projectId.toString(),
      userId: m.userId.toString(),
      user: user
        ? {
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }
        : null,
    };
  });
}
