import { getCurrentUser } from "@/lib/auth/auth";
import { getProjectOverview } from "@/app/actions/project.actions";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProjectOverviewView } from "./ProjectOverviewView";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const result = await getProjectOverview(id);
  if (!result.success) {
    if (result.code === "FORBIDDEN") {
      redirect("/projects");
    }
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectOverviewView
          user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
          overview={result.data}
        />
      </main>
    </div>
  );
}
