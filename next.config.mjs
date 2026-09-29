/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["cloudinary", "@cloudinary/analysis"],
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
};
export default nextConfig;
