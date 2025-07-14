"use client";
import React, { useState, useEffect } from "react";
import {
  DollarSign, MapPin, Ship, Upload, List, Database, CheckCircle, AlertCircle, 
  Settings, Plus, Edit3, Save, X, ChevronLeft, ChevronRight, Search,
  Calendar, Filter, Package
} from "lucide-react";

// --- TYPES & ENUMS --------------------------------------------------------
enum ContainerGroup {
  DRY_STANDARD = "DRY_STANDARD",
  REEFER = "REEFER", 
  OPEN_TOP = "OPEN_TOP",
  FLAT_RACK = "FLAT_RACK",
  TANK = "TANK"
}

interface Tariff {
  serviceCode: string;
  pol: string; // port-of-loading UN/LOCODE
  pod: string; // port-of-discharge UN/LOCODE
  commodity: string;
  group: ContainerGroup;
  ratePerTeu: number;
  validFrom: string;
  validTo?: string;
  service?: ServiceSchedule;
}

interface ServiceSchedule {
  code: string;
  description?: string;
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
export function TariffsComponent() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"create-tariff"|"bulk-import"|"tariff-list">("create-tariff");

  // Forms & data
  const [tariffForm, setTariffForm] = useState<Tariff>({
    serviceCode: "",
    pol: "",
    pod: "",
    commodity: "FAK",
    group: ContainerGroup.DRY_STANDARD,
    ratePerTeu: 0,
    validFrom: new Date().toISOString().split('T')[0]
  } as Tariff);

  const [bulkData, setBulkData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea"|"file">("textarea");
  
  const [allTariffs, setAllTariffs] = useState<Tariff[]>([]);
  const [allServices, setAllServices] = useState<ServiceSchedule[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    serviceCode: "",
    pol: "",
    pod: "",
    commodity: "",
    group: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selected, setSelected] = useState<Tariff|null>(null);
  const [editForm, setEditForm] = useState<Tariff>({} as Tariff);

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

  async function createTariff(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/tariffs
      console.log("Creating tariff:", tariffForm);
      showMessage("success", "Tariff created successfully");
      setTariffForm({
        serviceCode: "",
        pol: "",
        pod: "",
        commodity: "FAK",
        group: ContainerGroup.DRY_STANDARD,
        ratePerTeu: 0,
        validFrom: new Date().toISOString().split('T')[0]
      } as Tariff);
    } catch (error) {
      showMessage("error", "Failed to create tariff");
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
      showMessage("success", `Successfully imported ${parsed.length} tariffs`);
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
      serviceCode: "WAX",
      pol: "USNYC",
      pod: "DEHAM",
      commodity: "FAK",
      group: "DRY_STANDARD",
      ratePerTeu: 1250.00,
      validFrom: "2024-01-01",
      validTo: "2024-12-31"
    }];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tariff-sample.json";
    a.click();
  }

  async function fetchTariffs(page = 1) {
    setIsLoadingList(true);
    try {
      // GET /api/tariffs with filters and pagination
      console.log("Fetching tariffs...");
      // Mock data for now
      setAllTariffs([
        {
          serviceCode: "WAX",
          pol: "USNYC",
          pod: "DEHAM", 
          commodity: "FAK",
          group: ContainerGroup.DRY_STANDARD,
          ratePerTeu: 1250.00,
          validFrom: "2024-01-01",
          validTo: "2024-12-31",
          service: { code: "WAX", description: "Weekly Atlantic Express" }
        },
        {
          serviceCode: "PAX",
          pol: "CNSHA",
          pod: "USLAX",
          commodity: "FAK", 
          group: ContainerGroup.DRY_STANDARD,
          ratePerTeu: 2100.00,
          validFrom: "2024-01-01",
          service: { code: "PAX", description: "Pacific Express" }
        }
      ]);
      setTotalPages(1);
    } catch (error) {
      showMessage("error", "Failed to fetch tariffs");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function fetchServices() {
    try {
      // GET /api/services
      console.log("Fetching services...");
      setAllServices([
        { code: "WAX", description: "Weekly Atlantic Express" },
        { code: "PAX", description: "Pacific Express" },
        { code: "MEX", description: "Mediterranean Express" },
        { code: "AEX", description: "Asia Express" }
      ]);
    } catch (error) {
      console.error("Failed to fetch services");
    }
  }

  function applyFilters() { fetchTariffs(1); }
  function clearFilters() { 
    setFilters({ serviceCode: "", pol: "", pod: "", commodity: "", group: "" });
    fetchTariffs(1);
  }

  function openEdit(tariff: Tariff) { 
    setSelected(tariff); 
    setEditForm(tariff); 
    setEditModalOpen(true); 
  }

  function closeEdit() { 
    setEditModalOpen(false); 
    setSelected(null);
    setEditForm({} as Tariff);
  }

  async function applyEdit() {
    setIsUpdating(true);
    try {
      // PATCH /api/tariffs (composite ID)
      console.log("Updating tariff:", editForm);
      showMessage("success", "Tariff updated successfully");
      closeEdit();
      fetchTariffs(currentPage);
    } catch (error) {
      showMessage("error", "Failed to update tariff");
    } finally {
      setIsUpdating(false);
    }
  }

  const getGroupLabel = (group: ContainerGroup) => {
    switch(group) {
      case ContainerGroup.DRY_STANDARD: return "Dry Standard";
      case ContainerGroup.REEFER: return "Reefer";
      case ContainerGroup.OPEN_TOP: return "Open Top";
      case ContainerGroup.FLAT_RACK: return "Flat Rack";
      case ContainerGroup.TANK: return "Tank";
      default: return group;
    }
  };

  const getGroupColor = (group: ContainerGroup) => {
    switch(group) {
      case ContainerGroup.DRY_STANDARD: return "bg-blue-900/30 text-blue-400";
      case ContainerGroup.REEFER: return "bg-green-900/30 text-green-400";
      case ContainerGroup.OPEN_TOP: return "bg-orange-900/30 text-orange-400";
      case ContainerGroup.FLAT_RACK: return "bg-purple-900/30 text-purple-400";
      case ContainerGroup.TANK: return "bg-red-900/30 text-red-400";
      default: return "bg-gray-900/30 text-gray-400";
    }
  };

  useEffect(() => {
    if (activeTab === "tariff-list") fetchTariffs(currentPage);
    fetchServices();
  }, [activeTab, currentPage]);

  // --- RENDER --------------------------------------------------------------
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-14 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <Ship className="text-[#00FFFF]" size={50} />
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Tariff Management</h1>
        <p className="text-lg mt-2">NVOCC Rate & Pricing Administration</p>
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
      <nav className="px-6 md:px-16 mb-8 flex gap-4 justify-center flex-wrap">
        {[
          { key: "create-tariff", icon: Plus, label: "Create Tariff" },
          { key: "bulk-import", icon: Upload, label: "Bulk Import" },
          { key: "tariff-list", icon: List, label: "Tariff List" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-8 py-3 rounded-lg uppercase flex items-center gap-2 shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all
              ${activeTab===tab.key ? "bg-[#600f9e] text-white" : "bg-[#1A2A4A] text-slate-300 hover:bg-[#2a72dc]"}`}
            style={cardGradient}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CREATE TARIFF */}
      {activeTab === "create-tariff" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <DollarSign className="text-cyan-400 w-8 h-8" />
              Create Tariff Rate
            </h2>
            <form onSubmit={createTariff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Code *</label>
                <select
                  value={tariffForm.serviceCode}
                  onChange={e => setTariffForm(prev=>({...prev, serviceCode:e.target.value}))}
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

              {/* Port of Loading */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Port of Loading (POL) *</label>
                <input
                  type="text"
                  value={tariffForm.pol}
                  onChange={e => setTariffForm(prev=>({...prev, pol:e.target.value.toUpperCase()}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="USNYC"
                  maxLength={5}
                  required
                />
              </div>

              {/* Port of Discharge */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Port of Discharge (POD) *</label>
                <input
                  type="text"
                  value={tariffForm.pod}
                  onChange={e => setTariffForm(prev=>({...prev, pod:e.target.value.toUpperCase()}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="DEHAM"
                  maxLength={5}
                  required
                />
              </div>

              {/* Commodity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Commodity *</label>
                <input
                  type="text"
                  value={tariffForm.commodity}
                  onChange={e => setTariffForm(prev=>({...prev, commodity:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="FAK"
                  required
                />
              </div>

              {/* Container Group */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Container Group *</label>
                <select
                  value={tariffForm.group}
                  onChange={e => setTariffForm(prev=>({...prev, group:e.target.value as ContainerGroup}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  {Object.values(ContainerGroup).map(group => (
                    <option key={group} value={group}>{getGroupLabel(group)}</option>
                  ))}
                </select>
              </div>

              {/* Rate Per TEU */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Rate Per TEU (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={tariffForm.ratePerTeu}
                  onChange={e => setTariffForm(prev=>({...prev, ratePerTeu:parseFloat(e.target.value)}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="1250.00"
                  required
                />
              </div>

              {/* Valid From */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Valid From *</label>
                <input
                  type="date"
                  value={tariffForm.validFrom}
                  onChange={e => setTariffForm(prev=>({...prev, validFrom:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* Valid To */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Valid To</label>
                <input
                  type="date"
                  value={tariffForm.validTo || ""}
                  onChange={e => setTariffForm(prev=>({...prev, validTo:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  Create Tariff
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
              Bulk Import Tariffs
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

      {/* TARIFF LIST */}
      {activeTab === "tariff-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <List className="text-cyan-400 w-8 h-8" />
              Tariff Rates
            </h2>
            
            {/* Filters */}
            <div className="bg-[#1A2A4A] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.serviceCode}
                onChange={e => setFilters(prev=>({...prev, serviceCode:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              >
                <option value="">All Services</option>
                {allServices.map(service => (
                  <option key={service.code} value={service.code}>{service.code}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="POL (e.g. USNYC)..."
                value={filters.pol}
                onChange={e => setFilters(prev=>({...prev, pol:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="POD (e.g. DEHAM)..."
                value={filters.pod}
                onChange={e => setFilters(prev=>({...prev, pod:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
              <select
                value={filters.group}
                onChange={e => setFilters(prev=>({...prev, group:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              >
                <option value="">All Groups</option>
                {Object.values(ContainerGroup).map(group => (
                  <option key={group} value={group}>{getGroupLabel(group)}</option>
                ))}
              </select>
              <button onClick={applyFilters} className="bg-[#600f9e] py-2 px-6 rounded-lg flex items-center gap-2">
                <Search className="w-4 h-4"/> Apply
              </button>
              <button onClick={clearFilters} className="bg-[#2a72dc] py-2 px-6 rounded-lg flex items-center gap-2">
                <Filter className="w-4 h-4"/> Clear
              </button>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8"/>
              </div>
            ) : allTariffs.length===0 ? (
              <div className="text-center py-12 text-slate-400">No tariffs found</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allTariffs.map((tariff, index) => (
                    <div
                      key={`${tariff.serviceCode}-${tariff.pol}-${tariff.pod}-${tariff.commodity}-${tariff.group}-${tariff.validFrom}`}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group cursor-pointer"
                      style={cardGradient}
                      onClick={() => openEdit(tariff)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-cyan-400">{tariff.serviceCode}</h3>
                          <p className="text-sm text-slate-300">{tariff.service?.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getGroupColor(tariff.group)}`}>
                          {getGroupLabel(tariff.group)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400"/>
                          <span className="text-slate-400">Route:</span>
                          <span className="font-mono">{tariff.pol} → {tariff.pod}</span>
                        </div>
                        <p><span className="text-slate-400">Commodity:</span> {tariff.commodity}</p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-yellow-400"/>
                          <span className="text-2xl font-bold text-yellow-400">
                            ${tariff.ratePerTeu.toLocaleString()}/TEU
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 border-t border-slate-600 pt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3"/>
                          <span>From: {new Date(tariff.validFrom).toLocaleDateString()}</span>
                        </div>
                        {tariff.validTo && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3"/>
                            <span>To: {new Date(tariff.validTo).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-2 text-cyan-400 transition-opacity">
                        <Edit3 className="w-4 h-4"/> Click to edit
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

      {/* EDIT MODAL */}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3/> Edit Tariff {selected.serviceCode}
              </h3>
              <button onClick={closeEdit} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>
            
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Rate Per TEU</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.ratePerTeu || 0}
                  onChange={e => setEditForm(prev=>({...prev, ratePerTeu:parseFloat(e.target.value)}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Valid From</label>
                <input
                  type="date"
                  value={editForm.validFrom || ""}
                  onChange={e => setEditForm(prev=>({...prev, validFrom:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Valid To</label>
                <input
                  type="date"
                  value={editForm.validTo || ""}
                  onChange={e => setEditForm(prev=>({...prev, validTo:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Commodity</label>
                <input
                  type="text"
                  value={editForm.commodity || ""}
                  onChange={e => setEditForm(prev=>({...prev, commodity:e.target.value}))}
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
    </div>
  );
}