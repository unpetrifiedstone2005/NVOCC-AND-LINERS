"use client";
import React, { useState, useEffect } from "react";
import {
  DollarSign,
  MapPin,
  Ship,
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
  Calendar,
  Filter,
  FileText,
  Download
} from "lucide-react";

import axios from "axios";

// --- TYPES & ENUMS --------------------------------------------------------
enum ContainerGroup {
  DRY_STANDARD = "DRY_STANDARD",
  REEFER = "REEFER",
  OPEN_TOP = "OPEN_TOP",
  FLAT_RACK = "FLAT_RACK",
  TANK = "TANK"
}

interface ServiceSchedule {
  code: string;
  description?: string;
}

interface ContainerType {
  isoCode: string;
  name: string;
  group: ContainerGroup;
}

interface Tariff {
  serviceCode: string;
  pol: string; // port-of-loading UN/LOCODE
  pod: string; // port-of-discharge UN/LOCODE
  commodity: string;
  group: ContainerGroup;
  validFrom: string;
  validTo?: string;
  service?: ServiceSchedule;
  rates?: Record<string, string>; // per-container-type rates
}



// --- STYLES ---------------------------------------------------------------
const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%,#0A1A2F 15%,#22D3EE 100%)
  `,
  backgroundBlendMode: "overlay"
};

// --- COMPONENT ------------------------------------------------------------
export function TariffsComponent() {
  

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "create-tariff" | "bulk-import" | "tariff-list"
  >("create-tariff");

  // Forms & data
  const [tariffForm, setTariffForm] = useState<Tariff>({
    serviceCode: "",
    pol: "",
    pod: "",
    commodity: "FAK",
    group: ContainerGroup.DRY_STANDARD,
    validFrom: new Date().toISOString().split("T")[0],
    rates: {}
  });

  const [bulkData, setBulkData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea" | "file">("textarea");

  const [allTariffs, setAllTariffs] = useState<Tariff[]>([]);
  const [allServices, setAllServices] = useState<ServiceSchedule[]>([]);
  const [allContainerTypes, setAllContainerTypes] = useState<
    ContainerType[]
  >([]);
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
  const [selected, setSelected] = useState<Tariff | null>(null);
  const [editForm, setEditForm] = useState<Tariff>({} as Tariff);

  // Loading & messages
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- HELPERS -------------------------------------------------------------
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getGroupLabel = (group: ContainerGroup) => {
    switch (group) {
      case ContainerGroup.DRY_STANDARD:
        return "Dry Standard";
      case ContainerGroup.REEFER:
        return "Reefer";
      case ContainerGroup.OPEN_TOP:
        return "Open Top";
      case ContainerGroup.FLAT_RACK:
        return "Flat Rack";
      case ContainerGroup.TANK:
        return "Tank";
      default:
        return group;
    }
  };

  const getGroupColor = (group: ContainerGroup) => {
    switch (group) {
      case ContainerGroup.DRY_STANDARD:
        return "bg-blue-900/30 text-blue-400";
      case ContainerGroup.REEFER:
        return "bg-green-900/30 text-green-400";
      case ContainerGroup.OPEN_TOP:
        return "bg-orange-900/30 text-orange-400";
      case ContainerGroup.FLAT_RACK:
        return "bg-purple-900/30 text-purple-400";
      case ContainerGroup.TANK:
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-gray-900/30 text-gray-400";
    }
  };

  // --- CRUD / FETCH --------------------------------------------------------

    async function createTariff(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Transform your `rates` map → array of { containerType, amount }
      const ratesArray = Object.entries(tariffForm.rates ?? {})
        .map(([containerType, amtStr]) => ({
          containerType,
          amount: parseFloat(amtStr),
        }))
        .filter(r => !isNaN(r.amount)); // drop any invalid

      // 2️⃣ Build the payload to match your POST schema
      const payload = {
        serviceCode: tariffForm.serviceCode,
        commodity:   tariffForm.commodity,
        pol:         tariffForm.pol,
        pod:         tariffForm.pod,
        group:       tariffForm.group,
        validFrom:   tariffForm.validFrom + "T00:00:00.000Z",
        validTo:     tariffForm.validTo
                       ? tariffForm.validTo + "T00:00:00.000Z"
                       : undefined,
        rates:       ratesArray,
      };

      // 3️⃣ POST to your API
      await axios.post("/api/seed/tariffs/post", payload);

      showMessage("success", "Tariff created successfully");
      // 4️⃣ reset form
       setTariffForm({
        serviceCode: "",
        pol: "",
        pod: "",
        commodity: "FAK",
        group: ContainerGroup.DRY_STANDARD,
        validFrom: new Date().toISOString().split("T")[0],
        rates: {}
      });

    } catch (err: any) {
      console.error("createTariff error:", err);
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create tariff";
      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ── 0️⃣ Fetch the "master" list of valid container isoCodes
      const {
        data: { items: containerTypes },
      } = await axios.get<{ items: Array<{ isoCode: string }> }>(
        "/api/seed/containers/types/get"
      );
      const validCodes = new Set(containerTypes.map((c) => c.isoCode));

      // ── 1️⃣ Define, per‐group, what suffixes are allowed
      //     Feel free to tweak these regexes if your naming differs
      const groupRegex: Record<ContainerGroup, RegExp> = {
        REEFER:      /RF$/,
        OPEN_TOP:    /T$/,        // matches "40T"
        FLAT_RACK:   /FR$/,
        TANK:        /TK$/,
        DRY_STANDARD:/(GP|HC|STD)$/,
      };

      // ── 2️⃣ Read & parse the raw JSON (textarea or file)
      let raw = bulkData;
      if (bulkMode === "file" && uploadedFile) {
        raw = await uploadedFile.text();
      }
      const parsed = JSON.parse(raw);
      const batch = Array.isArray(parsed) ? parsed : [parsed];

      // ── 3️⃣ Check for any containerType that doesn't exist at all
      const unknown: string[] = [];
      batch.forEach((t) => {
        if (!Array.isArray(t.rates)) return;
        t.rates.forEach((r: any) => {
          if (!validCodes.has(r.containerType)) {
            unknown.push(r.containerType);
          }
        });
      });
      if (unknown.length > 0) {
        const list = Array.from(new Set(unknown)).join(", ");
        showMessage("error", `Unknown container types: ${list}. Import aborted.`);
        return;
      }

      // ── 4️⃣ Check for any containerType that doesn't match its group
      const mismatches: string[] = [];
      batch.forEach((t) => {
        if (!Array.isArray(t.rates)) return;
        const regex = groupRegex[t.group as ContainerGroup];
        t.rates.forEach((r: any) => {
          if (!regex.test(r.containerType)) {
            mismatches.push(`${r.containerType} (not valid for ${t.group})`);
          }
        });
      });
      if (mismatches.length > 0) {
        const list = Array.from(new Set(mismatches)).join(", ");
        showMessage(
          "error",
          `Invalid container-type↔group combos: ${list}. Import aborted.`
        );
        return;
      }

      // ── 5️⃣ All checks passed! Send to your bulk endpoint
      await axios.post(
        "/api/seed/tariffs/post",
        batch.length > 1 ? batch : batch[0]
      );

      // ── 6️⃣ Success
      showMessage(
        "success",
        `Successfully imported ${batch.length} tariff${
          batch.length > 1 ? "s" : ""
        }`
      );
      setBulkData("");
      setUploadedFile(null);

    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        console.error("Payload validation errors:", err.response.data);
        showMessage(
          "error",
          `Import failed: ${JSON.stringify(err.response.data)}`
        );
      } else {
        showMessage("error", "Failed to import bulk data");
      }
    } finally {
      setIsLoading(false);
    }
  }




  function downloadSample() {
    const sample = [
      {
        serviceCode: "WAX",
        pol: "USNYC",
        pod: "DEHAM",
        commodity: "FAK",
        group: "DRY_STANDARD",
        validFrom: "2024-01-01",
        validTo: "2024-12-31",
        rates: { "20GP": "1250.00", "40GP": "2500.00" }
      }
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tariff-sample.json";
    a.click();
  }

  async function fetchTariffs(page = 1) {
    setIsLoadingList(true);
    try {
      console.log("Fetching tariffs...");
      // TODO: GET from API
      setAllTariffs([]);
      setTotalPages(1);
    } catch {
      showMessage("error", "Failed to fetch tariffs");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function fetchServices(page = 1, limit = 20, filters = {}) {
  try {
    // Build query string from filters
    const params = new URLSearchParams({
      page:  String(page),
      limit: String(limit),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "")
      )
    }).toString();

    const res = await fetch(`/api/seed/serviceschedules/get?${params}`);
    if (!res.ok) throw new Error("Failed to fetch service schedules");

    const { items, total, totalPages, currentPage } = await res.json();

    setAllServices(items); // Set the result (matches your allServices state)
    // Optionally update pagination state if you track it
    // setTotalServices(total);
    // setTotalPages(totalPages);
    // setCurrentPage(currentPage);

    return items;
  } catch (error) {
    console.error("Failed to fetch services:", error);
    setAllServices([]); // fallback to empty if fetch fails
    return [];
  }
}


async function fetchContainerTypes(group?: ContainerGroup) {
  try {
    const params = new URLSearchParams();
    if (group) params.set("group", group);
    const res = await fetch(`/api/seed/containers/types/get?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch container types");
    const { items } = await res.json();
    setAllContainerTypes(items);
  } catch {
    setAllContainerTypes([]);
  }
}

  async function applyEdit() {
    setIsUpdating(true);
    try {
      console.log("Updating tariff:", editForm);
      // TODO: PATCH to API
      showMessage("success", "Tariff updated successfully");
      setEditModalOpen(false);
      fetchTariffs(currentPage);
    } catch {
      showMessage("error", "Failed to update tariff");
    } finally {
      setIsUpdating(false);
    }
  }

  // --- FILTERS, MODALS -----------------------------------------------------
  function applyFilters() {
    fetchTariffs(1);
  }
  function clearFilters() {
    setFilters({ serviceCode: "", pol: "", pod: "", commodity: "", group: "" });
    fetchTariffs(1);
  }

  function openEdit(t: Tariff) {
    setSelected(t);
    setEditForm(t);
    setEditModalOpen(true);
  }
  function closeEdit() {
    setEditModalOpen(false);
    setSelected(null);
  }

  // --- LIFECYCLE -----------------------------------------------------------
  useEffect(() => {
    fetchServices();
    fetchContainerTypes(tariffForm.group);
  }, []);

  useEffect(() => {
  // whenever the selected group changes, re-fetch
  fetchContainerTypes(tariffForm.group);
  }, [tariffForm.group]);

  useEffect(() => {
    if (activeTab === "tariff-list") fetchTariffs(currentPage);
    
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
        <div
          className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-900/30 border border-green-400 text-green-400"
              : "bg-red-900/30 border border-red-400 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}{" "}
          {message.text}
        </div>
      )}

      {/* TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              key: "create-tariff",
              icon: <Plus className="w-5 h-5" />,
              label: "Create Tariff"
            },
            {
              key: "bulk-import",
              icon: <Upload className="w-5 h-5" />,
              label: "Bulk Import"
            },
            {
              key: "tariff-list",
              icon: <List className="w-5 h-5" />,
              label: "Tariff List"
            }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-1 py-2 uppercase font-bold transition shadow border-2 border-black flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? "bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0_rgba(0,0,0,1)]"
                  : "bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white rounded-lg shadow-[4px_4px_0_rgba(0,0,0,1)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CREATE TARIFF */}
      {activeTab === "create-tariff" && (
        <section className="px-6 md:px-16 mb-16">
          <div
            className="border-2 border-white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <DollarSign className="text-cyan-400 w-8 h-8" /> Create Tariff Rate
            </h2>
            <form
              onSubmit={createTariff}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Service Code */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Service Code *
                </label>
                <select
                  value={tariffForm.serviceCode}
                  onChange={(e) =>
                    setTariffForm((prev) => ({
                      ...prev,
                      serviceCode: e.target.value
                    }))
                  }
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                >
                  <option value="">Select Service</option>
                  {allServices.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} – {s.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* POL */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Port of Loading (POL) *
                </label>
                <input
                  type="text"
                  value={tariffForm.pol}
                  onChange={(e) =>
                    setTariffForm((prev) => ({
                      ...prev,
                      pol: e.target.value.toUpperCase()
                    }))
                  }
                  placeholder="USNYC"
                  maxLength={5}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                />
              </div>

              {/* POD */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Port of Discharge (POD) *
                </label>
                <input
                  type="text"
                  value={tariffForm.pod}
                  onChange={(e) =>
                    setTariffForm((prev) => ({
                      ...prev,
                      pod: e.target.value.toUpperCase()
                    }))
                  }
                  placeholder="DEHAM"
                  maxLength={5}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                />
              </div>

              {/* Commodity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Commodity *
                </label>
                <input
                  type="text"
                  value={tariffForm.commodity}
                  onChange={(e) =>
                    setTariffForm((prev) => ({ ...prev, commodity: e.target.value }))
                  }
                  placeholder="FAK"
                  required
                  className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                         border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
                         mt-3 hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow rounded-lg text-white placeholder-white/80
                         focus:border-white focus:outline-none"
                />
              </div>

              {/* Container Group */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Container Group *
                </label>
                <select
                value={tariffForm.group}
                 onChange={e => {
                    const next = e.target.value as ContainerGroup;
                    setTariffForm(prev => ({ ...prev, group: next }));
                    fetchContainerTypes(next);
                      
                  }}
                  required
                  className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                         border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
                         mt-3 hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow rounded-lg text-white placeholder-white/80
                         focus:border-white focus:outline-none"
                >
                  {Object.values(ContainerGroup).map((g) => (
                    <option key={g} value={g}>
                      {getGroupLabel(g)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rates per Container Type */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-white">
                  Rates per Container Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 ">
                  {allContainerTypes
                    .filter(ct => ct.group === tariffForm.group)
                    .map((ct) => (
                    <div key={ct.isoCode} className="flex flex-col">
                      <span className="font-bold text-white mb-1">{ct.name}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={tariffForm.rates?.[ct.isoCode] || ""}
                        onChange={(e) =>
                          setTariffForm((prev) => ({
                            ...prev,
                            rates: {
                              ...prev.rates,
                              [ct.isoCode]: e.target.value
                            }
                          }))
                        }
                        placeholder="0.00"
                        className="px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                          border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
                          hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow
                          rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Valid From */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Valid From *
                </label>
                <input
                  type="date"
                  value={tariffForm.validFrom}
                  onChange={(e) =>
                    setTariffForm((prev) => ({
                      ...prev,
                      validFrom: e.target.value
                    }))
                  }
                  required
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a]
                         shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow border border-black border-4 rounded-lg text-white mt-3
                         focus:border-white focus:outline-none"
                />
              </div>

              {/* Valid To */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Valid To</label>
                <input
                  type="date"
                  value={tariffForm.validTo || ""}
                  onChange={(e) =>
                    setTariffForm((prev) => ({
                      ...prev,
                      validTo: e.target.value
                    }))
                  }
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a]
                         shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow border border-black border-4 rounded-lg text-white mt-3
                         focus:border-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? (
                    <Settings className="animate-spin w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Create Tariff
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* BULK IMPORT */}
      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16">
          <div
            className="rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-2 border-white"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Tariffs
            </h2>

            {/* Mode Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setBulkMode("file")}
                className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all ${
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
                className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all ${
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
                className="bg-[#2a72dc] hover:bg-[#00FFFF] hover:text-black px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Download className="w-5 h-5" /> Download Sample JSON
              </button>
              <p className="text-md text-slate-200 mt-5">
                Download a <b>full example</b> covering tariffs and their per‐container rates.
              </p>
            </div>

            <form onSubmit={importBulk} className="space-y-6">
              {bulkMode === "file" ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Select JSON File *
                  </label>
                  <div className="border-2 border-dashed border-white rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
                    <input
                      id="tariff-file"
                      type="file"
                      accept=".json"
                      required
                      className="hidden"
                      onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}
                    />
                    <label htmlFor="tariff-file" className="cursor-pointer flex flex-col items-center gap-4">
                      <Upload className="w-16 h-16 text-slate-400" />
                      <p className="text-lg font-semibold text-white">Click to upload JSON file</p>
                      <p className="text-sm text-slate-400">or drag and drop</p>
                    </label>
                  </div>
                  <p className="text-xs font-bold text-white">
                    File must be an array of tariff records with their container‐type rates.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    JSON Data *
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-[#0A1A2F] border border-white/80 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:border-cyan-400 focus:outline-none whitespace-pre-wrap"
                    rows={12}
                    placeholder={`[
        {
          "serviceCode": "WAX",
          "pol": "CNSHA",
          "pod": "SGSIN",
          "commodity": "FAK",
          "group": "DRY_STANDARD",
          "rates": {
            "20GP": "100.00",
            "40GP": "180.00"
          },
          "validFrom": "2025-08-01T00:00:00Z"
        }
      ]`}
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                    required
                  />
                  <p className="text-md font-bold text-white">
                    Paste an array of tariffs, each with a `"rates"` object mapping container‐types to amounts.
                  </p>
                </div>
              )}

              <div
                className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600 mt-4"
                style={cardGradient}
              >
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">
                  JSON Format:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-bold text-white">
                  <div>• serviceCode (required)</div>
                  <div>• pol (required)</div>
                  <div>• pod (required)</div>
                  <div>• commodity (required)</div>
                  <div>• group (required: DRY_STANDARD, REEFER…)</div>
                  <div>• validFrom (ISO datetime)</div>
                  <div>• validTo (optional ISO datetime)</div>
                  <div className="col-span-2 md:col-span-3 mt-3">
                    • rates (array, required):
                  </div>
                  <div>— &quot;20GP&quot;: &quot;100.00&quot;</div>
                  <div>— &quot;40HC&quot;: &quot;180.00&quot;</div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow text-white"
                >
                  {isLoading ? (
                    <Settings className="animate-spin w-5 h-5" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  Import
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* TARIFF LIST */}
      {activeTab === "tariff-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="bg-[#121c2d] rounded-3xl p-8" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <List className="text-cyan-400 w-8 h-8" /> Tariff Rates
            </h2>

            {/* Filters */}
            <div className="bg-[#1A2A4A] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.serviceCode}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, serviceCode: e.target.value }))
                }
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              >
                <option value="">All Services</option>
                {allServices.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="POL (e.g. USNYC)..."
                value={filters.pol}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, pol: e.target.value }))
                }
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="POD (e.g. DEHAM)..."
                value={filters.pod}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, pod: e.target.value }))
                }
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              />
              <select
                value={filters.group}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, group: e.target.value }))
                }
                className="px-4 py-2 bg-[#0A1A2F] border border-slate-600 rounded-lg text-white"
              >
                <option value="">All Groups</option>
                {Object.values(ContainerGroup).map((g) => (
                  <option key={g} value={g}>
                    {getGroupLabel(g)}
                  </option>
                ))}
              </select>
              <button
                onClick={applyFilters}
                className="bg-[#600f9e] py-2 px-6 rounded-lg flex items-center gap-2 text-white"
              >
                <Search className="w-4 h-4" />
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="bg-[#2a72dc] py-2 px-6 rounded-lg flex items-center gap-2 text-white"
              >
                <Filter className="w-4 h-4" />
                Clear
              </button>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8 text-cyan-400" />
              </div>
            ) : allTariffs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No tariffs found</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allTariffs.map((tariff) => (
                    <div
                      key={`${tariff.serviceCode}-${tariff.pol}-${tariff.pod}-${tariff.commodity}-${tariff.group}-${tariff.validFrom}`}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group cursor-pointer"
                      style={cardGradient}
                      onClick={() => openEdit(tariff)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-cyan-400">
                            {tariff.serviceCode}
                          </h3>
                          <p className="text-sm text-slate-300">
                            {tariff.service?.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${getGroupColor(
                            tariff.group
                          )}`}
                        >
                          {getGroupLabel(tariff.group)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="text-slate-400">Route:</span>
                          <span className="font-mono">
                            {tariff.pol} → {tariff.pod}
                          </span>
                        </div>
                        <p>
                          <span className="text-slate-400">Commodity:</span>{" "}
                          {tariff.commodity}
                        </p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          <span className="text-2xl font-bold text-yellow-400">
                            {tariff.rates
                              ? Object.entries(tariff.rates)
                                  .map(([iso, amt]) => `${amt}/${iso}`)
                                  .join(", ")
                              : `${tariff.validFrom}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 border-t border-slate-600 pt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            From: {new Date(tariff.validFrom).toLocaleDateString()}
                          </span>
                        </div>
                        {tariff.validTo && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              To: {new Date(tariff.validTo).toLocaleDateString()}
                            </span>
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
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage <= 1}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
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

      {/* EDIT MODAL */}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div
            className="bg-[#121c2d] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={cardGradient}
          >
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 /> Edit Tariff {selected.serviceCode}
              </h3>
              <button onClick={closeEdit} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </header>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Rate Per Container Type
                </label>
                {/* For brevity, just editing one rate field here */}
                <input
                  type="text"
                  value={
                    selected.rates
                      ? Object.entries(selected.rates)
                          .map(([iso, amt]) => `${iso}:${amt}`)
                          .join(", ")
                      : ""
                  }
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      rates: { ...prev.rates, CUSTOM: e.target.value }
                    }))
                  }
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Valid From</label>
                <input
                  type="date"
                  value={editForm.validFrom || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, validFrom: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-[#1A2A4A] border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Valid To</label>
                <input
                  type="date"
                  value={editForm.validTo || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, validTo: e.target.value }))
                  }
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
                className="bg-[#600f9e] hover:bg-[#491174] py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 text-white"
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
