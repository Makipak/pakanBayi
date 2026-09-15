// Dipakai HANYA oleh route handler di src/app/api/wilayah/** (server-side).
// Fetch ke emsifa dilakukan dari server Next.js, bukan dari browser, supaya
// tidak kena CORS (GitHub Pages tidak mengirim header Access-Control-Allow-Origin
// untuk domain lain) — browser cukup fetch ke API internal kita sendiri.

const BASE_URL = "https://emsifa.github.io/api-wilayah-indonesia/api";

// Cache di server: sekali sebuah path (mis. "regencies/32.json") diambil, hasilnya
// disimpan di memori proses ini selama server hidup — data wilayah administratif
// praktis tidak pernah berubah, jadi klik dropdown berikutnya (kader/admin lain,
// atau balita berikutnya di provinsi yang sama) langsung instan tanpa fetch ulang
// ke emsifa. Ini independen dari fetch cache bawaan Next.js (yang perilakunya bisa
// beda-beda antar versi) — jadi kecepatannya konsisten.
const memoryCache = new Map<string, unknown>();

// Cache-Control ini yang bikin BROWSER juga tidak fetch ulang ke server kita kalau
// user buka form Tambah Balita lagi hari yang sama.
const BROWSER_CACHE_HEADER = "public, max-age=86400, stale-while-revalidate=604800";

// Jangan biarkan dropdown "Memuat..." menggantung lama kalau emsifa.github.io
// lambat/tidak respons — 6 detik lalu gagal, komponen di client otomatis fallback
// ke isian manual.
const TIMEOUT_MS = 6000;

export async function proxyWilayah(path: string): Promise<Response> {
  const cached = memoryCache.get(path);
  if (cached) {
    return Response.json(cached, {
      headers: { "Cache-Control": BROWSER_CACHE_HEADER },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${BASE_URL}/${path}`, { signal: controller.signal });
    if (!upstream.ok) {
      return Response.json(
        { error: `Sumber data wilayah membalas status ${upstream.status}` },
        { status: 502 }
      );
    }
    const data = await upstream.json();
    memoryCache.set(path, data);
    return Response.json(data, {
      headers: { "Cache-Control": BROWSER_CACHE_HEADER },
    });
  } catch {
    return Response.json(
      { error: "Gagal menghubungi sumber data wilayah. Cek koneksi internet server." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
