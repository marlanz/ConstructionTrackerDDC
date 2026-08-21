import { getUploadSignature } from "@/app/actions/dailyReport.actions";

/**
 * Upload an image file directly to Cloudinary from the browser using a short-lived signature.
 */
export async function uploadImageToCloudinary(
  file: File,
): Promise<{ url: string; publicId: string }> {
  const sigResult = await getUploadSignature();
  if (!sigResult.success) {
    throw new Error(sigResult.error);
  }
  const {
    timestamp,
    signature,
    apiKey,
    cloudName: sigCloudName,
  } = sigResult.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", "daily-reports");

  const cloudName =
    sigCloudName ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME chưa được cấu hình");
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || "Tải ảnh lên Cloudinary thất bại",
    );
  }

  const data = await res.json();
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
  };
}
