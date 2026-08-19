"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addProjectMember, removeProjectMember } from "@/app/actions/projectMember.actions";
import { ProjectMemberWithUser } from "@/lib/services/projectMember.service";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { USER_ROLE_VN_LABELS, UserRoleType } from "@/app/constants/role";

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

  // AlertDialog state for removing supervisor
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;

    setLoading(true);
    setError(null);

    const result = await addProjectMember(projectId, newUserId.trim());
    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Đã phân công giám sát viên vào dự án thành công");
    setNewUserId("");
    setLoading(false);
    router.refresh();
  };

  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    setRemoving(true);

    const result = await removeProjectMember(removeTarget.id);
    if (!result.success) {
      toast.error(result.error);
      setRemoving(false);
      setRemoveTarget(null);
      return;
    }

    toast.success(`Đã xóa ${removeTarget.name} khỏi danh sách giám sát viên`);
    setRemoving(false);
    setRemoveTarget(null);
    router.refresh();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            Quản lý thành viên dự án
          </DialogTitle>
          <DialogDescription>
            Các giám sát viên được phân công cho <span className="font-semibold text-zinc-900 dark:text-zinc-100">{projectName}</span>
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
                <UserPlus className="h-3.5 w-3.5" /> Phân công Giám sát viên mới (Nhập ID Người dùng)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="VD: 665f10000000000000000001"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                  className="bg-white dark:bg-zinc-950"
                />
                <Button type="submit" size="sm" disabled={loading}>
                  Phân công
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Thành viên hiện tại ({members.length})
            </h4>

            {members.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Chưa có giám sát viên nào được phân công cho dự án này.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800 overflow-hidden">
                {members.map((member) => {
                  const displayName = member.user?.name || member.userId;

                  return (
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
                            {displayName}
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
                          {USER_ROLE_VN_LABELS[member.user?.role as UserRoleType] || "Giám sát viên"}
                        </Badge>
                        {isManager && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemoveTarget({ id: member._id, name: displayName })}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Xóa thành viên"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Confirmation Dialog for Removing Supervisor */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
        title="Xóa giám sát viên khỏi dự án?"
        description={`Bạn có chắc chắn muốn xóa ${removeTarget?.name}? Họ sẽ không thể gửi báo cáo hằng ngày hoặc chỉnh sửa công việc cho dự án này nữa.`}
        confirmLabel="Xóa giám sát viên"
        variant="destructive"
        loading={removing}
        onConfirm={confirmRemoveMember}
      />
    </>
  );
}
