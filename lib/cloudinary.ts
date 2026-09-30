import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;
  if (
    cloudName === "your_cloud_name" ||
    apiKey === "your_api_key" ||
    apiSecret === "your_api_secret" ||
    cloudName.startsWith("your_") ||
    apiKey.startsWith("your_") ||
    apiSecret.startsWith("your_")
  ) {
    return false;
  }
  return true;
}

export { cloudinary };
