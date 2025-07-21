// File: components/ServiceComponent.tsx
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Ship,
  Navigation,
  Anchor,
  Upload,
  List,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CalendarCheckIcon,
  CalendarSync,
} from "lucide-react";

// --- TYPES & INTERFACES ---------------------------------------------------
interface ServiceSchedule {
  code: string;
  description?: string;
  voyages?: Voyage[];
}

interface ServiceForm {
  code: string;
  description: string;
}

interface Voyage {
  id?: string;
  serviceCode: string;
  voyageNumber?: string;
  departure: string;
  arrival?: string;
  portCalls?: PortCall[];
}

interface PortCall {
  id?: string;
  voyageId: string;
  portCode: string;
  order: number;
  etd?: string;
  eta?: string;
  mode?: string;
  vesselName?: string;
}

// --- STYLES ---------------------------------------------------------------
const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

// --- COMPONENT ------------------------------------------------------------
export function ServiceComponent() {
  // Tabs
  const [activeTab, setActiveTab] = useState<
    "create-schedule" |
    "create-voyage" |
    "port-calls" |
    "bulk-import" |
    "schedule-list"
  >("create-schedule");

  // Forms & data
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    code: "",
    description: ""
  });

  const [voyageForm, setVoyageForm] = useState<Voyage>({
    serviceCode: "",
    voyageNumber: "",
    departure: new Date().toISOString().slice(0,16),
    arrival: "",
  });

  const [portCallForm, setPortCallForm] = useState<PortCall>({
    voyageId: "",
    portCode: "",
    order: 1,
    eta: "",
    etd: "",
    mode: "SEA",
    vesselName: "",
  });

  const [bulkData, setBulkData] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea"|"file">("textarea");

  const [allSchedules, setAllSchedules] = useState<ServiceSchedule[]>([]);
  const [allVoyages, setAllVoyages]       = useState<Voyage[]>([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [filters, setFilters] = useState({
    code: "",
    description: "",
    voyageNumber: ""
  });

  const [editModalOpen, setEditModalOpen]       = useState(false);
  const [voyageModalOpen, setVoyageModalOpen]   = useState(false);
  const [portCallsModalOpen, setPortCallsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ServiceSchedule|null>(null);
  const [selectedVoyage, setSelectedVoyage]     = useState<Voyage|null>(null);
  const [editForm, setEditForm] = useState<ServiceSchedule>({} as ServiceSchedule);
  const [selectedPortCalls, setSelectedPortCalls] = useState<PortCall[]>([]);

  // Loading & messages
  const [isLoading, setIsLoading]       = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [message, setMessage]           = useState<{ type:"success"|"error"; text:string }|null>(null);

  // --- HELPERS -------------------------------------------------------------
  const showMessage = (type:"success"|"error", text:string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };


  // FETCH SCHEDULES
  async function fetchSchedules(page = 1) {
  setIsLoadingList(true);
  try {
    const { data } = await axios.get<{
      items:       ServiceSchedule[];
      total:       number;
      totalPages:  number;
      currentPage: number;
    }>(
      "/api/seed/serviceschedules/get",
      { params: { page, code: filters.code, description: filters.description } }
    );

    console.log("API → fetchSchedules:", data);
    setAllSchedules(data.items);
    setTotalPages(data.totalPages);
  } catch (err: any) {
    console.error("fetchSchedules error:", err);
    showMessage("error", "Failed to fetch schedules");
  } finally {
    setIsLoadingList(false);
  }
}


  // CREATE SCHEDULE
   async function createSchedule(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data: created } = await axios.post<ServiceSchedule>(
        "/api/seed/serviceschedules/post",
        serviceForm
      )
      showMessage("success", `Created schedule ${created.code}!`)
      setServiceForm({ code: "", description: "" })
      // 2) Immediately reload ALL schedules for your dropdown
      fetchSchedules(1)
    } catch (err:any) {
      const pd = err.response?.data || {};
      if (Array.isArray(pd.error)) {
        showMessage("error", pd.error.map((z:any)=>z.message).join("; "));
      } else if (Array.isArray(pd.errors)) {
        showMessage("error", pd.errors.map((e:any)=>e.message).join("; "));
      } else {
        showMessage("error", pd.error || "Failed to create schedule");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // CREATE VOYAGE
  async function createVoyage(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        serviceCode:  voyageForm.serviceCode,
        voyageNumber: voyageForm.voyageNumber,
        departure:    new Date(voyageForm.departure).toISOString(),
        arrival:      voyageForm.arrival ? new Date(voyageForm.arrival).toISOString() : undefined,
      };
      const { data: created } = await axios.post<Voyage>(
        "/api/seed/voyages/post",
        payload
      );
      showMessage("success", `Voyage ${created.voyageNumber} created!`);
      setVoyageForm({ serviceCode:"", voyageNumber:"", departure:new Date().toISOString().slice(0,16), arrival:"" });
      fetchVoyages();
    } catch (err:any) {
      console.error("createVoyage error:", err.response?.data ?? err);
      const pd = err.response?.data || {};
      if (Array.isArray(pd.error)) {
        showMessage("error", pd.error.map((z:any)=>z.message).join("; "));
      } else if (Array.isArray(pd.errors)) {
        showMessage("error", pd.errors.map((e:any)=>e.message).join("; "));
      } else {
        showMessage("error", pd.error || "Failed to create voyage");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // CREATE PORT CALL
  async function createPortCall(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("/api/seed/portcalls/post", portCallForm);
      showMessage("success","Port call created");
      setPortCallForm({ voyageId:"", portCode:"", order:1, eta:"", etd:"", mode:"SEA", vesselName:"" });
    } catch {
      showMessage("error","Failed to create port call");
    } finally {
      setIsLoading(false);
    }
  }

  // BULK IMPORT
  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      let data = bulkData;
      if (bulkMode==="file" && uploadedFile) data = await uploadedFile.text();
      const parsed = JSON.parse(data);
      await axios.post("/api/seed/serviceschedules/bulk", parsed);
      showMessage("success",`Imported ${parsed.length} records`);
      setBulkData(""); setUploadedFile(null);
      fetchSchedules(1);
      setActiveTab("schedule-list");
    } catch {
      showMessage("error","Failed bulk import");
    } finally {
      setIsLoading(false);
    }
  }

  // DOWNLOAD SAMPLE
  function downloadSample() {
    const sample = [
      { code:"WAX", description:"Weekly Atlantic Express", voyages:[ /* … */ ] }
    ];
    const blob = new Blob([JSON.stringify(sample,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="schedule-sample.json"; a.click();
  }

  // FETCH VOYAGES
  async function fetchVoyages() {
  try {
    const { data } = await axios.get<{
      voyages: Voyage[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>("/api/seed/voyages/get");

    console.log("API → fetchVoyages:", data);
    setAllVoyages(data.voyages);
  } catch (err: any) {
    console.error("fetchVoyages error:", err);
    showMessage("error", "Could not load voyages");
  }
}

  // APPLY EDIT
  async function applyEdit() {
    setIsUpdating(true);
    try {
      await axios.patch(
        `/api/seed/serviceschedules/${selectedSchedule!.code}/patch`,
        { description: editForm.description }
      );
      showMessage("success","Schedule updated");
      setEditModalOpen(false);
      fetchSchedules(currentPage);
    } catch {
      showMessage("error","Failed to update");
    } finally {
      setIsUpdating(false);
    }
  }

  // MODALS & FILTERS
  function applyFilters() { fetchSchedules(1) }
  function clearFilters() {
    setFilters({ code:"", description:"", voyageNumber:"" });
    fetchSchedules(1);
  }
  function openEdit(s:ServiceSchedule) { setSelectedSchedule(s); setEditForm(s); setEditModalOpen(true) }
  function closeEdit() { setEditModalOpen(false); setSelectedSchedule(null) }
  function openVoyages(s:ServiceSchedule) { setSelectedSchedule(s); setVoyageModalOpen(true) }
  function closeVoyages() { setVoyageModalOpen(false); setSelectedSchedule(null) }
  function openPortCalls(v:Voyage) {
    setSelectedVoyage(v);
    setSelectedPortCalls(v.portCalls||[]);
    setPortCallsModalOpen(true);
  }
  function closePortCalls() {
    setPortCallsModalOpen(false);
    setSelectedVoyage(null);
    setSelectedPortCalls([]);
  }

    // INITIAL LOAD & TAB CHANGE
// on-mount: grab both schedules (for dropdown) and voyages
useEffect(() => {
  fetchSchedules(1)
  fetchVoyages()
}, [])

useEffect(() => {
  console.log("allVoyages state:", allVoyages);
}, [allVoyages]);

// when you actually land on “schedule-list”, re-fetch that page
useEffect(() => {
  if (activeTab === "schedule-list") {
    fetchSchedules(currentPage)
  }
}, [activeTab, currentPage])


  // === RENDER ===
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-1 px-6 md:px-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-[#1A2A4A] p-3" style={cardGradient}>
                <CalendarCheckIcon height={50} width={50} className="text-[#00FFFF]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
              SCMT Data Seeding
              <span className="block text-cyan-400 mt-2">Service Schedules & Voyages</span>
            </h1>
          </div>
        </header>

      {/* MESSAGE */}
      {message && (
        <div className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type==="success"
            ? "bg-green-900/30 border border-green-400 text-green-400"
            : "bg-red-900/30 border border-red-400 text-red-400"
        }`}>
          {message.type==="success" ? <CheckCircle/> : <AlertCircle/>} {message.text}
        </div>
      )}

      {/* TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { key:"create-schedule", icon:<CalendarSync className="w-5 h-5"/>,      label:"Create Schedule" },
            { key:"create-voyage",   icon:<Navigation className="w-5 h-5"/>,label:"Create Voyage"  },
            { key:"port-calls",      icon:<Anchor className="w-5 h-5"/>,    label:"Port Calls"      },
            { key:"bulk-import",     icon:<Upload className="w-5 h-5"/>,    label:"Bulk Import"     },
            { key:"schedule-list",   icon:<List className="w-5 h-5"/>,      label:"Schedule List"   },
          ].map(tab=>(
            <button key={tab.key}
              onClick={()=>setActiveTab(tab.key as any)}
              className={`px-1 py-2 uppercase font-bold transition shadow border-2 border-black flex items-center justify-center gap-2 ${
                activeTab===tab.key
                  ? "bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0_rgba(0,0,0,1)]"
                  : "bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white rounded-lg shadow-[4px_4px_0_rgba(0,0,0,1)]"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CREATE SCHEDULE */}
      {activeTab === "create-schedule" && (
  <section className="px-6 md:px-16 mb-16">
    <div
      className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
      style={cardGradient}
    >
      <h2 className="text-3xl font-bold flex items-center gap-3 mb-8">
        <CalendarSync className="text-cyan-400 w-8 h-8" /> Create Service Schedule
      </h2>
      <form
        onSubmit={createSchedule}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Code */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Code *</label>
          <input
            type="text"
            value={serviceForm.code}
            onChange={e =>
              setServiceForm(prev => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
            }
            placeholder="WAX"
            maxLength={10}
            required
            className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Description</label>
          <input
            type="text"
            value={serviceForm.description}
            onChange={e =>
              setServiceForm(prev => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Weekly Atlantic Express"
            className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
          />
        </div>

        {/* Submit Button spans both columns */}
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


      {/* CREATE VOYAGE */}
      {activeTab==="create-voyage" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Navigation className="text-cyan-400 w-8 h-8"/> Create Voyage
            </h2>
            <form onSubmit={createVoyage} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Service Schedule *</label>
                <select
                  value={voyageForm.serviceCode}
                  onChange={e=>setVoyageForm(prev=>({...prev,serviceCode:e.target.value}))}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                >
                  <option value="">Select Schedule</option>
                  {(allSchedules ?? []).map(s=>(
                    <option key={s.code} value={s.code}>
                      {s.code} – {s.description}
                    </option>
                  ))}
                </select>
              </div>
              {/* Voyage Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Voyage Number *</label>
                <input
                  type="text"
                  value={voyageForm.voyageNumber||""}
                  onChange={e=>setVoyageForm(prev=>({...prev,voyageNumber:e.target.value}))}
                  placeholder="245N"
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>
              {/* Departure */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Departure (ETD) *</label>
                <input
                  type="datetime-local"
                  value={voyageForm.departure}
                  onChange={e=>setVoyageForm(prev=>({...prev,departure:e.target.value}))}
                  required
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
              {/* Arrival */}
              <div className="space-y-2">
                <label className="text-sm mt-2 font-semibold">Arrival (ETA)</label>
                <input
                  type="datetime-local"
                  value={voyageForm.arrival||""}
                  onChange={e=>setVoyageForm(prev=>({...prev,arrival:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
              {/* Submit */}
              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading?<Settings className="animate-spin w-5 h-5"/>:<Plus className="w-5 h-5"/>}
                  Create
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* PORT CALLS */}
      {activeTab==="port-calls" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Anchor className="text-cyan-400 w-8 h-8"/> Create Port Call
            </h2>
            <form onSubmit={createPortCall} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Voyage */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Voyage *</label>
                <select
                  value={portCallForm.voyageId}
                  onChange={e=>setPortCallForm(prev=>({...prev,voyageId:e.target.value}))}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                >
                  <option value="">Select Voyage</option>
                  {(allVoyages ?? []).map(v=>(
                    <option key={v.id} value={v.id}>
                      {v.serviceCode} {v.voyageNumber} – {new Date(v.departure).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              {/* Port Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Port Code *</label>
                <input
                  type="text"
                  value={portCallForm.portCode}
                  onChange={e=>setPortCallForm(prev=>({...prev,portCode:e.target.value.toUpperCase()}))}
                  placeholder="USNYC"
                  maxLength={5}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>
              {/* Order */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Call Order *</label>
                <input
                  type="number"
                  value={portCallForm.order}
                  onChange={e=>setPortCallForm(prev=>({...prev,order:parseInt(e.target.value)}))}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ETA */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">ETA *</label>
            <input
              type="datetime-local"
              value={portCallForm.eta || ""}
              onChange={e => setPortCallForm(prev => ({ ...prev, eta: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A] border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] mt-3 hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
            />
          </div>
          {/* ETD */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">ETD *</label>
            <input
              type="datetime-local"
              value={portCallForm.etd || ""}
              onChange={e => setPortCallForm(prev => ({ ...prev, etd: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A] border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] mt-3  hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
            />
          </div>
        </div>

              {/* Vessel */}
              <div className="space-y-2 lg:col-span-3">
                <label className="text-sm font-semibold">Vessel Name</label>
                <input
                  type="text"
                  value={portCallForm.vesselName||""}
                  onChange={e=>setPortCallForm(prev=>({...prev,vesselName:e.target.value}))}
                  placeholder="MSC OSCAR"
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[12px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
              {/* Submit */}
              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)]"
                >
                  {isLoading?<Settings className="animate-spin w-5 h-5"/>:<Plus className="w-5 h-5"/>}
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
              <Upload className="text-cyan-400 w-8 h-8"/> Bulk Import Schedules
            </h2>
            <div className="flex gap-4 mb-6">
              <button
                onClick={()=>setBulkMode("textarea")}
                className={`px-6 py-3 rounded-lg ${bulkMode==="textarea"?"bg-[#600f9e]":"bg-[#2D4D8B]"}`}
              >Paste JSON</button>
              <button
                onClick={()=>setBulkMode("file")}
                className={`px-6 py-3 rounded-lg ${bulkMode==="file"?"bg-[#600f9e]":"bg-[#2D4D8B]"}`}
              >Upload File</button>
            </div>
            <button
              onClick={downloadSample}
              className="mb-6 bg-[#2a72dc] px-6 py-3 rounded-lg flex items-center gap-2"
            ><Upload className="w-5 h-5"/> Download Sample</button>
            <form onSubmit={importBulk} className="space-y-6">
              {bulkMode==="textarea" ? (
                <textarea
                  className="w-full h-48 bg-[#2D4D8B] border border-slate-600 rounded-lg text-white font-mono p-4"
                  value={bulkData}
                  onChange={e=>setBulkData(e.target.value)}
                  placeholder="[{…}, {…}]"
                />
              ) : (
                <input
                  type="file"
                  accept=".json"
                  onChange={e=>setUploadedFile(e.target.files?.[0]||null)}
                  className="w-full bg-[#2D4D8B] border border-slate-600 rounded-lg p-3"
                />
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)]"
              >
                {isLoading?<Settings className="animate-spin w-5 h-5"/>:<Upload className="w-5 h-5"/>}
                Import
              </button>
            </form>
          </div>
        </section>
      )}

      {/* SCHEDULE LIST */}
      {activeTab==="schedule-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <List className="text-cyan-400 w-8 h-8"/> Service Schedules
            </h2>
            {/* Filters */}
            <div className="bg-[#2D4D8B] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Code..."
                value={filters.code}
                onChange={e=>setFilters(prev=>({...prev,code:e.target.value}))}
                className="px-4 py-2 bg-[#11235d] border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Description..."
                value={filters.description}
                onChange={e=>setFilters(prev=>({...prev,description:e.target.value}))}
                className="px-4 py-2 bg-[#11235d] border border-slate-600 rounded-lg text-white"
              />
              <div className="flex gap-2">
                <button onClick={applyFilters} className="bg-[#600f9e] py-2 px-6 rounded-lg flex items-center gap-2">
                  <Search className="w-4 h-4"/> Apply
                </button>
                <button onClick={clearFilters} className="bg-[#2a72dc] py-2 px-6 rounded-lg flex items-center gap-2">
                  <Filter className="w-4 h-4"/> Clear
                </button>
              </div>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8"/>
              </div>
            ) : allSchedules.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No schedules found</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allSchedules.map(s => (
                    <div key={s.code} className="rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)]">
                      <div className="flex justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-cyan-400">{s.code}</h3>
                          {s.description && <p className="text-sm text-slate-300">{s.description}</p>}
                        </div>
                        <div className="bg-blue-900/30 text-blue-400 px-2 py-1 text-xs rounded">
                          {s.voyages?.length||0} Voyages
                        </div>
                      </div>
                      {/* show first 2 voyages */}
                      {s.voyages && s.voyages.slice(0,2).map((v,i)=>(
                        <div key={i} className="bg-[#11235d] rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Navigation className="w-4 h-4 text-yellow-400"/>
                            <span className="font-mono font-bold">{v.voyageNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <ChevronLeft className="w-3 h-3"/>
                            <span>{new Date(v.departure).toLocaleDateString()}</span>
                            {v.arrival && <>
                              <span>→</span>
                              <span>{new Date(v.arrival).toLocaleDateString()}</span>
                            </>}
                          </div>
                        </div>
                      ))}
                      {s.voyages && s.voyages.length>2 && (
                        <div className="text-xs text-slate-400 text-center">+{s.voyages.length-2} more</div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={()=>openEdit(s)}
                          className="flex-1 bg-[#600f9e] py-2 rounded-lg text-xs"
                        >
                          <Edit3 className="inline w-4 h-4"/> Edit
                        </button>
                        <button
                          onClick={()=>openVoyages(s)}
                          className="flex-1 bg-[#2a72dc] py-2 rounded-lg text-xs"
                        >
                          <Ship className="inline w-4 h-4"/> Voyages
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={()=>setCurrentPage(p=>p-1)}
                    disabled={currentPage<=1}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg disabled:opacity-50"
                  ><ChevronLeft className="w-4 h-4"/> Prev</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={()=>setCurrentPage(p=>p+1)}
                    disabled={currentPage>=totalPages}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg disabled:opacity-50"
                  >Next <ChevronRight className="w-4 h-4"/></button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* EDIT SCHEDULE MODAL */}
      {editModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl p-8 max-w-md w-full" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3/> Edit {selectedSchedule.code}
              </h3>
              <button onClick={closeEdit}><X className="w-6 h-6"/></button>
            </header>
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Description</label>
                <input
                  type="text"
                  value={editForm.description||""}
                  onChange={e=>setEditForm(prev=>({...prev,description:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] border border-slate-600 rounded-lg text-white"
                />
              </div>
            </form>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={closeEdit} className="bg-[#2D4D8B] py-2 px-4 rounded-lg">Cancel</button>
              <button
                onClick={applyEdit}
                disabled={isUpdating}
                className="bg-[#600f9e] py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <Settings className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOYAGES MODAL */}
      {voyageModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Ship/> Voyages for {selectedSchedule.code}
              </h3>
              <button onClick={closeVoyages}><X className="w-6 h-6"/></button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedSchedule.voyages ?? []).length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400">
                  No voyages scheduled
                </div>
              ) : (
                (selectedSchedule.voyages ?? []).map((v,i)=>(
                  <div key={i} className="bg-[#2D4D8B] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-cyan-400">{v.voyageNumber}</h4>
                      <button
                        onClick={()=>openPortCalls(v)}
                        className="bg-[#2a72dc] px-3 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Anchor className="w-3 h-3"/> Port Calls
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4 text-green-400"/>
                        <span>Depart: {new Date(v.departure).toLocaleString()}</span>
                      </div>
                      {v.arrival && (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-red-400"/>
                          <span>Arrive: {new Date(v.arrival).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={closeVoyages} className="bg-[#2a72dc] py-2 px-4 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PORT CALLS MODAL */}
      {portCallsModalOpen && selectedVoyage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Anchor/> Port Calls – {selectedVoyage.serviceCode} {selectedVoyage.voyageNumber}
              </h3>
              <button onClick={closePortCalls}><X className="w-6 h-6"/></button>
            </header>
            <div className="space-y-3">
              {selectedPortCalls.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No port calls defined</div>
              ) : (
                selectedPortCalls.sort((a,b)=>a.order-b.order).map((pc,i)=>(
                  <div key={i} className="bg-[#2D4D8B] rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {pc.order}
                      </div>
                      <div>
                        <h4 className="font-bold text-cyan-400">{pc.portCode}</h4>
                        <div className="text-sm text-slate-300 space-y-1">
                          {pc.eta && (
                            <div className="flex items-center gap-2">
                              <ChevronLeft className="w-3 h-3 text-green-400"/>
                              <span>ETA: {new Date(pc.eta).toLocaleString()}</span>
                            </div>
                          )}
                          {pc.etd && (
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-red-400"/>
                              <span>ETD: {new Date(pc.etd).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {pc.mode && (
                        <div className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs mb-1">
                          {pc.mode}
                        </div>
                      )}
                      {pc.vesselName && <div className="text-slate-400 text-xs">{pc.vesselName}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={closePortCalls} className="bg-[#2a72dc] py-2 px-4 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
