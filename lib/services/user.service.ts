import { getUsersCollection, UserDoc } from "@/lib/db/collections";
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

export async function getUserById(userId: string): Promise<SerializedUser | null> {
  const usersCol = await getUsersCollection();
  const query = { _id: toObjectId(userId) as any };
  const user = await usersCol.findOne(query);
  if (!user) return null;
  return serializeUser(user);
}

export async function setUserRole(
  userId: string,
  role: "MANAGER" | "USER"
): Promise<SerializedUser | null> {
  const usersCol = await getUsersCollection();
  const query = { _id: toObjectId(userId) as any };

  const result = await usersCol.findOneAndUpdate(
    query,
    {
      $set: {
        role,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) return null;
  return serializeUser(result);
}
