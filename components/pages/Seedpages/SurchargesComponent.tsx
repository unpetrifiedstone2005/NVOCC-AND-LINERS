  "use client";
  import React, { useState, useEffect } from "react";
  import axios from "axios";
  import {
    DollarSign, Percent, Upload, List,
    CheckCircle, AlertCircle,
    Settings, Plus, Edit3, Save, X,
    ChevronLeft, ChevronRight, Search, Filter,
    FileText,
    Download
  } from "lucide-react";

  // --- TYPES & ENUMS --------------------------------------------------------
  enum SurchargeScope {
    ORIGIN = "ORIGIN",
    FREIGHT = "FREIGHT",
    DESTINATION = "DESTINATION"
  }

  // Record type returned by API
  interface SurchargeDef {
    id: string;
    name: string;
    scope: SurchargeScope;
    portCode?: string;
    serviceCode?: string;
    isPercentage: boolean;
    currency: string;
    effectiveFrom: string;
    effectiveTo?: string;
    defaultRate?: string;
    rates?: Array<{
      id:                   string;
      containerTypeIsoCode: string;
      amount: string | number;
    }>;
  }

  // Form input type (no id, rates optional)
interface SurchargeDefForm {
  name: string
  scope: SurchargeScope
  portCode?: string
  serviceCode?: string
  isPercentage: boolean
  defaultRate: string           // new: holds the “%” when isPercentage=true
  currency: string
  effectiveFrom: string
  effectiveTo?: string
  rates: Array<{
    containerTypeIsoCode: string
    amount: string | number
  }>
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
 const [surchargeDefForm, setSurchargeDefForm] = useState<SurchargeDefForm>({
  name:             "",
  scope:            SurchargeScope.ORIGIN,
  portCode:         "",
  serviceCode:      "",
  isPercentage:     false,
  defaultRate:      "",                    // ← add this
  currency:         "USD",
  effectiveFrom:    new Date().toISOString().slice(0,16),
  effectiveTo:      "",
  rates:            [],                    // for fixed-amount entries
})
    const [rateForm, setRateForm] = useState<SurchargeRate>({
      surchargeDefId: "",
      containerTypeIsoCode: "",
      amount: 0
    });

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

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: "success"|"error", text: string }|null>(null);

    const [editRateModalOpen, setEditRateModalOpen] = useState(false);
    const [selectedRate,   setSelectedRate]   = useState<SurchargeRate|null>(null);
    


    const showMessage = (type: "success"|"error", text: string) => {
      setMessage({ type, text });
      setTimeout(() => setMessage(null), 5000);
    };

  async function createSurchargeDef(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    // Normalize; could be undefined or empty
    const rates = Array.isArray(surchargeDefForm.rates) ? surchargeDefForm.rates : [];

    // Convert local‐datetime to full ISO
    const fromISO = new Date(surchargeDefForm.effectiveFrom).toISOString();
    const toISO   = surchargeDefForm.effectiveTo
      ? new Date(surchargeDefForm.effectiveTo).toISOString()
      : undefined;

    try {
      // Build the payload
      const payload: any = {
        name:          surchargeDefForm.name,
        scope:         surchargeDefForm.scope,
        portCode:      surchargeDefForm.portCode || undefined,
        serviceCode:   surchargeDefForm.serviceCode || undefined,
        isPercentage:  surchargeDefForm.isPercentage,
        currency:      surchargeDefForm.currency,
        effectiveFrom: fromISO,
        effectiveTo:   toISO,
      };

      // Only include rates if you have any
      if (rates.length > 0) {
        payload.rates = rates.map(r => ({
          containerTypeIsoCode: r.containerTypeIsoCode,
          amount:               Number(r.amount)
        }));
      }

      await axios.post("/api/seed/surcharges/post", payload);

      showMessage("success", "Surcharge definition created successfully");

      // Reset form (no id needed)
    setSurchargeDefForm({
      name: "",
      scope: SurchargeScope.ORIGIN,
      portCode: "",
      serviceCode: "",
      isPercentage: false,
      defaultRate: "",                        // reset the percentage field
      currency: "USD",
      effectiveFrom: new Date().toISOString().slice(0,16),
      effectiveTo: "",
      rates: []                               // clear any fixed-amount entries
    });

    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const errors = err.response.data?.error;
        if (Array.isArray(errors)) {
          showMessage("error", errors.map((e: any) => e.message).join("; "));
        } else {
          showMessage("error", "Validation error: " + JSON.stringify(errors));
        }
      } else {
        showMessage("error", "Failed to create surcharge definition");
      }
    } finally {
      setIsLoading(false);
    }
  }


async function createSurchargeRate(e: React.FormEvent) {
  e.preventDefault();
  setIsLoading(true);

  try {
    const { surchargeDefId, containerTypeIsoCode, amount } = rateForm;
    // call the nested rates endpoint for that def id
    await axios.post(
      `/api/seed/surcharges/${surchargeDefId}/rates/post`,
      {
        containerTypeIsoCode,
        amount: amount.toFixed(2),  // match zod regex
      }
    );

    showMessage("success", "Surcharge rate created successfully");
    setRateForm({ surchargeDefId: "", containerTypeIsoCode: "", amount: 0 });
    fetchSurchargeDefs(currentPage);
  } catch (err: any) {
    let text: string;

    if (axios.isAxiosError(err)) {
      const apiError = err.response?.data?.error;
      if (Array.isArray(apiError)) {
        const labelMap: Record<string,string> = {
          containerTypeIsoCode: "Container Type",
          amount:               "Amount",
        };
        text = apiError
          .map((e: any) => {
            const field = e.path?.[0] as string;
            const label = labelMap[field] || field;
            return /required/i.test(e.message)
              ? `${label} is required`
              : `${label}: ${e.message}`;
          })
          .join("; ");
      } else if (typeof apiError === "string") {
        text = apiError;
      } else {
        text = err.message;
      }
    } else {
      text = "Failed to create surcharge rate";
    }

    showMessage("error", text);
  } finally {
    setIsLoading(false);
  }
}




async function importBulk(e: React.FormEvent) {
  e.preventDefault();
  setIsLoading(true);

  try {
    let raw = bulkData;
    if (bulkMode === "file" && uploadedFile) raw = await uploadedFile.text();
    const payload = JSON.parse(raw);

    const res = await axios.post("/api/seed/surcharges/post", payload);
    if (res.status === 207 && Array.isArray(res.data.results)) {
      const results = res.data.results as Array<{ id?: string; errors?: any }>;
      const total     = results.length;
      const successes = results.filter(r => r.id).length;
      const failures  = total - successes;

      // build a little error summary
      const errorLines = results
        .map((r, idx) => {
          if (!r.id && r.errors) {
            // if Zod errors, they’ll be an array
            const msg = Array.isArray(r.errors)
              ? r.errors.map((e:any)=>e.message).join("; ")
              : r.errors;
            return `#${idx+1}: ${msg}`;
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");

      if (failures > 0) {
        showMessage(
          "error",
          `Imported ${successes} of ${total} surcharge definitions.\nErrors:\n${errorLines}`
        );
      } else {
        showMessage("success", `Imported all ${total} surcharge definitions.`);
      }
    } else {
      // single-create path
      showMessage("success", "Surcharge definition created successfully");
    }

    setBulkData("");
    setUploadedFile(null);
    fetchSurchargeDefs(currentPage);

  } catch {
    showMessage("error", "Bulk import failed");
  } finally {
    setIsLoading(false);
  }
}





    function downloadSample() {
      const sample = [{
        name: "Fuel Surcharge Origin Land",
        scope: SurchargeScope.ORIGIN,
        portCode: "USNYC",
        isPercentage: false,
        currency: "USD",
        effectiveFrom: "2024-01-01T00:00:00.000Z",
        rates: [{ containerTypeIsoCode: "20GP", amount: 50.00 }]
      }];
      const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "surcharge-sample.json"; a.click();
    }

  async function fetchSurchargeDefs(page = 1) {
    setIsLoadingList(true);
     try {
    const res = await axios.get<{
      data: SurchargeDef[];
      pagination: { totalPages: number };
    }>("/api/seed/surcharges/get", {
      params: {
        page,
        limit: 100,
        // include only non-empty filters
        ...(filters.name      && { name: filters.name }),
        ...(filters.scope     && { scope: filters.scope }),
        ...(filters.currency  && { currency: filters.currency }),
        ...(filters.portCode  && { portCode: filters.portCode }),
        ...(filters.serviceCode && { serviceCode: filters.serviceCode }),
      }
    });

    setAllSurchargeDefs(res.data.data);
    setTotalPages(res.data.pagination.totalPages);
  } catch (err: any) {
      console.error("❌ Failed to fetch surcharge definitions:", err);
      showMessage("error", "Failed to load surcharge definitions");
    } finally {
      setIsLoadingList(false);
    }
  }



  async function fetchContainerTypes() {
    try {
      const { data } = await axios.get<{
        items: Array<{
          isoCode: string;
          name: string;
        }>;
      }>("/api/seed/containers/types/get");

      // only keep the two fields your UI needs
      setAllContainerTypes(
        data.items.map((c) => ({
          isoCode: c.isoCode,
          name:    c.name,
        }))
      );
    } catch (error) {
      console.error("Failed to load container types", error);
      showMessage("error", "Unable to load container types");
    }
  }





      function applyFilters() {
      setCurrentPage(1);
      fetchSurchargeDefs(1);
    }

    function clearFilters() {
      setFilters({
        name: "", scope: "", currency: "", portCode: "", serviceCode: ""
      });
      setCurrentPage(1);
      fetchSurchargeDefs(1);
    }

    function openEdit(def: SurchargeDef) {
      setSelected(def); setEditForm(def); setEditModalOpen(true);
    }
    function closeEdit() { setEditModalOpen(false); setSelected(null); setEditForm({} as SurchargeDef); }

    function openRates(def: SurchargeDef) {
      setSelected(def);
      setSelectedRates(
        (def.rates || []).map(r => ({
          id:                   r.id,   // ← grab the PK
          surchargeDefId:       def.id,
          containerTypeIsoCode: r.containerTypeIsoCode,
          amount:               typeof r.amount === "number"
                                  ? r.amount
                                  : Number(r.amount),
        }))
      );
      setRateModalOpen(true);
    }

    function closeRates() { setRateModalOpen(false); setSelected(null); setSelectedRates([]); }


    function openEditRate(rate: SurchargeRate) {
        setSelectedRate(rate);
        setEditRateModalOpen(true);
      }
    function closeEditRate() {
      setEditRateModalOpen(false);
      setSelectedRate(null);
    }

    async function applyEdit() {
      if (!selected) return;

      setIsUpdating(true);
      try {
        // Build payload from editForm
        const payload: any = {
          name:          editForm.name,
          scope:         editForm.scope,
          portCode:      editForm.portCode || undefined,
          serviceCode:   editForm.serviceCode || undefined,
          isPercentage:  editForm.isPercentage,
          currency:      editForm.currency,
          effectiveFrom: new Date(editForm.effectiveFrom).toISOString(),
          effectiveTo:   editForm.effectiveTo 
                          ? new Date(editForm.effectiveTo).toISOString() 
                          : undefined,
        };

        if (editForm.isPercentage) {
          // include defaultRate and drop any rates array
          payload.defaultRate = editForm.defaultRate;
        } else {
          // fixed-amount: we’re _not_ editing rates here, so leave rates alone
          payload.rates = undefined;
        }

        // send the update
        await axios.patch(
          `/api/seed/surcharges/${selected.id}/patch`,
          payload
        );

        showMessage("success", "Surcharge definition updated successfully");
        closeEdit();
        fetchSurchargeDefs(currentPage);

      } catch (err: any) {
        // pull out Zod / Axios validation errors if present
        let text = err.message
        // let text = "Failed to update surcharge definition";
        if (axios.isAxiosError(err)) {
          const apiError = err.response?.data?.error;
          if (Array.isArray(apiError)) {
            text = apiError.map((e: any) => e.message).join("; ");
          } else if (typeof apiError === "string") {
            text = apiError;
          }
        }
        showMessage("error", text);
      } finally {
        setIsUpdating(false);
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

    const debouncedFilters = useDebounce(filters, 300);
 

    useEffect(() => {
  fetchContainerTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Fetch on tab or page change (immediate)
useEffect(() => {
  if (activeTab !== "surcharge-list") return;
  fetchSurchargeDefs(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, currentPage]);

// Fetch when filters settle (debounced 1s)
useEffect(() => {
  if (activeTab !== "surcharge-list") return;

  // If page isn't 1, go to page 1 first; the page effect above will fetch.
  if (currentPage !== 1) {
    setCurrentPage(1);
    return;
  }

  // Already on page 1 → fetch now using the latest filters (read inside fetch)
  fetchSurchargeDefs(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, debouncedFilters]);

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
          <div
            className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-900/30 border border-green-400 text-green-400"
                : "bg-red-900/30 border border-red-400 text-red-400"
            }`}
          >
            {message.type === "success" ? <CheckCircle /> : <AlertCircle />}{" "}
            <span>{message.text}</span>
          </div>
        )}


      {/* TABS */}
        <div className="px-6 md:px-16 mb-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { key: "create-def",    icon: <Plus className="w-5 h-5" />,    label: "Create Definition" },
              { key: "rates",         icon: <Percent className="w-5 h-5" />, label: "Manage Rates" },
              { key: "bulk-import",   icon: <Upload className="w-5 h-5" />,  label: "Bulk Import" },
              { key: "surcharge-list",icon: <List className="w-5 h-5" />,    label: "Surcharge List" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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


        {/* CREATE SURCHARGE DEFINITION */}
        {activeTab === "create-def" && (
          <section className="px-6 md:px-16 mb-16">
            <div
              className="border-2 border-white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]"
              style={cardGradient}
            >
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
                <DollarSign className="text-cyan-400 w-8 h-8" />
                Create Surcharge Definition
              </h2>
              <form
                onSubmit={createSurchargeDef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Surcharge Name *
                  </label>
                  <input
                    type="text"
                    value={surchargeDefForm.name}
                    onChange={e =>
                      setSurchargeDefForm(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Fuel Surcharge Origin Land"
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                  />
                </div>

                {/* Scope */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Scope *</label>
                  <select
                    value={surchargeDefForm.scope}
                    onChange={e =>
                      setSurchargeDefForm(prev => ({
                        ...prev,
                        scope: e.target.value as SurchargeScope,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                  >
                    <option value={SurchargeScope.ORIGIN}>Origin</option>
                    <option value={SurchargeScope.FREIGHT}>Freight</option>
                    <option value={SurchargeScope.DESTINATION}>Destination</option>
                  </select>
                </div>

                {/* Port Code */}
                {(surchargeDefForm.scope === SurchargeScope.ORIGIN ||
                  surchargeDefForm.scope === SurchargeScope.DESTINATION) && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">
                      Port Code *
                    </label>
                    <input
                      type="text"
                      value={surchargeDefForm.portCode || ""}
                      onChange={e =>
                        setSurchargeDefForm(prev => ({
                          ...prev,
                          portCode: e.target.value,
                        }))
                      }
                      placeholder="USNYC"
                      required
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Service Code */}
                {surchargeDefForm.scope === SurchargeScope.FREIGHT && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">
                      Service Code *
                    </label>
                    <input
                      type="text"
                      value={surchargeDefForm.serviceCode || ""}
                      onChange={e =>
                        setSurchargeDefForm(prev => ({
                          ...prev,
                          serviceCode: e.target.value,
                        }))
                      }
                      placeholder="WAX"
                      required
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Percentage Toggle */}
                <div className="space-y-2 flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={surchargeDefForm.isPercentage}
                      onChange={e =>
                        setSurchargeDefForm(prev => ({
                          ...prev,
                          isPercentage: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div
                      className="w-14 h-8 bg-[#1A2A4A] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300
                                rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white
                                after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-cyan-600
                                border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
                                hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-shadow"
                    />
                    <span className="ml-3 text-sm font-medium text-white">
                      {surchargeDefForm.isPercentage ? "Percentage" : "Fixed Amount"}
                    </span>
                  </label>
                </div>

                {/* Default Rate % (when percentage) */}
                {surchargeDefForm.isPercentage ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">
                      Default Rate (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={surchargeDefForm.defaultRate || ""}
                        onChange={e =>
                          setSurchargeDefForm(prev => ({
                            ...prev,
                            defaultRate: e.target.value,
                          }))
                        }
                        placeholder="e.g. 12.50"
                        required
                        className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                  transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                  focus:border-white focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Currency input only for fixed-amount */
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">
                      Currency *
                    </label>
                    <select
                      value={surchargeDefForm.currency}
                      onChange={e =>
                        setSurchargeDefForm(prev => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                focus:border-white focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                )}

                {/* Effective From */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Effective From *
                  </label>
                  <input
                    type="datetime-local"
                    value={surchargeDefForm.effectiveFrom}
                    onChange={e =>
                      setSurchargeDefForm(prev => ({
                        ...prev,
                        effectiveFrom: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                  />
                </div>

                {/* Effective To */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Effective To
                  </label>
                  <input
                    type="datetime-local"
                    value={surchargeDefForm.effectiveTo || ""}
                    onChange={e =>
                      setSurchargeDefForm(prev => ({
                        ...prev,
                        effectiveTo: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                              transition-shadow border border-black border-4 rounded-lg text-white mt-3
                              focus:border-white focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed
                              px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3
                              shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)]
                              transition-shadow"
                  >
                    {isLoading ? (
                      <Settings className="animate-spin w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
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
            <div
              className="border-2 border-white rounded-3xl p-8 shadow-[30px_30px_0_rgba(0,0,0,1)]"
              style={cardGradient}
            >
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
                <Percent className="text-cyan-400 w-8 h-8" />
                Manage Surcharge Rates
              </h2>

              {(() => {
                const def = allSurchargeDefs.find(d => d.id === rateForm.surchargeDefId);

                // If it's a percentage-based surcharge, show a banner and no rate form
                if (def?.isPercentage) {
                  return (
                    <div className="p-6 bg-yellow-900/20 border border-yellow-400 rounded-lg text-yellow-200">
                      <p className="font-semibold">
                        This surcharge is percentage‐based ({def.defaultRate ?? "0"}%).<br/>
                        No per‐container rates are required.
                      </p>
                    </div>
                  );
                }

                // Otherwise render the fixed‐amount rates form
                return (
                  <form
                    onSubmit={createSurchargeRate}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {/* Definition selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        Surcharge Definition *
                      </label>
                      <select
                        value={rateForm.surchargeDefId}
                        onChange={e =>
                          setRateForm(prev => ({ ...prev, surchargeDefId: e.target.value }))
                        }
                        required
                        className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                  transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                  focus:border-white focus:outline-none"
                      >
                        <option value="">Select Definition</option>
                        {allSurchargeDefs
                          .filter(d => !d.isPercentage)
                          .map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Container Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        Container Type *
                      </label>
                      <select
                        value={rateForm.containerTypeIsoCode}
                        onChange={e =>
                          setRateForm(prev => ({ ...prev, containerTypeIsoCode: e.target.value }))
                        }
                        required
                        className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                  transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                  focus:border-white focus:outline-none"
                      >
                        <option value="">Select Container Type</option>
                        {allContainerTypes.map(type => (
                          <option key={type.isoCode} value={type.isoCode}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">
                        Amount ({def?.currency}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateForm.amount || ""}
                        onChange={e =>
                          setRateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))
                        }
                        placeholder="0.00"
                        required
                        className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                                  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                  transition-shadow border border-black border-4 rounded-lg text-white mt-3
                                  focus:border-white focus:outline-none"
                      />
                    </div>

                    {/* Submit button */}
                    <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed
                                  px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3
                                  shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)]
                                  transition-shadow"
                      >
                        {isLoading ? (
                          <Settings className="animate-spin w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                        Create Rate
                      </button>
                    </div>
                  </form>
                );
              })()}
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
          <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Surcharges
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
            Download a <b>full example</b> covering surcharge definitions and rates.
          </p>
        </div>

        <form onSubmit={importBulk} className="space-y-6">
          {bulkMode === "file" ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">
                Select JSON File *
              </label>
              <div className="border-2 border-dashed border-white rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
                <input
                  id="surcharge-file"
                  type="file"
                  accept=".json"
                  required
                  className="hidden"
                  onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="surcharge-file"
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
                File must be an array of surcharge definitions and rates.
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
                placeholder='[
    {
      "name": "Fuel Surcharge Origin",
      "scope": "ORIGIN",
      "currency": "USD",
      "isPercentage": false,
      "effectiveFrom": "2025-08-01T00:00",
      "rates": [
        {
          "containerTypeIsoCode": "20GP",
          "amount": 50
        }
      ]
    }
  ]'
                value={bulkData}
                onChange={e => setBulkData(e.target.value)}
                required
              />
              <p className="text-md font-bold text-white">
                Paste an array of surcharge entries, each with `rates`.
              </p>
              <div
                className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600 mt-4"
                style={cardGradient}
              >
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">
                  JSON Format:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-bold text-white">
                  <div>• name (required)</div>
                  <div>• scope (required)</div>
                  <div>• currency (required)</div>
                  <div>• isPercentage (true/false)</div>
                  <div>• effectiveFrom (ISO datetime)</div>
                  <div>• effectiveTo (optional ISO datetime)</div>
                  <div className="col-span-2 md:col-span-3 mt-3">
                    • rates (array, required):
                  </div>
                  <div>— containerTypeIsoCode (required)</div>
                  <div>— amount (number)</div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              {isLoading ? (
                <>
                  <Settings className="w-5 h-5 animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" /> Import Surcharges
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
        )}


        {/* SURCHARGE LIST */}
        {activeTab === "surcharge-list" && (
          <section className="px-6 md:px-16 mb-16">
            <div className="border-2 border white rounded-3xl p-8 shadow-[40px_40px_0_rgba(0,0,0,1)]" style={cardGradient}>
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
                <List className="text-cyan-400 w-8 h-8" />
                Surcharge Definitions
              </h2>
              
              {/* Filters */}
            <div
              className="bg-[#2e4972] rounded-lg border-4 border-black p-6 mb-8"
              style={cardGradient}
            >
              {/* inputs grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Name filter */}
                <div className="space-y-2">
                  <label htmlFor="filter-name" className="block text-sm font-semibold text-white">
                    Search by name
                  </label>
                  <input
                    id="filter-name"
                    type="text"
                    placeholder="Enter name…"
                    value={filters.name}
                    onChange={e => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF]
                              border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]
                              hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow
                              rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  />
                </div>

                {/* Scope filter */}
                <div className="space-y-2">
                  <label htmlFor="filter-scope" className="block text-sm font-semibold text-white">
                    Scope
                  </label>
                  <select
                    id="filter-scope"
                    value={filters.scope}
                    onChange={e => setFilters(prev => ({ ...prev, scope: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF]
                              border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]
                              hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow
                              rounded-lg text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Scopes</option>
                    <option value="ORIGIN">Origin</option>
                    <option value="FREIGHT">Freight</option>
                    <option value="DESTINATION">Destination</option>
                  </select>
                </div>

                {/* Port/Service Code filter */}
                <div className="space-y-2">
                  <label htmlFor="filter-port-code" className="block text-sm font-semibold text-white">
                    Port/Service Code
                  </label>
                  <input
                    id="filter-port-code"
                    type="text"
                    placeholder="Enter code…"
                    value={filters.portCode}
                    onChange={e => setFilters(prev => ({ ...prev, portCode: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF]
                              border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]
                              hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow
                              rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  />
                </div>
              </div>

          {/* action buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={applyFilters}
              className="bg-[#600f9e] hover:bg-[#491174] px-6 py-2 rounded-lg flex items-center gap-2
                        font-semibold uppercase text-sm shadow-[6px_6px_0px_rgba(0,0,0,1)]
                        hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow text-white"
            >
              <Search className="w-4 h-4" />
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg flex items-center gap-2
                        font-semibold uppercase text-sm shadow-[6px_6px_0px_rgba(0,0,0,1)]
                        hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow text-white"
            >
              <Filter className="w-4 h-4" />
              Clear
            </button>
          </div>
            </div>


  {isLoadingList ? (
  <div className="flex justify-center py-12">
  <Settings className="animate-spin w-8 h-8"/>
  </div>
  ) : allSurchargeDefs.length===0 ? (
  <div className="text-center py-12 text-white">No surcharge definitions found</div>
  ) : (
  <>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {allSurchargeDefs.map(def => (
  <div
    key={def.id}
    onClick={() => openEdit(def)}
    className="group relative bg-[#1A2A4A] rounded-lg p-6 border border-slate-600 
               shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] 
               transition-shadow cursor-pointer"
    style={cardGradient}
  >
    {/* header */}
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-bold text-cyan-400 truncate">{def.name}</h3>
      <span className={`px-2 py-1 text-xs rounded ${
        def.scope === 'ORIGIN' ? 'bg-green-900/30 text-green-400' :
        def.scope === 'FREIGHT' ? 'bg-blue-900/30 text-blue-400' :
                                 'bg-purple-900/30 text-purple-400'
      }`}>
        {def.scope}
      </span>
    </div>

    {/* details */}
    <div className="space-y-2 text-sm">
      <p>
        <span className="text-slate-400">Type:</span>{" "}
        {def.isPercentage ? 'Percentage' : 'Fixed Amount'}
      </p>
      <p>
        <span className="text-slate-400">Currency:</span>{" "}
        {def.currency}
      </p>
      {def.portCode && (
        <p>
          <span className="text-slate-400">Port:</span>{" "}
          {def.portCode}
        </p>
      )}
      {def.serviceCode && (
        <p>
          <span className="text-slate-400">Service:</span>{" "}
          {def.serviceCode}
        </p>
      )}
      <p>
        <span className="text-slate-400">From:</span>{" "}
        {new Date(def.effectiveFrom).toLocaleDateString()}
      </p>
      {def.effectiveTo && (
        <p>
          <span className="text-slate-400">To:</span>{" "}
          {new Date(def.effectiveTo).toLocaleDateString()}
        </p>
      )}
    </div>

    {/* rates strip */}
    <div
      className="relative overflow-visible my-4"
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      onClick={e => {
        e.stopPropagation()
        openRates(def)
      }}
    >
      <div
        className="cursor-pointer shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)]
                   bg-gradient-to-r from-black/40 to-transparent
                   p-3 border border-yellow-400/20 hover:border-yellow-400/60
                   transition-all rounded-lg"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,0,0.05) 0%, rgba(0,0,0,0.1) 100%)',
            clipPath:   'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)'
          }}
        />
        <div className="relative flex items-center justify-between">
          <span className="text-yellow-400 font-mono text-sm font-bold uppercase tracking-wider">
            { (def.rates?.length || 0) === 1 ? 'Rate' : 'Rates' }
          </span>
          <span className="text-white font-mono text-lg font-extrabold">
            { def.rates?.length || 0 }
          </span>
        </div>
      </div>
    </div>

    {/* click-to-edit hint */}
    <div className="mt-6 pt-3 border-t border-[#00FFFF] opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2 text-[#00FFFF] text-xs font-semibold">
        <Edit3 className="w-3 h-3" /> Click to edit
      </div>
    </div>
  </div>
))}

                  </div>

                  Pagination
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
                  <label className="text-sm font-semibold text-white">Name</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={e => setEditForm(prev=>({...prev, name:e.target.value}))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Currency</label>
                  <select
                    value={editForm.currency || "USD"}
                    onChange={e => setEditForm(prev=>({...prev, currency:e.target.value}))}
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
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
                  className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={applyEdit}
                  disabled={isUpdating}
                  className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow
                    px-4 py-2 rounded-lg flex items-center gap-2
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUpdating
                      ?<Settings className="animate-spin w-4 h-4" />
                      : <Save     className="w-4 h-4" />
                    }
                    <span>
                      {isUpdating ? 'Saving…' : 'Save'}
                    </span>
                  </button>
              </footer>
            </div>
          </div>
        )}

        {/* RATES MODAL */}
        {rateModalOpen && selected && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div
      className="bg-[#121c2d] rounded-3xl p-8 w-full max-w-3xl max-h-[80vh] overflow-y-auto
                 border-2 border-white shadow-[30px_30px_0_rgba(0,0,0,1)]"
      style={cardGradient}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-6 gap-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Percent className="text-cyan-400 w-6 h-6" />
          Rates for {selected.name}
        </h3>
        <button onClick={closeRates}>
          <X className="w-6 h-6 text-white hover:text-[#00FFFF]" />
        </button>
      </header>

      {/* Loading */}
      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Settings className="animate-spin w-8 h-8 text-cyan-400" />
          <span className="mt-3 text-cyan-200 text-lg font-semibold">
            Loading rates…
          </span>
        </div>
      ) : (
        /* Rates Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedRates.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-400">
              No rates defined for this surcharge
            </div>
          ) : (
            selectedRates.map((rate, idx) => (
              <div
                key={idx}
                onClick={() => openEditRate(rate)}
                className="group/rate bg-[#2e4972] relative px-2 py-2 border border-white
                           hover:bg-[#121c2d] hover:border-[#00FFFF] transition-all
                           rounded-lg overflow-hidden shadow-[14px_14px_0_rgba(0,0,0,1)]
                           hover:shadow-[19px_19px_0_rgba(0,0,0,1)] transition-shadow"
                style={cardGradient}
              >
                {/* hover-only gradient overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover/rate:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)',
                    clipPath:   'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)'
                  }}
                />

                {/* Content */}
                <div className="flex items-center gap-3">
                  {/* colored stripe */}
                  <div className="w-2 h-6 bg-gradient-to-b from-cyan-400 to-yellow-400
                                  opacity-80 group-hover/rate:opacity-100 transition-opacity" />
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-1">
                      {rate.containerTypeIsoCode}
                    </h4>
                    <p className="text-xl font-extrabold text-white">
                      {selected.isPercentage
                        ? `${rate.amount}%`
                        : `${selected.currency} ${rate.amount}`}
                    </p>
                    <span className="mt-1 text-xs text-[#00FFFF] opacity-0 group-hover/rate:opacity-100 transition-opacity font-semibold flex items-center gap-1">
                      <Edit3 className="w-3 h-3"/> Click to edit
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  </div>
)}

{editRateModalOpen && selectedRate && selected && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div
      className="bg-[#121c2d] rounded-3xl p-8 w-full max-w-md
                 border-2 border-white shadow-[30px_30px_0_rgba(0,0,0,1)]"
      style={cardGradient}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-6 gap-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Edit3 className="text-cyan-400 w-6 h-6" />
          Edit Rate
        </h3>
        <button onClick={closeEditRate}>
          <X className="w-6 h-6 text-white hover:text-[#00FFFF]" />
        </button>
      </header>

      {/* Form */}
      <form
       onSubmit={async e => {
      e.preventDefault();
      setIsUpdating(true);
      try {
    if (!selected.isPercentage) {
      await axios.patch(
        `/api/seed/surcharges/${selected.id}/patch`,
        { currency: selected.currency }
      );
    }

    

    await axios.patch(
      `/api/seed/surcharges/${selectedRate.surchargeDefId}/rates/${selectedRate.id}/patch`,
      { amount: selectedRate.amount.toFixed(2) }
    );


    setSelectedRates(rates =>
      rates.map(r =>
        r.id === selectedRate.id
          ? { ...r, amount: selectedRate.amount }
          : r
      )
    );

    showMessage("success", "Rate updated successfully");
    closeEditRate();

  

    fetchSurchargeDefs(currentPage);
  } catch (err: any) {
    const text = axios.isAxiosError(err)
      ? err.response?.data?.error || err.message
      : err.message;
    showMessage("error", text);
  } finally {
    setIsUpdating(false);
  }
    }}
          className="space-y-6"
        >
          {/* Currency selector (fixed‐amount only) */}
          {!selected.isPercentage && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Currency *
              </label>
              <select
                value={selected.currency}
                onChange={e =>
                  setSelected(prev => prev && ({
                    ...prev,
                    currency: e.target.value
                  }))
                }
                required
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                          shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)]
                          transition-shadow border-4 border-black rounded-lg text-white focus:border-white focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
          )}

          {/* Amount or Percentage */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">
              {selected.isPercentage
                ? "Percentage (%) *"
                : `Amount (${selected.currency}) *`}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={selectedRate.amount}
                onChange={e =>
                  setSelectedRate(prev =>
                    prev && { ...prev, amount: parseFloat(e.target.value) }
                  )
                }
                required
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                          shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)]
                          transition-shadow border-4 border-black rounded-lg text-white
                          focus:border-white focus:outline-none"
              />
              {selected.isPercentage && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                  %
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={closeEditRate}
              className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow
                    px-4 py-2 rounded-lg flex items-center gap-2
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdating ? (
                <Settings className="animate-spin w-4 h-4 text-white" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
              <span className="text-white">Save</span>
            </button>
          </div>
          </form>
        </div>
    </div>
  )}
</div>
);
}