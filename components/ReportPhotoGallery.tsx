"use client";

import { useState } from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { attachReportImage, deleteReportImage } from "@/app/actions/dailyReport.actions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-client";
import { WorkAgendaImage } from "@/lib/services/dailyReport.service";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ReportPhotoGalleryProps {
  reportId: string;
  entryId: string;
  images: WorkAgendaImage[];
  isSupervisor: boolean;
  isEditMode?: boolean;
}

export function ReportPhotoGallery({
  reportId,
  entryId,
  images,
  isSupervisor,
  isEditMode = false,
}: ReportPhotoGalleryProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<{
    publicId: string;
    url: string;
  } | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    setDeletingImage(true);

    try {
      const res = await deleteReportImage(
        reportId,
        entryId,
        imageToDelete.publicId,
      );
      if (!res.success) {
        toast.error(res.error || "Xóa hình ảnh thất bại");
        setDeletingImage(false);
        setImageToDelete(null);
        return;
      }

      toast.success("Đã xóa ảnh khỏi Cloudinary thành công");
      setImageToDelete(null);
      setDeletingImage(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa hình ảnh";
      toast.error(msg);
      setDeletingImage(false);
      setImageToDelete(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Direct upload from browser to Cloudinary
      const uploadedImage = await uploadImageToCloudinary(file);

      // 2. Attach resulting { url, publicId } to database via Server Action
      const result = await attachReportImage(reportId, entryId, uploadedImage);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        setUploading(false);
        return;
      }

      toast.success("Đã tải ảnh thực địa lên Cloudinary thành công");
      setUploading(false);
      router.refresh();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Xử lý tệp hình ảnh thất bại";
      setError(errMsg);
      toast.error(errMsg);
      setUploading(false);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Grid of Images */}
      {(images.length > 0 || uploading) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => {
            const imageUrl = typeof img === "string" ? img : img?.url;
            const publicId = typeof img === "string" ? "" : img?.publicId || "";
            if (!imageUrl) return null;

            return (
              <div
                key={idx}
                onClick={() => setSelectedImage(imageUrl)}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <AspectRatio ratio={4 / 3}>
                  <Image
                    src={imageUrl}
                    alt={`Ảnh báo cáo ${idx + 1}`}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </AspectRatio>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Maximize2 className="h-5 w-5 drop-shadow-md" />
                </div>

                {isSupervisor && isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageToDelete({ publicId, url: imageUrl });
                    }}
                    className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md hover:bg-red-700 transition-colors focus:outline-none"
                    title="Xóa hình ảnh này"
                  >
                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            );
          })}


          {uploading && (
            <div className="relative overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center dark:border-zinc-700 dark:bg-zinc-900/50">
              <AspectRatio ratio={4 / 3}>
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-[10px] font-medium text-center">
                    Đang tải ảnh lên...
                  </span>
                </div>
              </AspectRatio>
            </div>
          )}
        </div>
      )}

      {/* Upload button for SUPERVISORs */}
      {isSupervisor && (
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors">
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                Đang tải ảnh lên Cloudinary...
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-zinc-500" />
                Thêm hình ảnh
              </>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-3xl p-2 bg-black border-zinc-800 text-white">
          <DialogHeader className="p-2 border-b border-zinc-800">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Xem trước hình ảnh nhật ký công
              trình
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative flex items-center justify-center max-h-[80vh] p-2 overflow-hidden">
              <Image
                src={selectedImage}
                alt="Hình ảnh thực địa kích thước đầy đủ"
                width={1200}
                height={900}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog
        open={!!imageToDelete}
        onOpenChange={(open) => !open && !deletingImage && setImageToDelete(null)}
        title="Xóa hình ảnh thực địa?"
        description="Hình ảnh này sẽ bị xóa vĩnh viễn khỏi Cloudinary và nhật ký công trình. Thao tác này không thể hoàn tác."
        confirmLabel="Xóa hình ảnh"
        variant="destructive"
        loading={deletingImage}
        onConfirm={handleDeleteImage}
      />
    </div>
  );
}

