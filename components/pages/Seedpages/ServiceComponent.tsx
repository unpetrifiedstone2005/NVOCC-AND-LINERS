"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Search,
  Filter,
  CalendarCheckIcon,
  CalendarSync,
  FileText,
  Download,
  Calendar,
  Clock,
  Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ServiceSchedule {
  id: string;
  code: string;
  description?: string;
  voyages?: Voyage[];
  _count: { voyages: number };
}

interface ServiceForm {
  code: string;
  description: string;
}

type VoyageCore = {
  voyageNumber: string;
  departure: string;
  arrival: string;
  vesselName: string;
};

interface Voyage extends VoyageCore {
  id: string;
  serviceId: string;
  portCalls?: PortCall[];
  service?: {
    id: string;
    code: string;
    description?: string;
  };
}

type VoyageForm = {
  serviceCode: string;
  voyageNumber: string;
  vesselName: string;
  // departure/arrival are derived
  departure?: string;
  arrival?: string;
};

interface PortCall {
  id?: string;
  voyageId: string;
  portCode: string;
  order: number;
  etd: string | null;
  eta: string | null;
}

// Draft row used in unified creator
type PortCallDraft = {
  uid: string;
  portCode: string;
  order: number | "";
  eta: string; // datetime-local string
  etd: string; // datetime-local string
};

type CutoffKind = "ERD" | "FCL_GATEIN" | "VGM" | "DOC_SI";
type CutoffRow = { kind: CutoffKind; at: string; source?: string };

const CUTOFF_LABEL: Record<CutoffKind, string> = {
  ERD: "Earliest Receiving",
  FCL_GATEIN: "FCL Cut-off (CY close)",
  VGM: "VGM Cut-off",
  DOC_SI: "Documentation (SI) Cut-off",
};

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────────
const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ServiceComponent() {
  const [activeTab, setActiveTab] = useState<
    "create-schedule" | "create-voyage-flow" | "bulk-import" | "schedule-list"
  >("create-schedule");

  const [serviceForm, setServiceForm] = useState<ServiceForm>({ code: "", description: "" });

  // Unified voyage+port calls form
  const [voyageForm, setVoyageForm] = useState<VoyageForm>({
    serviceCode: "",
    voyageNumber: "",
    vesselName: "",
  });

  const [pcRows, setPcRows] = useState<PortCallDraft[]>([
    { uid: uid(), portCode: "", order: 1, eta: "", etd: "" }, // origin
    { uid: uid(), portCode: "", order: 2, eta: "", etd: "" }, // next/final initially
  ]);

  // Data
  const [allSchedules, setAllSchedules] = useState<ServiceSchedule[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ code: "", description: "", voyageNumber: "" });

  // Modals / selections
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [voyageModalOpen, setVoyageModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ServiceSchedule | null>(null);
  const [selectedVoyage, setSelectedVoyage] = useState<Voyage | null>(null);
  const [editForm, setEditForm] = useState<ServiceSchedule>({} as ServiceSchedule);

  // Edit voyage modal
  const [editVoyageModal, setEditVoyageModal] = useState(false);
  const [voyageEditForm, setVoyageEditForm] = useState<Voyage | null>(null);

  // Port calls viewer + edit
  const [selectedPortCalls, setSelectedPortCalls] = useState<PortCall[]>([]);
  const [isLoadingPortCalls, setIsLoadingPortCalls] = useState(false);
  const [portCallsTotalPages, setPortCallsTotalPages] = useState<number>(1);
  const [portCallsTotal, setPortCallsTotal] = useState<number>(0);
  const [portCallsModalOpen, setPortCallsModalOpen] = useState(false);
  const [portCallsPage, setPortCallsPage] = useState<number>(1);
  const [portCallsPageSize, setPortCallsPageSize] = useState<number>(10);
  const [portCallsFilters, setPortCallsFilters] = useState<{ portCode?: string }>({});

  // NEW: Port call edit modal
  const [pcEditModalOpen, setPcEditModalOpen] = useState(false);
  const [pcEditForm, setPcEditForm] = useState<PortCall | null>(null);

  // Cutoffs modal
  const [cutoffModalOpen, setCutoffModalOpen] = useState(false);
  const [cutoffSaving, setCutoffSaving] = useState(false);
  const [cutoffTimezone, setCutoffTimezone] = useState("UTC");
  const [cutoffPortCall, setCutoffPortCall] = useState<PortCall | null>(null);
  const [cutoffRows, setCutoffRows] = useState<CutoffRow[]>([
    { kind: "ERD", at: "" },
    { kind: "FCL_GATEIN", at: "" },
    { kind: "VGM", at: "" },
    { kind: "DOC_SI", at: "" },
  ]);

  // Inline cutoffs for viewer
  const [cutoffsByPortCall, setCutoffsByPortCall] = useState<
    Record<string, { timezone?: string; values: Partial<Record<CutoffKind, string>> }>
  >({});

  // UI status
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingVoyages, setIsLoadingVoyages] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch & helpers
  // ───────────────────────────────────────────────────────────────────────────
  function useDebounce<T>(value: T, delay = 600) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  const debouncedFilters = useDebounce(filters, 300);

  async function fetchSchedules(page = 1) {
    setIsLoadingSchedules(true);
    try {
      const { data } = await axios.get<{
        items: ServiceSchedule[];
        total: number;
        totalPages: number;
        currentPage: number;
      }>("/api/seed/serviceschedules/get", {
        params: { page, code: filters.code, description: filters.description },
      });
      setAllSchedules(data.items);
      setTotalPages(data.totalPages);
    } catch {
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
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch {
      showMessage("error", "Could not load voyages");
    } finally {
      setIsLoadingVoyages(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "schedule-list") return;
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    fetchSchedules(1);
  }, [debouncedFilters, activeTab]); // eslint-disable-line

  useEffect(() => {
    if (activeTab === "schedule-list") {
      fetchSchedules(currentPage);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    if (["create-schedule", "create-voyage-flow", "bulk-import"].includes(activeTab) && !isLoadingSchedules) {
      fetchSchedules(1);
    }
  }, [activeTab]); // eslint-disable-line

  // ───────────────────────────────────────────────────────────────────────────
  // Create Schedule
  // ───────────────────────────────────────────────────────────────────────────
  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: created } = await axios.post<ServiceSchedule>("/api/seed/serviceschedules/post", serviceForm);
      showMessage("success", `Created schedule ${created.code}!`);
      setServiceForm({ code: "", description: "" });
      fetchSchedules(1);
    } catch (err: any) {
      const pd = err.response?.data || {};
      if (Array.isArray(pd.error)) {
        showMessage("error", pd.error.map((z: any) => z.message).join("; "));
      } else if (Array.isArray(pd.errors)) {
        showMessage("error", pd.errors.map((e: any) => e.message).join("; "));
      } else {
        showMessage("error", pd.error || "Failed to create schedule");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Unified: Create Voyage + Port Calls
  // ───────────────────────────────────────────────────────────────────────────
  function numericRows(rows: PortCallDraft[]) {
    return rows
      .filter((r) => typeof r.order === "number" && r.order >= 1)
      .sort((a, b) => Number(a.order) - Number(b.order));
  }
  function maxOrder(rows: PortCallDraft[]) {
    const nums = rows.map((r) => (typeof r.order === "number" ? r.order : 0));
    return nums.length ? Math.max(...nums) : 0;
  }
  function duplicateOrders(rows: PortCallDraft[]) {
    const map = new Map<number, number>();
    for (const r of rows) {
      if (typeof r.order !== "number") continue;
      map.set(r.order, (map.get(r.order) || 0) + 1);
    }
    const dups: number[] = [];
    map.forEach((cnt, ord) => {
      if (cnt > 1) dups.push(ord);
    });
    return dups;
  }
  function isFinalRow(row: PortCallDraft, rows = pcRows) {
    if (typeof row.order !== "number" || row.order < 1) return false;
    return row.order === maxOrder(rows);
  }

  function addPcRow() {
    const nextOrder = maxOrder(pcRows) + 1 || 1;
    setPcRows((rs) => [...rs, { uid: uid(), portCode: "", order: nextOrder, eta: "", etd: "" }]);
  }
  function removePcRow(uidToRemove: string) {
    setPcRows((rs) => {
      const filtered = rs.filter((r) => r.uid !== uidToRemove);
      if (filtered.length === 0) {
        // Always keep at least one
        return [{ uid: uid(), portCode: "", order: 1, eta: "", etd: "" }];
      }
      return filtered;
    });
  }
  function updatePcRow(uidRow: string, patch: Partial<PortCallDraft>) {
    setPcRows((rs) => rs.map((r) => (r.uid === uidRow ? { ...r, ...patch } : r)));
  }

  // Derived voyage window (live preview)
  const nrows = numericRows(pcRows);
  const origin = nrows[0];
  const finalRow = nrows[nrows.length - 1];
  const derivedDeparture = origin?.etd || ""; // voyage.departure
  const derivedArrival = finalRow?.eta || ""; // voyage.arrival

  function validateUnified(): string | null {
    if (!voyageForm.serviceCode) return "Select a schedule";
    if (!voyageForm.voyageNumber.trim()) return "Voyage number is required";
    if (!voyageForm.vesselName.trim()) return "Vessel name is required";

    if (pcRows.length === 0) return "Add at least one port call";

    const dups = duplicateOrders(pcRows);
    if (dups.length) return `Duplicate call order(s): ${dups.join(", ")}`;

    const maxOrd = maxOrder(pcRows);
    if (maxOrd < 1) return "At least one call must have order >= 1";

    for (const r of pcRows) {
      const ord = Number(r.order);
      if (!ord || ord < 1) return "Call order must be >= 1";
      if (!r.portCode.trim()) return `Port code required for call order ${ord}`;

      // ETA rule: required for non-origin calls, hidden for origin
      if (ord > 1 && !r.eta) return `ETA is required for call order ${ord}`;

      // ETD rule: required unless final call
      const final = ord === maxOrd;
      if (!final && !r.etd) return `ETD is required for call order ${ord}`;

      // Temporal rule
      if (r.eta && r.etd) {
        const eta = new Date(r.eta).getTime();
        const etd = new Date(r.etd).getTime();
        if (!(etd > eta)) return `ETD must be after ETA (order ${ord})`;
      }
    }

    // Derived voyage window
    if (!derivedDeparture) return "Origin must have an ETD (sets voyage departure).";
    if (!derivedArrival) return "Final call must have an ETA (sets voyage arrival).";

    const depMs = new Date(derivedDeparture).getTime();
    const arrMs = new Date(derivedArrival).getTime();
    if (!(arrMs > depMs)) return "Voyage arrival must be after voyage departure.";

    return null;
  }

  async function createVoyageAndPortCalls(e: React.FormEvent) {
    e.preventDefault();
    const err = validateUnified();
    if (err) return showMessage("error", err);

    setIsLoading(true);
    try {
      const schedule = allSchedules.find((s) => s.code === voyageForm.serviceCode);
      if (!schedule) throw new Error(`No ServiceSchedule "${voyageForm.serviceCode}"`);

      const payload = {
        voyageNumber: voyageForm.voyageNumber.trim(),
        departure: new Date(derivedDeparture).toISOString(),
        arrival: new Date(derivedArrival).toISOString(),
        vesselName: voyageForm.vesselName.trim(),
      };
      const { data: created } = await axios.post<Voyage>(
        `/api/seed/serviceschedules/${schedule.id}/voyages/post`,
        payload
      );

      // Create port calls
      for (const r of nrows) {
        const ord = Number(r.order);
        const body: any = {
          portUnlocode: r.portCode.trim().toUpperCase(),
          order: ord,
        };
        if (ord > 1 && r.eta) body.eta = new Date(r.eta).toISOString();
        if (r.etd) body.etd = new Date(r.etd).toISOString();
        await axios.post(
          `/api/seed/serviceschedules/${schedule.id}/voyages/${created.id}/portcalls/post`,
          body
        );
      }

      showMessage("success", `Voyage ${created.voyageNumber} and ${nrows.length} port call(s) created.`);

      // Reset
      setVoyageForm((prev) => ({ ...prev, voyageNumber: "", vesselName: "" }));
      setPcRows([
        { uid: uid(), portCode: "", order: 1, eta: "", etd: "" },
        { uid: uid(), portCode: "", order: 2, eta: "", etd: "" },
      ]);

      await fetchVoyages(schedule.id);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        let msg: string = (data as any)?.error ?? JSON.stringify(data);
        if ((data as any)?.errors && typeof (data as any).errors === "object") {
          msg = Object.values((data as any).errors as Record<string, any[]>).flat().join("; ");
        }
        showMessage("error", `HTTP ${status}: ${msg}`);
      } else if (error instanceof Error) {
        showMessage("error", error.message);
      } else {
        showMessage("error", "Failed to create voyage & port calls");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Bulk sample
  // ───────────────────────────────────────────────────────────────────────────
  function downloadSample() {
    const sample = [
      {
        serviceCode: "WAX",
        scheduleDescription: "West Africa Express",
        voyages: [
          {
            voyageNumber: "245N",
            vesselName: "MSC OSCAR",
            departure: "2025-09-01T08:00:00Z",
            arrival: "2025-09-24T12:00:00Z",
            portCalls: [
              { order: 1, portCode: "CNSHA", etd: "2025-09-01T08:00:00Z" },
              { order: 2, portCode: "USLAX", eta: "2025-09-15T20:00:00Z", etd: "2025-09-17T04:00:00Z" },
              { order: 3, portCode: "USNYC", eta: "2025-09-24T12:00:00Z" },
            ],
          },
        ],
      },
      {
        serviceCode: "IND-EUR",
        scheduleDescription: "India to Europe",
        voyages: [
          {
            voyageNumber: "108S",
            vesselName: "MV KALYPSO",
            departure: "2025-10-05T06:00:00Z",
            arrival: "2025-10-18T11:00:00Z",
            portCalls: [
              { order: 1, portCode: "INBOM", etd: "2025-10-05T06:00:00Z" },
              { order: 2, portCode: "INBLR", eta: "2025-10-06T09:00:00Z", etd: "2025-10-06T18:00:00Z" },
              { order: 3, portCode: "IEDUB", eta: "2025-10-13T14:30:00Z", etd: "2025-10-14T04:00:00Z" },
              { order: 4, portCode: "DEBER", eta: "2025-10-18T11:00:00Z" },
            ],
          },
        ],
      },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule-sample.json";
    a.click();
  }

  // Bulk import
  const [bulkData, setBulkData] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea" | "file">("textarea");

  async function importBulkVoyages(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    // helper: normalize ANY input into [{ serviceCode, scheduleDescription?, voyages: [...] }]
    function normalize(input: any): Array<{
      serviceCode: string;
      scheduleDescription?: string;
      voyages: Array<{
        voyageNumber: string;
        vesselName: string;
        departure?: string;
        arrival?: string;
        portCalls?: Array<{
          order: number;
          portCode: string;
          eta?: string;
          etd?: string;
        }>;
      }>;
    }> {
      const asArray = Array.isArray(input) ? input : [input];

      // If objects already have voyages[], assume “nested services” shape.
      const looksNested = asArray.every((s) => Array.isArray(s?.voyages));

      if (looksNested) {
        return asArray.map((s) => ({
          serviceCode: String(s.serviceCode || s.code || "").toUpperCase(),
          scheduleDescription: s.scheduleDescription ?? s.description ?? "",
          voyages: (s.voyages || []).map((v: any) => ({
            voyageNumber: String(v.voyageNumber || v.voyage || "").toUpperCase(),
            vesselName: String(v.vesselName || v.vessel || ""),
            departure: v.departure,
            arrival: v.arrival,
            portCalls: (v.portCalls || []).map((pc: any) => ({
              order: Number(pc.order ?? pc.sequence),
              portCode: String(pc.portCode ?? pc.unlocode ?? pc.portUnlocode ?? "").toUpperCase(),
              eta: pc.eta,
              etd: pc.etd,
            })),
          })),
        }));
      }

      // Else: treat as “flat voyages” shape
      return asArray.reduce((acc: any[], row: any) => {
        const svc = String(row.serviceCode || row.code || "").toUpperCase();
        if (!svc) return acc;

        let svcRec = acc.find((x) => x.serviceCode === svc);
        if (!svcRec) {
          svcRec = { serviceCode: svc, scheduleDescription: row.scheduleDescription || row.description || "", voyages: [] };
          acc.push(svcRec);
        }
        svcRec.voyages.push({
          voyageNumber: String(row.voyageNumber || row.voyage || "").toUpperCase(),
          vesselName: String(row.vesselName || row.vessel || ""),
          departure: row.departure,
          arrival: row.arrival,
          portCalls: Array.isArray(row.portCalls)
            ? row.portCalls.map((pc: any) => ({
                order: Number(pc.order ?? pc.sequence),
                portCode: String(pc.portCode ?? pc.unlocode ?? pc.portUnlocode ?? "").toUpperCase(),
                eta: pc.eta,
                etd: pc.etd,
              }))
            : [],
        });
        return acc;
      }, []);
    }

    try {
      // 1) Read input (file or textarea)
      let raw = bulkData;
      if (bulkMode === "file" && uploadedFile) raw = await uploadedFile.text();

      const parsed = JSON.parse(raw);
      const services = normalize(parsed).filter((s) => s.serviceCode && s.voyages?.length);

      if (!services.length) {
        showMessage("error", "No valid services/voyages found in JSON. Check field names and structure.");
        return;
      }

      // 2) Ensure we have schedules in memory
      if (!allSchedules.length) {
        await fetchSchedules(1);
      }

      const scheduleCache: Record<string, string> = {};
      let voyagesCreated = 0;
      let portCallsCreated = 0;

      for (const service of services) {
        // find or create schedule
        let scheduleId = scheduleCache[service.serviceCode];
        if (!scheduleId) {
          let schedule = allSchedules.find((s) => s.code === service.serviceCode);
          if (!schedule) {
            const { data: created } = await axios.post("/api/seed/serviceschedules/post", {
              code: service.serviceCode,
              description: service.scheduleDescription ?? "",
            });
            scheduleId = created.id;
            scheduleCache[service.serviceCode] = scheduleId;
            allSchedules.push(created);
          } else {
            scheduleId = schedule.id;
            scheduleCache[service.serviceCode] = scheduleId;
          }
        }

        // fetch existing voyages
        let existing: Voyage[] = [];
        try {
          const { data } = await axios.get<{ voyages: Voyage[] }>(
            `/api/seed/serviceschedules/${scheduleId}/voyages/get`,
            { params: { includeService: true } }
          );
          existing = data.voyages ?? [];
        } catch {
          existing = [];
        }

        for (const v of service.voyages) {
          if (!v.voyageNumber || !v.vesselName) {
            showMessage("error", `Skipping voyage with missing fields under ${service.serviceCode}`);
            continue;
          }

          // create voyage if not present
          let voyageId: string;
          const found = existing.find((ev) => ev.voyageNumber === v.voyageNumber);
          if (!found) {
            const { data: created } = await axios.post<Voyage>(
              `/api/seed/serviceschedules/${scheduleId}/voyages/post`,
              {
                voyageNumber: v.voyageNumber,
                departure: v.departure ? new Date(v.departure).toISOString() : undefined,
                arrival: v.arrival ? new Date(v.arrival).toISOString() : undefined,
                vesselName: v.vesselName,
              }
            );
            voyageId = created.id;
            voyagesCreated += 1;
          } else {
            voyageId = found.id;
          }

          // create port calls
          if (Array.isArray(v.portCalls)) {
            const pcs = v.portCalls
              .filter((pc) => pc.portCode && Number.isFinite(pc.order))
              .sort((a, b) => a.order - b.order);

            for (const pc of pcs) {
              try {
                await axios.post(
                  `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/post`,
                  {
                    portUnlocode: pc.portCode.toUpperCase(),
                    order: Number(pc.order),
                    eta: pc.eta ? new Date(pc.eta).toISOString() : undefined,
                    etd: pc.etd ? new Date(pc.etd).toISOString() : undefined,
                  }
                );
                portCallsCreated += 1;
              } catch (err: any) {
                const msg =
                  err?.response?.data?.error ||
                  (err?.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
                  err?.message ||
                  "Failed to create a port call";
                if (!/already exists/i.test(msg)) {
                  showMessage("error", `PortCall o${pc.order} ${pc.portCode}: ${msg}`);
                }
              }
            }
          }
        }
      }

      showMessage("success", `Imported ${voyagesCreated} voyage(s) and ${portCallsCreated} port call(s).`);
      setBulkData("");
      setUploadedFile(null);
      await fetchSchedules(1);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { status, data } = err.response;
        let msg = `HTTP ${status}`;
        if (data?.error) msg += `: ${data.error}`;
        if (data?.errors) msg += `: ${JSON.stringify(data.errors)}`;
        showMessage("error", msg);
      } else {
        showMessage("error", err?.message || "Failed to import");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Edit / View helpers
  // ───────────────────────────────────────────────────────────────────────────
  function applyFilters() {
    fetchSchedules(1);
  }
  function clearFilters() {
    setFilters({ code: "", description: "", voyageNumber: "" });
    fetchSchedules(1);
  }
  function openEdit(s: ServiceSchedule) {
    setSelectedSchedule(s);
    setEditForm(s);
    setEditModalOpen(true);
  }
  function closeEdit() {
    setEditModalOpen(false);
    setSelectedSchedule(null);
  }
  async function applyEdit() {
    if (!selectedSchedule) return;
    setIsUpdating(true);
    try {
      await axios.patch(`/api/seed/serviceschedules/${selectedSchedule.id}/patch`, {
        code: editForm.code,
        description: editForm.description,
      });
      showMessage("success", "Schedule updated");
      setEditModalOpen(false);
      fetchSchedules(currentPage);
    } catch (err: any) {
      let msg = "Failed to update schedule";
      if (axios.isAxiosError(err) && err.response) {
        const { status, data } = err.response;
        if (data && typeof data === "object" && "errors" in data) {
          msg = Object.values((data as any).errors).flat().join("; ");
        } else if (data && typeof data === "object" && "error" in data) {
          msg = (data as any).error;
        } else {
          msg = `Server returned ${status}`;
        }
      } else if (err instanceof Error) msg = err.message;
      showMessage("error", msg);
    } finally {
      setIsUpdating(false);
    }
  }

  async function openVoyages(s: ServiceSchedule) {
    setSelectedSchedule(s);
    setVoyageModalOpen(true);
    await fetchVoyages(s.id);
  }
  function closeVoyages() {
    setVoyageModalOpen(false);
    setSelectedSchedule(null);
    setVoyages([]);
  }

  function openEditVoyage(v: Voyage) {
    setVoyageEditForm(v);
    setEditVoyageModal(true);
  }
  async function saveEditVoyage() {
    if (!voyageEditForm?.id) return;
    const scheduleId = voyageEditForm.service?.id ?? selectedSchedule?.id;
    if (!scheduleId) return showMessage("error", "Unable to determine parent schedule");

    const patch: Partial<Voyage> = {
      id: voyageEditForm.id,
      voyageNumber: voyageEditForm.voyageNumber,
      vesselName: voyageEditForm.vesselName,
    };
    setIsUpdating(true);
    try {
      await axios.patch(`/api/seed/serviceschedules/${scheduleId}/voyages/${voyageEditForm.id}/patch`, patch);
      showMessage("success", "Voyage updated");
      setEditVoyageModal(false);
      await fetchVoyages(scheduleId);
    } catch {
      showMessage("error", "Failed to update voyage");
    } finally {
      setIsUpdating(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Port calls viewer + cutoffs
  // ───────────────────────────────────────────────────────────────────────────
  function closePortCalls() {
    setPortCallsModalOpen(false);
    setSelectedVoyage(null);
    setSelectedPortCalls([]);
    setCutoffsByPortCall({});
  }

  function defaultDocSiFromEtd(etdIso?: string | null) {
    if (!etdIso) return "";
    const t = new Date(etdIso).getTime();
    if (Number.isNaN(t)) return "";
    const suggested = new Date(t - 24 * 60 * 60 * 1000); // 24h before ETD
    return suggested.toISOString();
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
      const params: Record<string, any> = { page, pageSize };
      if (filters.portCode) params.portUnlocode = filters.portCode;
      const { data } = await axios.get<{
        portCalls: Array<{ id: string; voyageId: string; portUnlocode: string; order: number; eta: string; etd: string }>;
        total: number;
        totalPages: number;
      }>(`/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/get`, { params });

      const calls = data.portCalls.map((pc) => ({
        id: pc.id,
        voyageId: pc.voyageId,
        portCode: pc.portUnlocode,
        order: pc.order,
        eta: pc.eta,
        etd: pc.etd,
      }));

      setSelectedPortCalls(calls);
      setPortCallsTotal(data.total);
      setPortCallsTotalPages(data.totalPages);

      // FIXED PATHS: fetch cutoffs with full nested route
      await fetchCutoffsFor(scheduleId, voyageId, calls);
    } catch {
      setSelectedPortCalls([]);
      setPortCallsTotal(0);
      setPortCallsTotalPages(1);
      setCutoffsByPortCall({});
    } finally {
      setIsLoadingPortCalls(false);
    }
  }

  const [cutoffIdsByPc, setCutoffIdsByPc] = useState<
  Record<string, Partial<Record<CutoffKind, string>>>
>({});

  // FIXED: include scheduleId & voyageId and correct 'portcalls' path + '/get'
  async function fetchCutoffsFor(scheduleId: string, voyageId: string, calls: PortCall[]) {
    const entries = await Promise.all(
      calls.map(async (pc) => {
        if (!pc.id) return null;
        try {
          const { data } = await axios.get(
            `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/${pc.id}/cutoffs/get`
          );

          const values: Partial<Record<CutoffKind, string>> = {};
          const ids: Partial<Record<CutoffKind, string>> = {};

          (data.cutoffs ?? []).forEach((c: any) => {
            values[c.kind as CutoffKind] = c.at;
            ids[c.kind as CutoffKind] = c.id; // <-- capture id
          });

          // keep your DOC_SI suggestion
          if (!values.DOC_SI) {
            const suggested = defaultDocSiFromEtd(pc.etd || undefined);
            if (suggested) values.DOC_SI = suggested;
          }

          return [pc.id!, { tz: data.port?.timezone ?? "UTC", values, ids }] as const;
        } catch {
          const suggested = defaultDocSiFromEtd(pc.etd || undefined);
          const values: Partial<Record<CutoffKind, string>> = {};
          if (suggested) values.DOC_SI = suggested;
          return [pc.id!, { tz: "UTC", values, ids: {} }] as const;
        }
      })
    );

    const valueMap: Record<string, { timezone?: string; values: Partial<Record<CutoffKind, string>> }> = {};
    const idMap: Record<string, Partial<Record<CutoffKind, string>>> = {};

    for (const e of entries) {
      if (!e) continue;
      const [id, { tz, values, ids }] = e;
      valueMap[id] = { timezone: tz, values };
      idMap[id] = ids;
    }

    setCutoffsByPortCall(valueMap);
    setCutoffIdsByPc(idMap);
  }


  function fmtLocal(isoUtc: string, tz: string) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoUtc));
    } catch {
      return isoUtc;
    }
  }

  function setCutoffAt(kind: CutoffKind, atIso: string) {
    setCutoffRows((rows) => rows.map((r) => (r.kind === kind ? { ...r, at: atIso } : r)));
  }

  async function openCutoffs(pc: PortCall) {
    try {
      setCutoffPortCall(pc);
      setCutoffModalOpen(true);
      if (!pc.id) return;

      const scheduleId = selectedVoyage?.service?.id ?? selectedSchedule?.id;
      if (!scheduleId || !selectedVoyage?.id) throw new Error("Missing ids");

      // FIXED: nested GET path
      const { data } = await axios.get(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${selectedVoyage.id}/portcalls/${pc.id}/cutoffs/get`
      );
      setCutoffTimezone(data.port?.timezone ?? "UTC");

      // seed rows with server values (or blanks)
      const map = new Map<CutoffKind, string>();
      (data.cutoffs ?? []).forEach((c: any) => map.set(c.kind, c.at));
      let next = [
        { kind: "ERD", at: "" },
        { kind: "FCL_GATEIN", at: "" },
        { kind: "VGM", at: "" },
        { kind: "DOC_SI", at: "" },
      ] as CutoffRow[];

      next = next.map((row) => ({ ...row, at: map.get(row.kind) ?? "" }));

      if (!map.get("DOC_SI")) {
        const suggested = defaultDocSiFromEtd(pc.etd || undefined);
        if (suggested) next = next.map((r) => (r.kind === "DOC_SI" ? { ...r, at: suggested } : r));
      }

      setCutoffRows(next);
    } catch {
      const suggested = defaultDocSiFromEtd(pc.etd || undefined);
      setCutoffTimezone("UTC");
      setCutoffRows([
        { kind: "ERD", at: "" },
        { kind: "FCL_GATEIN", at: "" },
        { kind: "VGM", at: "" },
        { kind: "DOC_SI", at: suggested || "" },
      ]);
      showMessage("error", "Failed to load cut-offs from server; showing defaults/suggestions.");
    }
  }

  function closeCutoffs() {
    setCutoffModalOpen(false);
    setCutoffPortCall(null);
  }

  // FIXED: nested PATCH + refresh GET
async function saveCutoffs() {
  if (!cutoffPortCall?.id) return;
  const scheduleId = selectedVoyage?.service?.id ?? selectedSchedule?.id;
  const voyageId = selectedVoyage?.id;
  if (!scheduleId || !voyageId) return showMessage("error", "Missing schedule/voyage id");

  const idsForPc = cutoffIdsByPc[cutoffPortCall.id] || {};
  const toSave = cutoffRows.filter((r) => r.at);

  if (toSave.length === 0) {
    showMessage("error", "No cut-offs to save");
    return;
  }

  setCutoffSaving(true);
  try {
    const results = await Promise.allSettled(
      toSave.map((r) => {
        const cutoffId = idsForPc[r.kind];
        if (!cutoffId) {
          // your API only supports update-by-id; no id means nothing to patch
          return Promise.reject(new Error(`No existing ${r.kind} cutoff id to update.`));
        }
        return axios.patch(
          `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/${cutoffPortCall.id}/cutoffs/${cutoffId}/patch`,
          { at: r.at, source: r.source ?? "MANUAL" }
        );
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      showMessage("error", `Some cut-offs failed: ${failed.length}. Check console/network.`);
    } else {
      showMessage("success", "Cut-offs saved");
      setCutoffModalOpen(false);
    }

    // refresh inline data (values + ids)
    try {
      const { data } = await axios.get(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageId}/portcalls/${cutoffPortCall.id}/cutoffs/get`
      );
      const values: Partial<Record<CutoffKind, string>> = {};
      const ids2: Partial<Record<CutoffKind, string>> = {};
      (data.cutoffs ?? []).forEach((c: any) => {
        values[c.kind as CutoffKind] = c.at;
        ids2[c.kind as CutoffKind] = c.id;
      });
      setCutoffsByPortCall((prev) => ({
        ...prev,
        [cutoffPortCall.id!]: { timezone: data.port?.timezone ?? "UTC", values },
      }));
      setCutoffIdsByPc((prev) => ({ ...prev, [cutoffPortCall.id!]: ids2 }));
    } catch {
      /* ignore */
    }
  } catch (e: any) {
    const msg = axios.isAxiosError(e)
      ? e.response?.data?.error || "Failed to save cut-offs"
      : "Failed to save cut-offs";
    showMessage("error", msg);
  } finally {
    setCutoffSaving(false);
  }
}


  // NEW: Port call edit helpers
  function openEditPortCall(pc: PortCall) {
    setPcEditForm({ ...pc });
    setPcEditModalOpen(true);
  }
  function closeEditPortCall() {
    setPcEditModalOpen(false);
    setPcEditForm(null);
  }
  async function saveEditPortCall() {
    if (!pcEditForm?.id || !selectedVoyage) return;
    const scheduleId = selectedVoyage.service?.id ?? selectedSchedule?.id;
    if (!scheduleId) return showMessage("error", "Unable to determine schedule id");

    const body: any = {
      portUnlocode: pcEditForm.portCode?.trim()?.toUpperCase(),
      order: Number(pcEditForm.order),
      eta: pcEditForm.eta ? new Date(pcEditForm.eta).toISOString() : null,
      etd: pcEditForm.etd ? new Date(pcEditForm.etd).toISOString() : null,
    };
    setIsUpdating(true);
    try {
      await axios.patch(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${selectedVoyage.id}/portcalls/${pcEditForm.id}/patch`,
        body
      );
      showMessage("success", "Port call updated");
      await fetchPortCalls(scheduleId, selectedVoyage.id, portCallsPage, portCallsPageSize, portCallsFilters);
      await fetchVoyages(scheduleId);
      closeEditPortCall();
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ||
          (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
          "Failed to update port call"
        : "Failed to update port call";
      showMessage("error", msg);
    } finally {
      setIsUpdating(false);
    }
  }

  function ScheduleCard({
    schedule: s,
    openVoyages,
    openEdit,
  }: {
    schedule: ServiceSchedule;
    openVoyages: (s: ServiceSchedule) => void;
    openEdit: (s: ServiceSchedule) => void;
  }) {
    const [overStrip, setOverStrip] = useState(false);
    return (
      <div
        onClick={() => openEdit(s)}
        className="group relative bg-[#121c2d] rounded-lg p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] transition-shadow border border-slate-400 hover:border-cyan-400"
        style={cardGradient}
      >
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#00FFFF]">{s.code}</h3>
            {s.description && <p className="text-sm text-white">{s.description}</p>}
          </div>
        </div>
        <div
          className="relative overflow-visible mb-4"
          onMouseEnter={() => setOverStrip(true)}
          onMouseLeave={() => setOverStrip(false)}
          onClick={(e) => {
            e.stopPropagation();
            openVoyages(s);
          }}
        >
          <div className="cursor-pointer shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-black/40 to-transparent p-3 border border-cyan-400/20 hover:border-cyan-400/60 transition-all rounded-lg">
            <div
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)",
                clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
              }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider">
                {s._count.voyages === 1 ? "Voyage" : "Voyages"}
              </span>
              <span className="text-white font-mono text-lg font-extrabold">{s._count.voyages}</span>
            </div>
          </div>
        </div>
        <div className={`mt-6 pt-3 border-t border-[#00FFFF] transition-opacity ${overStrip ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
          <div className="flex items-center gap-2 text-[#00FFFF] text-xs font-semibold">
            <Edit3 className="w-3 h-3" /> Click to edit
          </div>
        </div>
      </div>
    );
  }
  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
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
        <div
          className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-900/30 border border-green-400 text-green-400"
              : "bg-red-900/30 border border-red-400 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />} {message.text}
        </div>
      )}

      {/* TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { key: "create-schedule", icon: <CalendarSync className="w-5 h-5" />, label: "Create Schedule" },
            { key: "create-voyage-flow", icon: <Navigation className="w-5 h-5" />, label: "Create Voyage + Port Calls" },
            { key: "bulk-import", icon: <Upload className="w-5 h-5" />, label: "Bulk Import" },
            { key: "schedule-list", icon: <ListIcon className="w-5 h-5" />, label: "Schedule List" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-1 py-2 uppercase font-bold transition shadow border-2 border-black flex items-center justify-center gap-2 ${
                activeTab === (tab.key as any)
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

      {/* CREATE SCHEDULE */}
      {activeTab === "create-schedule" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-8">
              <CalendarSync className="text-cyan-400 w-8 h-8" /> Create Service Schedule
            </h2>
            <form onSubmit={createSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Service Code *</label>
                <input
                  type="text"
                  value={serviceForm.code}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
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
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Weekly Atlantic Express"
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                />
              </div>
              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* CREATE VOYAGE + PORT CALLS (departure/arrival derived from PCs) */}
      {activeTab === "create-voyage-flow" && (
        <section className="px-6 md:px-16 mb-16">
          <div className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Navigation className="text-cyan-400 w-8 h-8" /> Create Voyage + Port Calls
            </h2>

            <form onSubmit={createVoyageAndPortCalls} className="space-y-8">
              {/* Voyage fields (departure/arrival are derived and shown below) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Service Schedule *</label>
                  <select
                    value={voyageForm.serviceCode}
                    onChange={(e) => setVoyageForm((prev) => ({ ...prev, serviceCode: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  >
                    <option value="">Select Schedule</option>
                    {isLoadingSchedules && <option value="" disabled>Loading schedules…</option>}
                    {!isLoadingSchedules && allSchedules.length === 0 && (
                      <option value="" disabled>No schedules found</option>
                    )}
                    {allSchedules.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} – {s.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Voyage Number *</label>
                  <input
                    type="text"
                    value={voyageForm.voyageNumber}
                    onChange={(e) => setVoyageForm((prev) => ({ ...prev, voyageNumber: e.target.value }))}
                    placeholder="245N"
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold">Vessel Name *</label>
                  <input
                    type="text"
                    value={voyageForm.vesselName}
                    onChange={(e) => setVoyageForm((prev) => ({ ...prev, vesselName: e.target.value }))}
                    placeholder="MSC OSCAR"
                    required
                    className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[12px_10px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Derived window preview */}
              <div className="bg-[#0b1b33] border border-white/20 rounded-xl p-4" style={cardGradient}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-300">Voyage Departure (from origin ETD)</div>
                    <div className="text-white font-mono mt-1">
                      {derivedDeparture ? new Date(derivedDeparture).toLocaleString() : <span className="text-amber-300">— set ETD on call order 1</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-300">Voyage Arrival (from final ETA)</div>
                    <div className="text-white font-mono mt-1">
                      {derivedArrival ? new Date(derivedArrival).toLocaleString() : <span className="text-amber-300">— set ETA on highest call order</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Port Calls rows */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Anchor className="text-cyan-400 w-6 h-6" /> Port Calls
                </h3>

                <div className="space-y-4">
                  {pcRows
                    .slice()
                    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
                    .map((row) => {
                      const ord = Number(row.order || 0);
                      const final = isFinalRow(row);
                      return (
                        <div
                          key={row.uid}
                          className="relative grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#121c2d] border border-slate-400 hover:border-cyan-400 rounded-xl p-4 shadow-[10px_10px_0_rgba(0,0,0,1)]"
                          style={cardGradient}
                        >
                          {/* Order */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-semibold">Call Order *</label>
                            <input
                              type="number"
                              min={1}
                              value={row.order }
                              onChange={(e) => updatePcRow(row.uid, { order: e.target.value === "" ? "" : Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white"
                              required
                            />
                          </div>

                          {/* Port code */}
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-xs font-semibold">Port (UN/LOCODE) *</label>
                            <input
                              type="text"
                              value={row.portCode}
                              onChange={(e) => updatePcRow(row.uid, { portCode: e.target.value.toUpperCase() })}
                              placeholder="SGSIN"
                              className="w-full px-3 py-2 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white"
                              required
                            />
                          </div>

                          {/* ETA (hide for origin) */}
                          {ord > 1 ? (
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-xs font-semibold">ETA *</label>
                              <input
                                type="datetime-local"
                                value={row.eta}
                                onChange={(e) => updatePcRow(row.uid, { eta: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
                              />
                            </div>
                          ) : (
                            <div className="md:col-span-3 flex items-end">
                              <div className="text-xs text-white/70 italic">Origin call — ETA not required</div>
                            </div>
                          )}

                          {/* ETD (optional only on final) */}
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-xs font-semibold">
                              ETD {final ? "(optional — final call)" : "*"}
                            </label>
                            <input
                              type="datetime-local"
                              value={row.etd}
                              onChange={(e) => updatePcRow(row.uid, { etd: e.target.value })}
                              required={!final}
                              className="w-full px-3 py-2 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
                            />
                          </div>

                          {/* Remove */}
                          <div className="md:col-span-1 flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => removePcRow(row.uid)}
                              className="px-3 py-2 bg-[#1A2A4A] hover:bg-[#2A3A5A] rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)]"
                              title="Remove row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={addPcRow}
                      className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg flex items-center gap-2 text-white uppercase text-sm shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                    >
                      <Plus className="w-4 h-4" /> Add Port Call
                    </button>

                    {/* Duplicate orders warning */}
                    {duplicateOrders(pcRows).length > 0 && (
                      <div className="text-xs text-amber-300 font-semibold">
                        Duplicate call order(s): {duplicateOrders(pcRows).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? <Settings className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  Create Voyage & Port Calls
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* BULK IMPORT */}
      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16">
          <div className="rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-2 border-white" style={cardGradient}>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Schedules, Voyages & Port Calls
            </h2>

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

            <div className="mb-6">
              <button
                type="button"
                onClick={downloadSample}
                className="bg-[#2a72dc] hover:bg-[#00FFFF] hover:text-black px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-all"
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
                  <label className="text-sm font-semibold text-slate-200">Select JSON File *</label>
                  <div className="border-2 border-dashed border-white rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
                    <input
                      id="voyage-file"
                      type="file"
                      accept=".json"
                      required
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
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
                  <label className="text-sm font-semibold text-white">JSON Data *</label>
                  <textarea
                    className="w-full px-4 py-3 bg-[#0A1A2F] border border-white/80 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                    rows={16}
                    placeholder={`[
  {
    "serviceCode": "WAX",
    "scheduleDescription": "West Africa Express",
    "voyages": [
      {
        "voyageNumber": "22N",
        "vesselName": "COSCO AFRICA",
        "portCalls": [
          { "order": 1, "portCode": "CNSHA", "etd": "2025-07-20T18:00:00Z" },
          { "order": 2, "portCode": "SGSIN", "eta": "2025-07-22T08:00:00Z", "etd": "2025-07-22T20:00:00Z" }
        ]
      }
    ]
  }
]`}
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    required
                  />
                  <p className="text-md font-bold text-white">
                    Paste an array of <b>schedules</b>, each with \`voyages\` (and \`portCalls\` inside).
                  </p>
                  <div className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600 mt-4" style={cardGradient}>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-3">JSON Format:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-bold text-white">
                      <div>• serviceCode (required)</div>
                      <div>• scheduleDescription (optional)</div>
                      <br />
                      <br />
                      <div className="col-span-2 md:col-span-3 mt-3">• voyages (array, required):</div>
                      <div>— voyageNumber</div>
                      <div>— vesselName</div>
                      <div>— portCalls (derive dep/arr)</div>
                      <br />
                      <div className="col-span-2 md:col-span-3 mt-3">• portCalls (array):</div>
                      <div>— order</div>
                      <div>— portCode</div>
                      <div>— eta, etd</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? (
                    <>
                      <Settings className="w-5 h-5 animate-spin" /> Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" /> Import Schedules
                    </>
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
              <ListIcon className="text-cyan-400 w-8 h-8" /> Service Schedules
            </h2>
            <div className="bg-[#2e4972] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-10" style={cardGradient}>
              <div className="space-y-2">
                <label htmlFor="filter-code" className="block text-sm font-semibold text-white">Service Code</label>
                <input
                  id="filter-code"
                  type="text"
                  placeholder="Service Code..."
                  value={filters.code}
                  onChange={(e) => setFilters((prev) => ({ ...prev, code: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="filter-desc" className="block text-sm font-semibold text-white">Description</label>
                <input
                  id="filter-desc"
                  type="text"
                  placeholder="Description..."
                  value={filters.description}
                  onChange={(e) => setFilters((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
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
                <Settings className="animate-spin w-8 h-8" />
              </div>
            ) : allSchedules.length === 0 ? (
              <div className="text-center py-12 text-white">No schedules found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {allSchedules.map((s) => (
                  <ScheduleCard key={s.code} schedule={s} openVoyages={openVoyages} openEdit={openEdit} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* EDIT SCHEDULE MODAL */}
      {editModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] border-2 border-white shadow-[30px_30px_0px_rgba(0,0,0,1)] rounded-3xl p-8 max-w-md w-full" style={cardGradient}>
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 /> Edit Service Schedule
              </h3>
              <button onClick={closeEdit}><X className="w-6 h-6 text-white hover:text-[#00FFFF]" /></button>
            </header>

            <form onSubmit={(e) => { e.preventDefault(); applyEdit(); }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Service Code</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
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
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Weekly Atlantic Express"
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-2 focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={closeEdit} className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg">Cancel</button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow px-4 py-2 rounded-lg flex items-center gap-2 ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isUpdating ? <Settings className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} <span>{isUpdating ? "Saving…" : "Save"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOYAGES MODAL */}
      {voyageModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] rounded-3xl p-8 w-full max-w-5xl max-height-[90vh] max-h-[90vh] overflow-y-auto border-2 border-white shadow-[30px_30px_0_rgba(0,0,0,1)]" style={cardGradient}>
            <header className="flex items-center justify-between mb-6 gap-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Ship /> Voyages for {selectedSchedule.code}
              </h3>
              <button onClick={closeVoyages}><X className="w-6 h-6 text-white hover:text-[#00FFFF]" /></button>
            </header>

            {isLoadingVoyages ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Settings className="animate-spin w-8 h-8 text-cyan-400" />
                <span className="ml-4 text-cyan-200 text-lg font-semibold mt-3">Loading voyages…</span>
              </div>
            ) : voyages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No voyages</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {voyages.map((v) => (
                  <div
                    key={v.id}
                    className="group/voyage bg-[#2e4972] relative p-3 border border-white hover:bg-[#121c2d] hover:border-[#00FFFF] transition-all rounded-lg overflow-hidden shadow-[14px_14px_0_rgba(0,0,0,1)] hover:shadow-[19px_19px_0_rgba(0,0,0,1)] transition-shadow"
                    style={cardGradient}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover/voyage:opacity-100 transition-opacity pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)",
                        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
                      }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div
                        onClick={() => openEditVoyage(v)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-2 h-6 bg-gradient-to-b from-cyan-400 via-yellow-400 to-red-400 opacity-80 group-hover/voyage:opacity-100 transition-opacity" />
                        <div>
                          <span className="text-cyan-400 font-mono text-lg font-bold tracking-wider">{v.voyageNumber}</span>
                          <div className="text-md text-white font-mono">
                            {new Date(v.departure).toLocaleDateString()}
                            {v.arrival && <> → {new Date(v.arrival).toLocaleDateString()}</>}
                          </div>
                        </div>
                      </div>

                      <div className="relative flex flex-col items-end">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setSelectedVoyage(v);
                            setPortCallsModalOpen(true);
                            const scheduleId = v.service?.id ?? selectedSchedule?.id;
                            if (scheduleId && v.id) {
                              await fetchPortCalls(scheduleId, v.id, portCallsPage, portCallsPageSize, portCallsFilters);
                            }
                          }}
                          className="px-3 py-2 rounded bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10"
                          title="View Port Calls"
                        >
                          <Anchor className="w-4 h-4 inline-block mr-1" /> Port Calls
                        </button>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PORT CALLS VIEWER (with inline cut-offs) */}
      {portCallsModalOpen && selectedVoyage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={cardGradient}>
            <header className="flex justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Anchor /> Port Calls — {selectedVoyage.voyageNumber}
              </h3>
              <button onClick={closePortCalls}>
                <X className="w-6 h-6" />
              </button>
            </header>

            {isLoadingPortCalls ? (
              <div className="flex justify-center py-10">
                <Settings className="animate-spin w-6 h-6 text-cyan-300" />
              </div>
            ) : selectedPortCalls.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No port calls defined</div>
            ) : (
              selectedPortCalls
                .sort((a, b) => a.order - b.order)
                .map((pc) => {
                  const cut = pc.id ? cutoffsByPortCall[pc.id] : undefined;
                  const tz = cut?.timezone ?? "UTC";
                  return (
                    <div
                      key={pc.id ?? `${pc.portCode}-${pc.order}`}
                      className="relative flex flex-col gap-3 bg-[#121c2d] border border-slate-400 hover:border-cyan-400 rounded-lg p-4 mb-6 transition-colors group cursor-default shadow-[12px_12px_0_rgba(0,0,0,1)] hover:shadow-[20px_20px_0_rgba(0,0,0,1)] transition-shadow"
                      style={cardGradient}
                    >
                      {/* Order badge */}
                      <div className="absolute -left-6 z-10">
                        <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center text-lg font-extrabold shadow-[4px_4px_0_rgba(0,0,0,1)]">
                          {pc.order}
                        </div>
                      </div>

                      {/* Main line */}
                      <div className="flex items-center justify-between pl-8">
                        <div className="font-bold text-cyan-400 text-lg">{pc.portCode}</div>
                        <div className="flex gap-2">
                          {/* NEW: Edit Port Call */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPortCall(pc);
                            }}
                            className="px-3 py-2 rounded bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10"
                            title="Edit Port Call"
                          >
                            <Edit3 className="w-4 h-4 inline-block mr-1" /> Edit
                          </button>

                          {/* Existing: Cutoffs */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCutoffs(pc);
                            }}
                            className="px-3 py-2 rounded bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10"
                            title="View/Edit Cut-offs"
                          >
                            <Calendar className="w-4 h-4 inline-block mr-1" /> Cutoffs
                          </button>
                        </div>
                      </div>

                      {/* Times */}
                      <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {pc.eta && <div>ETA: {new Date(pc.eta).toLocaleString()}</div>}
                        {pc.etd && <div>ETD: {new Date(pc.etd).toLocaleString()}</div>}
                      </div>

                      {/* Inline cutoffs summary */}
                      <div className="pl-8 pt-2">
                        <div className="text-xs text-slate-300 mb-2">Cut-offs {cut?.timezone ? `(Local: ${tz})` : ""}</div>
                        <div className="flex flex-wrap gap-2">
                          {(["ERD", "FCL_GATEIN", "VGM", "DOC_SI"] as CutoffKind[]).map((k) => {
                            const at = cut?.values?.[k];
                            if (!at) return null;
                            return (
                              <span
                                key={k}
                                className="text-xs px-2 py-1 rounded-full border border-white/20 bg-white/10"
                                title={`${CUTOFF_LABEL[k]} — ${at}`}
                              >
                                <b>{k}</b>: {fmtLocal(at, tz)}
                              </span>
                            );
                          })}
                          {!cut || Object.keys(cut.values || {}).length === 0 ? (
                            <span className="text-xs text-slate-400 italic">No cut-offs yet</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* EDIT VOYAGE MODAL (dep/arr readonly; edit via port calls) */}
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
                onChange={(e) => setVoyageEditForm({ ...voyageEditForm, voyageNumber: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold">Departure (derived from origin ETD)</label>
              <input
                type="text"
                value={new Date(voyageEditForm.departure).toLocaleString()}
                readOnly
                className="w-full px-4 py-3 bg-[#0A1A2F] text-white/80 mt-2 border-4 border-black rounded-lg"
              />

              <label className="text-sm font-semibold">Arrival (derived from final ETA)</label>
              <input
                type="text"
                value={voyageEditForm.arrival ? new Date(voyageEditForm.arrival).toLocaleString() : ""}
                readOnly
                className="w-full px-4 py-3 bg-[#0A1A2F] text-white/80 mt-2 border-4 border-black rounded-lg"
              />

              <label className="text-sm font-semibold">Vessel Name</label>
              <input
                type="text"
                value={voyageEditForm.vesselName || ""}
                onChange={(e) => setVoyageEditForm({ ...voyageEditForm, vesselName: e.target.value })}
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <div className="text-xs text-slate-300">
                To change departure/arrival, edit the <b>Port Calls</b> (origin ETD & final ETA).
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setEditVoyageModal(false)} className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-4 py-2 shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg">Cancel</button>
              <button
                onClick={saveEditVoyage}
                disabled={isUpdating}
                className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow px-4 py-2 rounded-lg flex items-center gap-2 ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isUpdating ? <Settings className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isUpdating ? "Saving… " : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: EDIT PORT CALL MODAL */}
      {pcEditModalOpen && pcEditForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121c2d] border-2 border-white shadow-[30px_30px_0_rgba(0,0,0,1)] rounded-3xl p-6 w-full max-w-lg" style={cardGradient}>
            <header className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> Edit Port Call
              </h3>
              <button onClick={closeEditPortCall}><X className="w-6 h-6 text-white hover:text-[#00FFFF]" /></button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Order *</label>
                <input
                  type="number"
                  min={1}
                  value={pcEditForm.order || ""}
                  onChange={(e) => setPcEditForm((p) => (p ? { ...p, order: Number(e.target.value) } : p))}
                  className="w-full px-3 py-2 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white"
                />
              </div>

              {/* UN/LOCODE */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Port (UN/LOCODE) *</label>
                <input
                  type="text"
                  value={pcEditForm.portCode}
                  onChange={(e) => setPcEditForm((p) => (p ? { ...p, portCode: e.target.value.toUpperCase() } : p))}
                  className="w-full px-3 py-2 bg-[#2D4D8B] border-4 border-black rounded-lg text-white focus:border-white"
                />
              </div>

              {/* ETA (not required for origin) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">ETA</label>
                <input
                  type="datetime-local"
                  value={pcEditForm.eta ? new Date(pcEditForm.eta).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    setPcEditForm((p) =>
                      p ? { ...p, eta: e.target.value ? new Date(e.target.value).toISOString() : null } : p
                    )
                  }
                  className="w-full px-3 py-2 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
                />
                <div className="text-[10px] text-slate-300">Required for non-origin calls.</div>
              </div>

              {/* ETD (optional for final call) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">ETD</label>
                <input
                  type="datetime-local"
                  value={pcEditForm.etd ? new Date(pcEditForm.etd).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    setPcEditForm((p) =>
                      p ? { ...p, etd: e.target.value ? new Date(e.target.value).toISOString() : null } : p
                    )
                  }
                  className="w-full px-3 py-2 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
                />
                <div className="text-[10px] text-slate-300">Required unless this is the final call.</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeEditPortCall} className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500">
                Cancel
              </button>
              <button
                onClick={saveEditPortCall}
                disabled={isUpdating}
                className="px-4 py-2 rounded bg-[#22D3EE] text-black font-semibold hover:brightness-110 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-2"
              >
                {isUpdating ? <Settings className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>

            <div className="text-[11px] text-slate-400 mt-3">
              Backend validation applies (chronology, window fit, existing UN/LOCODE, etc.).
            </div>
          </div>
        </div>
      )}

      {/* CUT-OFFS MODAL */}
      {cutoffModalOpen && cutoffPortCall && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0A1A2F] text-white p-6 shadow-[20px_20px_0_rgba(0,0,0,1)] border border-white/10" style={cardGradient}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Port Call Cut-offs — {cutoffPortCall.portCode}
              </h3>
              <button onClick={closeCutoffs}><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-4">
              {cutoffRows.map((row) => (
                <div key={row.kind} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center bg-[#1A2A4A] p-4 rounded-xl border border-white/10">
                  <div>
                    <div className="text-sm text-slate-300">{CUTOFF_LABEL[row.kind]}</div>
                    {row.at && (
                      <div className="text-xs text-slate-400 mt-1">
                        Local ({cutoffTimezone}): {fmtLocal(row.at, cutoffTimezone)}
                      </div>
                    )}
                    {row.kind === "DOC_SI" && !row.at && (
                      <div className="text-xs text-amber-300 mt-1">
                        No DOC/SI from server — suggested is 24h before ETD (auto-filled if ETD known).
                      </div>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    value={row.at ? new Date(row.at).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setCutoffAt(row.kind, new Date(e.target.value).toISOString())}
                    className="w-full px-3 py-2 rounded bg-[#2D4D8B] border border-black shadow-[4px_4px_0_rgba(0,0,0,1)]"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeCutoffs} className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500">Cancel</button>
              <button
                onClick={saveCutoffs}
                disabled={cutoffSaving}
                className="px-4 py-2 rounded bg-[#22D3EE] text-black font-semibold hover:brightness-110 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> {cutoffSaving ? "Saving..." : "Save Cut-offs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}