import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(
  fileInput: string | Buffer,
  folder = "construction_tracker/daily_reports"
): Promise<{ url: string; publicId: string }> {
  if (typeof fileInput === "string") {
    const res = await cloudinary.uploader.upload(fileInput, {
      folder,
      resource_type: "auto",
    });
    return { url: res.secure_url, publicId: res.public_id };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(fileInput);
  });
}

/**
 * Extracts the Cloudinary public_id from a full Cloudinary secure URL.
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    if (!url.includes("cloudinary.com")) return null;

    const cleanUrl = url.split("?")[0].split("#")[0];
    const uploadIndex = cleanUrl.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = cleanUrl.substring(uploadIndex + "/upload/".length);
    const parts = pathAfterUpload.split("/");
    let startIndex = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/^v\d+$/.test(part)) {
        startIndex = i + 1;
        break;
      }
      if (part.includes(",") || part.includes("_")) {
        startIndex = i + 1;
      }
    }

    if (startIndex < parts.length) {
      pathAfterUpload = parts.slice(startIndex).join("/");
    }

    const dotIndex = pathAfterUpload.lastIndexOf(".");
    if (dotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
    }

    return pathAfterUpload || null;
  } catch (error) {
    console.error("Error parsing Cloudinary public_id:", error);
    return null;
  }
}

/**
 * Bulk delete images from Cloudinary storage given their URLs or publicIds.
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  const publicIds = urls
    .map((url) => (url.startsWith("http") ? extractPublicIdFromUrl(url) : url))
    .filter((id): id is string => Boolean(id));

  if (publicIds.length === 0) return;

  const uniqueIds = Array.from(new Set(publicIds));

  try {
    for (let i = 0; i < uniqueIds.length; i += 100) {
      const chunk = uniqueIds.slice(i, i + 100);
      await cloudinary.api.delete_resources(chunk);
    }
  } catch (error) {
    console.error("Error deleting images from Cloudinary:", error);
  }
}

export default cloudinary;
