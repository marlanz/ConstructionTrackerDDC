"use client";

import { useState } from "react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject } from "@/app/actions/project.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import z from "zod";
import { createProjectSchema } from "@/lib/schemas/project.schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";

const items = [
  {
    label: "Nhà máy DDC An Hạ",
    value: {
      name: "Nhà máy DDC An Hạ",
      location: "Khu C Đường D1 KCN, An Hạ, Tân Vĩnh Lộc, Hồ Chí Minh",
    },
  },
  {
    label: "Nhà máy DDC Bình Chánh",
    value: {
      name: "Nhà máy DDC Bình Chánh",
      location: "Ấp 2, Xã Tân Nhựt, Huyện Bình Chánh, Thành phố Hồ Chí Minh",
    },
  },
  {
    label: "Nhà máy DDC Long An",
    value: {
      name: "Nhà máy DDC Long An",
      location: "ĐT825, Đức Hòa, Tây Ninh",
    },
  },
  {
    label: "Nhà máy DDC Vũng Tàu",
    value: {
      name: "Nhà máy DDC Vũng Tàu",
      location: "ĐS 12, Rạch Dừa, Hồ Chí Minh",
    },
  },
  {
    label: "Nhà máy DDC Miền Trung",
    value: {
      name: "Nhà máy DDC Miền Trung",
      location:
        "Lô 10, phân khu công nghiệp Sài Gòn – Dung Quất, xã Bình Sơn, tỉnh Quảng Ngãi.",
    },
  },
  {
    label: "Nhà máy DDC Nghi Sơn",
    value: {
      name: "Nhà máy DDC Nghi Sơn",
      location:
        "Lô CN-5, Khu công nghiệp Số 1, Khu Kinh tế Nghi Sơn, Phường Hải Bình, tỉnh Thanh Hóa",
    },
  },
];

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreateProjectForm = z.input<typeof createProjectSchema>;

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    mode: "onChange",
    defaultValues: {
      projectCode: "",
      name: "",
      description: "",
      factory: {
        name: "",
        location: "",
      },
      briefPlan: "",
      startDate: new Date(),
      plannedEndDate: new Date(),
      status: "PLANNED",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateProjectForm) => {
    setLoading(true);
    setError(null);

    const status =
      new Date() >= new Date(data.startDate) ? "IN_PROGRESS" : "PLANNED";

    const result = await createProject({
      ...data,
      status,
    });

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Tạo dự án "${data.name}" thành công`);
    setLoading(false);
    onOpenChange(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Tạo dự án lắp đặt mới</DialogTitle>
        <DialogDescription>
          Điền các thông tin chi tiết để tạo dự án mới trong hệ thống.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              name="projectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Mã dự án *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ddcah-trobot-0826" />
                  </FormControl>
                </FormItem>
              )}
              control={form.control}
            />

            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tên dự án *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Tên dự án lắp đặt MMTB" />
                  </FormControl>
                </FormItem>
              )}
              control={form.control}
            />
          </div>

          <FormField
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Mô tả dự án</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Mô tả tổng quan về dự án thi công"
                  />
                </FormControl>
              </FormItem>
            )}
            control={form.control}
          />

          <FormField
            control={form.control}
            name="factory.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Nhà máy *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue(
                      "factory.location",
                      items.find((item) => item.value.name === value)?.value
                        .location ?? "",
                      { shouldValidate: true },
                    );
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full px-3">
                      <SelectValue placeholder="Chọn nhà máy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Danh sách nhà máy</SelectLabel>
                      {items.map((item) => (
                        <SelectItem
                          key={item.value.name}
                          value={item.value.name}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* <FormField
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Ngày bắt đầu *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                </FormItem>
              )}
              control={form.control}
            /> */}

            {/* <FormField
              name="plannedEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Ngày dự kiến kết thúc *
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                </FormItem>
              )}
              control={form.control}
            /> */}

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs">Ngày diễn ra</FormLabel>
                  <Popover>
                    <PopoverTrigger>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plannedEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs">
                    Ngày dự kiến kết thúc
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="briefPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Kế hoạch tổng thể</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="URL Google Sheet/Docs" />
                </FormControl>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo dự án"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </Dialog>
  );
}
