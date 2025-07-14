"use client";
import React, { useState, useEffect } from "react";
import {
  DollarSign, Percent, Upload, List, Database, CheckCircle, AlertCircle, 
  Settings, Plus, Edit3, Save, X, ChevronLeft, ChevronRight, Search,
  Calendar, MapPin, Ship, Filter
} from "lucide-react";

// --- TYPES & ENUMS --------------------------------------------------------
enum SurchargeScope {
  ORIGIN = "ORIGIN",
  FREIGHT = "FREIGHT", 
  DESTINATION = "DESTINATION"
}

interface SurchargeDef {
  id?: string;
  name: string;
  scope: SurchargeScope;
  portCode?: string;
  serviceCode?: string;
  isPercentage: boolean;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  rates?: SurchargeRate[];
}

interface SurchargeRate {
  id?: string;
  surchargeDefId: string;
  containerTypeIsoCode: string;
  amount: number;
}

interface ContainerType {
  isoCode: string;
  name: string;
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
export function SurchargeComponent() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"create-def"|"bulk-import"|"surcharge-list"|"rates">("create-def");

  // Forms & data
  const [surchargeDefForm, setSurchargeDefForm] = useState<SurchargeDef>({
    name: "",
    scope: SurchargeScope.ORIGIN,
    isPercentage: false,
    currency: "USD",
    effectiveFrom: new Date().toISOString().split('T')[0]
  } as SurchargeDef);
  
  const [rateForm, setRateForm] = useState<SurchargeRate>({
    surchargeDefId: "",
    containerTypeIsoCode: "",
    amount: 0
  } as SurchargeRate);

  const [bulkData, setBulkData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea"|"file">("textarea");
  
  const [allSurchargeDefs, setAllSurchargeDefs] = useState<SurchargeDef[]>([]);
  const [allContainerTypes, setAllContainerTypes] = useState<ContainerType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    name: "",
    scope: "",
    currency: "",
    portCode: "",
    serviceCode: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selected, setSelected] = useState<SurchargeDef|null>(null);
  const [editForm, setEditForm] = useState<SurchargeDef>({} as SurchargeDef);
  const [selectedRates, setSelectedRates] = useState<SurchargeRate[]>([]);

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

  async function createSurchargeDef(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/surcharge-defs
      console.log("Creating surcharge definition:", surchargeDefForm);
      showMessage("success", "Surcharge definition created successfully");
      setSurchargeDefForm({
        name: "",
        scope: SurchargeScope.ORIGIN,
        isPercentage: false,
        currency: "USD",
        effectiveFrom: new Date().toISOString().split('T')[0]
      } as SurchargeDef);
    } catch (error) {
      showMessage("error", "Failed to create surcharge definition");
    } finally {
      setIsLoading(false);
    }
  }

  async function createSurchargeRate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/surcharge-rates
      console.log("Creating surcharge rate:", rateForm);
      showMessage("success", "Surcharge rate created successfully");
      setRateForm({
        surchargeDefId: "",
        containerTypeIsoCode: "",
        amount: 0
      } as SurchargeRate);
    } catch (error) {
      showMessage("error", "Failed to create surcharge rate");
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
      name: "Fuel Surcharge Origin Land",
      scope: "ORIGIN",
      portCode: "USNYC",
      isPercentage: false,
      currency: "USD",
      effectiveFrom: "2024-01-01",
      rates: [{
        containerTypeIsoCode: "20GP",
        amount: 50.00
      }]
    }];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "surcharge-sample.json";
    a.click();
  }

  async function fetchSurchargeDefs(page = 1) {
    setIsLoadingList(true);
    try {
      // GET /api/surcharge-defs with filters and pagination
      console.log("Fetching surcharge definitions...");
      // Mock data for now
      setAllSurchargeDefs([
        {
          id: "1",
          name: "Fuel Surcharge Origin Land",
          scope: SurchargeScope.ORIGIN,
          portCode: "USNYC",
          isPercentage: false,
          currency: "USD",
          effectiveFrom: "2024-01-01",
          rates: []
        }
      ]);
      setTotalPages(1);
    } catch (error) {
      showMessage("error", "Failed to fetch surcharge definitions");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function fetchContainerTypes() {
    try {
      // GET /api/container-types
      console.log("Fetching container types...");
      setAllContainerTypes([
        { isoCode: "20GP", name: "20' General Purpose" },
        { isoCode: "40GP", name: "40' General Purpose" },
        { isoCode: "40HC", name: "40' High Cube" },
        { isoCode: "45HC", name: "45' High Cube" }
      ]);
    } catch (error) {
      console.error("Failed to fetch container types");
    }
  }

  function applyFilters() { fetchSurchargeDefs(1); }
  function clearFilters() { 
    setFilters({ name: "", scope: "", currency: "", portCode: "", serviceCode: "" });
    fetchSurchargeDefs(1);
  }

  function openEdit(def: SurchargeDef) { 
    setSelected(def); 
    setEditForm(def); 
    setEditModalOpen(true); 
  }

  function closeEdit() { 
    setEditModalOpen(false); 
    setSelected(null);
    setEditForm({} as SurchargeDef);
  }

  function openRates(def: SurchargeDef) {
    setSelected(def);
    setSelectedRates(def.rates || []);
    setRateModalOpen(true);
  }

  function closeRates() {
    setRateModalOpen(false);
    setSelected(null);
    setSelectedRates([]);
  }

  async function applyEdit() {
    setIsUpdating(true);
    try {
      // PATCH /api/surcharge-defs/:id
      console.log("Updating surcharge definition:", editForm);
      showMessage("success", "Surcharge definition updated successfully");
      closeEdit();
      fetchSurchargeDefs(currentPage);
    } catch (error) {
      showMessage("error", "Failed to update surcharge definition");
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    if (activeTab === "surcharge-list") fetchSurchargeDefs(currentPage);
    fetchContainerTypes();
  }, [activeTab, currentPage]);

  // --- RENDER --------------------------------------------------------------
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-14 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <DollarSign className="text-[#00FFFF]" size={50} />
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Surcharge Management</h1>
        <p className="text-lg mt-2">NVOCC Surcharge & Rate Administration</p>
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
          { key: "create-def", icon: Plus, label: "Create Definition" },
          { key: "rates", icon: Percent, label: "Manage Rates" },
          { key: "bulk-import", icon: Upload, label: "Bulk Import" },
          { key: "surcharge-list", icon: List, label: "Surcharge List" },
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

      {/* CREATE SURCHARGE DEFINITION */}
      {activeTab === "create-def" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <DollarSign className="text-cyan-400 w-8 h-8" />
              Create Surcharge Definition
            </h2>
            <form onSubmit={createSurchargeDef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Surcharge Name *</label>
                <input
                  type="text"
                  value={surchargeDefForm.name}
                  onChange={e => setSurchargeDefForm(prev=>({...prev, name:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="Fuel Surcharge Origin Land"
                  required
                />
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Scope *</label>
                <select
                  value={surchargeDefForm.scope}
                  onChange={e => setSurchargeDefForm(prev=>({...prev, scope:e.target.value as SurchargeScope}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value={SurchargeScope.ORIGIN}>Origin</option>
                  <option value={SurchargeScope.FREIGHT}>Freight</option>
                  <option value={SurchargeScope.DESTINATION}>Destination</option>
                </select>
              </div>

              {/* Port Code (conditional) */}
              {(surchargeDefForm.scope === SurchargeScope.ORIGIN || surchargeDefForm.scope === SurchargeScope.DESTINATION) && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Port Code</label>
                  <input
                    type="text"
                    value={surchargeDefForm.portCode || ""}
                    onChange={e => setSurchargeDefForm(prev=>({...prev, portCode:e.target.value}))}
                    className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                    placeholder="USNYC"
                  />
                </div>
              )}

              {/* Service Code (conditional) */}
              {surchargeDefForm.scope === SurchargeScope.FREIGHT && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Service Code</label>
                  <input
                    type="text"
                    value={surchargeDefForm.serviceCode || ""}
                    onChange={e => setSurchargeDefForm(prev=>({...prev, serviceCode:e.target.value}))}
                    className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                    placeholder="WAX"
                  />
                </div>
              )}

              {/* Is Percentage */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Rate Type</label>
                <select
                  value={surchargeDefForm.isPercentage ? "true" : "false"}
                  onChange={e => setSurchargeDefForm(prev=>({...prev, isPercentage: e.target.value === "true"}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                >
                  <option value="false">Fixed Amount</option>
                  <option value="true">Percentage</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Currency</label>
                <select
                  value={surchargeDefForm.currency}
                  onChange={e => setSurchargeDefForm(prev=>({...prev, currency:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>

              {/* Effective From */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Effective From *</label>
                <input
                  type="date"
                  value={surchargeDefForm.effectiveFrom}
                  onChange={e => setSurchargeDefForm(prev=>({...prev, effectiveFrom:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>

              {/* Effective To */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Effective To</label>
                <input
                  type="date"
                  value={surchargeDefForm.effectiveTo || ""}
                  onChange={e => setSurchargeDefForm(prev=>({...prev, effectiveTo:e.target.value}))}
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
                  Create Definition
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* MANAGE RATES */}
      {activeTab === "rates" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Percent className="text-cyan-400 w-8 h-8" />
              Create Surcharge Rate
            </h2>
            <form onSubmit={createSurchargeRate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Surcharge Definition */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Surcharge Definition *</label>
                <select
                  value={rateForm.surchargeDefId}
                  onChange={e => setRateForm(prev=>({...prev, surchargeDefId:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value="">Select Surcharge Definition</option>
                  {allSurchargeDefs.map(def => (
                    <option key={def.id} value={def.id}>{def.name}</option>
                  ))}
                </select>
              </div>

              {/* Container Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Container Type *</label>
                <select
                  value={rateForm.containerTypeIsoCode}
                  onChange={e => setRateForm(prev=>({...prev, containerTypeIsoCode:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  required
                >
                  <option value="">Select Container Type</option>
                  {allContainerTypes.map(type => (
                    <option key={type.isoCode} value={type.isoCode}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={rateForm.amount}
                  onChange={e => setRateForm(prev=>({...prev, amount:parseFloat(e.target.value)}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  Create Rate
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
              Bulk Import Surcharges
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

      {/* SURCHARGE LIST */}
      {activeTab === "surcharge-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <List className="text-cyan-400 w-8 h-8" />
              Surcharge Definitions
            </h2>
            
            {/* Filters */}
            <div className="bg-[#1A2A4A] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.name}
                onChange={e => setFilters(prev=>({...prev, name:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
              <select
                value={filters.scope}
                onChange={e => setFilters(prev=>({...prev, scope:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              >
                <option value="">All Scopes</option>
                <option value="ORIGIN">Origin</option>
                <option value="FREIGHT">Freight</option>
                <option value="DESTINATION">Destination</option>
              </select>
              <input
                type="text"
                placeholder="Port/Service Code..."
                value={filters.portCode}
                onChange={e => setFilters(prev=>({...prev, portCode:e.target.value}))}
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
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
            ) : allSurchargeDefs.length===0 ? (
              <div className="text-center py-12 text-slate-400">No surcharge definitions found</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allSurchargeDefs.map(def => (
                    <div
                      key={def.id}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group"
                      style={cardGradient}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-cyan-400">{def.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          def.scope === 'ORIGIN' ? 'bg-green-900/30 text-green-400' :
                          def.scope === 'FREIGHT' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-purple-900/30 text-purple-400'
                        }`}>
                          {def.scope}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Type:</span> {def.isPercentage ? 'Percentage' : 'Fixed Amount'}</p>
                        <p><span className="text-slate-400">Currency:</span> {def.currency}</p>
                        {def.portCode && <p><span className="text-slate-400">Port:</span> {def.portCode}</p>}
                        {def.serviceCode && <p><span className="text-slate-400">Service:</span> {def.serviceCode}</p>}
                        <p><span className="text-slate-400">From:</span> {new Date(def.effectiveFrom).toLocaleDateString()}</p>
                        {def.effectiveTo && <p><span className="text-slate-400">To:</span> {new Date(def.effectiveTo).toLocaleDateString()}</p>}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => openEdit(def)}
                          className="flex-1 bg-[#600f9e] hover:bg-[#491174] py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs"
                        >
                          <Edit3 className="w-4 h-4"/> Edit
                        </button>
                        <button
                          onClick={() => openRates(def)}
                          className="flex-1 bg-[#2a72dc] hover:bg-[#1e5bb8] py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs"
                        >
                          <Percent className="w-4 h-4"/> Rates
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

      {/* EDIT MODAL */}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3/> Edit {selected.name}
              </h3>
              <button onClick={closeEdit} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>
            
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Name</label>
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={e => setEditForm(prev=>({...prev, name:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Currency</label>
                <select
                  value={editForm.currency || "USD"}
                  onChange={e => setEditForm(prev=>({...prev, currency:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CNY">CNY</option>
                </select>
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

      {/* RATES MODAL */}
      {rateModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Percent/> Rates for {selected.name}
              </h3>
              <button onClick={closeRates} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedRates.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400">
                  No rates defined for this surcharge
                </div>
              ) : (
                selectedRates.map((rate, index) => (
                  <div key={index} className="bg-[#1A2A4A] rounded-lg p-4">
                    <h4 className="font-bold text-cyan-400 mb-2">{rate.containerTypeIsoCode}</h4>
                    <p className="text-2xl font-bold">
                      {selected.isPercentage ? `${rate.amount}%` : `${selected.currency} ${rate.amount}`}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <footer className="mt-8 flex justify-end">
              <button 
                onClick={closeRates} 
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