"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Ship,
  Navigation,
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
} from "lucide-react";
import Papa from "papaparse";

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
  departure: string; // ISO
  arrival: string; // ISO
  vesselName: string;
  polUnlocode?: string | null; // NEW
  podUnlocode?: string | null; // NEW
};

interface Voyage extends VoyageCore {
  id: string;
  serviceId: string;
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
  departure?: string; // local input value
  arrival?: string; // local input value
  polUnlocode: string; // NEW
  podUnlocode: string; // NEW
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

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function fromLocalInputValue(localValue?: string | null): string | null {
  if (!localValue) return null;
  // Value is local time; Date will create the correct UTC instant.
  return new Date(localValue).toISOString();
}

const UNLOCODE_5 = /^[A-Za-z0-9]{5}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ServiceComponent() {
  const [activeTab, setActiveTab] = useState<
    "create-schedule" | "create-voyage" | "bulk-import" | "schedule-list"
  >("create-schedule");

  // Create schedule
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    code: "",
    description: "",
  });

  // Create voyage
  const [voyageForm, setVoyageForm] = useState<VoyageForm>({
    serviceCode: "",
    voyageNumber: "",
    vesselName: "",
    departure: "",
    arrival: "",
    polUnlocode: "", // NEW
    podUnlocode: "", // NEW
  });

  // Data
  const [allSchedules, setAllSchedules] = useState<ServiceSchedule[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    code: "",
    description: "",
    voyageNumber: "",
  });

  // Modals / selections
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [voyageModalOpen, setVoyageModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ServiceSchedule | null>(null);
  const [selectedVoyage, setSelectedVoyage] = useState<Voyage | null>(null);
  const [editForm, setEditForm] = useState<ServiceSchedule>(
    {} as ServiceSchedule
  );

  // Edit voyage
  const [editVoyageModal, setEditVoyageModal] = useState(false);
  const [voyageEditForm, setVoyageEditForm] = useState<Voyage | null>(null);

  // Cutoffs
  const [cutoffModalOpen, setCutoffModalOpen] = useState(false);
  const [cutoffSaving, setCutoffSaving] = useState(false);
  const [cutoffLoading, setCutoffLoading] = useState(false);
  const [cutoffTimezone, setCutoffTimezone] = useState("UTC");
  const [cutoffRows, setCutoffRows] = useState<CutoffRow[]>([
    { kind: "ERD", at: "" },
    { kind: "FCL_GATEIN", at: "" },
    { kind: "VGM", at: "" },
    { kind: "DOC_SI", at: "" },
  ]);

  // UI status
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingVoyages, setIsLoadingVoyages] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Debounce
  function useDebounce<T>(value: T, delay = 600) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch schedules
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

  // Fetch voyages for a schedule
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

  // Effects
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
    if (
      ["create-schedule", "create-voyage", "bulk-import"].includes(activeTab) &&
      !isLoadingSchedules
    ) {
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
      const { data: created } = await axios.post<ServiceSchedule>(
        "/api/seed/serviceschedules/post",
        serviceForm
      );
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
  // Create Voyage
  // ───────────────────────────────────────────────────────────────────────────
  function validateVoyageForm(): string | null {
    if (!voyageForm.serviceCode) return "Select a schedule";
    if (!voyageForm.voyageNumber.trim()) return "Voyage number is required";
    if (!voyageForm.vesselName.trim()) return "Vessel name is required";

    // NEW: require UN/LOCODEs (5 chars)
    const pol = voyageForm.polUnlocode?.trim().toUpperCase();
    const pod = voyageForm.podUnlocode?.trim().toUpperCase();
    if (!pol || !UNLOCODE_5.test(pol))
      return "POL (UN/LOCODE) must be 5 letters/digits";
    if (!pod || !UNLOCODE_5.test(pod))
      return "POD (UN/LOCODE) must be 5 letters/digits";

    if (!voyageForm.departure) return "Departure is required";
    if (!voyageForm.arrival) return "Arrival is required";

    const dep = new Date(voyageForm.departure).getTime();
    const arr = new Date(voyageForm.arrival).getTime();
    if (!(arr > dep)) return "Arrival must be after departure";
    return null;
  }

  async function createVoyage(e: React.FormEvent) {
    e.preventDefault();
    const err = validateVoyageForm();
    if (err) return showMessage("error", err);

    setIsLoading(true);
    try {
      const schedule = allSchedules.find(
        (s) => s.code === voyageForm.serviceCode
      );
      if (!schedule)
        throw new Error(`No ServiceSchedule "${voyageForm.serviceCode}"`);

      const payload = {
        voyageNumber: voyageForm.voyageNumber.trim(),
        vesselName: voyageForm.vesselName.trim(),
        polUnlocode: voyageForm.polUnlocode.trim().toUpperCase(), // NEW
        podUnlocode: voyageForm.podUnlocode.trim().toUpperCase(), // NEW
        departure: fromLocalInputValue(voyageForm.departure)!,
        arrival: fromLocalInputValue(voyageForm.arrival)!,
      };

      const { data: created } = await axios.post<Voyage>(
        `/api/seed/serviceschedules/${schedule.id}/voyages/post`,
        payload
      );

      showMessage("success", `Voyage ${created.voyageNumber} created.`);
      setVoyageForm({
        serviceCode: voyageForm.serviceCode,
        voyageNumber: "",
        vesselName: "",
        departure: "",
        arrival: "",
        polUnlocode: "",
        podUnlocode: "",
      });
      await fetchVoyages(schedule.id);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        let msg: string = (data as any)?.error ?? JSON.stringify(data);
        if ((data as any)?.errors && typeof (data as any).errors === "object") {
          msg = Object.values((data as any).errors as Record<string, any[]>)
            .flat()
            .join("; ");
        }
        showMessage("error", `HTTP ${status}: ${msg}`);
      } else if (error instanceof Error) {
        showMessage("error", error.message);
      } else {
        showMessage("error", "Failed to create voyage");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Bulk import — voyages require POL/POD + dep/arr
  // ───────────────────────────────────────────────────────────────────────────
  const [bulkData, setBulkData] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<"textarea" | "file">("textarea");

  type BulkCutoff = {
    kind: CutoffKind; // "ERD" | "FCL_GATEIN" | "VGM" | "DOC_SI"
    at: string; // ISO timestamp
    facilityScheme?: string | null; // e.g. "SMDG"
    facilityCode?: string | null; // e.g. "USNYCN4"
    source?: "MANUAL" | "AUTO" | "CALCULATED";
  };

  function downloadSample() {
    const sample = [
      {
        serviceCode: "WAX",
        scheduleDescription: "West Africa Express",
        voyages: [
          {
            voyageNumber: "245N",
            vesselName: "MSC OSCAR",
            polUnlocode: "CNSHA",
            podUnlocode: "USNYC",
            departure: "2025-09-01T08:00:00Z",
            arrival: "2025-09-24T12:00:00Z",
            cutoffs: [
              { kind: "ERD", at: "2025-08-25T00:00:00Z" },
              {
                kind: "FCL_GATEIN",
                at: "2025-08-31T18:00:00Z",
                facilityScheme: "SMDG",
                facilityCode: "CNSHATS",
              },
              // VGM/DOC_SI will be auto-created if omitted
            ],
          },
        ],
      },
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voyage-sample.json";
    a.click();
  }

  async function importBulkVoyages(file: File) {
    setIsLoading(true);

    // --------- CSV/JSON NORMALIZER ----------
    function normalize(input: any): Array<{
      serviceCode: string;
      scheduleDescription?: string;
      voyages: Array<{
        voyageNumber: string;
        vesselName: string;
        polUnlocode: string;
        podUnlocode: string;
        departure?: string;
        arrival?: string;
        cutoffs?: BulkCutoff[];
      }>;
    }> {
      const U = (v: any) => (v == null ? "" : String(v).toUpperCase());
      const asArray = Array.isArray(input) ? input : [input];
      const looksNested = asArray.every((s) => Array.isArray(s?.voyages));

      const mapCutoffs = (arr: any): BulkCutoff[] | undefined =>
        Array.isArray(arr)
          ? arr
              .map((c: any) => ({
                kind: U(c.kind) as CutoffKind,
                at: String(c.at),
                facilityScheme: c.facilityScheme ?? null,
                facilityCode: c.facilityCode ?? null,
                source: c.source ?? "MANUAL",
              }))
              .filter(
                (c) =>
                  ["ERD", "FCL_GATEIN", "VGM", "DOC_SI"].includes(c.kind) &&
                  !!c.at
              )
          : undefined;

      if (looksNested) {
        return asArray.map((s) => ({
          serviceCode: U(s.serviceCode || s.code),
          scheduleDescription: s.scheduleDescription ?? s.description ?? "",
          voyages: (s.voyages || []).map((v: any) => ({
            voyageNumber: U(v.voyageNumber || v.voyage),
            vesselName: String(v.vesselName || v.vessel || ""),
            polUnlocode: U(
              v.polUnlocode || v.pol || v.loadPort || v.origin || v.polCode
            ),
            podUnlocode: U(
              v.podUnlocode ||
                v.pod ||
                v.dischargePort ||
                v.destination ||
                v.podCode
            ),
            departure: v.departure,
            arrival: v.arrival,
            cutoffs: mapCutoffs(v.cutoffs),
          })),
        }));
      }

      // flat shape
      return asArray.reduce((acc: any[], row: any) => {
        const svc = U(row.serviceCode || row.code);
        if (!svc) return acc;

        let group = acc.find((x) => x.serviceCode === svc);
        if (!group) {
          group = {
            serviceCode: svc,
            scheduleDescription:
              row.scheduleDescription || row.description || "",
            voyages: [],
          };
          acc.push(group);
        }

        group.voyages.push({
          voyageNumber: U(row.voyageNumber || row.voyage),
          vesselName: String(row.vesselName || row.vessel || ""),
          polUnlocode: U(
            row.polUnlocode ||
              row.pol ||
              row.loadPort ||
              row.origin ||
              row.polCode
          ),
          podUnlocode: U(
            row.podUnlocode ||
              row.pod ||
              row.dischargePort ||
              row.destination ||
              row.podCode
          ),
          departure: row.departure,
          arrival: row.arrival,
          cutoffs: mapCutoffs(row.cutoffs),
        });

        return acc;
      }, []);
    }

    try {
      // ✅ STEP 1: Read CSV text
      const text = await file.text();
      const parsedCSV = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      // ✅ STEP 2: Parsed CSV → JSON objects
      const parsed = parsedCSV.data;

      // ✅ STEP 3: Normalize into old dev’s shape
      const services = normalize(parsed).filter(
        (s) => s.serviceCode && s.voyages?.length
      );

      if (!services.length) {
        showMessage("error", "No valid services/voyages found in CSV.");
        return;
      }

      // ---- everything below is IDENTICAL to old flow ----
      if (!allSchedules.length) {
        await fetchSchedules(1);
      }

      const scheduleCache: Record<string, string> = {};
      let voyagesCreated = 0;

      for (const service of services) {
        // find or create schedule
        let scheduleId = scheduleCache[service.serviceCode];
        if (!scheduleId) {
          let schedule = allSchedules.find(
            (s) => s.code === service.serviceCode
          );
          if (!schedule) {
            const { data: created } = await axios.post(
              "/api/seed/serviceschedules/post",
              {
                code: service.serviceCode,
                description: service.scheduleDescription ?? "",
              }
            );
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
          if (!v.voyageNumber || !v.vesselName) continue;
          if (!UNLOCODE_5.test(v.polUnlocode || "")) continue;
          if (!UNLOCODE_5.test(v.podUnlocode || "")) continue;
          if (!v.departure || !v.arrival) continue;

          const found = existing.find(
            (ev) => ev.voyageNumber === v.voyageNumber
          );
          if (found) continue;

          await axios.post<Voyage>(
            `/api/seed/serviceschedules/${scheduleId}/voyages/post`,
            {
              voyageNumber: v.voyageNumber,
              vesselName: v.vesselName,
              polUnlocode: v.polUnlocode,
              podUnlocode: v.podUnlocode,
              departure: new Date(v.departure).toISOString(),
              arrival: new Date(v.arrival).toISOString(),
            }
          );
          voyagesCreated += 1;
        }
      }

      showMessage("success", `Imported ${voyagesCreated} voyage(s).`);
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

  const UNLOCODE_5 = /^[A-Z0-9]{5}$/; // same check as old code

  async function handleCSVVoyages(file: File) {
    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];

          // 1) Group by serviceCode
          const services: Array<{
            serviceCode: string;
            scheduleDescription?: string;
            voyages: any[];
          }> = [];

          for (const r of rows) {
            const serviceCode = (r.serviceCode || r.code || "")
              .trim()
              .toUpperCase();
            if (!serviceCode) continue;

            const scheduleDescription =
              r.scheduleDescription || r.description || "";

            // find group
            let svc = services.find((s) => s.serviceCode === serviceCode);
            if (!svc) {
              svc = { serviceCode, scheduleDescription, voyages: [] };
              services.push(svc);
            }

            // parse cutoffs cell if present
            let cutoffs: any[] | undefined;
            if (r.cutoffs) {
              try {
                cutoffs = JSON.parse(r.cutoffs);
              } catch {
                cutoffs = undefined;
              }
            }

            svc.voyages.push({
              voyageNumber: (r.voyageNumber || r.voyage || "")
                .trim()
                .toUpperCase(),
              vesselName: r.vesselName || r.vessel || "",
              polUnlocode: (r.polUnlocode || r.pol || "").trim().toUpperCase(),
              podUnlocode: (r.podUnlocode || r.pod || "").trim().toUpperCase(),
              departure: r.departure,
              arrival: r.arrival,
              cutoffs,
            });
          }

          if (!services.length) {
            showMessage("error", "No valid rows in CSV");
            setIsLoading(false);
            return;
          }

          let voyagesCreated = 0;

          // 2) For each service, ensure schedule exists then post voyages
          for (const service of services) {
            // find or create schedule
            let scheduleId: string | null = null;
            try {
              const { data } = await axios.get(
                `/api/seed/serviceschedules/getall`
              );
              const found = (data || []).find(
                (s: any) => s.code === service.serviceCode
              );
              if (found) {
                scheduleId = found.id;
              }
            } catch {
              scheduleId = null;
            }

            if (!scheduleId) {
              const { data: created } = await axios.post(
                "/api/seed/serviceschedules/post",
                {
                  code: service.serviceCode,
                  description: service.scheduleDescription ?? "",
                }
              );
              scheduleId = created.id;
            }

            // fetch existing voyages to avoid dups
            let existing: any[] = [];
            try {
              const { data } = await axios.get(
                `/api/seed/serviceschedules/${scheduleId}/voyages/get`
              );
              existing = data.voyages ?? [];
            } catch {
              existing = [];
            }

            // post voyages
            for (const v of service.voyages) {
              if (!v.voyageNumber || !v.vesselName) {
                showMessage(
                  "error",
                  `Skipping voyage missing number/vessel in ${service.serviceCode}`
                );
                continue;
              }
              if (!UNLOCODE_5.test(v.polUnlocode || "")) {
                showMessage("error", `Skipping ${v.voyageNumber}: invalid POL`);
                continue;
              }
              if (!UNLOCODE_5.test(v.podUnlocode || "")) {
                showMessage("error", `Skipping ${v.voyageNumber}: invalid POD`);
                continue;
              }
              if (!v.departure || !v.arrival) {
                showMessage(
                  "error",
                  `Skipping ${v.voyageNumber}: departure & arrival required`
                );
                continue;
              }

              const dup = existing.find(
                (ev) => ev.voyageNumber === v.voyageNumber
              );
              if (dup) continue;

              await axios.post(
                `/api/seed/serviceschedules/${scheduleId}/voyages/post`,
                {
                  voyageNumber: v.voyageNumber,
                  vesselName: v.vesselName,
                  polUnlocode: v.polUnlocode,
                  podUnlocode: v.podUnlocode,
                  departure: new Date(v.departure).toISOString(),
                  arrival: new Date(v.arrival).toISOString(),
                }
              );
              voyagesCreated += 1;
            }
          }

          showMessage("success", `Imported ${voyagesCreated} voyage(s).`);
        } catch (err: any) {
          console.error(err);
          if (axios.isAxiosError(err) && err.response) {
            showMessage(
              "error",
              `HTTP ${err.response.status}: ${JSON.stringify(
                err.response.data
              )}`
            );
          } else {
            showMessage("error", err?.message || "Failed to import");
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
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
      await axios.patch(
        `/api/seed/serviceschedules/${selectedSchedule.id}/patch`,
        {
          code: editForm.code,
          description: editForm.description,
        }
      );
      showMessage("success", "Schedule updated");
      setEditModalOpen(false);
      fetchSchedules(currentPage);
    } catch (err: any) {
      let msg = "Failed to update schedule";
      if (axios.isAxiosError(err) && err.response) {
        const { status, data } = err.response;
        if (data && typeof data === "object" && "errors" in data) {
          msg = Object.values((data as any).errors)
            .flat()
            .join("; ");
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
    if (!scheduleId)
      return showMessage("error", "Unable to determine parent schedule");

    const patch: Partial<Voyage> = {
      id: voyageEditForm.id,
      voyageNumber: voyageEditForm.voyageNumber,
      vesselName: voyageEditForm.vesselName,
      polUnlocode: voyageEditForm.polUnlocode, // NEW
      podUnlocode: voyageEditForm.podUnlocode, // NEW
      departure: voyageEditForm.departure,
      arrival: voyageEditForm.arrival,
    };
    setIsUpdating(true);
    try {
      await axios.patch(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${voyageEditForm.id}/patch`,
        patch
      );
      showMessage("success", "Voyage updated");
      setEditVoyageModal(false);
      await fetchVoyages(scheduleId);
    } catch (e) {
      showMessage("error", "Failed to update voyage");
    } finally {
      setIsUpdating(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Voyage cutoffs (voyage-level)
  // ───────────────────────────────────────────────────────────────────────────
  function fmtLocal(isoUtc: string, tz: string, locale?: string) {
    try {
      return new Intl.DateTimeFormat(locale || undefined, {
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
    setCutoffRows((rows) =>
      rows.map((r) => (r.kind === kind ? { ...r, at: atIso } : r))
    );
  }

  async function openCutoffsForVoyage(v: Voyage) {
    setSelectedVoyage(v);
    setCutoffModalOpen(true);
    setCutoffLoading(true); // ⬅️ start loading
    // (optional) clear any stale rows while loading
    setCutoffRows([
      { kind: "ERD", at: "" },
      { kind: "FCL_GATEIN", at: "" },
      { kind: "VGM", at: "" },
      { kind: "DOC_SI", at: "" },
    ]);

    try {
      const scheduleId = v.service?.id ?? selectedSchedule?.id;
      if (!scheduleId) throw new Error("Missing schedule id");

      const { data } = await axios.get(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${v.id}/cutoffs/get`
      );

      setCutoffTimezone(data.timezone ?? "UTC");

      const map = new Map<CutoffKind, string>();
      (data.cutoffs ?? []).forEach((c: any) => map.set(c.kind, c.at));

      setCutoffRows([
        { kind: "ERD", at: map.get("ERD") ?? "" },
        { kind: "FCL_GATEIN", at: map.get("FCL_GATEIN") ?? "" },
        { kind: "VGM", at: map.get("VGM") ?? "" },
        { kind: "DOC_SI", at: map.get("DOC_SI") ?? "" },
      ]);
    } catch {
      setCutoffTimezone("UTC");
      setCutoffRows([
        { kind: "ERD", at: "" },
        { kind: "FCL_GATEIN", at: "" },
        { kind: "VGM", at: "" },
        { kind: "DOC_SI", at: "" },
      ]);
      showMessage("error", "Failed to load cut-offs for the voyage.");
    } finally {
      setCutoffLoading(false); // ⬅️ stop loading
    }
  }

  function closeCutoffs() {
    setCutoffModalOpen(false);
  }

  async function saveCutoffs() {
    if (!selectedVoyage) return;
    const scheduleId = selectedVoyage.service?.id ?? selectedSchedule?.id;
    if (!scheduleId) return showMessage("error", "Missing schedule/voyage id");

    const toSave = cutoffRows.filter((r) => r.at);
    if (toSave.length === 0) {
      showMessage("error", "No cut-offs to save");
      return;
    }

    setCutoffSaving(true);
    try {
      await axios.patch(
        `/api/seed/serviceschedules/${scheduleId}/voyages/${selectedVoyage.id}/cutoffs/patch`,
        { cutoffs: toSave.map((r) => ({ ...r, source: r.source ?? "MANUAL" })) }
      );
      showMessage("success", "Cut-offs saved");
      setCutoffModalOpen(false);
    } catch (e: any) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.error || "Failed to save cut-offs"
        : "Failed to save cut-offs";
      showMessage("error", msg);
    } finally {
      setCutoffSaving(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cards & UI
  // ───────────────────────────────────────────────────────────────────────────
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
            {s.description && (
              <p className="text-sm text-white">{s.description}</p>
            )}
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
                background:
                  "linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)",
                clipPath:
                  "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
              }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider">
                {s._count.voyages === 1 ? "Voyage" : "Voyages"}
              </span>
              <span className="text-white font-mono text-lg font-extrabold">
                {s._count.voyages}
              </span>
            </div>
          </div>
        </div>
        <div
          className={`mt-6 pt-3 border-t border-[#00FFFF] transition-opacity ${
            overStrip ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}
        >
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
              <CalendarCheckIcon
                height={50}
                width={50}
                className="text-[#00FFFF]"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            SCMT Data Seeding
            <span className="block text-cyan-400 mt-2">
              Service Schedules & Voyages
            </span>
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
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}{" "}
          {message.text}
        </div>
      )}

      {/* TABS */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            {
              key: "create-schedule",
              icon: <CalendarSync className="w-5 h-5" />,
              label: "Create Schedule",
            },
            {
              key: "create-voyage",
              icon: <Navigation className="w-5 h-5" />,
              label: "Create Voyage",
            },
            {
              key: "bulk-import",
              icon: <Upload className="w-5 h-5" />,
              label: "Bulk Import",
            },
            {
              key: "schedule-list",
              icon: <ListIcon className="w-5 h-5" />,
              label: "Schedule List",
            },
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
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-8">
              <CalendarSync className="text-cyan-400 w-8 h-8" /> Create Service
              Schedule
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
                  onChange={(e) =>
                    setServiceForm((prev) => ({
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
                  onChange={(e) =>
                    setServiceForm((prev) => ({
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
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-shadow"
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
      {activeTab === "create-voyage" && (
        <section className="px-6 md:px-16 mb-16">
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Navigation className="text-cyan-400 w-8 h-8" /> Create Voyage
            </h2>

            <form onSubmit={createVoyage} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Service Schedule *
                  </label>
                  <select
                    value={voyageForm.serviceCode}
                    onChange={(e) =>
                      setVoyageForm((prev) => ({
                        ...prev,
                        serviceCode: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  >
                    <option value="">Select Schedule</option>
                    {isLoadingSchedules && (
                      <option value="" disabled>
                        Loading schedules…
                      </option>
                    )}
                    {!isLoadingSchedules && allSchedules.length === 0 && (
                      <option value="" disabled>
                        No schedules found
                      </option>
                    )}
                    {allSchedules.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} – {s.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Voyage number */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Voyage Number *
                  </label>
                  <input
                    type="text"
                    value={voyageForm.voyageNumber}
                    onChange={(e) =>
                      setVoyageForm((prev) => ({
                        ...prev,
                        voyageNumber: e.target.value,
                      }))
                    }
                    placeholder="245N"
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  />
                </div>

                {/* Vessel */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold">Vessel Name *</label>
                  <input
                    type="text"
                    value={voyageForm.vesselName}
                    onChange={(e) =>
                      setVoyageForm((prev) => ({
                        ...prev,
                        vesselName: e.target.value,
                      }))
                    }
                    placeholder="MSC OSCAR"
                    required
                    className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[12px_10px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  />
                </div>

                {/* POL / POD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      POL (UN/LOCODE) *
                    </label>
                    <input
                      type="text"
                      value={voyageForm.polUnlocode || ""}
                      onChange={(e) =>
                        setVoyageForm((prev) => ({
                          ...prev,
                          polUnlocode: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="CNSHA"
                      required
                      maxLength={5}
                      pattern="[A-Za-z0-9]{5}"
                      title="UN/LOCODE (exactly 5 letters/numbers)"
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      POD (UN/LOCODE) *
                    </label>
                    <input
                      type="text"
                      value={voyageForm.podUnlocode || ""}
                      onChange={(e) =>
                        setVoyageForm((prev) => ({
                          ...prev,
                          podUnlocode: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="USNYC"
                      required
                      maxLength={5}
                      pattern="[A-Za-z0-9]{5}"
                      title="UN/LOCODE (exactly 5 letters/numbers)"
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Departure / Arrival */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Departure *</label>
                  <input
                    type="datetime-local"
                    value={voyageForm.departure || ""}
                    onChange={(e) =>
                      setVoyageForm((prev) => ({
                        ...prev,
                        departure: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Arrival *</label>
                  <input
                    type="datetime-local"
                    value={voyageForm.arrival || ""}
                    onChange={(e) =>
                      setVoyageForm((prev) => ({
                        ...prev,
                        arrival: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? (
                    <Settings className="animate-spin w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Create Voyage
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* BULK IMPORT */}
      {activeTab === "bulk-import" && (
        <section className="px-6 md:px-16 mb-16">
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <Upload className="text-cyan-400" /> Bulk Import Voyages
            </h2>

            {/* Hidden input for file selection */}
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files?.[0]) importBulkVoyages(e.target.files[0]);
              }}
            />

            {isLoading && <p className="text-blue-500">Uploading...</p>}
            {message && <p className="text-sm">{message.text}</p>}

            {/* Styled button that triggers the hidden input */}
            <div className="flex justify-center">
              <button
                type="button"
                className="bg-[#600f9e] hover:bg-[#491174] px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)] transition-all"
                onClick={() => document.getElementById("csv-upload")?.click()}
              >
                <Upload className="w-5 h-5" /> Upload CSV/JSON File
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SCHEDULE LIST */}
      {activeTab === "schedule-list" && (
        <section className="px-6 md:px-16 mb-16">
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <ListIcon className="text-cyan-400 w-8 h-8" /> Service Schedules
            </h2>
            <div
              className="bg-[#2e4972] rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-10"
              style={cardGradient}
            >
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
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, code: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>
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
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
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
              <div className="text-center py-12 text-white">
                No schedules found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {allSchedules.map((s) => (
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

      {/* EDIT SCHEDULE MODAL */}
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyEdit();
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-sm font-semibold">Service Code</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm((prev) => ({
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
                  onChange={(e) =>
                    setEditForm((prev) => ({
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
                  className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow px-4 py-2 rounded-lg flex items-center gap-2 ${
                    isUpdating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUpdating ? (
                    <Settings className="animate-spin w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  <span>{isUpdating ? "Saving…" : "Save"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOYAGES MODAL */}
      {voyageModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div
            className="bg-[#121c2d] rounded-3xl p-8 w-full max-w-5xl max-height-[90vh] max-h-[90vh] overflow-y-auto border-2 border-white shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <header className="flex items-center justify-between mb-6 gap-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Ship /> Voyages for {selectedSchedule.code}
              </h3>
              <button onClick={closeVoyages}>
                <X className="w-6 h-6 text-white hover:text-[#00FFFF]" />
              </button>
            </header>

            {isLoadingVoyages ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Settings className="animate-spin w-8 h-8 text-cyan-400" />
                <span className="ml-4 text-cyan-200 text-lg font-semibold mt-3">
                  Loading voyages…
                </span>
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
                        background:
                          "linear-gradient(90deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.1) 100%)",
                        clipPath:
                          "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
                      }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div
                        onClick={() => openEditVoyage(v)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-2 h-6 bg-gradient-to-b from-cyan-400 via-yellow-400 to-red-400 opacity-80 group-hover/voyage:opacity-100 transition-opacity" />
                        <div>
                          <span className="text-cyan-400 font-mono text-lg font-bold tracking-wider">
                            {v.voyageNumber}
                          </span>
                          <div className="text-md text-white font-mono">
                            {new Date(v.departure).toLocaleDateString()}
                            {v.arrival && (
                              <> → {new Date(v.arrival).toLocaleDateString()}</>
                            )}
                          </div>
                          <div className="text-xs text-white/80">
                            {v.vesselName}
                          </div>
                          <div className="text-[11px] text-cyan-300/90 font-mono">
                            {v.polUnlocode || "-----"} →{" "}
                            {v.podUnlocode || "-----"}
                          </div>
                        </div>
                      </div>

                      <div className="relative flex flex-col items-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditVoyage(v);
                          }}
                          className="px-3 py-2 rounded bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10"
                          title="Edit Voyage"
                        >
                          <Edit3 className="w-4 h-4 inline-block mr-1" /> Edit
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCutoffsForVoyage(v);
                          }}
                          className="px-3 py-2 rounded bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10"
                          title="View/Edit Cut-offs"
                        >
                          <Calendar className="w-4 h-4 inline-block mr-1" />{" "}
                          Cutoffs
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

      {/* EDIT VOYAGE MODAL */}
      {editVoyageModal && voyageEditForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div
            className="bg-[#121c2d] border-4 border-white rounded-3xl p-6 max-w-md w-full shadow-[25px_25px_0px_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit3 /> Edit Voyage
            </h3>
            <div className="space-y-6">
              <label className="text-sm font-semibold">Voyage Number</label>
              <input
                type="text"
                value={voyageEditForm.voyageNumber || ""}
                onChange={(e) =>
                  setVoyageEditForm({
                    ...voyageEditForm,
                    voyageNumber: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold">Vessel Name</label>
              <input
                type="text"
                value={voyageEditForm.vesselName || ""}
                onChange={(e) =>
                  setVoyageEditForm({
                    ...voyageEditForm,
                    vesselName: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold">POL (UN/LOCODE)</label>
              <input
                type="text"
                value={voyageEditForm.polUnlocode || ""}
                onChange={(e) =>
                  setVoyageEditForm({
                    ...voyageEditForm,
                    polUnlocode: e.target.value.toUpperCase(),
                  })
                }
                maxLength={5}
                pattern="[A-Za-z0-9]{5}"
                title="UN/LOCODE (exactly 5 letters/numbers)"
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold">POD (UN/LOCODE)</label>
              <input
                type="text"
                value={voyageEditForm.podUnlocode || ""}
                onChange={(e) =>
                  setVoyageEditForm({
                    ...voyageEditForm,
                    podUnlocode: e.target.value.toUpperCase(),
                  })
                }
                maxLength={5}
                pattern="[A-Za-z0-9]{5}"
                title="UN/LOCODE (exactly 5 letters/numbers)"
                className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[10px_8px_0_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
              />

              <label className="text-sm font-semibold">Departure</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(voyageEditForm.departure)}
                onChange={(e) =>
                  setVoyageEditForm({
                    ...voyageEditForm,
                    departure:
                      fromLocalInputValue(e.target.value) ||
                      voyageEditForm.departure,
                  })
                }
                className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
              />

              <label className="text-sm font-semibold">Arrival</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(voyageEditForm.arrival)}
                onChange={(e) =>
                  setVoyageEditForm({
                    ...voyageEditForm,
                    arrival:
                      fromLocalInputValue(e.target.value) ||
                      voyageEditForm.arrival,
                  })
                }
                className="w-full px-4 py-3 bg-[#1d4595] border-4 border-black rounded-lg text-white focus:border-white"
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
                className={`bg-[#600f9e] hover:bg-[#491174] shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-shadow px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUpdating ? (
                  <Settings className="animate-spin w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isUpdating ? "Saving… " : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUT-OFFS MODAL (voyage-level) */}
      {cutoffModalOpen && selectedVoyage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div
            className="w-full max-w-2xl rounded-3xl bg-[#0A1A2F] text-white p-6 shadow-[20px_20px_0_rgba(0,0,0,1)] border border-white/10"
            style={cardGradient}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Voyage Cut-offs —{" "}
                {selectedVoyage.voyageNumber}
              </h3>
              <button onClick={closeCutoffs}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {cutoffLoading ? (
              // 🔄 Loader while fetching
              <div className="flex flex-col items-center justify-center py-16">
                <Settings className="animate-spin w-8 h-8 text-cyan-400" />
                <span className="mt-3 text-cyan-200 text-lg font-semibold">
                  Loading cut-offs…
                </span>
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-300 mb-3">
                  Inputs are captured in <b>your local time</b> and saved as
                  UTC.
                  {cutoffTimezone ? (
                    <>
                      {" "}
                      Port local preview shown in <b>{cutoffTimezone}</b>.
                    </>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {cutoffRows.map((row) => (
                    <div
                      key={row.kind}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center bg-[#1A2A4A] p-4 rounded-xl border border-white/10"
                    >
                      <div>
                        <div className="text-sm text-slate-300">
                          {CUTOFF_LABEL[row.kind]}
                        </div>
                        {row.at && (
                          <>
                            <div className="text-xs text-slate-400 mt-1">
                              Port local ({cutoffTimezone}):{" "}
                              {fmtLocal(row.at, cutoffTimezone)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              UTC:{" "}
                              {new Date(row.at)
                                .toISOString()
                                .slice(0, 16)
                                .replace("T", " ")}
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(row.at)}
                        onChange={(e) => {
                          const isoUtc = fromLocalInputValue(e.target.value);
                          setCutoffAt(row.kind, isoUtc ?? "");
                        }}
                        className="w-full px-3 py-2 rounded bg-[#2D4D8B] border border-black shadow-[4px_4px_0_rgba(0,0,0,1)]"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={closeCutoffs}
                    className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCutoffs}
                    disabled={cutoffSaving || cutoffLoading} // ⬅️ also disable while loading
                    className="px-4 py-2 rounded bg-[#22D3EE] text-black font-semibold hover:brightness-110 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-2 disabled:opacity-60"
                  >
                    <Clock className="w-4 h-4" />{" "}
                    {cutoffSaving ? "Saving..." : "Save Cut-offs"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
