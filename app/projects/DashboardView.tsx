"use client";

import { useState } from "react";
import Link from "next/link";
import { SerializedProject } from "@/lib/services/project.service";
import { getProjectStatusStyle } from "@/lib/status-styles";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Building2, Calendar, MapPin, Plus, ArrowRight, FolderKanban } from "lucide-react";

interface DashboardViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  projects: SerializedProject[];
}

export function DashboardView({ user, projects }: DashboardViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const isManager = user.role === "MANAGER";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Project Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isManager
              ? "Overseeing all construction & equipment installation projects across all factories."
              : "Projects you are currently assigned to supervise."}
          </p>
        </div>

        {isManager && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 mb-4">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            {isManager
              ? "Get started by creating your first construction project."
              : "You are not assigned to any construction projects yet."}
          </p>
          {isManager && (
            <Button onClick={() => setCreateDialogOpen(true)} className="mt-6 gap-2">
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const statusStyle = getProjectStatusStyle(project.status);

            return (
              <Card
                key={project._id}
                className="flex flex-col justify-between hover:shadow-md transition-shadow dark:hover:border-zinc-700"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {project.projectCode}
                    </Badge>
                    <Badge className={statusStyle.badgeClass}>
                      {statusStyle.label}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-50">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">
                      {project.factory.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="truncate">{project.factory.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()} —{" "}
                      {new Date(project.plannedEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                  <Link href={`/projects/${project._id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full justify-between">
                      View Project Overview
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal for MANAGER */}
      {isManager && (
        <CreateProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </div>
  );
}
