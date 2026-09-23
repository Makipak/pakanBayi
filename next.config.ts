import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan dev server diakses lewat tunnel ngrok saat demo online.
  // Cakup semua format domain ngrok (free & paid).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
};

export default nextConfig;
