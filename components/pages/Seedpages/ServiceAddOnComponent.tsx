"use client"

import React, { useState, useEffect } from "react";
import {
  Settings, Zap, Upload, List, Database, CheckCircle, AlertCircle,
  Plus, Edit3, Save, X, ChevronLeft, ChevronRight, Download,
  Star, StarOff, Eye, Search, Filter
} from "lucide-react";

// --- TYPES ---------------------------------------------------------------
interface Service {
  id?: string;
  code: string;
  name: string;
  description: string;
  ratePerUnit: number;
  currency: string;
  isRecommended: boolean;
  createdAt?: string;
}

// --- STYLES --------------------------------------------------------------
const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

export function ServiceAddOnComponent() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"create"|"bulk-import"|"service-list">("create");

  // Forms & data
  const [serviceForm, setServiceForm] = useState<Service>({
    code: "",
    name: "",
    description: "",
    ratePerUnit: 0,
    currency: "USD",
    isRecommended: false
  });
  const [bulkData, setBulkData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea"|"file">("textarea");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    currency: "",
    isRecommended: ""
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selected, setSelected] = useState<Service|null>(null);
  const [editForm, setEditForm] = useState<Service>({} as Service);
  const [hasChanges, setHasChanges] = useState(false);

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

  const resetForm = () => {
    setServiceForm({
      code: "",
      name: "",
      description: "",
      ratePerUnit: 0,
      currency: "USD",
      isRecommended: false
    });
  };

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.info("Creating service:", serviceForm);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/services', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(serviceForm)
      // });
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      showMessage("success", `Service ${serviceForm.code} created successfully!`);
      resetForm();
      if (activeTab === "service-list") fetchServices();
    } catch (error) {
      console.error("Error creating service:", error);
      showMessage("error", "Failed to create service");
    } finally {
      setIsLoading(false);
    }
  }

  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      let jsonData: Service[];
      
      if (bulkMode === "file" && uploadedFile) {
        const text = await uploadedFile.text();
        jsonData = JSON.parse(text);
      } else {
        jsonData = JSON.parse(bulkData);
      }

      console.info("Importing services:", jsonData);
      // TODO: Replace with actual API calls
      // for (const service of jsonData) {
      //   const response = await fetch('/api/services', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(service)
      //   });
      //   if (!response.ok) throw new Error(`Failed to create ${service.code}`);
      // }

      showMessage("success", `Successfully imported ${jsonData.length} services`);
      setBulkData("");
      setUploadedFile(null);
      if (activeTab === "service-list") fetchServices();
    } catch (error) {
      console.error("Error importing services:", error);
      showMessage("error", "Failed to import services. Check JSON format.");
    } finally {
      setIsLoading(false);
    }
  }

  function downloadSample() {
    const sample = [
      {
        code: "TRACK",
        name: "Live Tracking",
        description: "Real-time container tracking with GPS and IoT sensors",
        ratePerUnit: 25.00,
        currency: "USD",
        isRecommended: true
      },
      {
        code: "GREEN",
        name: "Green Shipping",
        description: "Carbon-neutral shipping with offset credits",
        ratePerUnit: 15.00,
        currency: "USD",
        isRecommended: false
      }
    ];
    
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "services-sample.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function fetchServices(page = 1) {
    setIsLoadingList(true);
    try {
      console.info("Fetching services...");
      // TODO: Replace with actual API call
      // const params = new URLSearchParams({
      //   page: page.toString(),
      //   limit: '12',
      //   ...filters
      // });
      // const response = await fetch(`/api/services?${params}`);
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // const data = await response.json();
      
      // Mock data for now
      const mockServices: Service[] = [
        {
          id: "1",
          code: "TRACK",
          name: "Live Tracking",
          description: "Real-time container tracking with GPS and IoT sensors",
          ratePerUnit: 25.00,
          currency: "USD",
          isRecommended: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "2", 
          code: "GREEN",
          name: "Green Shipping",
          description: "Carbon-neutral shipping with offset credits",
          ratePerUnit: 15.00,
          currency: "USD",
          isRecommended: false,
          createdAt: new Date().toISOString()
        }
      ];
      
      setAllServices(mockServices);
      setTotalPages(1);
    } catch (error) {
      console.error("Error fetching services:", error);
      showMessage("error", "Failed to fetch services");
    } finally {
      setIsLoadingList(false);
    }
  }

  function applyFilters() {
    setCurrentPage(1);
    fetchServices(1);
  }

  function clearFilters() {
    setFilters({ search: "", currency: "", isRecommended: "" });
    setCurrentPage(1);
    fetchServices(1);
  }

  function openEdit(service: Service) {
    setSelected(service);
    setEditForm({ ...service });
    setEditModalOpen(true);
    setHasChanges(false);
  }

  function closeEdit() {
    setEditModalOpen(false);
    setSelected(null);
    setEditForm({} as Service);
    setHasChanges(false);
  }

  async function applyEdit() {
    if (!selected?.id) return;
    setIsUpdating(true);
    try {
      console.info("Updating service:", editForm);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/services/${selected.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editForm)
      // });
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);

      showMessage("success", `Service ${editForm.code} updated successfully!`);
      closeEdit();
      fetchServices(currentPage);
    } catch (error) {
      console.error("Error updating service:", error);
      showMessage("error", "Failed to update service");
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    if (activeTab === "service-list") fetchServices(currentPage);
  }, [activeTab, currentPage]);

  useEffect(() => {
    if (selected && editForm) {
      const changed = JSON.stringify(selected) !== JSON.stringify(editForm);
      setHasChanges(changed);
    }
  }, [editForm, selected]);

  // --- RENDER --------------------------------------------------------------
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-14 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <Zap className="text-[#00FFFF]" size={50} />
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Service Add-Ons</h1>
        <p className="text-lg mt-2">Container Service Management</p>
      </header>

      {/* MESSAGE */}
      {message && (
        <div className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type==="success"? "bg-green-900/30 border border-green-400":"bg-red-900/30 border border-red-400"
        }`}>
          {message.type==="success"? <CheckCircle className="w-5 h-5"/>:<AlertCircle className="w-5 h-5" />} 
          {message.text}
        </div>
      )}

      {/* TABS */}
      <nav className="px-6 md:px-16 mb-8 flex gap-4 justify-center flex-wrap">
        {[
          { key: "create", icon: Plus, label: "Create Service" },
          { key: "bulk-import", icon: Upload, label: "Bulk Import" },
          { key: "service-list", icon: List, label: "Service List" },
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

      {/* PANELS */}
      {activeTab === "create" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Plus className="text-cyan-400 w-8 h-8" />
              Create Service Add-On
            </h2>
            <form onSubmit={createService} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Code *</label>
                <input
                  type="text"
                  value={serviceForm.code}
                  onChange={e => setServiceForm(prev=>({...prev, code:e.target.value.toUpperCase()}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="TRACK"
                  required
                />
              </div>

              {/* Service Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Name *</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={e => setServiceForm(prev=>({...prev, name:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="Live Tracking"
                  required
                />
              </div>

              {/* Rate Per Unit */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Rate Per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceForm.ratePerUnit}
                  onChange={e => setServiceForm(prev=>({...prev, ratePerUnit:parseFloat(e.target.value)||0}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="25.00"
                  required
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Currency *</label>
                <select
                  value={serviceForm.currency}
                  onChange={e => setServiceForm(prev=>({...prev, currency:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>

              {/* Is Recommended */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Recommended Service</label>
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={serviceForm.isRecommended}
                    onChange={e => setServiceForm(prev=>({...prev, isRecommended:e.target.checked}))}
                    className="w-5 h-5 text-cyan-400"
                  />
                  <span className="text-sm">Mark as recommended</span>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2 lg:col-span-3 space-y-2">
                <label className="text-sm font-semibold text-slate-300">Description *</label>
                <textarea
                  value={serviceForm.description}
                  onChange={e => setServiceForm(prev=>({...prev, description:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white h-24"
                  placeholder="Detailed description of the service..."
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Upload className="text-cyan-400 w-8 h-8" />
              Bulk Import Services
            </h2>
            
            {/* Mode Switch */}
            <div className="flex gap-4 mb-6">
              <button 
                onClick={()=>setBulkMode("textarea")} 
                className={`px-6 py-3 rounded-lg uppercase font-semibold ${
                  bulkMode==="textarea"?"bg-[#600f9e] text-white":"bg-[#1A2A4A] text-slate-300 hover:bg-[#2a72dc]"
                }`}
              >
                Paste JSON
              </button>
              <button 
                onClick={()=>setBulkMode("file")} 
                className={`px-6 py-3 rounded-lg uppercase font-semibold ${
                  bulkMode==="file"?"bg-[#600f9e] text-white":"bg-[#1A2A4A] text-slate-300 hover:bg-[#2a72dc]"
                }`}
              >
                Upload File
              </button>
            </div>

            <button 
              onClick={downloadSample} 
              className="mb-6 bg-[#2a72dc] hover:bg-[#1e5aa8] px-6 py-3 rounded-lg flex items-center gap-2 uppercase font-semibold"
            >
              <Download className="w-5 h-5"/> Download Sample
            </button>

            <form onSubmit={importBulk} className="space-y-6">
              {bulkMode==="textarea" ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">JSON Data</label>
                  <textarea
                    className="w-full h-48 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white font-mono p-4"
                    value={bulkData}
                    onChange={e=>setBulkData(e.target.value)}
                    placeholder='[{"code":"TRACK","name":"Live Tracking",...}]'
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Upload JSON File</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={e=>setUploadedFile(e.target.files?.[0]||null)}
                    className="w-full bg-[#1A2A4A] border border-slate-600 rounded-lg p-3 text-white"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading || (bulkMode==="textarea" && !bulkData.trim()) || (bulkMode==="file" && !uploadedFile)}
                className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
              >
                {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Upload className="w-5 h-5"/>}
                Import Services
              </button>
            </form>
          </div>
        </section>
      )}

      {activeTab === "service-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <List className="text-cyan-400 w-8 h-8" />
              Service List
            </h2>

            {/* Filters */}
            <div className="bg-[#1A2A4A] rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={e => setFilters(prev=>({...prev, search:e.target.value}))}
                    className="w-full px-3 py-2 bg-[#0A1A2F] border border-slate-600 rounded text-white text-sm"
                    placeholder="Code or name..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Currency</label>
                  <select
                    value={filters.currency}
                    onChange={e => setFilters(prev=>({...prev, currency:e.target.value}))}
                    className="w-full px-3 py-2 bg-[#0A1A2F] border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="">All Currencies</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Recommended</label>
                  <select
                    value={filters.isRecommended}
                    onChange={e => setFilters(prev=>({...prev, isRecommended:e.target.value}))}
                    className="w-full px-3 py-2 bg-[#0A1A2F] border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="">All Services</option>
                    <option value="true">Recommended Only</option>
                    <option value="false">Non-Recommended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={applyFilters} 
                  className="bg-[#600f9e] hover:bg-[#491174] py-2 px-6 rounded-lg flex items-center gap-2 uppercase font-semibold"
                >
                  <Filter className="w-4 h-4"/> Apply
                </button>
                <button 
                  onClick={clearFilters} 
                  className="bg-[#2a72dc] hover:bg-[#1e5aa8] py-2 px-6 rounded-lg flex items-center gap-2 uppercase font-semibold"
                >
                  <X className="w-4 h-4"/> Clear
                </button>
              </div>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8 text-cyan-400"/>
              </div>
            ) : allServices.length===0 ? (
              <div className="text-center py-12 text-slate-400">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                <p className="text-lg">No services found</p>
              </div>
            ) : (
              <>
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allServices.map(service => (
                    <div
                      key={service.id}
                      onClick={()=>openEdit(service)}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] cursor-pointer transition-all group"
                      style={cardGradient}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-cyan-400">{service.code}</h3>
                        {service.isRecommended && (
                          <Star className="w-5 h-5 text-yellow-400 fill-current"/>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-semibold mb-2">{service.name}</h4>
                      <p className="text-sm text-slate-300 mb-4 line-clamp-2">{service.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-400">
                          {service.ratePerUnit.toFixed(2)} {service.currency}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs text-cyan-400">
                          <Edit3 className="w-4 h-4"/>
                          Edit
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={()=>setCurrentPage(p=>Math.max(1, p-1))}
                      disabled={currentPage<=1}
                      className="bg-[#2a72dc] hover:bg-[#1e5aa8] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg flex items-center gap-2 uppercase font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4"/> Prev
                    </button>
                    
                    <span className="text-slate-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={()=>setCurrentPage(p=>Math.min(totalPages, p+1))}
                      disabled={currentPage>=totalPages}
                      className="bg-[#2a72dc] hover:bg-[#1e5aa8] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg flex items-center gap-2 uppercase font-semibold"
                    >
                      Next <ChevronRight className="w-4 h-4"/>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 className="text-cyan-400"/> Edit Service: {selected.code}
              </h3>
              <button 
                onClick={closeEdit}
                className="p-2 hover:bg-[#1A2A4A] rounded-lg transition-colors"
              >
                <X className="w-6 h-6"/>
              </button>
            </header>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Code *</label>
                <input
                  type="text"
                  value={editForm.code || ""}
                  onChange={e => setEditForm(prev=>({...prev, code:e.target.value.toUpperCase()}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* Service Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Service Name *</label>
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={e => setEditForm(prev=>({...prev, name:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* Rate Per Unit */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Rate Per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.ratePerUnit || 0}
                  onChange={e => setEditForm(prev=>({...prev, ratePerUnit:parseFloat(e.target.value)||0}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Currency *</label>
                <select
                  value={editForm.currency || "USD"}
                  onChange={e => setEditForm(prev=>({...prev, currency:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>

              {/* Is Recommended */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Recommended Service</label>
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={editForm.isRecommended || false}
                    onChange={e => setEditForm(prev=>({...prev, isRecommended:e.target.checked}))}
                    className="w-5 h-5 text-cyan-400"
                  />
                  <span className="text-sm">Mark as recommended</span>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-300">Description *</label>
                <textarea
                  value={editForm.description || ""}
                  onChange={e => setEditForm(prev=>({...prev, description:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white h-24"
                  required
                />
              </div>
            </form>

            <footer className="mt-8 flex justify-end gap-4">
              <button 
                onClick={closeEdit}
                className="bg-[#1A2A4A] hover:bg-[#2A3A5A] py-3 px-6 rounded-lg uppercase font-semibold"
              >
                Cancel
              </button>
              {hasChanges && (
                <button
                  onClick={applyEdit}
                  disabled={isUpdating}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 py-3 px-6 rounded-lg flex items-center gap-2 uppercase font-semibold"
                >
                  {isUpdating ? <Settings className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                  Save Changes
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}