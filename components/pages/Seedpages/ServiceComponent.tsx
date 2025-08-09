// File: components/ServiceComponent.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { FixedSizeList as List } from "react-window";
import axios, { AxiosError } from "axios";
import {
  Ship,
  Navigation,
  Anchor,
  Upload,
  List as ListIcon,
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
  FileText,
  Download,
  SearchIcon,
} from "lucide-react";

// Types based on your models
interface ServiceSchedule {
  id: string;
  code: string;
  description?: string;
  voyages?: Voyage[];
  _count:      { voyages: number }
}

interface ServiceForm {
  code: string;
  description: string;
}

// 1) The "core" properties that both your form and your fetched data share:
type VoyageCore = {
  voyageNumber: string;
  departure:    string;
  arrival:      string;
  vesselName:   string;
};

// 2) Your full data interface (matches Prisma exactly):
interface Voyage extends VoyageCore {
  id:           string;      // PK
  serviceId:    string;      // FK UUID
  portCalls?:   PortCall[];
  service?: {
    id:          string;
    code:        string;
    description?: string;
  };
}

// 3) Derive your form type from the core, and *add* serviceCode:
type VoyageForm = VoyageCore & {
  serviceCode: string;
};

interface PortCall {
  id?: string;
  voyageId: string;
  portCode: string;
  order: number;
  etd: string;
  eta: string;
}



interface ScheduleCardProps {
  schedule: ServiceSchedule;
  openVoyages: (s: ServiceSchedule) => void;
  openEdit: (s: ServiceSchedule) => void;
}


const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

export function ServiceComponent() {
  const [activeTab, setActiveTab] = useState<
    "create-schedule" |
    "create-voyage" |
    "port-calls" |
    "bulk-import" |
    "schedule-list"
  >("create-schedule");

  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    code: "",
    description: ""
  });

  const [voyageForm, setVoyageForm] = useState<VoyageForm>({
    serviceCode:  "",
    voyageNumber: "",
    departure:    "",
    arrival:      "",
    vesselName:   "",
  });

 const [portCallForm, setPortCallForm] = useState<{
  scheduleId?:    string;
  voyageNumber:   string;
  portCode:       string;
  order:          number;
  eta:            string;
  etd:            string;
}>({
  voyageNumber: "",
  portCode:     "",
  order:        0,
  eta:          "",
  etd:          "",
});

  const [bulkData, setBulkData] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea"|"file">("textarea");

  const [allSchedules, setAllSchedules] = useState<ServiceSchedule[]>([]);
  const [voyages, setVoyages]           = useState<Voyage[]>([]);
  const [formVoyages,  setFormVoyages]  = useState<Voyage[]>([]);
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

  const [isLoading, setIsLoading]       = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingVoyages,   setIsLoadingVoyages]   = useState(false);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [message, setMessage]           = useState<{ type:"success"|"error"; text:string }|null>(null);



  const [portCallsPage, setPortCallsPage] = useState<number>(1);
  const [portCallsPageSize, setPortCallsPageSize] = useState<number>(10);
  const [portCallsTotal, setPortCallsTotal] = useState<number>(0);
  const [portCallsTotalPages, setPortCallsTotalPages] = useState<number>(1);
  const [isLoadingPortCalls, setIsLoadingPortCalls] = useState<boolean>(false);
  const [portCallsFilters, setPortCallsFilters] = useState<{ portCode?: string }>({});

  const showMessage = (type:"success"|"error", text:string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // === NEW State for Voyage Modal Pagination & Search ===
  const [voyageSearch, setVoyageSearch] = useState("");
  const [voyagePage, setVoyagePage] = useState(1);
  const voyagesPerPage = 6;

  // === NEW State for Edit Voyage Modal ===
  const [editVoyageModal, setEditVoyageModal] = useState(false);
  const [voyageEditForm, setVoyageEditForm] = useState<Voyage|null>(null);

  // === NEW State for Edit Port Call Modal ===
  const [editPortCallModal, setEditPortCallModal] = useState(false);
  const [portCallEditForm, setPortCallEditForm] = useState<PortCall|null>(null);

  async function fetchSchedules(page = 1) {
    setIsLoadingSchedules(true);
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
      setAllSchedules(data.items);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      showMessage("error", "Failed to fetch schedules");
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  async function fetchVoyages(scheduleId: string) {
    setIsLoadingVoyages(true);
    try {
      const { data } = await axios.get<{
        voyages: Voyage[];
        total: number;
        totalPages: number;
        currentPage: number;
      }>(`/api/seed/serviceschedules/${scheduleId}/voyages/get`, {
        params: { includeService: true },
      });
      setVoyages(data.voyages);
      setFormVoyages(data.voyages);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch {
      showMessage("error", "Could not load voyages");
    } finally {
      setIsLoadingVoyages(false);
    }
  }

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: created } = await axios.post<ServiceSchedule>(
        "/api/seed/serviceschedules/post",
        serviceForm
      );
      showMessage("success", `Created schedule ${created.code}!`);
      setServiceForm({ code: "", description: "" });
      fetchSchedules(1);
      // Also refresh all voyages to show new schedule data
 
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

async function createVoyage(e: React.FormEvent) {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1) Resolve the UUID from the human‐readable code
    const schedule = allSchedules.find(s => s.code === voyageForm.serviceCode);
    if (!schedule) {
      throw new Error(`No ServiceSchedule found for code="${voyageForm.serviceCode}"`);
    }
    const scheduleId = schedule.id;

    // 2) Build the payload
    const payload = {
      voyageNumber: voyageForm.voyageNumber,
      departure:    new Date(voyageForm.departure).toISOString(),
      arrival:      new Date(voyageForm.arrival).toISOString(),
      vesselName:   voyageForm.vesselName,
    };

    // 3) POST to the nested endpoint
    const { data: created } = await axios.post<Voyage>(
      `/api/seed/serviceschedules/${scheduleId}/voyages/post`,
      payload
    );
    showMessage("success", `Voyage ${created.voyageNumber} created!`);

    // 4) Refresh both modal voyages and all voyages
    await fetchVoyages(scheduleId);


    // 5) Clear only the voyage fields—leave serviceCode in place
    setVoyageForm(prev => ({
      ...prev,
      voyageNumber: "",
      departure:    "",
      arrival:      "",
      vesselName:   "",
      // serviceCode: prev.serviceCode
    }));
  } catch (err: unknown) {
    console.error("✖️ createVoyage error:", err);

    let msg = "An unknown error occurred";

    if (axios.isAxiosError(err) && err.response) {
      const { status, data } = err.response;

      // if it’s a Zod‐style fieldErrors object
      if (data && typeof data === "object" && "errors" in data) {
        const errors = (data as any).errors;
        msg = Array.isArray(errors)
          ? errors.map((e: any) => e.message || JSON.stringify(e)).join("; ")
          : Object.values(errors).flat().map((e: any) => e.message || JSON.stringify(e)).join("; ");
      }
      // if it’s a single “error” field
      else if (data && typeof data === "object" && "error" in data) {
        const e = (data as any).error;
        msg = typeof e === "string"
          ? e
          : JSON.stringify(e);
      }
      else {
        msg = `Server returned ${status}`;
      }
    }
    else if (err instanceof Error) {
      msg = err.message;
    }
    else {
      // fallback for weird cases
      msg = JSON.stringify(err);
    }

    showMessage("error", msg);
  } finally {
    setIsLoading(false);
  }
}

async function createPortCall(e: React.FormEvent) {
  e.preventDefault();
  const { scheduleId, voyageNumber, portCode, order, eta, etd } = portCallForm;
  if (!scheduleId || !voyageNumber) {
    showMessage("error", "Please select a schedule and voyage first");
    return;
  }

  // 🔍 find the actual voyageId by number (within this schedule)
  const match = formVoyages.find(
    v => v.voyageNumber === voyageNumber && v.service?.id === scheduleId
  );
  if (!match) {
    showMessage("error", `No voyage ${voyageNumber} found under that schedule`);
    return;
  }
  const voyageId = match.id;

  setIsLoading(true);
  try {
    await axios.post(
      `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/post`,
        {
     portUnlocode: portCode,
    order,
    eta: new Date(eta).toISOString(),
    etd: new Date(etd).toISOString(),
  }
    );
    showMessage("success", `Port call added to voyage ${voyageNumber}`);
    // reset, keep schedule so they can add more
    setPortCallForm({ scheduleId, voyageNumber: "", portCode: "", order: 0, eta: "", etd: "" });
    await fetchVoyages(scheduleId);
  } catch (err: unknown) {
    console.error("createPortCall raw error:", err);
    let msg = "Failed to create port call";

    if (axios.isAxiosError(err) && err.response) {
      const { status, data } = err.response as any;

      // If Zod validation failed, `data.errors` is a Record<string, string[]>
      if (status === 422 && data.errors && typeof data.errors === "object") {
        // flatten all field‐specific messages
        const allMessages = Object.values(data.errors)
                                 .flat()
                                 .filter(Boolean);
        if (allMessages.length) {
          msg = allMessages.join("; ");
        }
      }
      // If you returned `{ error: "Some message" }`
      else if (typeof data.error === "string") {
        msg = data.error;
      }
      else {
        msg = `Server returned ${status}`;
      }
    }
    else if (err instanceof Error) {
      msg = err.message;
    }

    showMessage("error", msg);
  }finally {
    setIsLoading(false);
  }
}


async function importBulkVoyages(e: React.FormEvent) {
  e.preventDefault();
  setIsLoading(true);

  try {
    let raw = bulkData;
    if (bulkMode === "file" && uploadedFile) {
      raw = await uploadedFile.text();
    }

    // Parse as array of services, each with voyages array
    const servicesToImport = JSON.parse(raw) as Array<{
      serviceCode: string;
      serviceDescription?: string;
      voyages: Array<{
        voyageNumber: string;
        departure: string;
        arrival: string;
        vesselName: string;
        portCalls?: Array<{
          order: number;
          portCode: string;
          eta?: string;
          etd?: string;
        }>;
      }>;
    }>;

    // Cache for schedule IDs (so you don’t duplicate posts)
    const scheduleCache: Record<string, string> = {};
    let voyageCount = 0;
    let portCallCount = 0;

    for (const service of servicesToImport) {
      // 1️⃣ Find or create the ServiceSchedule
      let scheduleId = scheduleCache[service.serviceCode];
      if (!scheduleId) {
        let schedule = allSchedules.find(s => s.code === service.serviceCode);
        if (!schedule) {
          const { data: created } = await axios.post("/api/seed/serviceschedules/post", {
            code: service.serviceCode,
            description: service.serviceDescription ?? "",
          });
          scheduleId = created.id;
          showMessage("success", `Created schedule ${service.serviceCode}`);
        } else {
          scheduleId = schedule.id;
        }
        scheduleCache[service.serviceCode] = scheduleId;
      }

      // 2️⃣ Now handle each voyage under this schedule
      // Get all voyages for this schedule (for finding existing)
      let voyagesForSchedule: Voyage[] = [];
      try {
        const { data } = await axios.get<{ voyages: Voyage[] }>(
          `/api/seed/serviceschedules/${scheduleId}/voyages/get`
        );
        voyagesForSchedule = data.voyages;
      } catch {
        voyagesForSchedule = [];
      }

      for (const v of service.voyages) {
        let voyageId: string | undefined;
        let voyage = voyagesForSchedule.find(vv => vv.voyageNumber === v.voyageNumber);

        if (!voyage) {
          // Create if not found
          const { data: created } = await axios.post<Voyage>(
            `/api/seed/serviceschedules/${scheduleId}/voyages/post`,
            {
              voyageNumber: v.voyageNumber,
              departure: new Date(v.departure).toISOString(),
              arrival: new Date(v.arrival).toISOString(),
              vesselName: v.vesselName,
            }
          );
          voyageId = created.id;
          showMessage("success", `Created voyage ${v.voyageNumber} on ${service.serviceCode}`);
        } else {
          voyageId = voyage.id;
        }
        voyageCount++;

        // 3️⃣ Port calls for this voyage
        if (Array.isArray(v.portCalls)) {
          for (const pc of v.portCalls) {
            try {
              await axios.post(
                `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/post`,
                {
                  portCode: pc.portCode,
                  order: pc.order,
                  eta: pc.eta ? new Date(pc.eta).toISOString() : undefined,
                  etd: pc.etd ? new Date(pc.etd).toISOString() : undefined,
                }
              );
              portCallCount++;
            } catch (err: any) {
              let msg = `Port call ${pc.portCode} on voyage ${v.voyageNumber}`;
              if (err.response?.data?.error) msg += `: ${err.response.data.error}`;
              showMessage("error", msg);
            }
          }
        }
      }
    }

    showMessage(
      "success",
      `Imported ${voyageCount} voyages and ${portCallCount} port calls.`
    );
    setBulkData("");
    setUploadedFile(null);
    await fetchSchedules(1);

  } catch (err: any) {
    // New: show the full error response!
    if (axios.isAxiosError(err) && err.response) {
      const { status, data } = err.response;
      let msg = `HTTP ${status}`;
      if (data?.error) msg += `: ${data.error}`;
      if (data?.errors) msg += `: ${JSON.stringify(data.errors)}`;
      showMessage("error", msg);
    } else if (err instanceof Error) {
      showMessage("error", err.message);
      console.log(err)
    } else {
      showMessage("error", "Failed to import voyages/port calls");
    }
  } finally {
    setIsLoading(false);
  }
}





  function downloadSample() {
    const sample = [
      {
        "serviceCode": "WAX",
        "voyageNumber": "22N",
        "departure": "2025-07-20T01:24:00Z",
        "arrival":   "2025-07-25T07:12:00Z",
        "portCalls": [
          {
            "sequence": 1,
            "portCode": "CNSHA",
            "callType": "POL",
            "eta": "2025-07-20T01:24:00Z",
            "etd": "2025-07-20T18:00:00Z"
          },
          {
            "sequence": 2,
            "portCode": "SGSIN",
            "callType": "VIA",
            "eta": "2025-07-22T08:00:00Z",
            "etd": "2025-07-22T20:00:00Z"
          }
        ]
      }
    ];
    const blob = new Blob([JSON.stringify(sample,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="schedule-sample.json"; a.click();
  }

 async function applyEdit() {
  setIsUpdating(true);
  try {
    await axios.patch(
      `/api/seed/serviceschedules/${selectedSchedule!.id}/patch`,
      {
        code:        editForm.code,
        description: editForm.description
      }
    );
    showMessage("success", "Schedule updated");
    setEditModalOpen(false);
    fetchSchedules(currentPage);
  } catch (err: unknown) {
    // First, dump everything we know to the console
    console.error("✖️ applyEdit error (raw):", err);
    if (axios.isAxiosError(err)) {
      console.error("→ request:", err.config);
      console.error("→ status:", err.response?.status);
      console.error("→ headers:", err.response?.headers);
      console.error("→ data:", err.response?.data);
    }

    // Now pick a user‐friendly message
    let msg = "Failed to update schedule";

    if (axios.isAxiosError(err) && err.response) {
      const { status, data } = err.response;

      // If your API uses a Zod‐style `{ errors: { field: [msgs] } }`
      if (data && typeof data === "object" && "errors" in data) {
        msg = Object.values((data as any).errors).flat().join("; ");
      }
      // If it returns `{ error: "something went wrong" }`
      else if (data && typeof data === "object" && "error" in data) {
        msg = (data as any).error;
      }
      // Fallback to HTTP status
      else {
        msg = `Server returned ${status}`;
      }
    } else if (err instanceof Error) {
      // Non‑Axios error
      msg = err.message;
    }

    showMessage("error", msg);
  } finally {
    setIsUpdating(false);
  }
}


  function applyFilters() { fetchSchedules(1) }
  function clearFilters() {
    setFilters({ code:"", description:"", voyageNumber:"" });
    fetchSchedules(1);
  }

  function openEdit(s:ServiceSchedule) { setSelectedSchedule(s); setEditForm(s); setEditModalOpen(true) }
  function closeEdit() { setEditModalOpen(false); setSelectedSchedule(null) }
  
  async function openVoyages(s:ServiceSchedule) { 
    setSelectedSchedule(s); 
    setVoyageModalOpen(true);
    setVoyageSearch("");
    setVoyagePage(1);
    // Fetch voyages for this specific schedule (populates `voyages`)
    await fetchVoyages(s.id);
  }
  
  function closeVoyages() { 
    setVoyageModalOpen(false); 
    setSelectedSchedule(null);
    setVoyages([]) 
  }
  
  // === NEW: Edit Voyage functions ===
  function openEditVoyage(v:Voyage) { setVoyageEditForm(v); setEditVoyageModal(true); }
  async function saveEditVoyage() {
    if (!voyageEditForm?.id) return;

    // 1️⃣ figure out which schedule this voyage belongs to
    //    either use the embedded service.id or fall back to your selectedSchedule
    const scheduleId =
      voyageEditForm.service?.id
      ?? selectedSchedule?.id;

    if (!scheduleId) {
      showMessage("error", "Unable to determine parent schedule");
      return;
    }

    setIsUpdating(true);
    try {
      // 2️⃣ call the nested patch route
      await axios.patch(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageEditForm.id}/patch`,
        voyageEditForm
      );

      showMessage("success", "Voyage updated");
      setEditVoyageModal(false);

      // 3️⃣ re-fetch voyages for that schedule and all voyages
      await fetchVoyages(scheduleId);

    } catch (err: any) {
      console.error("saveEditVoyage error:", err);
      showMessage("error", "Failed to update voyage");
    } finally {
      setIsUpdating(false);
    }
  }

  function openPortCalls(v:Voyage) {
    setSelectedVoyage(v);
    setSelectedPortCalls(v.portCalls || []);
    setPortCallsModalOpen(true);
  }
  function closePortCalls() { setPortCallsModalOpen(false); setSelectedVoyage(null) }

  // === NEW: Edit Port Call functions ===
  function openEditPortCall(pc:PortCall) { setPortCallEditForm(pc); setEditPortCallModal(true); }
async function saveEditPortCall() {
  if (!portCallEditForm?.id) {
    showMessage("error", "No Port Call ID provided. Cannot update.");
    return;
  }

  const voyageId   = selectedVoyage?.id;
  const scheduleId = selectedVoyage?.service?.id ?? selectedSchedule?.id;
  if (!voyageId || !scheduleId) {
    showMessage("error", "Unable to determine parent schedule or voyage");
    return;
  }

  // Helper for ISO string
  const toISOStringSafe = (localDateTime: string | undefined) => {
    if (!localDateTime) return undefined;
    const dt = new Date(localDateTime);
    return isNaN(dt.getTime()) ? undefined : dt.toISOString();
  };

  setIsLoading(true);
  try {
    const patchData: { [key: string]: any } = {};
    if (portCallEditForm.portCode && portCallEditForm.portCode.trim() !== "") {
      patchData.portUnlocode = portCallEditForm.portCode.trim().toUpperCase();
    }
    if (Number.isInteger(portCallEditForm.order) && portCallEditForm.order >= 1) {
      patchData.order = portCallEditForm.order;
    }
    const etaISO = toISOStringSafe(portCallEditForm.eta);
    if (etaISO) patchData.eta = etaISO;
    const etdISO = toISOStringSafe(portCallEditForm.etd);
    if (etdISO) patchData.etd = etdISO;

    if (Object.keys(patchData).length === 0) {
      showMessage("error", "No valid fields to update");
      setIsLoading(false);
      return;
    }

    await axios.patch(
      `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/${portCallEditForm.id}/patch`,
      patchData
    );

    showMessage("success", "Port call updated");
    setEditPortCallModal(false);

    // 👉 This is the key line to add:
    await fetchPortCalls(scheduleId, voyageId);

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data   = error.response?.data;

      let msg = data?.error ?? JSON.stringify(data);
      if (data?.errors && typeof data.errors === "object") {
        msg = Object.values(data.errors).flat().join("; ");
      }
      showMessage("error", `HTTP ${status}: ${msg}`);
    } else if (error instanceof Error) {
      showMessage("error", error.message);
    } else {
      showMessage("error", String(error));
    }
  } finally {
    setIsLoading(false);
  }
}


async function fetchPortCalls(
  scheduleId: string,
  voyageId: string,
  page: number = 1,
  pageSize: number = 10,
  filters: { portCode?: string } = {}
) {
  setIsLoadingPortCalls(true);
  try {
    // 1️⃣ Build params, renaming filter to portUnlocode
    const params: Record<string, any> = { page, pageSize };
    if (filters.portCode) {
      params.portUnlocode = filters.portCode;  // ← backend now expects portUnlocode
    }

    const { data } = await axios.get<{
      portCalls: Array<{
        id: string;
        voyageId: string;
        portUnlocode: string;
        order: number;
        eta: string;
        etd: string;
      }>;
      total: number;
      totalPages: number;
    }>(
      `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/get`,
      { params }
    );

    // 2️⃣ Map each portUnlocode → portCode for the UI
    const calls = data.portCalls.map(pc => ({
      id:           pc.id,
      voyageId:     pc.voyageId,
      portCode:     pc.portUnlocode,  // ← UI still uses portCode
      order:        pc.order,
      eta:          pc.eta,
      etd:          pc.etd,
    }));

    setSelectedPortCalls(calls);
    setPortCallsTotal(data.total);
    setPortCallsTotalPages(data.totalPages);
  } catch (err) {
    setSelectedPortCalls([]);
    setPortCallsTotal(0);
    setPortCallsTotalPages(1);
    // Optional: handle error messaging
  } finally {
    setIsLoadingPortCalls(false);
  }
}




  useEffect(() => {
    fetchSchedules(1)
  }, [])

  useEffect(() => {
    if (activeTab === "schedule-list") {
      fetchSchedules(currentPage)
    }
  }, [activeTab, currentPage])

  // === Get voyages for a specific schedule from allVoyages ===
  

  // === Pagination logic for Voyage Modal ===
  const voyagesForSchedule = voyages
    .filter(v => v.voyageNumber?.toLowerCase().includes(voyageSearch.toLowerCase()));
  const totalVoyagePages = Math.ceil(voyagesForSchedule.length / voyagesPerPage);
  const paginatedVoyages = voyagesForSchedule.slice((voyagePage-1)*voyagesPerPage, voyagePage*voyagesPerPage);

  
function ScheduleCard({ schedule: s, openVoyages, openEdit }: ScheduleCardProps) {
  const [overStrip, setOverStrip] = useState(false);

  return (
    <div
      onClick={() => openEdit(s)}
      className="group relative bg-[#121c2d] rounded-lg p-6 
                 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                 hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]
                 transition-shadow border border-slate-400 hover:border-cyan-400"
      style={cardGradient}
    >
      {/* header */}
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#00FFFF]">{s.code}</h3>
          {s.description && <p className="text-sm text-white">{s.description}</p>}
        </div>
      </div>

      {/* voyages strip */}
      <div
        className="relative overflow-visible mb-4"
        onMouseEnter={() => setOverStrip(true)}
        onMouseLeave={() => setOverStrip(false)}
        onClick={e => {
          e.stopPropagation();
          openVoyages(s);
        }}
      >
        <div
          className="cursor-pointer 
                     shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] 
                     hover:shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]   /* ← added */
                     bg-gradient-to-r from-black/40 to-transparent
                     p-3 border border-cyan-400/20 hover:border-cyan-400/60
                     transition-all rounded-lg"
        >
          {/* clipped overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)',
              clipPath:   'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)'
            }}
          />
          {/* strip content */}
          <div className="relative flex items-center justify-between">
            <span className="text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider">
              {s._count.voyages === 1 ? 'Voyage' : 'Voyages'}
            </span>
            <span className="text-white font-mono text-lg font-extrabold">
              {s._count.voyages}
            </span>
          </div>
        </div>
      </div>

      {/* click‑to‑edit hint (moved down to avoid overlapping shadow) */}
      <div
        className={`mt-6 pt-3 border-t border-[#00FFFF] transition-opacity 
                    ${overStrip ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <div className="flex items-center gap-2 text-[#00FFFF] text-xs font-semibold">
          <Edit3 className="w-3 h-3" /> Click to edit
        </div>
      </div>
    </div>
  );
}


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
            { key:"schedule-list",   icon:<ListIcon className="w-5 h-5"/>,      label:"Schedule List"   },
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
              <div className="space-y-2">
                <label className="text-sm font-semibold">Service Code *</label>
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
                    <option key={s.id} value={s.code }>
                      {s.code} – {s.description}
                    </option>
                  ))}
                </select>
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-semibold">Departure (ETD) *</label>
                <input
                  type="datetime-local"
                  value={voyageForm.departure || ""}
                  onChange={e=>setVoyageForm(prev=>({...prev,departure:e.target.value}))}
                  required
                  className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF]  mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm mt-2 font-semibold">Arrival (ETA) *</label>
                <input
                  type="datetime-local"
                  value={voyageForm.arrival||""}
                  onChange={e=>setVoyageForm(prev=>({...prev,arrival:e.target.value}))}
                  required
                  className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF]  mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold">Vessel Name *</label>
                <input
                  type="text"
                  value={voyageForm.vesselName||""}
                  onChange={e=>setVoyageForm(prev=>({...prev,vesselName:e.target.value}))}
                  placeholder="MSC OSCAR"
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[12px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
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
      {activeTab === "port-calls" && (
  <section className="px-6 md:px-16 mb-16">
    <div
      className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
      style={cardGradient}
    >
      <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
        <Anchor className="text-cyan-400 w-8 h-8" /> Create Port Call
      </h2>

      <form onSubmit={createPortCall} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Schedule selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Schedule *</label>
          <select
            value={portCallForm.scheduleId || ""}
            onChange={async e => {
              const scheduleId = e.target.value;
              setPortCallForm(f => ({ ...f, scheduleId, voyageNumber: "" }));
              if (scheduleId) await fetchVoyages(scheduleId);
            }}
            required
            className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                       shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                       transition-shadow border border-black border-4 rounded-lg text-white mt-3
                       focus:border-white focus:outline-none"
          >
            <option value="">Select Schedule</option>
            {allSchedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} – {s.description}
              </option>
            ))}
          </select>
        </div>

        {/* Voyage selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Voyage *</label>
          <select
            value={portCallForm.voyageNumber}
            onChange={e => setPortCallForm(f => ({ ...f, voyageNumber: e.target.value }))}
            required
            disabled={!portCallForm.scheduleId}
            className={`
              w-full px-4 py-3 bg-[#2D4D8B]
              ${!portCallForm.scheduleId
                ? "opacity-50 cursor-not-allowed"
                : "hover:text-[#00FFFF] hover:bg-[#0A1A2F] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]"}
              shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4
              rounded-lg text-white mt-3 focus:border-white focus:outline-none
            `}
          >
            {!portCallForm.scheduleId
              ? <option value="">Select schedule first</option>
              : <>
                  <option value="">Select Voyage</option>
                  {formVoyages.map(v => (
                    <option key={v.id} value={v.voyageNumber}>
                      {v.voyageNumber} — {new Date(v.departure).toLocaleDateString()}
                    </option>
                  ))}
                </>
            }
          </select>
        </div>

        {/* Port Code */}
        <div className="space-y-2">
          <label htmlFor="portCode" className="text-sm font-semibold">Port Code *</label>
          <input
            id="portCode"
            type="text"
            value={portCallForm.portCode}
            onChange={e => setPortCallForm(prev => ({ ...prev, portCode: e.target.value.toUpperCase() }))}
            placeholder="USNYC"
            required
            className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F]
                       shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                       transition-shadow border border-black border-4 rounded-lg text-white mt-3
                       focus:border-white focus:outline-none"
          />
        </div>

        {/* ETA & ETD */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="eta" className="text-sm font-semibold">ETA *</label>
            <input
              id="eta"
              type="datetime-local"
              value={portCallForm.eta}
              onChange={e => setPortCallForm(prev => ({ ...prev, eta: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                         border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
                         mt-3 hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow rounded-lg text-white placeholder-white/80
                         focus:border-white focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="etd" className="text-sm font-semibold">ETD *</label>
            <input
              id="etd"
              type="datetime-local"
              value={portCallForm.etd}
              onChange={e => setPortCallForm(prev => ({ ...prev, etd: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A]
                         border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
                         mt-3 hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow rounded-lg text-white placeholder-white/80
                         focus:border-white focus:outline-none"
            />
          </div>
        </div>

        {/* Call Order (centered) */}
        <div className="lg:col-span-3 grid grid-cols-3">
          <div /> {/* empty */}
          <div className="space-y-2">
            <label htmlFor="order" className="text-sm font-semibold">Call Order *</label>
            <input
              id="order"
              type="number"
              value={portCallForm.order || ""}
              onChange={e => setPortCallForm(prev => ({ ...prev, order: +e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a]
                         shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                         transition-shadow border border-black border-4 rounded-lg text-white mt-3
                         focus:border-white focus:outline-none"
            />
          </div>
          <div /> {/* empty */}
        </div>

        {/* Submit */}
        <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#600f9e] hover:bg-[#491174]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       px-8 py-4 rounded-lg font-semibold uppercase
                       flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)]
                       hover:shadow-[15px_15px_0px_rgba(0,0,0,1)]
                       transition-shadow"
          >
            {isLoading
              ? <Settings className="animate-spin w-5 h-5" />
              : <Plus className="w-5 h-5" />}
            Create
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
        <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Schedules, Voyages & Port Calls
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
          Download a <b>full example</b> covering schedule, voyage, and port call import.
        </p>
      </div>

      <form onSubmit={importBulkVoyages} className="space-y-6">
        {bulkMode === "file" ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Select JSON File *
            </label>
            <div className="border-2 border-dashed border-white rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
              <input
                id="voyage-file"
                type="file"
                accept=".json"
                required
                className="hidden"
                onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="voyage-file" className="cursor-pointer flex flex-col items-center gap-4">
                <Upload className="w-16 h-16 text-slate-400" />
                <p className="text-lg font-semibold text-white">Click to upload JSON file</p>
                <p className="text-sm text-slate-400">or drag and drop</p>
              </label>
            </div>
            <p className="text-xs font-bold text-white">
              File must be an array of <b>schedules</b> with nested voyages and port calls.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">
              JSON Data *
            </label>
            <textarea
              className="w-full px-4 py-3 bg-[#0A1A2F] border border-white/80 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
              rows={24}
              placeholder={`[
  {
    "serviceCode": "WAX",
    "scheduleDescription": "West Africa Express",
    "voyages": [
      {
        "voyageNumber": "22N",
        "vesselName": "COSCO AFRICA",
        "departure": "2025-07-20T01:24:00Z",
        "arrival": "2025-07-25T07:12:00Z",
        "portCalls": [
          {
            "order": 1,
            "portCode": "CNSHA",
            "eta": "2025-07-20T01:24:00Z",
            "etd": "2025-07-20T18:00:00Z"
          },
          {
            "order": 2,
            "portCode": "SGSIN",
            "eta": "2025-07-22T08:00:00Z",
            "etd": "2025-07-22T20:00:00Z"
          }
        ]
      }
    ]
  }
]`}
              value={bulkData}
              onChange={e => setBulkData(e.target.value)}
              required
            />
            <p className="text-md font-bold text-white">
              Paste an array of <b>schedules</b>, each with `voyages` (and `portCalls` inside).
            </p>
            <div className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600 mt-4" style={cardGradient}>
              <h4 className="text-lg font-semibold text-cyan-400 mb-3">JSON Format:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-bold text-white">
                <div>• serviceCode (required)</div>
                <div>• scheduleDescription (optional)</div>
                <br/><br/>
                  <div className="col-span-2 md:col-span-3 mt-3">• voyages (array, required):</div>
                  <div>— voyageNumber (required)</div>
                  <div>— vesselName (required)</div>
                  <div>— departure, arrival (required, optional)</div>
                <br/>
                <div className="col-span-2 md:col-span-3 mt-3">• portCalls (array):</div>
                  <div>— order (required)</div>
                  <div>— portCode (required)</div>
                  <div>— eta, etd (optional)</div>
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
              <><Settings className="w-5 h-5 animate-spin" /> Importing…</>
            ) : (
              <><Upload className="w-5 h-5" /> Import Schedules</>
            )}
          </button>
        </div>
      </form>
    </div>
  </section>
      )}


      {/* SCHEDULE LIST */}
      {activeTab === "schedule-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <ListIcon className="text-cyan-400 w-8 h-8"/> Service Schedules
            </h2>
            <div
              className="bg-[#2e4972] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-10"
              style={cardGradient}
            >
              {/* 1st column */}
              <div className="space-y-2">
                <label
                  htmlFor="filter-code"
                  className="block text-sm font-semibold text-white"
                >
                  Service Code
                </label>
                <input
                  id="filter-code"
                  type="text"
                  placeholder="Service Code..."
                  value={filters.code}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, code: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>

              {/* 2nd column */}
              <div className="space-y-2">
                <label
                  htmlFor="filter-desc"
                  className="block text-sm font-semibold text-white"
                >
                  Description
                </label>
                <input
                  id="filter-desc"
                  type="text"
                  placeholder="Description..."
                  value={filters.description}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>

  {/* 3rd column: buttons, align to bottom */}
  <div className="flex gap-5 items-end justify-end">
    <button
      onClick={applyFilters}
      className="inline-flex items-center gap-2 h-10 px-8 bg-[#600f9e] hover:bg-[#491174] rounded-lg font-semibold uppercase text-base shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-shadow"
    >
      <Search className="w-5 h-5" />
      Apply
    </button>
    <button
      onClick={clearFilters}
      className="inline-flex items-center gap-2 h-10 px-8 bg-[#2a72dc] hover:bg-[#1e5bb8] rounded-lg font-semibold uppercase text-base shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-shadow"
    >
      <Filter className="w-5 h-5" />
      Clear
    </button>
  </div>
</div>

            {isLoadingSchedules ? (
              <div className="flex justify-center py-12">
                <Settings className="animate-spin w-8 h-8"/>
              </div>
            ) : allSchedules.length === 0 ? (
              <div className="text-center py-12 text-white">No schedules found</div>
            ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {allSchedules.map(s => (
          <ScheduleCard
            key={s.code}
            schedule={s}
            openVoyages={openVoyages}
            openEdit={openEdit}
          />
        ))}
      </div>
       )}
          </div>
        </section>
      )}

      {editModalOpen && selectedSchedule && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div
      className="bg-[#121c2d] border-2 border-white shadow-[30px_30px_0px_rgba(0,0,0,1)] rounded-3xl p-8 max-w-md w-full"
      style={cardGradient}
    >
      <header className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Edit3 /> Edit Service Schedule
        </h3>
        <button onClick={closeEdit}>
          <X className="w-6 h-6 text-white hover:text-[#00FFFF]" />
        </button>
      </header>

      <form onSubmit={e=>{
        e.preventDefault();
        applyEdit();
      }} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">Service Code</label>
          <input
            type="text"
            value={editForm.code}
            onChange={e =>
              setEditForm(prev => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
            }
            placeholder="WAX"
            required
            className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">Description</label>
          <input
            type="text"
            value={editForm.description || ""}
            onChange={e =>
              setEditForm(prev => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Weekly Atlantic Express"
            className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={closeEdit}
            className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
          >
            Cancel
          </button>
         <button
            type="submit"
            disabled={isUpdating}
            className={`bg-[#600f9e] hover:bg-[#491174]
              shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)]
              transition-shadow px-4 py-2 rounded-lg flex items-center gap-2
              ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isUpdating
              ? <Settings className="animate-spin w-4 h-4" />
              : <Save     className="w-4 h-4" />
            }
            <span>
              {isUpdating ? "Saving…" : "Save"}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* VOYAGE MODAL WITH SEARCH & PAGINATION */}
        {voyageModalOpen && selectedSchedule && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div
      className="bg-[#121c2d] rounded-3xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto border-2 border-white shadow-[30px_30px_0_rgba(0,0,0,1)]"
      style={cardGradient}
    >
      <header className="flex items-center justify-between mb-6 gap-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Ship /> Voyages for {selectedSchedule.code}
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-200" />
          <input
            type="text"
            placeholder="Search…"
            value={voyageSearch}
            onChange={e => { setVoyageSearch(e.target.value); setVoyagePage(1); }}
            className="w-md pl-10 pr-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#1A2A4A] shadow-[7px_7px_0_rgba(0,0,0,1)]
              hover:shadow-[10px_10px_0_rgba(0,0,0,1)] border-4 border-black rounded-lg text-white text-sm focus:outline-none"
          />
        </div>
        <button onClick={closeVoyages}>
          <X className="w-6 h-6 text-white hover:text-[#00FFFF]" />
        </button>
      </header>

      {isLoadingVoyages ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Settings className="animate-spin w-8 h-8 text-cyan-400" />
          <span className="ml-4 text-cyan-200 text-lg font-semibold mt-3">Loading voyages…</span>
        </div>
      ) : (
        <>
          {paginatedVoyages.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No voyages</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {paginatedVoyages.map(v => (
                <div
                  key={v.id}
                  className="group/voyage bg-[#2e4972] relative p-3 border border-white hover:bg-[#121c2d] hover:border-[#00FFFF] transition-all rounded-lg overflow-hidden shadow-[14px_14px_0_rgba(0,0,0,1)]
                  hover:shadow-[19px_19px_0_rgba(0,0,0,1)] transition-shadow"
                  style={cardGradient}
                >
                  {/* hover‑only gradient strip */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover/voyage:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)',
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)'
                    }}
                  />
                  {/* edit‑voyage clickable area */}
                  <div
                    onClick={() => openEditVoyage(v)}
                    className="relative flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* colored stripe */}
                      <div className="w-2 h-6 bg-gradient-to-b from-cyan-400 via-yellow-400 to-red-400 opacity-80 group-hover/voyage:opacity-100 transition-opacity" />
                      <div>
                        <span className="text-cyan-400 font-mono text-lg font-bold tracking-wider">
                          {v.voyageNumber}
                        </span>
                        <div className="text-md text-white font-mono">
                          {new Date(v.departure).toLocaleDateString()}
                          {v.arrival && <> → {new Date(v.arrival).toLocaleDateString()}</>}
                        </div>
                      </div>
                    </div>
                    {/* port‑calls icon + label */}
                    <div
                      className="relative flex flex-col items-end"
                      onClick={e => {
                        e.stopPropagation();
                        openPortCalls(v);
                      }}
                    >
                      <Anchor className="w-5 h-5 text-yellow-400 group-hover/voyage:text-cyan-400 transition-colors cursor-pointer mb-3" />
                      <span className="mt-1 text-xs font-semibold text-cyan-400 opacity-0 group-hover/voyage:opacity-100 transition-opacity">
                        Click anchor for Port Calls
                      </span>
                    </div>
                  </div>
                  {/* subtle glitch overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover/voyage:opacity-10 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-transparent animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalVoyagePages > 1 && (
            <div className="flex justify-between mt-6">
              <button
                disabled={voyagePage <= 1}
                onClick={() => setVoyagePage(p => p - 1)}
                className="bg-[#2a72dc]
                  hover:bg-[#1e5bb8]
                  disabled:hover:bg-[#2a72dc]
                  rounded-lg
                  font-semibold
                  uppercase
                  shadow-[7px_7px_0_rgba(0,0,0,1)]
                  hover:shadow-[10px_10px_0_rgba(0,0,0,1)]
                  disabled:hover:shadow-[7px_7px_0_rgba(0,0,0,1)]
                  transition-shadow
                  px-4
                  py-2
                  disabled:opacity-50
                  disabled:cursor-not-allowed "
              >
                Prev
              </button>
              <span className="text-sm text-white">
                Page {voyagePage} of {totalVoyagePages}
              </span>
              <button
                disabled={voyagePage >= totalVoyagePages}
                onClick={() => setVoyagePage(p => p + 1)}
                className="bg-[#2a72dc]
                  hover:bg-[#1e5bb8]
                  disabled:hover:bg-[#2a72dc]
                  rounded-lg
                  font-semibold
                  uppercase
                  shadow-[7px_7px_0_rgba(0,0,0,1)]
                  hover:shadow-[10px_10px_0_rgba(0,0,0,1)]
                  disabled:hover:shadow-[7px_7px_0_rgba(0,0,0,1)]
                  transition-shadow
                  px-4
                  py-2
                  disabled:opacity-50
                  disabled:cursor-not-allowed "
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
)}


      {/* EDIT VOYAGE MODAL */}
      {editVoyageModal && voyageEditForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] border-4 border-white rounded-3xl p-6 max-w-md w-full shadow-[25px_25px_0px_rgba(0,0,0,1)]" style={cardGradient}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit3 /> Edit Voyage
            </h3>
            <div className="space-y-6">
              <label className="text-sm font-semibold">Voyage Number</label>
              <input
                type="text"
                value={voyageEditForm.voyageNumber || ""}
                onChange={e => setVoyageEditForm({ ...voyageEditForm, voyageNumber: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold ">ETA</label>
              <input
                type="datetime-local"
                value={voyageEditForm.departure.slice(0,16)}
                onChange={e => setVoyageEditForm({ ...voyageEditForm, departure: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold">ETD</label>
              <input
                type="datetime-local"
                value={voyageEditForm.arrival?.slice(0,16) || ""}
                onChange={e => setVoyageEditForm({ ...voyageEditForm, arrival: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />


              <label className="text-sm font-semibold">Vessel Name</label>
              <input
                type="text"
                value={voyageEditForm.vesselName?.slice(0,16) || ""}
                onChange={e => setVoyageEditForm({ ...voyageEditForm, vesselName: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

            </div>

            
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setEditVoyageModal(false)}
                className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveEditVoyage}
                disabled={isUpdating}
                className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow
                  px-4 py-2 rounded-lg flex items-center gap-2
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUpdating
                  ? <Settings className="animate-spin w-4 h-4" />
                  : <Save     className="w-4 h-4" />
                }
                <span>
                  {isUpdating ? 'Saving…' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORT CALLS MODAL */}
      {portCallsModalOpen && selectedVoyage && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div className="rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
      <header className="flex justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Anchor /> Port Calls – {selectedVoyage.voyageNumber}
        </h3>
        <button onClick={closePortCalls}>
          <X className="w-6 h-6" />
        </button>
      </header>

      {selectedPortCalls.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No port calls defined</div>
      ) : (
        selectedPortCalls
          .sort((a, b) => a.order - b.order)
          .map((pc, i) => (
            <div
              key={i}
              onClick={() => openEditPortCall(pc)}
              className="relative flex items-center bg-[#121c2d] border border-slate-400 hover:border-cyan-400 rounded-lg p-4 mb-6 transition-colors group cursor-pointer shadow-[12px_12px_0_rgba(0,0,0,1)] hover:shadow-[20px_20px_0_rgba(0,0,0,1)] transition-shadow"
              style={cardGradient}
            >
              {/* Number badge */}
              <div className="absolute -left-6 z-10 ">
                <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center text-lg font-extrabold shadow-[4px_4px_0_rgba(0,0,0,1)] group-hover:bg-cyan-400 transition-colors">
                  {pc.order}
                </div>
              </div>

              {/* Main card content */}
              <div className="flex-1 pl-8">
                <div className="font-bold text-cyan-400 text-lg">{pc.portCode}</div>
                {pc.eta && <div className="text-sm">ETA: {new Date(pc.eta).toLocaleString()}</div>}
                {pc.etd && <div className="text-sm">ETD: {new Date(pc.etd).toLocaleString()}</div>}
              </div>

              {/* Hover-only hint */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Edit3 className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 text-xs font-semibold uppercase">Click to edit</span>
              </div>
            </div>
          ))
      )}
    </div>
  </div>
)}


      {/* EDIT PORT CALL MODAL */}
      {editPortCallModal && portCallEditForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-6 max-w-md w-full " style={cardGradient}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit3 /> Edit Port Call
            </h3>
            <div className="space-y-5">
              <label className="text-sm font-semibold ">PORT CODE</label>
              <input
                type="text"
                value={portCallEditForm.portCode || ""}
                onChange={e => setPortCallEditForm({ ...portCallEditForm, portCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold ">CALL ORDER</label>
              <input
                type="number"
                value={portCallEditForm.order}
                onChange={e => setPortCallEditForm({ ...portCallEditForm, order: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold ">ETA</label>
              <input
                type="datetime-local"
                value={portCallEditForm.eta?.slice(0,16) || ""}
                onChange={e => setPortCallEditForm({ ...portCallEditForm, eta: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold ">ETD</label>
              <input
                type="datetime-local"
                value={portCallEditForm.etd?.slice(0,16) || ""}
                onChange={e => setPortCallEditForm({ ...portCallEditForm, etd: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />
            </div>


            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setEditPortCallModal(false)}
                className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg"
              >
                Cancel
              </button>
               <button
                onClick={saveEditPortCall}
                disabled={isLoading}
                className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow px-4 py-2 rounded-lg flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading
                  ? <Settings className="animate-spin w-4 h-4" />
                  : <Save     className="w-4 h-4" />
                }
                <span>{isLoading ? 'Saving…' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
