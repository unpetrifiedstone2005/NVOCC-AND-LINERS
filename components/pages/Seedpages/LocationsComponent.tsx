// File: components/pages/Seedpages/LocationsComponent.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Upload,
  List as ListIcon,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Edit3,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Tag,
} from "lucide-react";
import axios from "axios";

const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

// UI-friendly types that map to DB enum:
// PORT        -> SEAPORT
// INLAND      -> INLAND_CITY
type LocationType = "PORT" | "INLAND";

// Tri-state select for Door capability
type DoorTri = "UNKNOWN" | "ALLOWED" | "NOT_ALLOWED";

interface Location {
  id:       string;
  unlocode: string | null;
  name:     string;
  city:     string | null;
  country:  string | null;
  type:     LocationType; // UI-facing type in this component

  // optional (may not be returned by your list endpoint yet)
  doorPickupAllowed?: boolean | null;
  doorDeliveryAllowed?: boolean | null;
  doorNotes?: string | null;

  // NEW: aliases from DB (string array)
  aliases?: string[];
}

interface LocationForm {
  unlocode: string;
  name:     string;
  city:     string;
  country:  string;
  type:     LocationType;

  // NEW: Door capability inputs
  pickupDoor: DoorTri;   // UNKNOWN | ALLOWED | NOT_ALLOWED
  deliveryDoor: DoorTri; // UNKNOWN | ALLOWED | NOT_ALLOWED
  doorNotes: string;

  // NEW: Aliases (comma/newline separated text field in UI)
  aliasesText: string;
}

const triToBool = (v: DoorTri): boolean | null =>
  v === "ALLOWED" ? true : v === "NOT_ALLOWED" ? false : null;

const boolishToTri = (v: boolean | null | undefined): DoorTri =>
  v === true ? "ALLOWED" : v === false ? "NOT_ALLOWED" : "UNKNOWN";

const parseBoolish = (v: unknown): boolean | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1 ? true : v === 0 ? false : null;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true","1","yes","y"].includes(s)) return true;
    if (["false","0","no","n"].includes(s)) return false;
  }
  return null;
};

// Normalize aliases from string or array into uppercased, de-duped list
function normalizeAliases(input: string | string[] | null | undefined): string[] {
  const parts: string[] =
    typeof input === "string"
      ? input.split(/[,;\n]+/)
      : Array.isArray(input)
      ? input
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = String(p).trim();
    if (!t) continue;
    const up = t.toUpperCase();
    if (!seen.has(up)) {
      seen.add(up);
      out.push(up);
    }
  }
  return out;
}

export function LocationsComponent() {
  const [activeTab, setActiveTab] =
    useState<"create" | "bulk-import" | "list">("create");

  const [form, setForm] = useState<LocationForm>({
    unlocode: "",
    name:     "",
    city:     "",
    country:  "",
    type:     "PORT",
    pickupDoor: "UNKNOWN",
    deliveryDoor: "UNKNOWN",
    doorNotes: "",
    aliasesText: "",
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const [filters, setFilters] = useState({
    code: "",
    name: "",
    type: "" as LocationType | "",
  });

  // edit-modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selected, setSelected]           = useState<Location | null>(null);
  const [editForm, setEditForm]           = useState<LocationForm>({
    unlocode: "",
    name:     "",
    city:     "",
    country:  "",
    type:     "PORT",
    pickupDoor: "UNKNOWN",
    deliveryDoor: "UNKNOWN",
    doorNotes: "",
    aliasesText: "",
  });

  const [bulkMode, setBulkMode]     = useState<"textarea"|"file">("textarea");
  const [bulkData, setBulkData]     = useState("");
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);

  const [isLoading, setIsLoading]         = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUpdating, setIsUpdating]       = useState(false);
  const [message, setMessage]             = useState<{type:"success"|"error", text:string}|null>(null);

  const showMessage = (type:"success"|"error", text:string) => {
    setMessage({type, text});
    setTimeout(() => setMessage(null), 5000);
  };

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  function downloadSample() {
    const sample = [
      // PORTS (need UN/LOCODE)
      { unlocode: "INBOM", name: "Mumbai",   city: "Mumbai",   country: "IN", type: "PORT",   doorPickupAllowed: true,  doorDeliveryAllowed: true,  doorNotes: "Full inland coverage", aliases:["BOMBAY","NHAVA SHEVA","JNPT"] },
      { unlocode: "IEDUB", name: "Dublin",   city: "Dublin",   country: "IE", type: "PORT",   doorPickupAllowed: false, doorDeliveryAllowed: false, doorNotes: "CY only (no door)", aliases:["DUBLIN PORT"] },
      // INLAND CITIES (UN/LOCODE preferred but optional in our API)
      { unlocode: "USCHI", name: "Chicago",  city: "Chicago",  country: "US", type: "INLAND", doorPickupAllowed: true,  doorDeliveryAllowed: true,  aliases:["CHI","CHICAGO, IL"] },
      { unlocode: "INDEL", name: "Delhi",    city: "Delhi",    country: "IN", type: "INLAND", doorPickupAllowed: null,  doorDeliveryAllowed: null, doorNotes: "Unknown; verify locally", aliases:["NEW DELHI","DELHI NCR"] }
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "locations-sample.json"; a.click();
  }

  async function fetchLocations(page = 1) {
    setIsLoadingList(true);
    try {
      const params = {
        page:  String(page),
        limit: "20",
        ...(filters.code && { code: filters.code }),
        ...(filters.name && { name: filters.name }),
        ...(filters.type && { type: filters.type }),
      };

      const res = await axios.get("/api/seed/locations/get", { params });

      const toUiType = (t: any): LocationType =>
        t === "SEAPORT" || t === "PORT" ? "PORT" : "INLAND";

      const items: Location[] = (res.data.items as any[]).map((x): Location => ({
        id: String(x.id),
        unlocode: x.unlocode ?? null,
        name: String(x.name),
        city: x.city ?? null,
        country: x.country ?? null,
        type: toUiType(x.type),

        // 👇 map BOTH, and coerce
        doorPickupAllowed:   parseBoolish(x.doorPickupAllowed ?? x.pickupDoor),
        doorDeliveryAllowed: parseBoolish(x.doorDeliveryAllowed ?? x.deliveryDoor),

        doorNotes: typeof x.doorNotes === "string" ? x.doorNotes : (x.doorNotes ?? ""),

        // NEW: aliases
        aliases: normalizeAliases(x.aliases),
      }));
      setLocations(items);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch {
      showMessage("error", "Failed to fetch locations");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function createLocation(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Normalize aliases from text (comma/newlines)
      const aliases = normalizeAliases(form.aliasesText);

      // Send UI type; server maps "PORT" -> SEAPORT, "INLAND" -> INLAND_CITY
      const payload = {
        unlocode: form.unlocode?.trim() ? form.unlocode.trim().toUpperCase() : null,
        name:     form.name.trim(),
        city:     form.city?.trim() || null,
        country:  form.country?.trim().toUpperCase() || null,
        type:     form.type, // "PORT" | "INLAND" (server maps)

        // NEW: door capability flags
        doorPickupAllowed:   triToBool(form.pickupDoor),
        doorDeliveryAllowed: triToBool(form.deliveryDoor),
        doorNotes:           form.doorNotes?.trim() || null,

        // NEW: aliases array
        aliases,
      };

      // IMPORTANT: update on conflicts so type/door/aliases changes take effect
      await axios.post("/api/seed/locations/post?onConflict=update", payload);

      showMessage("success", "Location created/updated");
      setForm({
        unlocode: "",
        name:     "",
        city:     "",
        country:  "",
        type:     "PORT",
        pickupDoor: "UNKNOWN",
        deliveryDoor: "UNKNOWN",
        doorNotes: "",
        aliasesText: "",
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ??
        "Creation failed";
      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  function useDebounce<T>(value: T, delay = 1000) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }

  async function applyEdit() {
    if (!selected) return;
    setIsUpdating(true);
    try {
      const aliases = normalizeAliases(editForm.aliasesText);

      // Include door & aliases fields in the PATCH request
      await axios.patch(`/api/seed/locations/${selected.id}/patch`, {
        unlocode: editForm.unlocode,
        name:     editForm.name,
        city:     editForm.city,
        country:  editForm.country,
        type:     editForm.type,
        doorPickupAllowed: triToBool(editForm.pickupDoor),
        doorDeliveryAllowed: triToBool(editForm.deliveryDoor),
        doorNotes: editForm.doorNotes?.trim() || null,
        aliases,
      });
      showMessage("success", "Location updated");
      setEditModalOpen(false);
      fetchLocations(currentPage);
    } catch (err:any) {
      const msg =
        err.response?.data?.error ??
        (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ??
        "Update failed";
      showMessage("error", msg);
    } finally {
      setIsUpdating(false);
    }
  }

  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      let raw = bulkData;
      if (bulkMode === "file" && uploadedFile) {
        raw = await uploadedFile.text();
      }

      const parsed = JSON.parse(raw);
      const rows: any[] = Array.isArray(parsed) ? parsed : [parsed];

      const normalized = rows.map((r, i) => {
        const typeRaw = (r.type ?? "").toString().toUpperCase();
        const type = typeRaw === "PORT" || typeRaw === "SEAPORT" ? "SEAPORT" : "INLAND_CITY";

        const code = (r.unlocode ?? r.code ?? null);
        const unlocode = code ? String(code).trim().toUpperCase() : null;

        const name = String(r.name ?? "").trim();
        const city = r.city ? String(r.city).trim() : null;
        const country = r.country ? String(r.country).trim().toUpperCase() : null;

        // use the top-level helper
        const doorPickupAllowed   = parseBoolish(r.doorPickupAllowed);
        const doorDeliveryAllowed = parseBoolish(r.doorDeliveryAllowed);
        const doorNotes = r.doorNotes != null ? String(r.doorNotes) : null;

        // NEW: aliases can be array or comma/newline string
        const aliases = normalizeAliases(r.aliases ?? r.aliasesText ?? null);

        if (!name) throw new Error(`Row ${i + 1}: "name" is required`);
        if (type === "SEAPORT" && !unlocode) {
          throw new Error(`Row ${i + 1}: UN/LOCODE (field "unlocode" or "code") is required for PORT/SEAPORT`);
        }
        if (unlocode && !/^[A-Z0-9]{5}$/.test(unlocode)) {
          throw new Error(`Row ${i + 1}: invalid UN/LOCODE "${unlocode}" (expected 5 alphanumerics, e.g. USLAX)`);
        }

        return { unlocode, name, city, country, type, doorPickupAllowed, doorDeliveryAllowed, doorNotes, aliases };
      });

      await axios.post("/api/seed/locations/post?onConflict=update", normalized);

      showMessage("success", `Imported ${normalized.length} location(s).`);
      setBulkData("");
      setUploadedFile(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        (err?.response?.data?.errors && JSON.stringify(err.response.data.errors)) ??
        (err?.message || "Import failed");
      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  const debouncedFilters = useDebounce(filters, 300);

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "list") return;
    fetchLocations(currentPage); // uses current `filters` state internally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, currentPage]);

  useEffect(() => {
    if (activeTab !== "list") return;

    // If we're not on page 1, move to 1 and let the page effect do the fetch.
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    // Already on page 1 → fetch now
    fetchLocations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedFilters]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      <header className="py-8 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <MapPin className="text-[#00FFFF]" size={50}/>
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Master Locations</h1>
        <p className="text-lg mt-2">Ports & Inland Cities</p>
      </header>

      {message && (
        <div
          className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-900/30 border border-green-400 text-green-400"
              : "bg-red-900/30 border border-red-400 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}
          <span>{message.text}</span>
        </div>
      )}

      {/* TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { key:"create",      icon:<Plus/>,     label:"CREATE LOCATION" },
            { key:"bulk-import", icon:<Upload/>,   label:"BULK IMPORT"     },
            { key:"list",        icon:<ListIcon/>, label:"LOCATION LIST"   },
          ].map(tab=>(
            <button key={tab.key}
              onClick={()=>setActiveTab(tab.key as any)}
              className={`px-1 py-2 font-bold flex items-center justify-center gap-2 ${
                activeTab===tab.key
                  ? "bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0_rgba(0,0,0,1)] "
                  : "bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] rounded-lg shadow-[4px_4px_0_rgba(0,0,0,1)] "
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CREATE */}
      {activeTab==="create" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <MapPin className="text-cyan-400" size={24}/> Create Location
            </h2>

            <form onSubmit={createLocation} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label:"Code (UN/LOCODE)", key:"unlocode", placeholder:"USLAX" },
                { label:"Name",            key:"name",     placeholder:"Port or City name" },
                { label:"City",            key:"city",     placeholder:"City (e.g. CHICAGO)" },
                { label:"Country",         key:"country",  placeholder:"ISO-2 (e.g. US)" },
              ].map(f=> {
                // Required rules: name always; unlocode only when type=PORT
                const isRequired = f.key === "name" || (f.key === "unlocode" && form.type === "PORT");
                const label = `${f.label}${isRequired ? " *" : ""}`;
                return (
                  <div key={f.key} className="space-y-2">
                    <label className="text-sm font-semibold">{label}</label>
                    <input
                      type="text"
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        [f.key]: e.target.value.toUpperCase()
                      }))}
                      placeholder={f.placeholder}
                      required={isRequired}
                      className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                                placeholder-white/60 focus:border-white mt-2"
                    />
                  </div>
                );
              })}

              <div className="space-y-2">
                <label className="text-sm font-semibold">Type *</label>
                <select
                  value={form.type}
                  onChange={e =>
                    setForm(prev => ({ ...prev, type: e.target.value as LocationType }))
                  }
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white mt-2"
                >
                  <option value="PORT">PORT</option>
                  <option value="INLAND">INLAND</option>
                </select>
              </div>

              {/* NEW: Door capability (tri-state) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Door Pickup (from this location)</label>
                <select
                  value={form.pickupDoor}
                  onChange={e => setForm(prev => ({ ...prev, pickupDoor: e.target.value as DoorTri }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white mt-2"
                >
                  <option value="UNKNOWN">UNKNOWN</option>
                  <option value="ALLOWED">ALLOWED</option>
                  <option value="NOT_ALLOWED">NOT ALLOWED</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Door Delivery (to this location)</label>
                <select
                  value={form.deliveryDoor}
                  onChange={e => setForm(prev => ({ ...prev, deliveryDoor: e.target.value as DoorTri }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white mt-2"
                >
                  <option value="UNKNOWN">UNKNOWN</option>
                  <option value="ALLOWED">ALLOWED</option>
                  <option value="NOT_ALLOWED">NOT ALLOWED</option>
                </select>
              </div>

              {/* Notes (not uppercased) */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold">Door Notes (optional)</label>
                <textarea
                  value={form.doorNotes}
                  onChange={e => setForm(prev => ({ ...prev, doorNotes: e.target.value }))}
                  rows={3}
                  placeholder="e.g., CY only, no carrier haulage inland"
                  className="w-full px-4 py-3 bg-[#0A1A2F] border-4 border-black rounded-lg text-white placeholder-white/60 focus:border-white"
                />
              </div>

              {/* NEW: Aliases */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Aliases (optional)
                </label>
                <textarea
                  value={form.aliasesText}
                  onChange={e => setForm(prev => ({ ...prev, aliasesText: e.target.value }))}
                  rows={2}
                  placeholder="Comma or newline separated: NHAVA SHEVA, JNPT, BOMBAY"
                  className="w-full px-4 py-3 bg-[#0A1A2F] border-4 border-black rounded-lg text-white placeholder-white/60 focus:border-white"
                />
                <p className="text-xs text-white/90">
                  We’ll store these as uppercased tokens in <code>aliases[]</code>.
                </p>
              </div>

              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? (
                    <Settings className="animate-spin w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Create
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* BULK IMPORT */}
      {activeTab==="bulk-import" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Upload className="text-cyan-400" /> Bulk Import Locations
            </h2>

            {/* Mode Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setBulkMode("file")}
                className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-all ${
                  bulkMode === "file"
                    ? "bg-[#600f9e] text-white"
                    : "bg-[#1A2A4A] text-white hover:bg-[#00FFFF] hover:text-black"
                }`}
                style={bulkMode === "file" ? cardGradient : {}}
              >
                <Upload className="w-5 h-5" /> Upload JSON File
              </button>

              <button
                type="button"
                onClick={() => setBulkMode("textarea")}
                className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-all ${
                  bulkMode === "textarea"
                    ? "bg-[#600f9e] text-white"
                    : "bg-[#1A2A4A] text-white hover:bg-[#00FFFF] hover:text-black"
                }`}
                style={bulkMode === "textarea" ? cardGradient : {}}
              >
                <FileText className="w-5 h-5" /> Paste JSON Data
              </button>
            </div>

            {/* Download Sample */}
            <div className="mb-6">
              <button
                type="button"
                onClick={downloadSample}
                className="bg-[#2a72dc] hover:bg-[#00FFFF] hover:text-black px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-all"
              >
                <Download className="w-5 h-5" /> Download Sample JSON
              </button>
              <p className="text-md text-slate-200 mt-5">
                Download a <b>full example</b> for locations import.
              </p>
            </div>

            <form onSubmit={importBulk} className="space-y-6">
              {bulkMode === "file" ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Select JSON File *</label>
                  <div className="border-2 border-dashed border-white rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
                    <input
                      id="location-file"
                      type="file"
                      accept=".json"
                      required
                      className="hidden"
                      onChange={e => setUploadedFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="location-file" className="cursor-pointer flex flex-col items-center gap-4">
                      <Upload className="w-16 h-16 text-slate-400" />
                      <p className="text-lg font-semibold text-white">Click to upload JSON file</p>
                      <p className="text-sm text-slate-400">or drag and drop</p>
                    </label>
                  </div>
                  <p className="text-xs font-bold text-white">
                    File must be an array of <b>locations</b>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">JSON Data *</label>
                  <textarea
                    className="w-full px-4 py-3 bg-[#0A1A2F] border border-white/80 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                    rows={10}
                    placeholder={`[
  { "unlocode": "INBOM", "name": "Mumbai",  "city": "Mumbai",  "country": "IN", "type": "PORT",
    "doorPickupAllowed": true, "doorDeliveryAllowed": true, "doorNotes": "Full inland coverage",
    "aliases": ["BOMBAY","NHAVA SHEVA","JNPT"] },
  { "unlocode": "IEDUB", "name": "Dublin",  "city": "Dublin",  "country": "IE", "type": "PORT",
    "doorPickupAllowed": false, "doorDeliveryAllowed": false, "aliases": "DUBLIN PORT" },
  { "unlocode": "USCHI", "name": "Chicago", "city": "Chicago", "country": "US", "type": "INLAND",
    "doorPickupAllowed": true,  "doorDeliveryAllowed": true, "aliases": ["CHI","CHICAGO, IL"] }
]`}
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                    required
                  />
                  <div className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600 mt-4" style={cardGradient}>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-3">JSON Format:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-bold text-white">
                      <div>• unlocode (PORT required)</div>
                      <div>• name</div>
                      <div>• city</div>
                      <div>• country (ISO-2)</div>
                      <div>• type (PORT | INLAND)</div>
                      <div>• doorPickupAllowed (true/false/null)</div>
                      <div>• doorDeliveryAllowed (true/false/null)</div>
                      <div>• doorNotes (optional)</div>
                      <div>• aliases (array or string)</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-all"
                >
                  {isLoading ? (
                    <>
                      <Settings className="w-5 h-5 animate-spin" /> Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" /> Import Locations
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* LIST */}
      {activeTab==="list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <ListIcon className="text-cyan-400"/> Locations
            </h2>

            {/* Filters */}
            <div
              className="bg-[#2e4972] rounded-lg border-4 border-black p-6 mb-8"
              style={cardGradient}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Code */}
                <div className="space-y-2">
                  <label htmlFor="filter-code" className="block text-sm font-semibold text-white">
                    Code
                  </label>
                  <input
                    id="filter-code"
                    type="text"
                    placeholder="USLAX"
                    value={filters.code}
                    onChange={e => setFilters(f => ({ ...f, code: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                              focus:border-white focus:outline-none"
                  />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="filter-name" className="block text-sm font-semibold text-white">
                    Name
                  </label>
                  <input
                    id="filter-name"
                    type="text"
                    placeholder="Port or City…"
                    value={filters.name}
                    onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                              focus:border-white focus:outline-none"
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label htmlFor="filter-type" className="block text-sm font-semibold text-white">
                    Type
                  </label>
                  <select
                    id="filter-type"
                    value={filters.type}
                    onChange={e => setFilters(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                              focus:border-white focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="PORT">Port</option>
                    <option value="INLAND">Inland</option>
                  </select>
                </div>
              </div>

              {/* Apply / Clear (keep just Clear, like the top block) */}
              <div className="mt-6 flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setFilters({ code: "", name: "", type: "" as any });
                  }}
                  className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg flex items-center gap-2
                            text-white uppercase text-sm shadow-[8px_8px_0_rgba(0,0,0,1)]
                            hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {isLoadingList
                ? (
                  <div className="col-span-full text-center py-12">
                    <Settings className="animate-spin"/>
                  </div>
                ) : (
                  locations.map(loc => (
                    <div
                      key={loc.id}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group cursor-pointer"
                      style={cardGradient}
                      onClick={()=>{
                        setSelected(loc);
                        setEditForm({
                          unlocode: loc.unlocode ?? "",
                          name:     loc.name ?? "",
                          city:     (loc.city ?? "") as string,
                          country:  (loc.country ?? "") as string,
                          type:     loc.type,
                          pickupDoor: boolishToTri(loc.doorPickupAllowed),
                          deliveryDoor: boolishToTri(loc.doorDeliveryAllowed),
                          doorNotes: loc.doorNotes ?? "",
                          aliasesText: (loc.aliases ?? []).join(", "),
                        });
                        setEditModalOpen(true);
                      }}
                    >
                      {/* Top row: type badge */}
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`px-2 py-1 text-xs rounded border
              ${loc.type === "PORT"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                : "bg-amber-500/20 text-amber-300 border-amber-400"}`}
                        >
                          {loc.type === "PORT" ? "PORT" : "INLAND"}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400">Code:</span>
                          <span className="font-mono">{loc.unlocode || "-"}</span>

                          <span className="text-slate-400 ml-4">Country:</span>
                          <span className="font-mono">{loc.country || "-"}</span>
                        </div>

                        <p>
                          <span className="text-slate-400">Name:</span>{" "}
                          {loc.name || "-"}
                        </p>

                        {(loc.city || "").trim() && (
                          <p>
                            <span className="text-slate-400">City:</span>{" "}
                            {loc.city}
                          </p>
                        )}
                      </div>

                      {/* NEW: show up to 3 alias badges */}
                      {!!(loc.aliases && loc.aliases.length) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {loc.aliases.slice(0,3).map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-1 rounded border border-cyan-400 text-cyan-300 bg-cyan-500/10"
                            >
                              {a}
                            </span>
                          ))}
                          {loc.aliases.length > 3 && (
                            <span className="text-[10px] text-white/70">+{loc.aliases.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Hover hint */}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-2 text-cyan-400 transition-opacity">
                        <Edit3 className="w-4 h-4" /> Click to edit
                      </div>
                    </div>
                  ))
                )
              }

            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <button
                disabled={currentPage<=1}
                onClick={()=>setCurrentPage(p=>p-1)}
                className="px-4 py-2 bg-[#2a72dc] rounded disabled:opacity-50"
              >
                <ChevronLeft/> Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage>=totalPages}
                onClick={()=>setCurrentPage(p=>p+1)}
                className="px-4 py-2 bg-[#2a72dc] rounded disabled:opacity-50"
              >
                Next <ChevronRight/>
              </button>
            </div>

          </div>
        </section>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-6 max-w-md w-full" style={cardGradient}>
            <header className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3/> Edit Location
              </h3>
              <button onClick={()=>setEditModalOpen(false)}>
                <X/>
              </button>
            </header>
            <form onSubmit={e=>{ e.preventDefault(); applyEdit(); }} className="space-y-4">
              {["unlocode","name","city","country"].map(key=>(
                <div key={key} className="space-y-1">
                  <label className="text-sm font-semibold">
                    {key === "unlocode" ? "Code (UNLOCODE)" : key.charAt(0).toUpperCase()+key.slice(1)}
                  </label>
                  <input
                    type="text"
                    value={(editForm as any)[key] ?? ""}
                    onChange={e=>setEditForm(prev=>({
                      ...prev,
                      [key]: e.target.value.toUpperCase()
                    }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-sm font-semibold">Type</label>
                <select
                  value={editForm.type}
                  onChange={e=>setEditForm(prev=>({...prev, type:e.target.value as LocationType}))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
                >
                  <option value="PORT">Port</option>
                  <option value="INLAND">Inland</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold">Door Pickup</label>
                <select
                  value={editForm.pickupDoor}
                  onChange={e=>setEditForm(prev=>({...prev, pickupDoor: e.target.value as DoorTri}))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
                >
                  <option value="UNKNOWN">UNKNOWN</option>
                  <option value="ALLOWED">ALLOWED</option>
                  <option value="NOT_ALLOWED">NOT ALLOWED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Door Delivery</label>
                <select
                  value={editForm.deliveryDoor}
                  onChange={e=>setEditForm(prev=>({...prev, deliveryDoor: e.target.value as DoorTri}))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
                >
                  <option value="UNKNOWN">UNKNOWN</option>
                  <option value="ALLOWED">ALLOWED</option>
                  <option value="NOT_ALLOWED">NOT ALLOWED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Door Notes</label>
                <textarea
                  value={editForm.doorNotes}
                  onChange={e=>setEditForm(prev=>({...prev, doorNotes: e.target.value}))}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0A1A2F] border-4 border-black rounded-lg text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4"
                />
              </div>

              {/* NEW: Aliases */}
              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Aliases
                </label>
                <textarea
                  value={editForm.aliasesText}
                  onChange={e=>setEditForm(prev=>({...prev, aliasesText: e.target.value}))}
                  rows={2}
                  placeholder="Comma or newline separated"
                  className="w-full px-4 py-3 bg-[#0A1A2F] border-4 border-black rounded-lg text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={()=>setEditModalOpen(false)}
                  className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={applyEdit}
                  disabled={isUpdating}
                  className="bg-[#600f9e] hover:bg-[#491174] py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)]
                      transition-shadow"
                >
                  {isUpdating ? (
                    <Settings className="animate-spin w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
