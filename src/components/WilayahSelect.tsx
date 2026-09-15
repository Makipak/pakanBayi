"use client";

import { useEffect, useState } from "react";
import { Input, Label, Select } from "@/components/ui";
import {
  fetchDistricts,
  fetchProvinces,
  fetchRegencies,
  fetchVillages,
  type WilayahItem,
} from "@/lib/wilayah";

// Dropdown wilayah administratif berjenjang (Provinsi → Kab/Kota → Kecamatan →
// Desa/Kel), "klik-klik saja" — tidak perlu ketik manual. Datanya diambil dari
// API publik saat form dibuka, jadi butuh internet di browser kader/admin.
// Kalau API tidak bisa diakses (offline / diblokir jaringan), otomatis fallback
// ke isian teks manual supaya form tetap bisa dipakai.
export function WilayahSelect({
  defaultProvinsi = "",
  defaultKabupatenKota = "",
  defaultKecamatan = "",
  defaultDesaKelurahan = "",
}: {
  defaultProvinsi?: string;
  defaultKabupatenKota?: string;
  defaultKecamatan?: string;
  defaultDesaKelurahan?: string;
}) {
  const [manualMode, setManualMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  const [provinceId, setProvinceId] = useState("");
  const [regencyId, setRegencyId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [villageName, setVillageName] = useState("");

  const [loadingLevel, setLoadingLevel] = useState<null | "prov" | "kab" | "kec" | "desa">("prov");

  const provinceName = provinces.find((p) => p.id === provinceId)?.name ?? "";
  const regencyName = regencies.find((r) => r.id === regencyId)?.name ?? "";
  const districtName = districts.find((d) => d.id === districtId)?.name ?? "";

  useEffect(() => {
    if (manualMode) return;
    let cancelled = false;
    fetchProvinces()
      .then((data) => {
        if (cancelled) return;
        setProvinces(data);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Tidak bisa memuat data wilayah (cek koneksi internet). Isi manual saja.");
        setManualMode(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingLevel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [manualMode]);

  function onProvinceChange(id: string) {
    setProvinceId(id);
    setRegencyId("");
    setDistrictId("");
    setVillageName("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (!id) return;
    setLoadingLevel("kab");
    fetchRegencies(id)
      .then(setRegencies)
      .catch(() => setLoadError("Gagal memuat daftar Kab/Kota."))
      .finally(() => setLoadingLevel(null));
  }

  function onRegencyChange(id: string) {
    setRegencyId(id);
    setDistrictId("");
    setVillageName("");
    setDistricts([]);
    setVillages([]);
    if (!id) return;
    setLoadingLevel("kec");
    fetchDistricts(id)
      .then(setDistricts)
      .catch(() => setLoadError("Gagal memuat daftar Kecamatan."))
      .finally(() => setLoadingLevel(null));
  }

  function onDistrictChange(id: string) {
    setDistrictId(id);
    setVillageName("");
    setVillages([]);
    if (!id) return;
    setLoadingLevel("desa");
    fetchVillages(id)
      .then(setVillages)
      .catch(() => setLoadError("Gagal memuat daftar Desa/Kel."))
      .finally(() => setLoadingLevel(null));
  }

  if (manualMode) {
    return (
      <>
        {loadError && <p className="sm:col-span-3 text-xs text-amber-600">{loadError}</p>}
        <div>
          <Label htmlFor="provinsi">Provinsi</Label>
          <Input id="provinsi" name="provinsi" defaultValue={defaultProvinsi} />
        </div>
        <div>
          <Label htmlFor="kabupatenKota">Kab/Kota</Label>
          <Input id="kabupatenKota" name="kabupatenKota" defaultValue={defaultKabupatenKota} />
        </div>
        <div>
          <Label htmlFor="kecamatan">Kecamatan</Label>
          <Input id="kecamatan" name="kecamatan" defaultValue={defaultKecamatan} />
        </div>
        <div>
          <Label htmlFor="desaKelurahan">Desa/Kel</Label>
          <Input id="desaKelurahan" name="desaKelurahan" defaultValue={defaultDesaKelurahan} />
        </div>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setLoadingLevel("prov");
            setManualMode(false);
          }}
          className="sm:col-span-3 text-left text-xs text-brand hover:underline"
        >
          Coba pilih dari dropdown lagi
        </button>
      </>
    );
  }

  return (
    <>
      <input type="hidden" name="provinsi" value={provinceName} />
      <input type="hidden" name="kabupatenKota" value={regencyName} />
      <input type="hidden" name="kecamatan" value={districtName} />
      <input type="hidden" name="desaKelurahan" value={villageName} />

      <div>
        <Label htmlFor="provinsiSelect">Provinsi</Label>
        <Select
          id="provinsiSelect"
          value={provinceId}
          onChange={(e) => onProvinceChange(e.target.value)}
          disabled={loadingLevel === "prov"}
        >
          <option value="">{loadingLevel === "prov" ? "Memuat..." : "Pilih provinsi"}</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="kabupatenSelect">Kab/Kota</Label>
        <Select
          id="kabupatenSelect"
          value={regencyId}
          onChange={(e) => onRegencyChange(e.target.value)}
          disabled={!provinceId || loadingLevel === "kab"}
        >
          <option value="">{loadingLevel === "kab" ? "Memuat..." : "Pilih kab/kota"}</option>
          {regencies.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="kecamatanSelect">Kecamatan</Label>
        <Select
          id="kecamatanSelect"
          value={districtId}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!regencyId || loadingLevel === "kec"}
        >
          <option value="">{loadingLevel === "kec" ? "Memuat..." : "Pilih kecamatan"}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="desaSelect">Desa/Kel</Label>
        <Select
          id="desaSelect"
          value={villageName}
          onChange={(e) => setVillageName(e.target.value)}
          disabled={!districtId || loadingLevel === "desa"}
        >
          <option value="">{loadingLevel === "desa" ? "Memuat..." : "Pilih desa/kel"}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name}
            </option>
          ))}
        </Select>
      </div>
      <button
        type="button"
        onClick={() => setManualMode(true)}
        className="sm:col-span-3 text-left text-xs text-slate-400 hover:underline"
      >
        Wilayah tidak ketemu di daftar? Isi manual
      </button>
    </>
  );
}
