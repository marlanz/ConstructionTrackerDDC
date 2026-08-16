"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addProjectMember, removeProjectMember } from "@/app/actions/projectMember.actions";
import { ProjectMemberWithUser } from "@/lib/services/projectMember.service";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, UserCheck, Search } from "lucide-react";

interface MemberManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  members: ProjectMemberWithUser[];
  isManager: boolean;
}

export function MemberManagementModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  members,
  isManager,
}: MemberManagementModalProps) {
  const router = useRouter();
  const [newUserId, setNewUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;

    setLoading(true);
    setError(null);

    const result = await addProjectMember(projectId, newUserId.trim());
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setNewUserId("");
    setLoading(false);
    router.refresh();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this supervisor from the project?")) return;

    setLoading(true);
    setError(null);

    const result = await removeProjectMember(memberId);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          Project Member Management
        </DialogTitle>
        <DialogDescription>
          Assigned Supervisors for <span className="font-semibold text-zinc-900 dark:text-zinc-100">{projectName}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        {isManager && (
          <form onSubmit={handleAddMember} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Assign New Supervisor (Enter User ID)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 665f10000000000000000001"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                required
                className="bg-white dark:bg-zinc-950"
              />
              <Button type="submit" size="sm" disabled={loading}>
                Assign
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Current Members ({members.length})
          </h4>

          {members.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              No supervisors assigned to this project yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800 overflow-hidden">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {member.user?.name ? member.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {member.user?.name || "User ID: " + member.userId}
                      </div>
                      {member.user?.email && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {member.user.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      SUPERVISOR
                    </Badge>
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member._id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
