"use client";
import React, { useState, useEffect } from "react";
import {
  Ship, MapPin, Clock, Upload, List, Database, CheckCircle, AlertCircle, 
  Settings, Plus, Edit3, Save, X, ChevronLeft, ChevronRight, Search,
  Calendar, Filter, Navigation, Anchor
} from "lucide-react";

// --- TYPES & INTERFACES ---------------------------------------------------
interface ServiceSchedule {
  code: string;
  description?: string;
  voyages?: Voyage[];
}

interface Voyage {
  id?: string;
  serviceCode: string;
  voyageNumber?: string;
  departure: string;
  arrival?: string;
  portCalls?: PortCall[];
  service?: ServiceSchedule;
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
  const [activeTab, setActiveTab] = useState<"create-service"|"create-voyage"|"port-calls"|"bulk-import"|"service-list">("create-service");

  // Forms & data
  const [serviceForm, setServiceForm] = useState<ServiceSchedule>({
    code: "",
    description: ""
  });

  const [voyageForm, setVoyageForm] = useState<Voyage>({
    serviceCode: "",
    voyageNumber: "",
    departure: new Date().toISOString().slice(0, 16),
    arrival: ""
  });

  const [portCallForm, setPortCallForm] = useState<PortCall>({
    voyageId: "",
    portCode: "",
    order: 1,
    eta: "",
    etd: "",
    mode: "SEA",
    vesselName: ""
  });

  const [bulkData, setBulkData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea"|"file">("textarea");
  
  const [allServices, setAllServices] = useState<ServiceSchedule[]>([]);
  const [allVoyages, setAllVoyages] = useState<Voyage[]>([]);
  const [selectedVoyagePortCalls, setSelectedVoyagePortCalls] = useState<PortCall[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    code: "",
    description: "",
    voyageNumber: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [voyageModalOpen, setVoyageModalOpen] = useState(false);
  const [portCallsModalOpen, setPortCallsModalOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceSchedule|null>(null);
  const [selectedVoyage, setSelectedVoyage] = useState<Voyage|null>(null);
  const [editForm, setEditForm] = useState<ServiceSchedule>({} as ServiceSchedule);

  // Loading & messages
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success"|"error", text: string }|null>(null);

  // --- HELPERS -------------------------------------------------------------
  const showMessage = (type: "success"|"error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/services
      console.log("Creating service:", serviceForm);
      showMessage("success", "Service schedule created successfully");
      setServiceForm({ code: "", description: "" });
    } catch (error) {
      showMessage("error", "Failed to create service schedule");
    } finally {
      setIsLoading(false);
    }
  }

  async function createVoyage(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/voyages
      console.log("Creating voyage:", voyageForm);
      showMessage("success", "Voyage created successfully");
      setVoyageForm({
        serviceCode: "",
        voyageNumber: "",
        departure: new Date().toISOString().slice(0, 16),
        arrival: ""
      });
    } catch (error) {
      showMessage("error", "Failed to create voyage");
    } finally {
      setIsLoading(false);
    }
  }

  async function createPortCall(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/port-calls
      console.log("Creating port call:", portCallForm);
      showMessage("success", "Port call created successfully");
      setPortCallForm({
        voyageId: "",
        portCode: "",
        order: 1,
        eta: "",
        etd: "",
        mode: "SEA",
        vesselName: ""
      });
    } catch (error) {
      showMessage("error", "Failed to create port call");
    } finally {
      setIsLoading(false);
    }
  }

  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      let data = bulkData;
      if (bulkMode === "file" && uploadedFile) {
        data = await uploadedFile.text();
      }
      const parsed = JSON.parse(data);
      console.log("Bulk importing:", parsed);
      showMessage("success", `Successfully imported ${parsed.length} records`);
      setBulkData("");
      setUploadedFile(null);
    } catch (error) {
      showMessage("error", "Failed to import bulk data");
    } finally {
      setIsLoading(false);
    }
  }

  function downloadSample() {
    const sample = [{
      code: "WAX",
      description: "Weekly Atlantic Express",
      voyages: [{
        voyageNumber: "245N",
        departure: "2024-01-15T08:00",
        arrival: "2024-01-25T14:00",
        portCalls: [
          { portCode: "USNYC", order: 1, etd: "2024-01-15T08:00", mode: "SEA" },
          { portCode: "DEHAM", order: 2, eta: "2024-01-25T14:00", mode: "SEA" }
        ]
      }]
    }];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service-sample.json";
    a.click();
  }

  async function fetchServices(page = 1) {
    setIsLoadingList(true);
    try {
      // GET /api/services with filters and pagination
      console.log("Fetching services...");
      // Mock data for now
      setAllServices([
        {
          code: "WAX",
          description: "Weekly Atlantic Express",
          voyages: [
            {
              id: "1",
              serviceCode: "WAX",
              voyageNumber: "245N",
              departure: "2024-01-15T08:00",
              arrival: "2024-01-25T14:00"
            }
          ]
        },
        {
          code: "PAX",
          description: "Pacific Express",
          voyages: [
            {
              id: "2", 
              serviceCode: "PAX",
              voyageNumber: "006W",
              departure: "2024-01-10T10:00",
              arrival: "2024-01-28T18:00"
            }
          ]
        }
      ]);
      setTotalPages(1);
    } catch (error) {
      showMessage("error", "Failed to fetch services");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function fetchVoyages() {
    try {
      // GET /api/voyages
      console.log("Fetching voyages...");
      setAllVoyages([
        {
          id: "1",
          serviceCode: "WAX",
          voyageNumber: "245N",
          departure: "2024-01-15T08:00",
          arrival: "2024-01-25T14:00",
          service: { code: "WAX", description: "Weekly Atlantic Express" }
        },
        {
          id: "2",
          serviceCode: "PAX", 
          voyageNumber: "006W",
          departure: "2024-01-10T10:00",
          arrival: "2024-01-28T18:00",
          service: { code: "PAX", description: "Pacific Express" }
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch voyages");
    }
  }

  function applyFilters() { fetchServices(1); }
  function clearFilters() { 
    setFilters({ code: "", description: "", voyageNumber: "" });
    fetchServices(1);
  }

  function openEdit(service: ServiceSchedule) { 
    setSelected(service); 
    setEditForm(service); 
    setEditModalOpen(true); 
  }

  function closeEdit() { 
    setEditModalOpen(false); 
    setSelected(null);
    setEditForm({} as ServiceSchedule);
  }

  function openVoyages(service: ServiceSchedule) {
    setSelected(service);
    setVoyageModalOpen(true);
  }

  function closeVoyages() {
    setVoyageModalOpen(false);
    setSelected(null);
  }

  function openPortCalls(voyage: Voyage) {
    setSelectedVoyage(voyage);
    setSelectedVoyagePortCalls(voyage.portCalls || []);
    setPortCallsModalOpen(true);
  }

  function closePortCalls() {
    setPortCallsModalOpen(false);
    setSelectedVoyage(null);
    setSelectedVoyagePortCalls([]);
  }

  async function applyEdit() {
    setIsUpdating(true);
    try {
      // PATCH /api/services/:code
      console.log("Updating service:", editForm);
      showMessage("success", "Service updated successfully");
      closeEdit();
      fetchServices(currentPage);
    } catch (error) {
      showMessage("error", "Failed to update service");
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    if (activeTab === "service-list") fetchServices(currentPage);
    fetchVoyages();
  }, [activeTab, currentPage]);

  // --- RENDER --------------------------------------------------------------
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-14 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <Navigation className="text-[#00FFFF]" size={50} />
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Service Management</h1>
        <p className="text-lg mt-2">NVOCC Service Schedule & Voyage Administration</p>
      </header>

      {/* MESSAGE */}
      {message && (
        <div className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type==="success"? "bg-green-900/30 border border-green-400":"bg-red-900/30 border border-red-400"
        }`}>
          {message.type==="success"? <CheckCircle />:<AlertCircle />} {message.text}
        </div>
      )}

      {/* TABS */}
      <nav className="px-6 md:px-16 mb-8 flex gap-2 justify-center flex-wrap">
        {[
          { key: "create-service", icon: Ship, label: "Create Service" },
          { key: "create-voyage", icon: Navigation, label: "Create Voyage" },
          { key: "port-calls", icon: Anchor, label: "Port Calls" },
          { key: "bulk-import", icon: Upload, label: "Bulk Import" },
          { key: "service-list", icon: List, label: "Service List" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 rounded-lg text-sm uppercase flex items-center gap-2 shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all
              ${activeTab===tab.key ? "bg-[#600f9e] text-white" : "bg-[#1A2A4A] text-slate-300 hover:bg-[#2a72dc]"}`}
            style={cardGradient}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CREATE SERVICE */}
      {activeTab === "create-service" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Ship className="text-cyan-400 w-8 h-8" />
              Create Service Schedule
            </h2>
            <form onSubmit={createService} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Code *</label>
                <input
                  type="text"
                  value={serviceForm.code}
                  onChange={e => setServiceForm(prev=>({...prev, code:e.target.value.toUpperCase()}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white font-mono"
                  placeholder="WAX"
                  maxLength={10}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={serviceForm.description || ""}
                  onChange={e => setServiceForm(prev=>({...prev, description:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="Weekly Atlantic Express"
                />
              </div>

              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* CREATE VOYAGE */}
      {activeTab === "create-voyage" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Navigation className="text-cyan-400 w-8 h-8" />
              Create Voyage
            </h2>
            <form onSubmit={createVoyage} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Code *</label>
                <select
                  value={voyageForm.serviceCode}
                  onChange={e => setVoyageForm(prev=>({...prev, serviceCode:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value="">Select Service</option>
                  {allServices.map(service => (
                    <option key={service.code} value={service.code}>
                      {service.code} - {service.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voyage Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Voyage Number</label>
                <input
                  type="text"
                  value={voyageForm.voyageNumber || ""}
                  onChange={e => setVoyageForm(prev=>({...prev, voyageNumber:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white font-mono"
                  placeholder="245N"
                />
              </div>

              {/* Departure */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Departure (First Port ETD) *</label>
                <input
                  type="datetime-local"
                  value={voyageForm.departure}
                  onChange={e => setVoyageForm(prev=>({...prev, departure:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* Arrival */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Arrival (Last Port ETA)</label>
                <input
                  type="datetime-local"
                  value={voyageForm.arrival || ""}
                  onChange={e => setVoyageForm(prev=>({...prev, arrival:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  Create Voyage
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* PORT CALLS */}
      {activeTab === "port-calls" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Anchor className="text-cyan-400 w-8 h-8" />
              Create Port Call
            </h2>
            <form onSubmit={createPortCall} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Voyage */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Voyage *</label>
                <select
                  value={portCallForm.voyageId}
                  onChange={e => setPortCallForm(prev=>({...prev, voyageId:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value="">Select Voyage</option>
                  {allVoyages.map(voyage => (
                    <option key={voyage.id} value={voyage.id}>
                      {voyage.serviceCode} {voyage.voyageNumber} - {new Date(voyage.departure).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Port Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Port Code *</label>
                <input
                  type="text"
                  value={portCallForm.portCode}
                  onChange={e => setPortCallForm(prev=>({...prev, portCode:e.target.value.toUpperCase()}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white font-mono"
                  placeholder="USNYC"
                  maxLength={5}
                  required
                />
              </div>

              {/* Order */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Call Order *</label>
                <input
                  type="number"
                  min="1"
                  value={portCallForm.order}
                  onChange={e => setPortCallForm(prev=>({...prev, order:parseInt(e.target.value)}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* ETA */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">ETA</label>
                <input
                  type="datetime-local"
                  value={portCallForm.eta || ""}
                  onChange={e => setPortCallForm(prev=>({...prev, eta:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              {/* ETD */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">ETD</label>
                <input
                  type="datetime-local"
                  value={portCallForm.etd || ""}
                  onChange={e => setPortCallForm(prev=>({...prev, etd:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Transport Mode</label>
                <select
                  value={portCallForm.mode || "SEA"}
                  onChange={e => setPortCallForm(prev=>({...prev, mode:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                >
                  <option value="SEA">Sea</option>
                  <option value="RAIL">Rail</option>
                  <option value="ROAD">Road</option>
                  <option value="BARGE">Barge</option>
                </select>
              </div>

              {/* Vessel Name */}
              <div className="space-y-2 lg:col-span-3">
                <label className="text-sm font-semibold text-slate-300">Vessel Name</label>
                <input
                  type="text"
                  value={portCallForm.vesselName || ""}
                  onChange={e => setPortCallForm(prev=>({...prev, vesselName:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="MSC OSCAR"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  Create Port Call
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* BULK IMPORT */}
      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Upload className="text-cyan-400 w-8 h-8" />
              Bulk Import Services
            </h2>
            
            <div className="flex gap-4 mb-6">
              <button 
                onClick={()=>setBulkMode("textarea")} 
                className={`px-6 py-3 rounded-lg ${bulkMode==="textarea"?"bg-[#600f9e]":"bg-[#1A2A4A]"}`}
              >
                Paste JSON
              </button>
              <button 
                onClick={()=>setBulkMode("file")} 
                className={`px-6 py-3 rounded-lg ${bulkMode==="file"?"bg-[#600f9e]":"bg-[#1A2A4A]"}`}
              >
                Upload File
              </button>
            </div>
            
            <button 
              onClick={downloadSample} 
              className="mb-6 bg-[#2a72dc] px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Upload className="w-5 h-5"/> Download Sample
            </button>
            
            <form onSubmit={importBulk} className="space-y-6">
              {bulkMode==="textarea" ? (
                <textarea
                  className="w-full h-48 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white font-mono p-4"
                  value={bulkData}
                  onChange={e=>setBulkData(e.target.value)}
                  placeholder="[{...}, {...}]"
                />
              ) : (
                <input
                  type="file"
                  accept=".json"
                  onChange={e=>setUploadedFile(e.target.files?.[0]||null)}
                  className="w-full bg-[#1A2A4A] border border-slate-600 rounded-lg p-3"
                />
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
              >
                {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Upload className="w-5 h-5"/>}
                Import
              </button>
            </form>
          </div>
        </section>
      )}

      {/* SERVICE LIST */}
      {activeTab === "service-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <List className="text-cyan-400 w-8 h-8" />
              Service Schedules
            </h2>
            
            {/* Filters */}
            <div className="bg-[#1A2A4A] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Service Code..."
                value={filters.code}
                onChange={e => setFilters(prev=>({...prev, code:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Description..."
                value={filters.description}
                onChange={e => setFilters(prev=>({...prev, description:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
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
            ) : allServices.length===0 ? (
              <div className="text-center py-12 text-slate-400">No services found</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allServices.map(service => (
                    <div
                      key={service.code}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                      style={cardGradient}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-cyan-400 font-mono">{service.code}</h3>
                          {service.description && <p className="text-sm text-slate-300 mt-1">{service.description}</p>}
                        </div>
                        <div className="bg-blue-900/30 text-blue-400 px-2 py-1 text-xs rounded">
                          {service.voyages?.length || 0} Voyages
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {service.voyages && service.voyages.slice(0, 2).map((voyage, idx) => (
                          <div key={idx} className="bg-[#0A1A2F] rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Navigation className="w-4 h-4 text-yellow-400"/>
                              <span className="font-mono font-bold">{voyage.voyageNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Clock className="w-3 h-3"/>
                              <span>{new Date(voyage.departure).toLocaleDateString()}</span>
                              {voyage.arrival && (
                                <>
                                  <span>→</span>
                                  <span>{new Date(voyage.arrival).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {service.voyages && service.voyages.length > 2 && (
                          <div className="text-xs text-slate-400 text-center">
                            +{service.voyages.length - 2} more voyages
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(service)}
                          className="flex-1 bg-[#600f9e] hover:bg-[#491174] py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs"
                        >
                          <Edit3 className="w-4 h-4"/> Edit
                        </button>
                        <button
                          onClick={() => openVoyages(service)}
                          className="flex-1 bg-[#2a72dc] hover:bg-[#1e5bb8] py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs"
                        >
                          <Ship className="w-4 h-4"/> Voyages
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
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4"/> Prev
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={()=>setCurrentPage(p=>p+1)}
                    disabled={currentPage>=totalPages}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* EDIT SERVICE MODAL */}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-md w-full" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3/> Edit {selected.code}
              </h3>
              <button onClick={closeEdit} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>
            
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={editForm.description || ""}
                  onChange={e => setEditForm(prev=>({...prev, description:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>
            </form>
            
            <footer className="mt-8 flex justify-end gap-4">
              <button 
                onClick={closeEdit} 
                className="bg-[#1A2A4A] hover:bg-[#2A3A5A] py-3 px-6 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={applyEdit}
                disabled={isUpdating}
                className="bg-[#600f9e] hover:bg-[#491174] py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <Settings className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                Save Changes
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* VOYAGES MODAL */}
      {voyageModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Ship/> Voyages for {selected.code}
              </h3>
              <button onClick={closeVoyages} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selected.voyages && selected.voyages.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400">
                  No voyages scheduled for this service
                </div>
              ) : (
                selected.voyages?.map((voyage, index) => (
                  <div key={index} className="bg-[#1A2A4A] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-cyan-400 font-mono">{voyage.voyageNumber}</h4>
                      <button
                        onClick={() => openPortCalls(voyage)}
                        className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-3 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Anchor className="w-3 h-3"/> Port Calls
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-400"/>
                        <span>Depart: {new Date(voyage.departure).toLocaleString()}</span>
                      </div>
                      {voyage.arrival && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-400"/>
                          <span>Arrive: {new Date(voyage.arrival).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <footer className="mt-8 flex justify-end">
              <button 
                onClick={closeVoyages} 
                className="bg-[#2a72dc] hover:bg-[#1e5bb8] py-3 px-6 rounded-lg"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* PORT CALLS MODAL */}
      {portCallsModalOpen && selectedVoyage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Anchor/> Port Calls - {selectedVoyage.serviceCode} {selectedVoyage.voyageNumber}
              </h3>
              <button onClick={closePortCalls} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>
            
            <div className="space-y-3">
              {selectedVoyagePortCalls.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No port calls defined for this voyage
                </div>
              ) : (
                selectedVoyagePortCalls
                  .sort((a, b) => a.order - b.order)
                  .map((portCall, index) => (
                    <div key={index} className="bg-[#1A2A4A] rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {portCall.order}
                        </div>
                        <div>
                          <h4 className="font-bold text-cyan-400 font-mono text-lg">{portCall.portCode}</h4>
                          <div className="text-sm text-slate-300 space-y-1">
                            {portCall.eta && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-green-400"/>
                                <span>ETA: {new Date(portCall.eta).toLocaleString()}</span>
                              </div>
                            )}
                            {portCall.etd && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-red-400"/>
                                <span>ETD: {new Date(portCall.etd).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {portCall.mode && (
                          <div className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs mb-1">
                            {portCall.mode}
                          </div>
                        )}
                        {portCall.vesselName && (
                          <div className="text-slate-400 text-xs">{portCall.vesselName}</div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
            
            <footer className="mt-8 flex justify-end">
              <button 
                onClick={closePortCalls} 
                className="bg-[#2a72dc] hover:bg-[#1e5bb8] py-3 px-6 rounded-lg"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}