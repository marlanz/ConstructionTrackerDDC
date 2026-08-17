"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SerializedInstallationTask } from "@/lib/services/installationDetail.service";
import { createInstallationTask, updateInstallationTask } from "@/app/actions/installationDetail.actions";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskToEdit?: SerializedInstallationTask | null;
}

export function TaskFormModal({
  open,
  onOpenChange,
  projectId,
  taskToEdit,
}: TaskFormModalProps) {
  const router = useRouter();
  const isEditing = !!taskToEdit;

  const [sectionCode, setSectionCode] = useState("");
  const [agenda, setAgenda] = useState("");
  const [qty, setQty] = useState<string>("");
  const [unit, setUnit] = useState("");
  const [dimension, setDimension] = useState("");
  const [installationLocation, setInstallationLocation] = useState("");
  const [equipmentsText, setEquipmentsText] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [installationPeriod, setInstallationPeriod] = useState("");
  const [note, setNote] = useState("");
  const [progression, setProgression] = useState(0);

  // Tools & Personnel arrays
  const [tools, setTools] = useState<{ party: string; name: string }[]>([]);
  const [personnel, setPersonnel] = useState<{ party: string; role: string; amount: number; note: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setSectionCode(taskToEdit.sectionCode || "");
      setAgenda(taskToEdit.agenda);
      setQty(taskToEdit.qty !== null ? String(taskToEdit.qty) : "");
      setUnit(taskToEdit.unit || "");
      setDimension(taskToEdit.dimension || "");
      setInstallationLocation(taskToEdit.installationLocation || "");
      setEquipmentsText((taskToEdit.installationEquipments || []).join(", "));
      setPlannedStartDate(taskToEdit.plannedStartDate ? taskToEdit.plannedStartDate.substring(0, 10) : "");
      setPlannedEndDate(taskToEdit.plannedEndDate ? taskToEdit.plannedEndDate.substring(0, 10) : "");
      setInstallationPeriod(taskToEdit.installationPeriod || "");
      setNote(taskToEdit.note || "");
      setProgression(taskToEdit.progression || 0);
      setTools(taskToEdit.installationTools || []);
      setPersonnel(
        (taskToEdit.installationPersonel || []).map((p) => ({
          party: p.party,
          role: p.role,
          amount: p.amount,
          note: p.note || "",
        }))
      );
    } else {
      setSectionCode("");
      setAgenda("");
      setQty("");
      setUnit("");
      setDimension("");
      setInstallationLocation("");
      setEquipmentsText("");
      setPlannedStartDate("");
      setPlannedEndDate("");
      setInstallationPeriod("");
      setNote("");
      setProgression(0);
      setTools([]);
      setPersonnel([]);
    }
  }, [taskToEdit, open]);

  const handleAddTool = () => {
    setTools([...tools, { party: "CONTRACTOR", name: "" }]);
  };

  const handleRemoveTool = (idx: number) => {
    setTools(tools.filter((_, i) => i !== idx));
  };

  const handleAddPersonnel = () => {
    setPersonnel([...personnel, { party: "CONTRACTOR", role: "Worker", amount: 1, note: "" }]);
  };

  const handleRemovePersonnel = (idx: number) => {
    setPersonnel(personnel.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const equipments = equipmentsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const inputData = {
      sectionCode: sectionCode || null,
      agenda,
      qty: qty !== "" ? Number(qty) : null,
      unit: unit || null,
      dimension: dimension || null,
      installationLocation: installationLocation || null,
      installationEquipments: equipments,
      installationTools: tools,
      installationPersonel: personnel,
      plannedStartDate,
      plannedEndDate,
      installationPeriod: installationPeriod || null,
      note: note || null,
      progression,
    };

    let result;
    if (isEditing && taskToEdit) {
      result = await updateInstallationTask(taskToEdit._id, inputData);
    } else {
      result = await createInstallationTask(projectId, inputData);
    }

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(isEditing ? "Work item task updated successfully" : "New work item task added to plan");
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Work Item Task" : "Add New Installation Work Item"}</DialogTitle>
        <DialogDescription>
          Specify plan details, machinery, personnel, and target dates.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-medium">Section Code</label>
            <Input
              placeholder="e.g. I, II, IV"
              value={sectionCode}
              onChange={(e) => setSectionCode(e.target.value)}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium">Agenda / Work Description *</label>
            <Input
              placeholder="e.g. Lắp đặt dầm cầu trục 25T"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Quantity</label>
            <Input
              type="number"
              placeholder="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Unit</label>
            <Input
              placeholder="bộ / kiện / 件"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Location</label>
            <Input
              placeholder="Layout ref, e.g. F8-F9"
              value={installationLocation}
              onChange={(e) => setInstallationLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Equipments (comma separated)</label>
          <Input
            placeholder="Cẩu 25T, Máy hàn MIG, Xe nâng 5T"
            value={equipmentsText}
            onChange={(e) => setEquipmentsText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Planned Start *</label>
            <Input
              type="date"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Planned End *</label>
            <Input
              type="date"
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Display Period</label>
            <Input
              placeholder="e.g. 6 ngày"
              value={installationPeriod}
              onChange={(e) => setInstallationPeriod(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Tools */}
        <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Installation Tools ({tools.length})
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddTool} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Tool
            </Button>
          </div>

          {tools.map((tool, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Party (e.g. CONTRACTOR)"
                value={tool.party}
                onChange={(e) => {
                  const updated = [...tools];
                  updated[idx].party = e.target.value;
                  setTools(updated);
                }}
                className="w-1/3"
              />
              <Input
                placeholder="Tool Name"
                value={tool.name}
                onChange={(e) => {
                  const updated = [...tools];
                  updated[idx].name = e.target.value;
                  setTools(updated);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveTool(idx)}
                className="h-8 w-8 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Dynamic Personnel */}
        <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Personnel Allocation ({personnel.length})
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPersonnel} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Personnel
            </Button>
          </div>

          {personnel.map((p, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Party"
                value={p.party}
                onChange={(e) => {
                  const updated = [...personnel];
                  updated[idx].party = e.target.value;
                  setPersonnel(updated);
                }}
                className="w-1/4"
              />
              <Input
                placeholder="Role"
                value={p.role}
                onChange={(e) => {
                  const updated = [...personnel];
                  updated[idx].role = e.target.value;
                  setPersonnel(updated);
                }}
                className="w-1/3"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={p.amount}
                onChange={(e) => {
                  const updated = [...personnel];
                  updated[idx].amount = Number(e.target.value);
                  setPersonnel(updated);
                }}
                className="w-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePersonnel(idx)}
                className="h-8 w-8 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Item" : "Create Item"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
