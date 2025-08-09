// File: components/pages/Seedpages/TariffsComponent.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Ship,
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
  Download
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

interface ServiceSchedule {
  id: string;
  code: string;
  description?: string;
}

interface Voyage {
  id: string;
  voyageNumber: string;
  departure:    string;  // ISO datetime
  arrival:      string;
}

interface ApiTariff {
  id:          string;
  scheduleId:  string;
  voyageId:    string;
  serviceCode: string;          // still there
  commodity:   string;
  group:       ContainerGroup;
  validFrom:   string;
  validTo?:    string;
  rates:       TariffRate[];
  schedule: {                     // relation pulled in via Prisma include
    code:        string;
    description?: string;
  };
  voyage: {
    voyageNumber: string;
  };
}

interface ContainerType {
  isoCode: string;
  name: string;
  group: ContainerGroup;
}

interface TariffRate {
  id: string;
  containerType: string;
  amount: number;
}

interface Tariff {
  serviceCode: string;    // schedule code
  voyageId:    string;
  commodity:   string;
  group:       ContainerGroup;
  validFrom:   string;    // ISO “YYYY-MM-DD…”
  validTo?:    string;
  rates:       TariffRate[];
  service?:    { code: string; description?: string };
  
}

interface TariffForm {
  scheduleId: string;     // PK of the schedule
  voyageId:   string;     // PK of the voyage
  commodity:  string;
  group:      ContainerGroup;
  validFrom:  string;     // “YYYY-MM-DD”
  validTo?:   string;     // “YYYY-MM-DD”
  rates: Array<{
    containerType: string;
    amount:        number;
  }>;
}

interface ApiTariff {
  id:          string;
  scheduleId:  string;
  voyageId:    string;
  serviceCode: string;
  commodity:   string;
  group:       ContainerGroup;
  validFrom:   string;
  validTo?:    string;
  rates:       TariffRate[];
  schedule: { code: string; description?: string };
  voyage:   { voyageNumber: string };
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

export function TariffsComponent() {
  // ──────────────────────────────────────────────────────
  // TAB STATE
  // ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] =
    useState<"create-tariff" | "bulk-import" | "tariff-list">("create-tariff");

  // ──────────────────────────────────────────────────────
  // FORM & DATA STATE
  // ──────────────────────────────────────────────────────
  const [tariffForm, setTariffForm] = useState<TariffForm>({
    scheduleId: "",
    voyageId:   "",
    commodity:  "",
    group:      ContainerGroup.DRY_STANDARD,
    validFrom:  new Date().toISOString().slice(0, 10),
    validTo:    undefined,
    rates:      []
  });

  const [allServices, setAllServices]       = useState<ServiceSchedule[]>([]);
  const [allVoyages,  setAllVoyages]        = useState<Voyage[]>([]);
  const [allContainerTypes, setAllContainerTypes] =
    useState<ContainerType[]>([]);

  const [allTariffs, setAllTariffs]   = useState<ApiTariff[]>([]);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);

  const [filters, setFilters] = useState<{
    serviceCode: string;
    voyageId:    string;
    commodity:   string;
    group:       string;
  }>({
    serviceCode: "",
    voyageId:    "",
    commodity:   "",
    group:       ""
  });

  // edit-modal:
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selected,      setSelected]      = useState<ApiTariff | null>(null);
  const [editForm,      setEditForm]      = useState<Tariff>({} as Tariff);

  // loading & messages:
  const [isLoading,     setIsLoading]     = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUpdating,    setIsUpdating]    = useState(false);
  const [message,       setMessage]       = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);


  const [bulkMode,      setBulkMode]    = useState<"textarea"|"file">("textarea");
  const [bulkData,      setBulkData]    = useState<string>("");
  const [uploadedFile,  setUploadedFile]= useState<File|null>(null);

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
      case ContainerGroup.REEFER:       return "Reefer";
      case ContainerGroup.OPEN_TOP:     return "Open Top";
      case ContainerGroup.FLAT_RACK:    return "Flat Rack";
      case ContainerGroup.TANK:         return "Tank";
    }
  };

  const getGroupColor = (g: ContainerGroup) => {
    switch (g) {
      case ContainerGroup.DRY_STANDARD: return "bg-blue-900/30 text-blue-400";
      case ContainerGroup.REEFER:       return "bg-green-900/30 text-green-400";
      case ContainerGroup.OPEN_TOP:     return "bg-orange-900/30 text-orange-400";
      case ContainerGroup.FLAT_RACK:    return "bg-purple-900/30 text-purple-400";
      case ContainerGroup.TANK:         return "bg-red-900/30 text-red-400";
    }
    return "bg-gray-900/30 text-gray-400";
  };

  // ──────────────────────────────────────────────────────
  // FETCHERS / CRUD
  // ──────────────────────────────────────────────────────

  // ▶ fetch all schedules
  async function fetchSchedules() {
    try {
      const res = await fetch("/api/seed/serviceschedules/get?limit=100");
      if (!res.ok) throw new Error();
      const { items } = await res.json();
      // assume each item: { id, code, description }
      setAllServices(items);
    } catch {
      setAllServices([]);
    }
  }

  // ▶ fetch all container-types for a group
  async function fetchContainerTypes(group: ContainerGroup) {
    try {
      const params = new URLSearchParams();
      params.set("group", group);
      const res = await fetch(`/api/seed/containers/types/get?${params}`);
      if (!res.ok) throw new Error();
      const { items } = await res.json();
      setAllContainerTypes(items);
    } catch {
      setAllContainerTypes([]);
    }
  }

  // ▶ fetch voyages under a schedule
// inside TariffsComponent
async function fetchVoyages(scheduleId: string) {
  // clear out old ones if no schedule
  if (!scheduleId) {
    setAllVoyages([]);
    return;
  }
  try {
    // note: adjust the response type if your API returns { items } instead of { voyages }
    const { data } = await axios.get<{
      voyages: Voyage[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>(
      `/api/seed/serviceschedules/${encodeURIComponent(scheduleId)}/voyages/get`,
      { params: { includeService: true } }
    );
    // populate your dropdown
    setAllVoyages(data.voyages);
  } catch (err) {
    console.error("fetchVoyages error:", err);
    setAllVoyages([]);
  }
}


  // ▶ create one tariff
    async function createTariff(e: React.FormEvent) {
      e.preventDefault();
      setIsLoading(true);

      // 1) get the selected schedule & voyage objects
      const svc = allServices.find(s => s.id === tariffForm.scheduleId);
      const voy = allVoyages .find(v => v.id === tariffForm.voyageId);
      if (!svc || !voy) {
        showMessage("error", "Please select a valid schedule and voyage");
        setIsLoading(false);
        return;
      }

      // 2) build payload matching your new schema
      const payload = {
        serviceCode:  svc.code,
        voyageNumber: voy.voyageNumber,
        commodity:    tariffForm.commodity,
        group:        tariffForm.group,
        validFrom:    tariffForm.validFrom + "T00:00:00.000Z",
        validTo:      tariffForm.validTo
                        ? tariffForm.validTo + "T00:00:00.000Z"
                        : undefined,
        rates:        tariffForm.rates.map(r => ({
                        containerType: r.containerType,
                        amount:        r.amount
                      }))
      };

      try {
        // 3) post to the new route
        await axios.post("/api/seed/tariffs/post", payload);

        showMessage("success", "Tariff created successfully");

        // reset form
        setTariffForm({
          scheduleId: "",
          voyageId:   "",
          commodity:  "FAK",
          group:      ContainerGroup.DRY_STANDARD,
          validFrom:  new Date().toISOString().slice(0, 10),
          validTo:    undefined,
          rates:      []
        });
        setAllVoyages([]);
      } catch (err: any) {
        let raw = err.response?.data?.error;
        let msg = typeof raw === "string"
          ? raw
          : Array.isArray(raw)
            ? raw.map((e: any)=>e.message||JSON.stringify(e)).join("; ")
            : JSON.stringify(raw) || "Failed to create tariff";
        showMessage("error", msg);
      } finally {
        setIsLoading(false);
      }
    }



  // ▶ fetch the paginated list of tariffs
  async function fetchTariffs(page = 1) {
    setIsLoadingList(true);
    try {
      const params = {
        page:  String(page),
        limit: "20",   // ← use "limit" to override the default page size
        ...(filters.serviceCode && { serviceCode: filters.serviceCode }),
        ...(filters.voyageId    && { voyageId:    filters.voyageId   }),
        ...(filters.commodity   && { commodity:   filters.commodity  }),
        ...(filters.group       && { group:       filters.group      }),
      };

      const res = await axios.get<{
        items:       ApiTariff[];
        total:       number;
        currentPage: number;
        totalPages:  number;
      }>("/api/seed/tariffs/get", { params });

      setAllTariffs(res.data.items);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);

    } catch (err) {
      console.error("fetchTariffs error:", err);
      showMessage("error", "Failed to fetch tariffs");
    } finally {
      setIsLoadingList(false);
    }
  }


  // ▶ apply edits from the modal
async function applyEdit() {
  if (!selected) return;
  setIsUpdating(true);
  try {
    // build payload exactly as our patch route expects
    const payload = {
      validFrom: editForm.validFrom,                 // “YYYY-MM-DD”
      validTo:   editForm.validTo ?? null,           // or null
      rates:     editForm.rates.map(r => ({          // array of {containerType,amount}
        containerType: r.containerType,
        amount:        r.amount,
      })),
    };

    // PATCH by the tariff record’s id
    await axios.patch(
      `/api/seed/tariffs/${selected.id}/patch`,
      payload
    );

    showMessage("success", "Tariff updated successfully");
    setEditModalOpen(false);
    fetchTariffs(currentPage);
  } catch (err: any) {
    // show the error message returned by your API if there is one
    const msg = err.response?.data?.error || "Failed to update tariff";
    showMessage("error", msg);
  } finally {
    setIsUpdating(false);
  }
}


  async function importBulk(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ─── 1) parse JSON (file or textarea) ────────────────────────
      let raw = bulkData;
      if (bulkMode === "file" && uploadedFile) {
        raw = await uploadedFile.text();
      }
      const parsed = JSON.parse(raw);
      const batch  = Array.isArray(parsed) ? parsed : [parsed];

      // ─── 2) fetch *all* valid codes (for unknown vs mismatch) ───
      const allCodes = new Set<string>();
      await Promise.all(
        Object.values(ContainerGroup).map(async (g) => {
          const { data: { items } } = await axios.get<{
            items: { isoCode: string }[]
          }>(`/api/seed/containers/types/get?group=${g}`);
          items.forEach(i => allCodes.add(i.isoCode));
        })
      );

      // ─── 3) regex for group→container‐type combos ───────────────
      const groupRegex: Record<ContainerGroup, RegExp> = {
        REEFER:       /RF$/,
        OPEN_TOP:     /T$/,
        FLAT_RACK:    /FR$/,
        TANK:         /TK$/,
        DRY_STANDARD: /(HC|STD)$/
      };

      // ─── 4) UNKNOWN check: not in *any* group’s codes ───────────
      const unknown: string[] = [];
      batch.forEach((t: any) => {
        t.rates.forEach((r: any) => {
          if (!allCodes.has(r.containerType)) {
            unknown.push(r.containerType);
          }
        });
      });
      if (unknown.length) {
        showMessage(
          "error",
          `Unknown container types: ${[...new Set(unknown)].join(", ")}`
        );
        return;
      }

      // ─── 5) MISMATCH check: exists but fails the group regex ────
      const mismatches: string[] = [];
      batch.forEach((t: any) => {
        const rx = groupRegex[t.group as ContainerGroup];
        t.rates.forEach((r: any) => {
          if (!rx.test(r.containerType)) {
            mismatches.push(`${r.containerType} (not valid for ${t.group})`);
          }
        });
      });
      if (mismatches.length) {
        showMessage(
          "error",
          `Invalid combos: ${[...new Set(mismatches)].join(", ")}`
        );
        return;
      }

      // ─── 6) finally, send to your bulk‐import endpoint ────────────
      await axios.post(
        "/api/seed/tariffs/post",
        batch.length > 1 ? batch : batch[0]
      );

      showMessage(
        "success",
        `Imported ${batch.length} tariff${batch.length > 1 ? "s" : ""}`
      );
      setBulkData("");
      setUploadedFile(null);

    } catch (err: any) {
      console.error("importBulk error:", err);
      let msg: string;
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        msg =
          typeof data?.error === "string"
            ? data.error
            : JSON.stringify(data) || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = "Unexpected error importing tariffs";
      }
      showMessage("error", msg);
    } finally {
      setIsLoading(false);
    }
  }





  // ──────────────────────────────────────────────────────
  // MODAL OPEN/CLOSE HELPERS
  // ──────────────────────────────────────────────────────
  function openEdit(t: ApiTariff) {
    setSelected(t);
    setEditForm(t);
    setEditModalOpen(true);
    // re-fetch voyages for this tariff’s schedule
    const sched = allServices.find(s => s.code === t.serviceCode);
    if (sched) fetchVoyages(sched.id);
  }

  function closeEdit() {
    setEditModalOpen(false);
    setSelected(null);
  }

    function downloadSample() {
    const sample = [{
      serviceCode: "WAX",
      voyageId:    "123e4567-e89b-12d3-a456-426614174000",
      commodity:   "FAK",
      group:       "DRY_STANDARD",
      validFrom:   "2025-08-01T00:00:00Z",
      validTo:     "2025-12-31T00:00:00Z",
      rates: [
        { containerType: "20STD", amount: 100.00 },
        { containerType: "40STD", amount: 180.00 }
      ]
    }];
    const blob = new Blob([JSON.stringify(sample,null,2)],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "tariff-sample.json";
    a.click();
  }

  // ──────────────────────────────────────────────────────
  // LIFECYCLE
  // ──────────────────────────────────────────────────────
  useEffect(()=>{
    fetchSchedules();
    fetchContainerTypes(tariffForm.group);
  }, []);

  useEffect(()=>{
    fetchContainerTypes(tariffForm.group);
  }, [tariffForm.group]);

  useEffect(()=>{
    if (tariffForm.scheduleId) {
      fetchVoyages(tariffForm.scheduleId);
    } else {
      setAllVoyages([]);
    }
  }, [tariffForm.scheduleId]);

  useEffect(()=>{
    if (activeTab === "tariff-list") {
      fetchTariffs(currentPage);
    }
  }, [activeTab, currentPage, filters]);

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* HEADER */}
      <header className="py-14 px-6 md:px-16 text-center">
        <div className="inline-block p-3 rounded-full" style={cardGradient}>
          <Ship className="text-[#00FFFF]" size={50}/>
        </div>
        <h1 className="text-5xl font-extrabold mt-4">Tariff Management</h1>
        <p className="text-lg mt-2">NVOCC Rate & Pricing Administration</p>
      </header>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type==="success"
              ? "bg-green-900/30 border border-green-400 text-green-400"
              : "bg-red-900/30 border border-red-400 text-red-400"
          }`}
        >
          {message.type==="success" ? <CheckCircle/> : <AlertCircle/>}{" "}
          {message.text}
        </div>
      )}

      {/* TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { key:"create-tariff", icon:<Plus className="w-5 h-5"/>, label:"Create Tariff" },
            { key:"bulk-import",   icon:<Upload className="w-5 h-5"/>,    label:"Bulk Import" },
            { key:"tariff-list",   icon:<ListIcon className="w-5 h-5"/>,  label:"Tariff List" },
          ].map(tab=>(
            <button
              key={tab.key}
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

      {/* ───────────────────────────────── CREATE TARIFF ───────────────────────────────── */}
      {activeTab==="create-tariff" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="border-2 border-white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <DollarSign className="text-cyan-400 w-8 h-8"/> Create Tariff Rate
            </h2>
            <form onSubmit={createTariff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Schedule */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Service Schedule *</label>
                <select
                  value={tariffForm.scheduleId}
                  onChange={e=>setTariffForm(prev=>({
                    ...prev,
                    scheduleId: e.target.value,
                    voyageId:   ""
                  }))}
                  required
                  className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                >
                  <option value="">Select Schedule</option>
                  {allServices.map(s=>(
                    <option key={s.id} value={s.id}>
                      {s.code} – {s.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voyage */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Voyage *</label>
                <select
                  value={tariffForm.voyageId}
                  onChange={e=>setTariffForm(prev=>({...prev, voyageId:e.target.value}))}
                  required
                  disabled={!tariffForm.scheduleId}
                  className={`w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white mt-3 focus:border-white focus:outline-none ${
                    !tariffForm.scheduleId ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {!tariffForm.scheduleId
                    ? <option value="">Select schedule first</option>
                    : <>
                        <option value="">Select Voyage</option>
                        {allVoyages.map(v=>(
                          <option key={v.id} value={v.id}>
                            {v.voyageNumber} – {v.departure}→{v.arrival}
                          </option>
                        ))}
                      </>
                  }
                </select>
              </div>

              {/* Commodity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Commodity *</label>
                <input
                  type="text"
                  value={tariffForm.commodity}
                  onChange={e=>setTariffForm(prev=>({...prev,commodity:e.target.value}))}
                  placeholder="FAK"
                  required
                  className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>

              {/* Group */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Container Group *</label>
                <select
                  value={tariffForm.group}
                  onChange={e=>{
                    const g = e.target.value as ContainerGroup;
                    setTariffForm(prev=>({...prev,group:g}));
                    fetchContainerTypes(g);
                  }}
                  required
                  className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                >
                  {Object.values(ContainerGroup).map(g=>(
                    <option key={g} value={g}>{getGroupLabel(g)}</option>
                  ))}
                </select>
              </div>

              {/* Rates */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-white">Rates per Container Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  {allContainerTypes.filter(ct=>ct.group===tariffForm.group).map(ct=>(
                    <div key={ct.isoCode} className="flex flex-col">
                      <span className="font-bold text-white mb-1">{ct.name}</span>
                      <input
                        type="number" step="0.01" placeholder="0.00"
                        value={ tariffForm.rates.find(r=>r.containerType===ct.isoCode)?.amount.toString() || "" }
                        onChange={e=>{
                          const amt = parseFloat(e.target.value)||0;
                          setTariffForm(prev=>{
                            const rates = [...prev.rates];
                            const idx   = rates.findIndex(r=>r.containerType===ct.isoCode);
                            if(idx>=0) rates[idx] = {...rates[idx], amount:amt};
                            else      rates.push({ containerType:ct.isoCode, amount:amt });
                            return {...prev, rates};
                          });
                        }}
                        className="px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Valid From */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Valid From *</label>
                <input
                  type="date"
                  value={tariffForm.validFrom}
                  onChange={e=>setTariffForm(prev=>({...prev,validFrom:e.target.value}))}
                  required
                  className="w-full px-4 py-3 bg-[#11235d] border-4 border-black rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>

              {/* Valid To */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Valid To</label>
                <input
                  type="date"
                  value={tariffForm.validTo||""}
                  onChange={e=>setTariffForm(prev=>({...prev,validTo:e.target.value}))}
                  className="w-full px-4 py-3 bg-[#11235d] border-4 border-black rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg flex items-center gap-3 uppercase font-semibold shadow-[10px_10px_0_rgba(0,0,0,1)] transition-shadow text-white disabled:opacity-50"
                >
                  {isLoading
                    ? <Settings className="animate-spin w-5 h-5"/>
                    : <Plus     className="w-5 h-5"/>}
                  Create Tariff
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ————————— BULK IMPORT TAB ————————— */}
      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16">
          <div
            className="rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-2 border-white"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Tariffs
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setBulkMode("file")}
                className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 ${
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
                className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 ${
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
                onClick={downloadSample}
                className="bg-[#2a72dc] hover:bg-[#00FFFF] hover:text-black px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 text-white"
              >
                <Download className="w-5 h-5" /> Download Sample JSON
              </button>
              <p className="text-md text-slate-200 mt-5">
                Download a <b>full example</b> covering tariffs with serviceCode,
                voyageNumber & rates.
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
                      onChange={e => setUploadedFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="tariff-file"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <Upload className="w-16 h-16 text-slate-400" />
                      <p className="text-lg font-semibold text-white">
                        Click to upload JSON file
                      </p>
                      <p className="text-sm text-slate-400">or drag and drop</p>
                    </label>
                  </div>
                  <p className="text-xs font-bold text-white">
                    File must be an array of tariff records with serviceCode,
                    voyageNumber & rates.
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
          "serviceCode":  "WAX",
          "voyageNumber": "245N",
          "commodity":    "FAK",
          "group":        "DRY_STANDARD",
          "validFrom":    "2025-08-01T00:00:00Z",
          "validTo":      "2025-12-31T00:00:00Z",
          "rates": [
            { "containerType": "20STD", "amount": 100.00 },
            { "containerType": "40STD", "amount": 180.00 }
          ]
        }
      ]`}
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                    required
                  />
                  <p className="text-md font-bold text-white">
                    Paste an array of tariffs, each with{" "}
                    <code>serviceCode</code>, <code>voyageNumber</code> and{" "}
                    <code>rates</code>.
                  </p>
                </div>
              )}

              {/* Format Guide */}
              <div
                className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600"
                style={cardGradient}
              >
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">
                  JSON Format:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-bold text-white">
                  <div>• serviceCode (required)</div>
                  <div>• voyageNumber (required)</div>
                  <div>• commodity (required)</div>
                  <div>• group (required)</div>
                  <div>• validFrom (ISO datetime)</div>
                  <div>• validTo (optional ISO datetime)</div>
                  <div className="col-span-2 md:col-span-3 mt-3">
                    • rates (array, required):
                  </div>
                  <div>— containerType (string)</div>
                  <div>— amount (number)</div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 text-white"
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


      {/* ────────────────────────────────────────────────────── */}
      {/* TARIFF LIST */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab==="tariff-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <ListIcon className="text-cyan-400 w-8 h-8"/> Tariff Rates
            </h2>

            {/* — Filters — */}
            <div className="bg-[#2e4972] rounded-lg border-4 border-black p-6 mb-8" style={cardGradient}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Schedule */}
                <div className="space-y-2">
                  <label htmlFor="filter-sched" className="block text-sm font-semibold text-white">
                    Service Schedule
                  </label>
                  <select
                    id="filter-sched"
                    value={filters.serviceCode}
                    onChange={e=>{
                      const code = e.target.value;
                      setFilters(f=>({ ...f, serviceCode:code, voyageId:"" }));
                      const sched = allServices.find(s=>s.code===code);
                      if (sched) fetchVoyages(sched.id);
                      else setAllVoyages([]);
                    }}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Schedules</option>
                    {allServices.map(s=>(
                      <option key={s.id} value={s.code}>
                        {s.code} – {s.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Voyage */}
                <div className="space-y-2">
                  <label htmlFor="filter-voya" className="block text-sm font-semibold text-white">
                    Voyage
                  </label>
                  <select
                    id="filter-voya"
                    value={filters.voyageId}
                    onChange={e=>setFilters(f=>({ ...f, voyageId:e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Voyages</option>
                    {(allVoyages?? []).map(v=>(
                      <option key={v.id} value={v.id}>
                        {v.voyageNumber} – {v.departure}→{v.arrival}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commodity */}
                <div className="space-y-2">
                  <label htmlFor="filter-comm" className="block text-sm font-semibold text-white">
                    Commodity
                  </label>
                  <input
                    id="filter-comm"
                    type="text"
                    value={filters.commodity}
                    onChange={e=>setFilters(f=>({ ...f, commodity:e.target.value }))}
                    placeholder="FAK"
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  />
                </div>

                {/* Group */}
                <div className="space-y-2">
                  <label htmlFor="filter-group" className="block text-sm font-semibold text-white">
                    Container Group
                  </label>
                  <select
                    id="filter-group"
                    value={filters.group}
                    onChange={e=>setFilters(f=>({ ...f, group:e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Groups</option>
                    {Object.values(ContainerGroup).map(g=>(
                      <option key={g} value={g}>{getGroupLabel(g)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Apply / Clear */}
              <div className="mt-6 flex gap-4 justify-end">
                {/* <button onClick={()=>fetchTariffs(1)} className="bg-[#600f9e] hover:bg-[#491174] px-6 py-2 rounded-lg flex items-center gap-2 text-white uppercase text-sm shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow">
                  <Search className="w-4 h-4"/> Apply
                </button> */}
                <button onClick={()=>{
                    setFilters({ serviceCode:"",voyageId:"",commodity:"",group:"" });
                    setAllVoyages([]);
                    fetchTariffs(1);
                  }}
                  className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg flex items-center gap-2 text-white uppercase text-sm shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  <Filter className="w-4 h-4"/> Clear
                </button>
              </div>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8 text-cyan-400"/>
              </div>
              ) : allTariffs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No tariffs found</div>
              ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allTariffs.map(tariff=>{
                    const voy = allVoyages.find(v=>v.id===tariff.voyageId);
                    return (
                      <div
                        key={`${tariff.serviceCode}-${tariff.voyageId}-${tariff.group}-${tariff.validFrom}`}
                        className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group cursor-pointer"
                        style={cardGradient}
                        onClick={()=>openEdit(tariff)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 text-xs rounded ${getGroupColor(tariff.group)}`}>
                            {getGroupLabel(tariff.group)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-slate-400">Schedule:</span>
                          <span className="font-mono">{tariff.schedule.code}</span>

                          <span className="text-slate-400 ml-4">Voyage:</span>
                          <span className="font-mono">{tariff.voyage.voyageNumber}</span>
                          <p><span className="text-slate-400">Commodity:</span> {tariff.commodity}</p>
                        </div>
                          <div className="mt-2 overflow-auto">
                            <table className="w-full text-white text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left">Container</th>
                                  <th className="text-right">Price (USD)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tariff.rates.map(r=>(
                                  <tr key={r.containerType} className="border-t border-white">
                                    <td className="py-3">{r.containerType}</td>
                                    <td className="py-3 text-right">${Number(r.amount).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="text-sm text-white/80 border-t border-slate-600 pt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3 h-3"/><span>From: {new Date(tariff.validFrom).toLocaleDateString()}</span>
                          </div>
                          {tariff.validTo && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3"/><span>To: {new Date(tariff.validTo).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-2 text-cyan-400 transition-opacity">
                          <Edit3 className="w-4 h-4"/> Click to edit
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* pagination */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={()=>setCurrentPage(p=>p-1)}
                    disabled={currentPage<=1}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-white"
                  >
                    <ChevronLeft className="w-4 h-4"/> Prev
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={()=>setCurrentPage(p=>p+1)}
                    disabled={currentPage>=totalPages}
                    className="bg-[#2a72dc] px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-white"
                  >
                    Next <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* EDIT MODAL */}
      {/* ────────────────────────────────────────────────────── */}
      {/* ————————— EDIT MODAL ————————— */}

    {editModalOpen && selected && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div
          className="bg-[#121c2d] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-white uppercase"
          style={cardGradient}
        >
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Edit3 /> Edit Tariff {selected.serviceCode}
            </h3>
            <button onClick={closeEdit} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </header>

          {/* Form */}
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Rates Editor */}
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Rates per Container Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editForm.rates.map((rate, idx) => (
                  <div key={rate.containerType} className="flex items-center gap-2">
                    <span className="font-mono text-white">{rate.containerType}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={rate.amount}
                      onChange={e => {
                        const amt = parseFloat(e.target.value) || 0
                        setEditForm(prev => {
                          const rates = [...prev.rates]
                          rates[idx] = { ...rates[idx], amount: amt }
                          return { ...prev, rates }
                        })
                      }}
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Valid From */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">Valid From</label>
              <input
                type="date"
                value={editForm.validFrom.slice(0, 10)}
                onChange={e =>
                  setEditForm(prev => ({ ...prev, validFrom: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
              />
            </div>

            {/* Valid To */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">Valid To</label>
              <input
                type="date"
                value={editForm.validTo?.slice(0, 10) || ""}
                onChange={e =>
                  setEditForm(prev => ({ ...prev, validTo: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
              />
            </div>
          </form>

      {/* Footer */}
      <footer className="mt-8 flex justify-end gap-4">
        <button
            type="button"
            onClick={closeEdit}
            className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
          >
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
      </footer>
    </div>
  </div>
)}

    </div>
  );
}
