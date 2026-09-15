// Client-side helper untuk data wilayah administratif Indonesia. Fetch DIARAHKAN
// ke API internal kita sendiri (/api/wilayah/**), bukan langsung ke emsifa.github.io,
// karena GitHub Pages tidak mengirim header CORS sehingga fetch langsung dari
// browser diblokir. Route handler di src/app/api/wilayah/** yang melakukan fetch
// ke emsifa dari sisi server (lihat src/lib/wilayah-server.ts) — server-to-server
// tidak kena aturan CORS.

export type WilayahItem = { id: string; name: string };

async function getJson(url: string): Promise<WilayahItem[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal memuat data wilayah (${res.status})`);
  return res.json();
}

export function fetchProvinces(): Promise<WilayahItem[]> {
  return getJson("/api/wilayah/provinces");
}

export function fetchRegencies(provinceId: string): Promise<WilayahItem[]> {
  return getJson(`/api/wilayah/regencies/${provinceId}`);
}

export function fetchDistricts(regencyId: string): Promise<WilayahItem[]> {
  return getJson(`/api/wilayah/districts/${regencyId}`);
}

export function fetchVillages(districtId: string): Promise<WilayahItem[]> {
  return getJson(`/api/wilayah/villages/${districtId}`);
}
