import { getUsersCollection, UserDoc } from "@/lib/db/collections";
import { UserRoleType } from "@/constants/role";
import { ObjectId } from "mongodb";

function toObjectId(id: string): ObjectId | string {
  return ObjectId.isValid(id) ? new ObjectId(id) : id;
}

export type SerializedUser = Omit<UserDoc, "_id"> & { _id: string };

function serializeUser(doc: UserDoc): SerializedUser {
  return {
    ...doc,
    _id: doc._id.toString(),
  };
}

export async function getUserById(
  userId: string,
): Promise<SerializedUser | null> {
  const usersCol = await getUsersCollection();
  const query = { _id: toObjectId(userId) as any };
  const user = await usersCol.findOne(query);
  if (!user) return null;
  return serializeUser(user);
}

export async function setUserRole(
  userId: string,
  role: UserRoleType | string,
): Promise<SerializedUser | null> {
  const usersCol = await getUsersCollection();
  const query = { _id: toObjectId(userId) as any };

  const result = await usersCol.findOneAndUpdate(
    query,
    {
      $set: {
        role: role as UserRoleType,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!result) return null;
  return serializeUser(result);
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
}

/**
 * Search users by email or name (case-insensitive partial match).
 * Requires minimum query length of 2 characters and caps results.
 */
export async function searchUsers(
  query: string,
  limit: number = 10,
): Promise<UserSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const usersCol = await getUsersCollection();
  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  const docs = await usersCol
    .find({
      $or: [{ email: { $regex: regex } }, { name: { $regex: regex } }],
    })
    .limit(limit)
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name || "",
    email: doc.email || "",
  }));
}
