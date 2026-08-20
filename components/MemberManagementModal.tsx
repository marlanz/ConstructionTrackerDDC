"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { addProjectMember, removeProjectMember } from "@/app/actions/projectMember.actions";
import { searchUsers, UserSearchResult } from "@/app/actions/user.actions";
import { ProjectMemberWithUser } from "@/lib/services/projectMember.service";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, UserCheck, Search, Loader2, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AlertDialog state for removing supervisor
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  // Reset search state on modal open/close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setError(null);
    }
  }, [open]);

  // Debounced search by email or name (minimum 2 chars)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchUsers(trimmed);
      if (res.success) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    const result = await addProjectMember(projectId, selectedUser.id);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Đã phân công ${selectedUser.name || selectedUser.email} vào dự án thành công`);
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
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
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-primary" /> Phân công Giám sát viên mới
              </label>

              {!selectedUser ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Tìm theo email hoặc tên người dùng (tối thiểu 2 ký tự)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white text-xs dark:bg-zinc-950"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* Loading Skeleton */}
                  {isSearching && searchResults.length === 0 && (
                    <div className="rounded-lg border border-zinc-200 bg-white p-2.5 space-y-2 dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-2.5 w-48" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                      Không tìm thấy người dùng nào phù hợp với &quot;{searchQuery}&quot;
                    </div>
                  )}

                  {/* Search Results list */}
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:divide-zinc-800">
                      {searchResults.map((u) => {
                        const isAlreadyMember = members.some((m) => m.userId === u.id);

                        return (
                          <div
                            key={u.id}
                            className={`flex items-center justify-between p-2.5 text-xs transition-colors ${
                              isAlreadyMember
                                ? "opacity-60 bg-zinc-50 dark:bg-zinc-900/40"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isAlreadyMember) {
                                setSelectedUser(u);
                                setSearchQuery("");
                                setSearchResults([]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 font-semibold text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {u.name || "Chưa đặt tên"}
                                </div>
                                <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                                  {u.email}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isAlreadyMember ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Đã phân công
                                </Badge>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:text-primary">
                                  Chọn
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-primary/20 bg-white p-3 space-y-3 dark:border-primary/30 dark:bg-zinc-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          {selectedUser.name || "Chưa đặt tên"}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {selectedUser.email}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                      disabled={loading}
                      className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Đổi người khác
                    </Button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading}
                      onClick={handleAddMember}
                      className="gap-1.5 text-xs"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {loading ? "Đang phân công..." : "Xác nhận phân công"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
