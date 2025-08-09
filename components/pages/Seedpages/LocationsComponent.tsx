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

interface Location {
  id:       string;
  unlocode: string | null;
  name:     string;
  city:     string | null;
  country:  string | null;
  type:     LocationType; // UI-facing type in this component
}

interface LocationForm {
  unlocode: string;
  name:     string;
  city:     string;
  country:  string;
  type:     LocationType;
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
      { unlocode: "INBOM", name: "Mumbai",    city: "Mumbai",    country: "IN", type: "PORT"   },
      { unlocode: "CNSHA", name: "Shanghai",  city: "Shanghai",  country: "CN", type: "PORT"   },
      // INLAND CITIES (UN/LOCODE preferred but optional in our API)
      { unlocode: "USCHI", name: "Chicago",   city: "Chicago",   country: "US", type: "INLAND" },
      { unlocode: "INDEL", name: "Delhi",     city: "Delhi",     country: "IN", type: "INLAND" }
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
      const res = await axios.get<{
        items: Location[];
        totalPages: number;
        currentPage: number;
      }>("/api/seed/locations/get", { params });
      setLocations(res.data.items);
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
    // Send UI type; server maps "PORT" -> SEAPORT, "INLAND" -> INLAND_CITY
    const payload = {
      unlocode: form.unlocode?.trim() ? form.unlocode.trim().toUpperCase() : null,
      name:     form.name.trim(),
      city:     form.city?.trim() || null,
      country:  form.country?.trim().toUpperCase() || null,
      type:     form.type, // "PORT" | "INLAND" (server maps)
    };

    // IMPORTANT: update on conflicts so type changes take effect
    await axios.post("/api/seed/locations/post?onConflict=update", payload);

    showMessage("success", "Location created/updated");
    setForm({ unlocode: "", name: "", city: "", country: "", type: "PORT" });
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


  async function applyEdit() {
    if (!selected) return;
    setIsUpdating(true);
    try {
      // Send UI shape; PATCH endpoint maps "PORT"/"INLAND" → DB enum internally
      await axios.patch(`/api/seed/locations/${selected.id}/patch`, {
        unlocode: editForm.unlocode,
        name:     editForm.name,
        city:     editForm.city,
        country:  editForm.country,
        type:     editForm.type,
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
        const type =
          typeRaw === "PORT" || typeRaw === "SEAPORT"
            ? "SEAPORT"
            : "INLAND_CITY";

        const code = (r.unlocode ?? r.code ?? null);
        const unlocode = code ? String(code).trim().toUpperCase() : null;

        const name = String(r.name ?? "").trim();
        const city = r.city ? String(r.city).trim() : null;
        const country = r.country ? String(r.country).trim().toUpperCase() : null;

        if (!name) throw new Error(`Row ${i + 1}: "name" is required`);
        if (type === "SEAPORT" && !unlocode) {
          throw new Error(`Row ${i + 1}: UN/LOCODE (field "unlocode" or "code") is required for PORT/SEAPORT`);
        }
        if (unlocode && !/^[A-Z0-9]{5}$/.test(unlocode)) {
          throw new Error(`Row ${i + 1}: invalid UN/LOCODE "${unlocode}" (expected 5 alphanumerics, e.g. USLAX)`);
        }

        return { unlocode, name, city, country, type };
      });

      await axios.post("/api/seed/locations/post?onConflict=update", normalized);

      showMessage("success", `Imported ${normalized.length} location(s).`);
      setBulkData("");
      setUploadedFile(null);
    } catch (err: any) {
      let msg = "Import failed";

      if (err instanceof SyntaxError) {
        msg = "Invalid JSON in the input.";
      } else if (axios.isAxiosError(err)) {
        const { status, data } = err.response || {};
        if (status === 422 && data?.errors) {
          const lines = Object.entries(data.errors).map(([path, msgs]: any) =>
            `${path}: ${Array.isArray(msgs) ? msgs.join(", ") : String(msgs)}`
          );
          msg = `HTTP 422 — Validation failed\n${lines.join("\n")}`;
        } else if (typeof data?.error === "string") {
          msg = `HTTP ${status} — ${data.error}`;
        } else {
          msg = `HTTP ${status ?? ""} — ${JSON.stringify(data) || err.message}`;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }

      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab==="list") fetchLocations(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, filters]);

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
                      value={form[f.key as keyof LocationForm]}
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
                    rows={6}
                    placeholder={`[
  { "unlocode": "INBOM", "name": "Mumbai",   "city": "Mumbai",   "country": "IN", "type": "PORT"   },
  { "unlocode": "CNSHA", "name": "Shanghai", "city": "Shanghai", "country": "CN", "type": "PORT"   },
  { "unlocode": "USCHI", "name": "Chicago",  "city": "Chicago",  "country": "US", "type": "INLAND" },
  { "unlocode": "INDEL", "name": "Delhi",    "city": "Delhi",    "country": "IN", "type": "INLAND" }
]`}
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                    required
                  />
                  <div className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600 mt-4" style={cardGradient}>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-3">JSON Format:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-bold text-white">
                      <div>• unlocode (PORT required)</div>
                      <div>• name</div>
                      <div>• city</div>
                      <div>• country (ISO-2)</div>
                      <div>• type (PORT | INLAND)</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-shadow"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Code…"
                value={filters.code}
                onChange={e=>setFilters(f=>({...f, code:e.target.value}))}
                className="px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Name…"
                value={filters.name}
                onChange={e=>setFilters(f=>({...f, name:e.target.value}))}
                className="px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white"
              />
              <select
                value={filters.type}
                onChange={e=>setFilters(f=>({...f, type:e.target.value as any}))}
                className="px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white"
              >
                <option value="">All Types</option>
                <option value="PORT">Port</option>
                <option value="INLAND">Inland</option>
              </select>
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
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-sm font-semibold">Type</label>
                <select
                  value={editForm.type}
                  onChange={e=>setEditForm(prev=>({...prev, type:e.target.value as LocationType}))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white"
                >
                  <option value="PORT">Port</option>
                  <option value="INLAND">Inland</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={()=>setEditModalOpen(false)}
                  className="px-4 py-2 bg-[#1A2A4A] rounded">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating}
                  className="px-4 py-2 bg-[#600f9e] rounded disabled:opacity-50 flex items-center gap-2">
                  {isUpdating ? <Settings className="animate-spin"/> : <Save/>} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
