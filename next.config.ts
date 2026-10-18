import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Batasi worker build ke 1 CPU. Di shared hosting cPanel build dijalankan langsung
  // di server, dan default Next (jumlah core server) bikin LVE "Number of Processes" mentok.
  experimental: { cpus: 1 },
  // Izinkan dev server diakses lewat tunnel ngrok saat demo online.
  // Cakup semua format domain ngrok (free & paid).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
  // Matikan optimasi gambar server-side (sharp/libvips). Di shared hosting
  // cPanel, sharp scale thread count-nya ke jumlah core server dan bikin
  // LVE "Number of Processes" langsung mentok tiap ada request gambar
  // (lihat insiden 22-23 Sep 2026). Gambar dikirim apa adanya tanpa resize/
  // convert otomatis oleh Next.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
