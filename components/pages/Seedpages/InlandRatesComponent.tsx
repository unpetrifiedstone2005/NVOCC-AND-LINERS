// File: components/pages/Seedpages/InlandRatesComponent.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Truck,
  DollarSign,
  Upload,
  List as ListIcon,
  Search,
  Filter,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Edit3,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Trash2,
  Map
} from "lucide-react";
import axios from "axios";

// —————————————————————————————————————————————————————————————————————————————
// TYPES & ENUMS
// —————————————————————————————————————————————————————————————————————————————

enum ContainerGroup {
  DRY_STANDARD = "DRY_STANDARD",
  REEFER       = "REEFER",
  OPEN_TOP     = "OPEN_TOP",
  FLAT_RACK    = "FLAT_RACK",
  TANK         = "TANK"
}

enum InlandDirection {
  IMPORT = "IMPORT",
  EXPORT = "EXPORT"
}

enum InlandMode {
  ROAD = "ROAD",
  RAIL = "RAIL",
  BARGE = "BARGE"
}

interface InlandZone {
  id: string;
  country: string;
  name: string;
  postalPrefixes: string[];
  notes?: string;
  createdAt: string;
  inlandRates?: InlandRate[];
}

interface InlandRateBreak {
  id?: string;
  breakType: "WEIGHT" | "DISTANCE";
  fromValue: number;
  toValue?: number;
  amount: number;
}

interface InlandRate {
  id?: string;
  zoneId: string;
  zone?: InlandZone;
  portUnlocode: string;
  port?: { unlocode: string; name: string; country: string; };
  direction: InlandDirection;
  mode: InlandMode;
  containerGroup: ContainerGroup;
  containerTypeIsoCode?: string;
  containerType?: { isoCode: string; name: string; };
  currency: string;
  basis: "FLAT" | "PER_KM" | "BREAKS";
  flatAmount?: number;
  perKmAmount?: number;
  minCharge?: number;
  validFrom: string;
  validTo?: string;
  maxDistanceKm?: number;
  maxWeightKg?: number;
  breaks?: InlandRateBreak[];
}

interface Location {
  unlocode: string;
  name: string;
  country: string;
}

interface ContainerType {
  isoCode: string;
  name: string;
  group: ContainerGroup;
}

interface ZoneForm {
  country: string;
  name: string;
  postalPrefixes: string;
  notes: string;
}

interface RateForm {
  zoneId: string;
  portUnlocode: string;
  direction: InlandDirection;
  mode: InlandMode;
  containerGroup: ContainerGroup;
  containerTypeIsoCode: string;
  currency: string;
  basis: "FLAT" | "PER_KM" | "BREAKS";
  flatAmount: string;
  perKmAmount: string;
  minCharge: string;
  validFrom: string;
  validTo: string;
  maxDistanceKm: string;
  maxWeightKg: string;
  breaks: InlandRateBreak[];
}

// —————————————————————————————————————————————————————————————————————————————
// STYLES
// —————————————————————————————————————————————————————————————————————————————

const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%)
  `,
  backgroundBlendMode: "overlay"
};

// —————————————————————————————————————————————————————————————————————————————
// COMPONENT
// —————————————————————————————————————————————————————————————————————————————

export function InlandRatesComponent() {
  // ──────────────────────────────────────────────────────
  // TAB STATE
  // ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"zones" | "rates" | "bulk-import" | "rates-list">("zones");
  const [activeSubTab, setActiveSubTab] = useState<"create-zone" | "zone-list">("create-zone");
  const [activeRateTab, setActiveRateTab] = useState<"create-rate" | "rate-list">("create-rate");

  // ──────────────────────────────────────────────────────
  // FORM & DATA STATE
  // ──────────────────────────────────────────────────────
  
  // Zone management
  const [zoneForm, setZoneForm] = useState<ZoneForm>({
    country: "",
    name: "",
    postalPrefixes: "",
    notes: ""
  });

  // Rate management
  const [rateForm, setRateForm] = useState<RateForm>({
    zoneId: "",
    portUnlocode: "",
    direction: InlandDirection.IMPORT,
    mode: InlandMode.ROAD,
    containerGroup: ContainerGroup.DRY_STANDARD,
    containerTypeIsoCode: "",
    currency: "USD",
    basis: "FLAT",
    flatAmount: "",
    perKmAmount: "",
    minCharge: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    maxDistanceKm: "",
    maxWeightKg: "",
    breaks: []
  });

  // Data lists
  const [allZones, setAllZones] = useState<InlandZone[]>([]);
  const [allRates, setAllRates] = useState<InlandRate[]>([]);
  const [allPorts, setAllPorts] = useState<Location[]>([]);
  const [allContainerTypes, setAllContainerTypes] = useState<ContainerType[]>([]);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    zoneId: string;
    portUnlocode: string;
    direction: string;
    mode: string;
    containerGroup: string;
  }>({
    zoneId: "",
    portUnlocode: "",
    direction: "",
    mode: "",
    containerGroup: ""
  });

  // Edit modals
  const [editZoneModalOpen, setEditZoneModalOpen] = useState(false);
  const [editRateModalOpen, setEditRateModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<InlandZone | null>(null);
  const [selectedRate, setSelectedRate] = useState<InlandRate | null>(null);
  const [editZoneForm, setEditZoneForm] = useState<ZoneForm>({} as ZoneForm);
  const [editRateForm, setEditRateForm] = useState<InlandRate>({} as InlandRate);

  // Loading & messages
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Bulk import
  const [bulkMode, setBulkMode] = useState<"textarea" | "file">("textarea");
  const [bulkData, setBulkData] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // ──────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getGroupLabel = (g: ContainerGroup) => {
    switch (g) {
      case ContainerGroup.DRY_STANDARD: return "Dry Standard";
      case ContainerGroup.REEFER: return "Reefer";
      case ContainerGroup.OPEN_TOP: return "Open Top";
      case ContainerGroup.FLAT_RACK: return "Flat Rack";
      case ContainerGroup.TANK: return "Tank";
    }
  };

  const getGroupColor = (g: ContainerGroup) => {
    switch (g) {
      case ContainerGroup.DRY_STANDARD: return "bg-blue-900/30 text-blue-400";
      case ContainerGroup.REEFER: return "bg-green-900/30 text-green-400";
      case ContainerGroup.OPEN_TOP: return "bg-orange-900/30 text-orange-400";
      case ContainerGroup.FLAT_RACK: return "bg-purple-900/30 text-purple-400";
      case ContainerGroup.TANK: return "bg-red-900/30 text-red-400";
    }
  };

  const getModeIcon = (mode: InlandMode) => {
    switch (mode) {
      case InlandMode.ROAD: return <Truck className="w-4 h-4" />;
      case InlandMode.RAIL: return <div className="w-4 h-4 bg-current rounded-sm" />;
      case InlandMode.BARGE: return <div className="w-4 h-4 bg-current rounded-full" />;
    }
  };

  // ──────────────────────────────────────────────────────
  // FETCHERS / CRUD
  // ──────────────────────────────────────────────────────

  // ▶ fetch all zones
  async function fetchZones() {
    try {
      const res = await axios.get<{ items: InlandZone[]; total: number; }>("/api/seed/inland/zones/get");
      setAllZones(res.data.items);
    } catch (err) {
      console.error("fetchZones error:", err);
      setAllZones([]);
    }
  }

  // ▶ fetch all ports
  async function fetchPorts() {
    try {
      const res = await axios.get<{ items: Location[]; }>("/api/seed/locations/get?limit=500");
      setAllPorts(res.data.items);
    } catch (err) {
      console.error("fetchPorts error:", err);
      setAllPorts([]);
    }
  }

  // ▶ fetch container types
  async function fetchContainerTypes(group?: ContainerGroup) {
    try {
      const params = group ? `?group=${group}` : "";
      const res = await axios.get<{ items: ContainerType[]; }>(`/api/seed/containers/types/get${params}`);
      setAllContainerTypes(res.data.items);
    } catch (err) {
      console.error("fetchContainerTypes error:", err);
      setAllContainerTypes([]);
    }
  }

  // ▶ create zone
  async function createZone(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        country: zoneForm.country,
        name: zoneForm.name,
        postalPrefixes: zoneForm.postalPrefixes.split(",").map(p => p.trim()).filter(Boolean),
        notes: zoneForm.notes || undefined
      };

      await axios.post("/api/seed/inland/zones/post", payload);
      showMessage("success", "Inland zone created successfully");
      
      // Reset form
      setZoneForm({
        country: "",
        name: "",
        postalPrefixes: "",
        notes: ""
      });
      
      fetchZones();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create zone";
      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ▶ create rate
  async function createRate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        zoneId: rateForm.zoneId,
        portUnlocode: rateForm.portUnlocode,
        direction: rateForm.direction,
        mode: rateForm.mode,
        containerGroup: rateForm.containerGroup,
        containerTypeIsoCode: rateForm.containerTypeIsoCode || undefined,
        currency: rateForm.currency,
        basis: rateForm.basis,
        flatAmount: rateForm.flatAmount ? parseFloat(rateForm.flatAmount) : undefined,
        perKmAmount: rateForm.perKmAmount ? parseFloat(rateForm.perKmAmount) : undefined,
        minCharge: rateForm.minCharge ? parseFloat(rateForm.minCharge) : undefined,
        validFrom: rateForm.validFrom + "T00:00:00.000Z",
        validTo: rateForm.validTo ? rateForm.validTo + "T00:00:00.000Z" : undefined,
        maxDistanceKm: rateForm.maxDistanceKm ? parseInt(rateForm.maxDistanceKm) : undefined,
        maxWeightKg: rateForm.maxWeightKg ? parseInt(rateForm.maxWeightKg) : undefined,
        breaks: rateForm.breaks
      };

      await axios.post("/api/seed/inland/rates/post", payload);
      showMessage("success", "Inland rate created successfully");
      
      // Reset form
      setRateForm({
        zoneId: "",
        portUnlocode: "",
        direction: InlandDirection.IMPORT,
        mode: InlandMode.ROAD,
        containerGroup: ContainerGroup.DRY_STANDARD,
        containerTypeIsoCode: "",
        currency: "USD",
        basis: "FLAT",
        flatAmount: "",
        perKmAmount: "",
        minCharge: "",
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: "",
        maxDistanceKm: "",
        maxWeightKg: "",
        breaks: []
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create rate";
      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ▶ fetch rates
  const listRequestRef = useRef<AbortController | null>(null);

  async function fetchRates(page = 1) {
    setIsLoadingList(true);

    listRequestRef.current?.abort();
    const controller = new AbortController();
    listRequestRef.current = controller;

    try {
      const params = {
        page: String(page),
        limit: "20",
        ...(filters.zoneId && { zoneId: filters.zoneId }),
        ...(filters.portUnlocode && { portUnlocode: filters.portUnlocode }),
        ...(filters.direction && { direction: filters.direction }),
        ...(filters.mode && { mode: filters.mode }),
        ...(filters.containerGroup && { containerGroup: filters.containerGroup }),
      };

      const res = await axios.get<{
        items: InlandRate[];
        total: number;
        currentPage: number;
        totalPages: number;
      }>("/api/seed/inland/rates/get", { params, signal: controller.signal });

      setAllRates(res.data.items);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") return;
      console.error("fetchRates error:", err);
      showMessage("error", "Failed to fetch rates");
    } finally {
      setIsLoadingList(false);
    }
  }

  // ▶ update zone
  async function updateZone() {
    if (!selectedZone) return;
    setIsUpdating(true);
    try {
      const payload = {
        country: editZoneForm.country,
        name: editZoneForm.name,
        postalPrefixes: editZoneForm.postalPrefixes.split(",").map(p => p.trim()).filter(Boolean),
        notes: editZoneForm.notes || undefined
      };

      await axios.patch(`/api/seed/inland/zones/${selectedZone.id}/patch`, payload);
      showMessage("success", "Zone updated successfully");
      setEditZoneModalOpen(false);
      fetchZones();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to update zone";
      showMessage("error", msg);
    } finally {
      setIsUpdating(false);
    }
  }

  // ▶ update rate
  async function updateRate() {
    if (!selectedRate) return;
    setIsUpdating(true);
    try {
      const payload = {
        currency: editRateForm.currency,
        basis: editRateForm.basis,
        flatAmount: editRateForm.flatAmount,
        perKmAmount: editRateForm.perKmAmount,
        minCharge: editRateForm.minCharge,
        validFrom: editRateForm.validFrom,
        validTo: editRateForm.validTo,
        maxDistanceKm: editRateForm.maxDistanceKm,
        maxWeightKg: editRateForm.maxWeightKg,
        breaks: editRateForm.breaks
      };

      await axios.patch(`/api/seed/inland/rates/${selectedRate.id}/patch`, payload);
      showMessage("success", "Rate updated successfully");
      setEditRateModalOpen(false);
      fetchRates(currentPage);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to update rate";
      showMessage("error", msg);
    } finally {
      setIsUpdating(false);
    }
  }

  // ▶ delete zone
  async function deleteZone(zone: InlandZone) {
    if (!confirm(`Delete zone "${zone.name}"? This will also delete all associated rates.`)) return;
    
    try {
      await axios.delete(`/api/seed/inland/zones/${zone.id}/delete`);
      showMessage("success", "Zone deleted successfully");
      fetchZones();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to delete zone";
      showMessage("error", msg);
    }
  }

  // ──────────────────────────────────────────────────────
  // RATE BREAKS MANAGEMENT
  // ──────────────────────────────────────────────────────
  
  const addBreak = () => {
    setRateForm(prev => ({
      ...prev,
      breaks: [...prev.breaks, { breakType: "WEIGHT", fromValue: 0, toValue: undefined, amount: 0 }]
    }));
  };

  const updateBreak = (index: number, field: keyof InlandRateBreak, value: any) => {
    setRateForm(prev => ({
      ...prev,
      breaks: prev.breaks.map((brk, i) => i === index ? { ...brk, [field]: value } : brk)
    }));
  };

  const removeBreak = (index: number) => {
    setRateForm(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index)
    }));
  };

  // ──────────────────────────────────────────────────────
  // MODAL HELPERS
  // ──────────────────────────────────────────────────────
  
  const openEditZone = (zone: InlandZone) => {
    setSelectedZone(zone);
    setEditZoneForm({
      country: zone.country,
      name: zone.name,
      postalPrefixes: zone.postalPrefixes.join(", "),
      notes: zone.notes || ""
    });
    setEditZoneModalOpen(true);
  };

  const openEditRate = (rate: InlandRate) => {
    setSelectedRate(rate);
    setEditRateForm(rate);
    setEditRateModalOpen(true);
  };

  // ──────────────────────────────────────────────────────
  // LIFECYCLE
  // ──────────────────────────────────────────────────────
  
  useEffect(() => {
    fetchZones();
    fetchPorts();
    fetchContainerTypes();
  }, []);

  useEffect(() => {
    if (rateForm.containerGroup) {
      fetchContainerTypes(rateForm.containerGroup);
    }
  }, [rateForm.containerGroup]);

  useEffect(() => {
    if (activeTab === "rates-list") {
      fetchRates(currentPage);
    }
  }, [activeTab, currentPage]);

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-14 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <Truck className="text-[#00FFFF]" size={50} />
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Inland Rates Management</h1>
        <p className="text-lg mt-2">Zone & Transportation Rate Administration</p>
      </header>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-900/30 border border-green-400 text-green-400"
              : "bg-red-900/30 border border-red-400 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}
          {message.text}
        </div>
      )}

      {/* MAIN TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { key: "zones", icon: <Map className="w-5 h-5" />, label: "Inland Zones" },
            { key: "rates", icon: <DollarSign className="w-5 h-5" />, label: "Rate Management" },
            { key: "bulk-import", icon: <Upload className="w-5 h-5" />, label: "Bulk Import" },
            { key: "rates-list", icon: <ListIcon className="w-5 h-5" />, label: "Rates List" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-1 py-2 uppercase font-bold transition shadow border-2 border-black flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? "bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0_rgba(0,0,0,1)]"
                  : "bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white rounded-lg shadow-[4px_4px_0_rgba(0,0,0,1)]"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════ ZONES TAB ═══════════════════════════════════ */}
      {activeTab === "zones" && (
        <section className="px-6 md:px-16 mb-16">
          {/* Zone Sub-tabs */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            {[
              { key: "create-zone", label: "Create Zone" },
              { key: "zone-list", label: "Zone List" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key as any)}
                className={`px-4 py-2 uppercase font-bold transition ${
                  activeSubTab === tab.key
                    ? "bg-cyan-400 text-black rounded-lg"
                    : "bg-[#2D4D8B] text-white rounded-lg hover:bg-[#1A2F4E]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeSubTab === "create-zone" && (
            <div className="border-2 border-white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
                <Map className="text-cyan-400 w-8 h-8" /> Create Inland Zone
              </h2>
              
              <form onSubmit={createZone} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Country *</label>
                  <input
                    type="text"
                    value={zoneForm.country}
                    onChange={e => setZoneForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="USA"
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Zone Name *</label>
                  <input
                    type="text"
                    value={zoneForm.name}
                    onChange={e => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="California Central"
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-white">Postal Prefixes</label>
                  <input
                    type="text"
                    value={zoneForm.postalPrefixes}
                    onChange={e => setZoneForm(prev => ({ ...prev, postalPrefixes: e.target.value }))}
                    placeholder="93, 94, 95 (comma-separated)"
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-white">Notes</label>
                  <textarea
                    value={zoneForm.notes}
                    onChange={e => setZoneForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional zone information..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-2 flex justify-center mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow text-white disabled:opacity-50"
                  >
                    {isLoading ? <Settings className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    Create Zone
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === "zone-list" && (
            <div className="border-2 border-white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
                <ListIcon className="text-cyan-400 w-8 h-8" /> Inland Zones
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allZones.map(zone => (
                  <div
                    key={zone.id}
                    className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                    style={cardGradient}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-white">{zone.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditZone(zone)}
                          className="text-cyan-400 hover:text-white"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteZone(zone)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300">Country:</span>
                        <span className="text-white font-mono">{zone.country}</span>
                      </div>
                      
                      {zone.postalPrefixes.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-slate-300">Prefixes:</span>
                          <div className="flex flex-wrap gap-1">
                            {zone.postalPrefixes.slice(0, 3).map(prefix => (
                              <span key={prefix} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs">
                                {prefix}
                              </span>
                            ))}
                            {zone.postalPrefixes.length > 3 && (
                              <span className="text-slate-400 text-xs">+{zone.postalPrefixes.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {zone.notes && (
                        <div className="text-slate-300 text-xs mt-3 p-2 bg-slate-800/30 rounded">
                          {zone.notes}
                        </div>
                      )}
                      
                      <div className="text-xs text-slate-400 border-t border-slate-600 pt-2 mt-3">
                        Created: {new Date(zone.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════ RATES TAB ═══════════════════════════════════ */}
      {activeTab === "rates" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="border-2 border-white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <DollarSign className="text-cyan-400 w-8 h-8" /> Create Inland Rate
            </h2>
            
            <form onSubmit={createRate} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Inland Zone *</label>
                  <select
                    value={rateForm.zoneId}
                    onChange={e => setRateForm(prev => ({ ...prev, zoneId: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">Select Zone</option>
                    {allZones.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Port *</label>
                  <select
                    value={rateForm.portUnlocode}
                    onChange={e => setRateForm(prev => ({ ...prev, portUnlocode: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">Select Port</option>
                    {allPorts.map(port => (
                      <option key={port.unlocode} value={port.unlocode}>
                        {port.unlocode} - {port.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Direction *</label>
                  <select
                    value={rateForm.direction}
                    onChange={e => setRateForm(prev => ({ ...prev, direction: e.target.value as InlandDirection }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    {Object.values(InlandDirection).map(dir => (
                      <option key={dir} value={dir}>{dir}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Mode *</label>
                  <select
                    value={rateForm.mode}
                    onChange={e => setRateForm(prev => ({ ...prev, mode: e.target.value as InlandMode }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    {Object.values(InlandMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Container Group *</label>
                  <select
                    value={rateForm.containerGroup}
                    onChange={e => setRateForm(prev => ({ ...prev, containerGroup: e.target.value as ContainerGroup }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    {Object.values(ContainerGroup).map(group => (
                      <option key={group} value={group}>{getGroupLabel(group)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Specific Container Type</label>
                  <select
                    value={rateForm.containerTypeIsoCode}
                    onChange={e => setRateForm(prev => ({ ...prev, containerTypeIsoCode: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All types in group</option>
                    {allContainerTypes
                      .filter(ct => ct.group === rateForm.containerGroup)
                      .map(ct => (
                        <option key={ct.isoCode} value={ct.isoCode}>
                          {ct.name} ({ct.isoCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Currency</label>
                  <select
                    value={rateForm.currency}
                    onChange={e => setRateForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Pricing Basis *</label>
                  <select
                    value={rateForm.basis}
                    onChange={e => setRateForm(prev => ({ ...prev, basis: e.target.value as "FLAT" | "PER_KM" | "BREAKS" }))}
                    required
                    className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="FLAT">Flat Rate</option>
                    <option value="PER_KM">Per Kilometer</option>
                    <option value="BREAKS">Rate Breaks</option>
                  </select>
                </div>

                {rateForm.basis === "FLAT" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Flat Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateForm.flatAmount}
                      onChange={e => setRateForm(prev => ({ ...prev, flatAmount: e.target.value }))}
                      required
                      className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                {rateForm.basis === "PER_KM" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Per KM Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateForm.perKmAmount}
                      onChange={e => setRateForm(prev => ({ ...prev, perKmAmount: e.target.value }))}
                      required
                      className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Minimum Charge</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rateForm.minCharge}
                    onChange={e => setRateForm(prev => ({ ...prev, minCharge: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Rate Breaks */}
              {rateForm.basis === "BREAKS" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Rate Breaks</h3>
                    <button
                      type="button"
                      onClick={addBreak}
                      className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-4 py-2 rounded-lg flex items-center gap-2 text-white"
                    >
                      <Plus className="w-4 h-4" /> Add Break
                    </button>
                  </div>

                  {rateForm.breaks.map((brk, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-[#1A2A4A] rounded-lg">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white">Break Type</label>
                        <select
                          value={brk.breakType}
                          onChange={e => updateBreak(index, "breakType", e.target.value)}
                          className="w-full px-3 py-2 bg-[#2D4D8B] border-2 border-black rounded text-white text-sm focus:border-white focus:outline-none"
                        >
                          <option value="WEIGHT">Weight (kg)</option>
                          <option value="DISTANCE">Distance (km)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white">From</label>
                        <input
                          type="number"
                          value={brk.fromValue}
                          onChange={e => updateBreak(index, "fromValue", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-[#2D4D8B] border-2 border-black rounded text-white text-sm focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white">To (optional)</label>
                        <input
                          type="number"
                          value={brk.toValue || ""}
                          onChange={e => updateBreak(index, "toValue", e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 bg-[#2D4D8B] border-2 border-black rounded text-white text-sm focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={brk.amount}
                          onChange={e => updateBreak(index, "amount", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-[#2D4D8B] border-2 border-black rounded text-white text-sm focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeBreak(index)}
                          className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white text-sm flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Validity & Constraints */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Valid From *</label>
                  <input
                    type="date"
                    value={rateForm.validFrom}
                    onChange={e => setRateForm(prev => ({ ...prev, validFrom: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-[#11235d] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Valid To</label>
                  <input
                    type="date"
                    value={rateForm.validTo}
                    onChange={e => setRateForm(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#11235d] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Max Distance (km)</label>
                  <input
                    type="number"
                    value={rateForm.maxDistanceKm}
                    onChange={e => setRateForm(prev => ({ ...prev, maxDistanceKm: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#11235d] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Max Weight (kg)</label>
                  <input
                    type="number"
                    value={rateForm.maxWeightKg}
                    onChange={e => setRateForm(prev => ({ ...prev, maxWeightKg: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#11235d] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow text-white disabled:opacity-50"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  Create Rate
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ BULK IMPORT TAB ═══════════════════════════════════ */}
      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16">
          <div className="rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-2 border-white" style={cardGradient}>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Inland Rates
            </h2>

            <div className="bg-[#1A2A4A] rounded-lg p-6 mb-8" style={cardGradient}>
              <h4 className="text-lg font-semibold text-cyan-400 mb-3">JSON Format Example:</h4>
              <pre className="text-sm text-slate-300 overflow-x-auto">
{`{
  "zones": [
    {
      "country": "USA",
      "name": "California Central",
      "postalPrefixes": ["93", "94", "95"],
      "notes": "Central California region"
    }
  ],
  "rates": [
    {
      "zoneId": "zone-id-here",
      "portUnlocode": "USLAX",
      "direction": "IMPORT",
      "mode": "ROAD",
      "containerGroup": "DRY_STANDARD",
      "currency": "USD",
      "basis": "FLAT",
      "flatAmount": 250.00,
      "validFrom": "2025-08-01T00:00:00Z"
    }
  ]
}`}
              </pre>
            </div>

            <div className="text-center">
              <p className="text-slate-300 mb-4">Bulk import functionality would be implemented here</p>
              <button
                disabled
                className="bg-slate-600 px-8 py-4 rounded-lg text-slate-400 cursor-not-allowed"
              >
                Import (Coming Soon)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ RATES LIST TAB ═══════════════════════════════════ */}
      {activeTab === "rates-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <ListIcon className="text-cyan-400 w-8 h-8" /> Inland Rates
            </h2>

            {/* Filters */}
            <div className="bg-[#2e4972] rounded-lg border-4 border-black p-6 mb-8" style={cardGradient}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Zone</label>
                  <select
                    value={filters.zoneId}
                    onChange={e => setFilters(f => ({ ...f, zoneId: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Zones</option>
                    {allZones.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Port</label>
                  <select
                    value={filters.portUnlocode}
                    onChange={e => setFilters(f => ({ ...f, portUnlocode: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Ports</option>
                    {allPorts.map(port => (
                      <option key={port.unlocode} value={port.unlocode}>
                        {port.unlocode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Direction</label>
                  <select
                    value={filters.direction}
                    onChange={e => setFilters(f => ({ ...f, direction: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Directions</option>
                    {Object.values(InlandDirection).map(dir => (
                      <option key={dir} value={dir}>{dir}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Mode</label>
                  <select
                    value={filters.mode}
                    onChange={e => setFilters(f => ({ ...f, mode: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Modes</option>
                    {Object.values(InlandMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Container Group</label>
                  <select
                    value={filters.containerGroup}
                    onChange={e => setFilters(f => ({ ...f, containerGroup: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Groups</option>
                    {Object.values(ContainerGroup).map(group => (
                      <option key={group} value={group}>{getGroupLabel(group)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setFilters({ zoneId: "", portUnlocode: "", direction: "", mode: "", containerGroup: "" });
                    fetchRates(1);
                  }}
                  className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg flex items-center gap-2 text-white uppercase text-sm shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  <Filter className="w-4 h-4" /> Clear
                </button>
              </div>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8 text-cyan-400" />
              </div>
            ) : allRates.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No rates found</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allRates.map(rate => (
                    <div
                      key={rate.id}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group cursor-pointer"
                      style={cardGradient}
                      onClick={() => openEditRate(rate)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          {getModeIcon(rate.mode)}
                          <span className="text-sm font-mono text-cyan-400">{rate.mode}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getGroupColor(rate.containerGroup)}`}>
                          {getGroupLabel(rate.containerGroup)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Zone:</span>
                          <span className="font-mono text-white">{rate.zone?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Port:</span>
                          <span className="font-mono text-white">{rate.portUnlocode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Direction:</span>
                          <span className={`font-mono ${rate.direction === 'IMPORT' ? 'text-green-400' : 'text-orange-400'}`}>
                            {rate.direction}
                          </span>
                        </div>
                        
                        <div className="border-t border-slate-600 pt-2 mt-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-400">Basis:</span>
                            <span className="text-white">{rate.basis}</span>
                          </div>
                          {rate.basis === "FLAT" && rate.flatAmount && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Amount:</span>
                              <span className="text-white font-bold">{rate.currency} {Number(rate.flatAmount).toFixed(2)}</span>
                            </div>
                          )}
                          {rate.basis === "PER_KM" && rate.perKmAmount && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Per KM:</span>
                              <span className="text-white font-bold">{rate.currency} {Number(rate.perKmAmount).toFixed(2)}</span>
                            </div>
                          )}
                          {rate.basis === "BREAKS" && rate.breaks && (
                            <div className="text-white">
                              <span className="text-slate-400">Breaks:</span> {rate.breaks.length}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-white/80 border-t border-slate-600 pt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>From: {new Date(rate.validFrom).toLocaleDateString()}</span>
                        </div>
                        {rate.validTo && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>To: {new Date(rate.validTo).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-2 text-cyan-400 transition-opacity">
                        <Edit3 className="w-4 h-4" /> Click to edit
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage <= 1}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-white"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ EDIT ZONE MODAL ═══════════════════════════════════ */}
      {editZoneModalOpen && selectedZone && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div
            className="bg-[#121c2d] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-white uppercase"
            style={cardGradient}
          >
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 /> Edit Zone: {selectedZone.name}
              </h3>
              <button onClick={() => setEditZoneModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </header>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Country</label>
                  <input
                    type="text"
                    value={editZoneForm.country}
                    onChange={e => setEditZoneForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Zone Name</label>
                  <input
                    type="text"
                    value={editZoneForm.name}
                    onChange={e => setEditZoneForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Postal Prefixes</label>
                <input
                  type="text"
                  value={editZoneForm.postalPrefixes}
                  onChange={e => setEditZoneForm(prev => ({ ...prev, postalPrefixes: e.target.value }))}
                  placeholder="93, 94, 95 (comma-separated)"
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Notes</label>
                <textarea
                  value={editZoneForm.notes}
                  onChange={e => setEditZoneForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none resize-none"
                />
              </div>
            </form>

            <footer className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setEditZoneModalOpen(false)}
                className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={updateZone}
                disabled={isUpdating}
                className="bg-[#600f9e] hover:bg-[#491174] py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                {isUpdating ? <Settings className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════ EDIT RATE MODAL ═══════════════════════════════════ */}
      {editRateModalOpen && selectedRate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div
            className="bg-[#121c2d] rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto text-white uppercase"
            style={cardGradient}
          >
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 /> Edit Rate: {selectedRate.zone?.name} → {selectedRate.portUnlocode}
              </h3>
              <button onClick={() => setEditRateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-6">
              {/* Basic Info (Read-only) */}
              <div className="bg-[#1A2A4A] rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4">Rate Information (Read-only)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Zone:</span>
                    <div className="font-mono text-white">{editRateForm.zone?.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Port:</span>
                    <div className="font-mono text-white">{editRateForm.portUnlocode}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Direction:</span>
                    <div className="font-mono text-white">{editRateForm.direction}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Mode:</span>
                    <div className="font-mono text-white">{editRateForm.mode}</div>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Currency</label>
                  <select
                    value={editRateForm.currency}
                    onChange={e => setEditRateForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Basis</label>
                  <select
                    value={editRateForm.basis}
                    onChange={e => setEditRateForm(prev => ({ ...prev, basis: e.target.value as "FLAT" | "PER_KM" | "BREAKS" }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="FLAT">Flat Rate</option>
                    <option value="PER_KM">Per Kilometer</option>
                    <option value="BREAKS">Rate Breaks</option>
                  </select>
                </div>

                {editRateForm.basis === "FLAT" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Flat Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editRateForm.flatAmount || ""}
                      onChange={e => setEditRateForm(prev => ({ ...prev, flatAmount: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                {editRateForm.basis === "PER_KM" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Per KM Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editRateForm.perKmAmount || ""}
                      onChange={e => setEditRateForm(prev => ({ ...prev, perKmAmount: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Minimum Charge</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRateForm.minCharge || ""}
                    onChange={e => setEditRateForm(prev => ({ ...prev, minCharge: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Valid From</label>
                  <input
                    type="date"
                    value={editRateForm.validFrom?.slice(0, 10) || ""}
                    onChange={e => setEditRateForm(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Valid To</label>
                  <input
                    type="date"
                    value={editRateForm.validTo?.slice(0, 10) || ""}
                    onChange={e => setEditRateForm(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Max Distance (km)</label>
                  <input
                    type="number"
                    value={editRateForm.maxDistanceKm || ""}
                    onChange={e => setEditRateForm(prev => ({ ...prev, maxDistanceKm: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Max Weight (kg)</label>
                  <input
                    type="number"
                    value={editRateForm.maxWeightKg || ""}
                    onChange={e => setEditRateForm(prev => ({ ...prev, maxWeightKg: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>
              </form>

              {/* Rate Breaks (if basis is BREAKS) */}
              {editRateForm.basis === "BREAKS" && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Rate Breaks</h4>
                  {editRateForm.breaks && editRateForm.breaks.length > 0 ? (
                    <div className="space-y-2">
                      {editRateForm.breaks.map((brk, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-[#1A2A4A] rounded-lg">
                          <div>
                            <span className="text-xs text-slate-400">Type:</span>
                            <div className="text-white">{brk.breakType}</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400">From:</span>
                            <div className="text-white">{brk.fromValue}</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400">To:</span>
                            <div className="text-white">{brk.toValue || "∞"}</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400">Amount:</span>
                            <div className="text-white">{editRateForm.currency} {Number(brk.amount).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400">No rate breaks defined</div>
                  )}
                </div>
              )}
            </div>

            <footer className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setEditRateModalOpen(false)}
                className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={updateRate}
                disabled={isUpdating}
                className="bg-[#600f9e] hover:bg-[#491174] py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                {isUpdating ? <Settings className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}