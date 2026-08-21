import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

async function HomeRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect("/projects");
  return null;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}

