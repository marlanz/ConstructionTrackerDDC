import { getCurrentUser } from "@/lib/auth/auth";
import { listMyProjects } from "@/app/actions/project.actions";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DashboardView } from "./DashboardView";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const result = await listMyProjects();
  const projects = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardView
          user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
          projects={projects}
        />
      </main>
    </div>
  );
}
