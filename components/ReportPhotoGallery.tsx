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
import { Button } from "@/components/ui/button";
import { attachReportImage } from "@/app/actions/dailyReport.actions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-client";
import { WorkAgendaImage } from "@/lib/services/dailyReport.service";
import { useRouter } from "next/navigation";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

interface ReportPhotoGalleryProps {
  reportId: string;
  entryId: string;
  images: WorkAgendaImage[];
  isSupervisor: boolean;
}

export function ReportPhotoGallery({
  reportId,
  entryId,
  images,
  isSupervisor,
}: ReportPhotoGalleryProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      const errMsg = err.message || "Xử lý tệp hình ảnh thất bại";
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
    </div>
  );
}
