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

export default cloudinary;
