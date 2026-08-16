import { getCurrentUser } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect("/projects");
}
