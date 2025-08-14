"use client";

import React, { useState, ChangeEvent, useEffect, useMemo } from "react";
import {
  MapPin,
  Calendar,
  Container as ContainerIcon,
  Package,
  Ship,
  ArrowRight,
  ArrowLeft,
  Send,
  Download,
  Mail,
  LocateFixed,
  AlertTriangle,
  X,
  Anchor,
  Sailboat,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronDown,
} from "lucide-react";

import LocationInput from "../LocationsInput";

/** --- TYPES --------------------------------------------------------------- */
type DeliveryType = "door" | "terminal";
type WeightUnit = "kg" | "lb";

interface FormData {
  startLocation: string;
  endLocation: string;
  pickupType: DeliveryType;
  deliveryType: DeliveryType;
  validFrom: string;
  shipperOwnedContainer: boolean;
  containerType: string;         // UI value (e.g. "40-general")
  containerQuantity: string;     // keep as string for input
  weightPerContainer: string;
  weightUnit: WeightUnit;
  dangerousGoods: boolean;
  imoClass: string;
  unNumber: string;
  commodity: string;
}

interface ContainerTypeRow {
  code: string;
  label: string;
}

/** Tariff rows flattened per containerType */
type Tariff = {
  containerTypeCode: string;   // "20STD" | "40STD" | "40HC" | ...
  currency: string;            // "USD", etc.
  amount: number;              // per container
  validFrom?: string;
  validTo?: string;
};

type Surcharge = {
  code: string;                // e.g. "THC"
  description?: string;
  currency: string;
  amount?: number;             // for PER_CONTAINER / PER_SHIPMENT
  basis: "PER_CONTAINER" | "PER_SHIPMENT" | "PERCENT";
  percent?: number;            // if basis === "PERCENT"
};

type DepartureItem = {
  date: string; // ISO YYYY-MM-DD
  priceByType?: Record<string, { currency: string; amount: number }>;
  isPreferred?: boolean;
};

/** --- SMALL UTILS --------------------------------------------------------- */
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};
const buildQuery = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

/** Map your UI container to a Prisma ContainerGroup enum + allowed CT codes */
function groupForUiType(ui: string): { groupId: "DRY_STANDARD" | "DRY_HC"; allowed: string[] } {
  switch (ui) {
    case "20-general":
    case "40-general":
      // DRY_STANDARD group → base 20/40 dry
      return { groupId: "DRY_STANDARD", allowed: ["20STD", "40STD"] };
    case "40-hc":
      // DRY_HC group → 40HC only
      return { groupId: "DRY_HC", allowed: ["40HC"] };
    default:
      return { groupId: "DRY_STANDARD", allowed: ["20STD", "40STD"] };
  }
}
function uiToPrimaryTariffCode(ui: string): string {
  switch (ui) {
    case "20-general": return "20STD";
    case "40-general": return "40STD";
    case "40-hc":      return "40HC";
    default:           return "40STD";
  }
}

/** Normalize booleans from Locations rows */
function pickBool(meta: any, keys: string[]): boolean | null {
  if (!meta) return null;
  for (const k of keys) {
    if (k in meta) {
      const v = meta[k];
      if (typeof v === "boolean") return v;
      if (v === 1 || v === "1" || v === "true") return true;
      if (v === 0 || v === "0" || v === "false") return false;
    }
  }
  return null;
}

/** --- MAIN --------------------------------------------------------------- */
export const NewQuoteComponent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [formData, setFormData] = useState<FormData>({
    startLocation: "",
    endLocation: "",
    pickupType: "terminal",
    deliveryType: "terminal",
    validFrom: new Date().toISOString().slice(0, 10),
    shipperOwnedContainer: false,
    containerType: "40-general",
    containerQuantity: "1",
    weightPerContainer: "20000",
    weightUnit: "kg",
    dangerousGoods: false,
    imoClass: "",
    unNumber: "",
    commodity: "FAK",
  });

  // Labels + rows for door availability checks
  const [startLabel, setStartLabel] = useState<string>("");
  const [endLabel, setEndLabel] = useState<string>("");
  const [startMeta, setStartMeta] = useState<any | null>(null);
  const [endMeta, setEndMeta] = useState<any | null>(null);

  // Container types list (Step 1 <select>)
  const [containerTypes, setContainerTypes] = useState<ContainerTypeRow[]>([]);
  const [ctLoading, setCtLoading] = useState(false);
  const [ctError, setCtError] = useState<string | null>(null);

  // Step 2 data
  const { groupId, allowed } = useMemo(
    () => groupForUiType(formData.containerType),
    [formData.containerType]
  );

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [tariffsLoading, setTariffsLoading] = useState(false);
  const [tariffsError, setTariffsError] = useState<string | null>(null);

  const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
  const [surchargesLoading, setSurchargesLoading] = useState(false);
  const [surchargesError, setSurchargesError] = useState<string | null>(null);

  const [departures, setDepartures] = useState<DepartureItem[]>([]);
  const [depLoading, setDepLoading] = useState(false);
  const [depError, setDepError] = useState<string | null>(null);
  const [selectedDepartureIdx, setSelectedDepartureIdx] = useState(0);

  const [selectedCtCode, setSelectedCtCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<"breakdown" | "remarks" | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  /** --- FETCH CONTAINER TYPES (Step 1 select) ---------------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCtLoading(true);
        setCtError(null);
        const res = await fetch("/api/seed/containers/types/get");
        if (!res.ok) throw new Error("Failed to fetch types");
        const raw = await res.json();
        const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
        const normalized: ContainerTypeRow[] = items
          .map((it) => {
            const code =
              (it?.code ?? it?.value ?? it?.id ?? it?.isoCode ?? it?.slug ?? "")
                .toString()
                .trim();
            const label =
              (it?.label ?? it?.name ?? it?.description ?? it?.displayName ?? code)
                .toString()
                .trim();
            if (!code || !label) return null;
            return { code, label };
          })
          .filter(Boolean) as ContainerTypeRow[];
        if (!cancelled) {
          setContainerTypes(normalized);
          if (
            normalized.length &&
            !normalized.some((t) => t.code === formData.containerType)
          ) {
            setFormData((f) => ({ ...f, containerType: normalized[0].code }));
          }
        }
      } catch (e: any) {
        if (!cancelled) setCtError(e?.message || "Could not load container types.");
      } finally {
        if (!cancelled) setCtLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** --- VALIDATION -------------------------------------------------------- */
  const startEqualsEnd = useMemo(() => {
    const a = formData.startLocation?.trim().toUpperCase();
    const b = formData.endLocation?.trim().toUpperCase();
    return !!a && !!b && a === b;
  }, [formData.startLocation, formData.endLocation]);

  const pickupDoorAllowed = useMemo(
    () =>
      pickBool(startMeta, [
        "doorPickupAllowed",
        "pickupDoorAllowed",
        "supportsDoorPickup",
        "pickupDoor",
        "pickupDoorAvailable",
        "pickup_door_available",
        "door_available_pickup",
      ]),
    [startMeta]
  );
  const deliveryDoorAllowed = useMemo(
    () =>
      pickBool(endMeta, [
        "doorDeliveryAllowed",
        "deliveryDoorAllowed",
        "supportsDoorDelivery",
        "deliveryDoor",
        "deliveryDoorAvailable",
        "delivery_door_available",
      ]),
    [endMeta]
  );
  const pickupDoorBlocked =
    formData.pickupType === "door" && pickupDoorAllowed === false;
  const deliveryDoorBlocked =
    formData.deliveryType === "door" && deliveryDoorAllowed === false;

  const searchErrors = useMemo(() => {
    const errs: string[] = [];
    if (!formData.startLocation) errs.push("Select a start location.");
    if (!formData.endLocation) errs.push("Select an end location.");
    if (formData.startLocation && formData.endLocation && startEqualsEnd)
      errs.push("Start and End must be different.");
    if (pickupDoorBlocked)
      errs.push(
        `${startLabel || formData.startLocation} does not support PICKUP at DOOR.`
      );
    if (deliveryDoorBlocked)
      errs.push(
        `${endLabel || formData.endLocation} does not support DELIVERY at DOOR.`
      );
    return errs;
  }, [
    formData.startLocation,
    formData.endLocation,
    startEqualsEnd,
    pickupDoorBlocked,
    deliveryDoorBlocked,
    startLabel,
    endLabel,
  ]);

  /** --- STEP 2: FETCH TARIFFS + SURCHARGES + DEPARTURES ------------------ */
  const canQuery = useMemo(
    () => !searchErrors.length && !!formData.startLocation && !!formData.endLocation,
    [searchErrors.length, formData.startLocation, formData.endLocation]
  );

  useEffect(() => {
    if (currentStep !== 2 || !canQuery) return;
    let cancelled = false;

    // Tariffs for this route (we'll filter by allowed group types client-side)
    (async () => {
      setTariffsLoading(true);
      setTariffsError(null);
      try {
        const q = buildQuery({
          origin: formData.startLocation,
          destination: formData.endLocation,
          date: formData.validFrom,
        });
        const res = await fetch(`/api/seed/tariffs/get?${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load tariffs");
        const json = await res.json();
        const list: Tariff[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : [];

        const filtered = list
          .filter((t) => allowed.includes((t.containerTypeCode || "").toUpperCase()))
          .map((t) => ({
            ...t,
            containerTypeCode: (t.containerTypeCode || "").toUpperCase(),
          }));

        if (!cancelled) {
          setTariffs(filtered);
          // auto-select primary type within this group
          const primary = uiToPrimaryTariffCode(formData.containerType);
          const pick =
            filtered.find((t) => t.containerTypeCode === primary)?.containerTypeCode ||
            filtered[0]?.containerTypeCode ||
            null;
          setSelectedCtCode(pick);
        }
      } catch (e: any) {
        if (!cancelled) setTariffsError(e?.message ?? "Unable to fetch tariffs");
      } finally {
        if (!cancelled) setTariffsLoading(false);
      }
    })();

    // Surcharges (not CT dependent)
    (async () => {
      setSurchargesLoading(true);
      setSurchargesError(null);
      try {
        const q = buildQuery({
          origin: formData.startLocation,
          destination: formData.endLocation,
          date: formData.validFrom,
        });
        const res = await fetch(`/api/seed/surcharges/get?${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load surcharges");
        const json = await res.json();
        const list: Surcharge[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : [];
        if (!cancelled) setSurcharges(list);
      } catch (e: any) {
        if (!cancelled) setSurchargesError(e?.message ?? "Unable to fetch surcharges");
      } finally {
        if (!cancelled) setSurchargesLoading(false);
      }
    })();

    // Departures (service schedules)
    (async () => {
      setDepLoading(true);
      setDepError(null);
      try {
        const q = buildQuery({
          origin: formData.startLocation,
          destination: formData.endLocation,
          date: formData.validFrom,
        });
        const res = await fetch(`/api/seed/serviceschedules/get?${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load departures");
        const raw = await res.json();
        const arr = Array.isArray(raw) ? raw : (raw?.items ?? []);
        const normalized: DepartureItem[] = arr
          .map((r: any) => {
            const d = r?.etd || r?.departure || r?.depDate || r?.date || r?.sailDate || "";
            const iso = d ? new Date(d).toISOString().slice(0, 10) : "";
            return {
              date: iso,
              priceByType: r?.priceByType || r?.prices || undefined,
              isPreferred: !!r?.preferred,
            };
          })
          .filter((d: DepartureItem) => d.date);
        if (!cancelled) {
          setDepartures(normalized);
          setSelectedDepartureIdx(0);
        }
      } catch (e: any) {
        if (!cancelled) setDepError(e?.message ?? "Unable to fetch departures");
      } finally {
        if (!cancelled) setDepLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentStep,
    canQuery,
    formData.startLocation,
    formData.endLocation,
    formData.validFrom,
    formData.containerType,
    groupId,
    allowed.join("|"),
  ]);

  /** --- PRICE + TIME HELPERS --------------------------------------------- */
  const qty = Math.max(1, Number(formData.containerQuantity || 1));
  const selectedCode = (selectedCtCode || uiToPrimaryTariffCode(formData.containerType)).toUpperCase();
  const selectedTariff: Tariff | null =
    tariffs.find((t) => (t.containerTypeCode || "").toUpperCase() === selectedCode) || null;

  function perContainerTotalFor(t: Tariff | null): number {
    if (!t) return 0;
    let total = t.amount; // base ocean freight per container
    for (const s of surcharges) {
      if (s.basis === "PER_CONTAINER" && s.amount) total += s.amount;
      if (s.basis === "PERCENT" && s.percent) total += (t.amount * s.percent) / 100;
    }
    return total;
  }
  function grandTotalForSelection(t: Tariff | null): { currency: string; amount: number } {
    if (!t) return { currency: "USD", amount: 0 };
    const perCtr = perContainerTotalFor(t);
    let total = perCtr * qty;
    for (const s of surcharges) {
      if (s.basis === "PER_SHIPMENT" && s.amount) total += s.amount;
    }
    return { currency: t.currency, amount: total };
  }

  // Selected departure date (fallback to validFrom if no schedule yet)
  const selectedDepartureDate = useMemo(() => {
    const iso = departures[selectedDepartureIdx]?.date || formData.validFrom;
    // Make a Date at 17:00 local for ETD to avoid midnight ambiguity
    const d = new Date(iso);
    d.setHours(17, 0, 0, 0);
    return d;
  }, [departures, selectedDepartureIdx, formData.validFrom]);

  function cutoff(etd: Date, daysBefore: number, hour = 17) {
    const d = new Date(etd);
    d.setDate(d.getDate() - daysBefore);
    d.setHours(hour, 0, 0, 0);
    return d;
  }
  const cutoffs = useMemo(() => {
    const etd = selectedDepartureDate;
    return [
      { label: "CY Cutoff", date: cutoff(etd, 3, 17) },
      { label: "Docs Cutoff", date: cutoff(etd, 2, 17) },
      { label: "VGM Cutoff", date: cutoff(etd, 1, 17) },
      { label: "ETD (Sailing)", date: cutoff(etd, 0, 17) },
    ];
  }, [selectedDepartureDate]);

  // Live countdown tick
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function fmtDateTime(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }
  function countdownTo(d: Date) {
    const now = new Date().getTime();
    const diff = d.getTime() - now;
    if (diff <= 0) return { text: "Passed", past: true };
    const s = Math.floor(diff / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    return { text: `${days}d ${hours}h ${mins}m`, past: false };
  }

  /** --- CONTROLS ---------------------------------------------------------- */
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const canProceedToNext = () => {
    if (currentStep === 1) return searchErrors.length === 0;
    if (currentStep === 2) return !!selectedTariff;
    return true;
  };
  const nextStep = () => currentStep < 3 && setCurrentStep((s) => s + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  /** --- RENDER ------------------------------------------------------------ */
  const inputStyle =
    "w-full bg-[#0A1A2F] rounded-xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold placeholder:opacity-90";
  const radioButtonStyle = "w-4 h-4 accent-[#1d4595] bg-[#373737] border-2 border-black";
  const sectionStyle = "max-w-[1600.24px] rounded-xl shadow-[40px_40px_0px_rgba(0,0,0,1)] p-6 py-[26px] border-white border-2";

  return (
    <div className="max-w-[1600.24px] mx-auto px-4 flex flex-col font-bold rounded-xl p-10">
      <div>
        <div className="inline-flex items-center space-x-4 gap-3 rounded-xl text-2xl font-bold text-[#faf9f6] mb-8 border-2 border-white shadow-[20px_20px_0px_rgba(0,0,0,1)] px-6 py-2 bg-[#0A1A2F] mx-auto">
          <div><Package size={32} /></div>
          <div>NEW QUOTE REQUEST</div>
        </div>

        {/* Progress */}
        <div className="flex items-center rounded-xl justify-between bg-[#0F1B2A] border-white shadow-[30px_30px_0px_rgba(0,0,0,1)] border-2 px-6 py-4 mb-12">
          {[
            { num: 1, label: "SEARCH" },
            { num: 2, label: "OFFER SELECTION" },
            { num: 3, label: "REVIEW & NEXT STEPS" },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center border-white justify-center font-bold border-2",
                    currentStep >= step.num ? "bg-white text-[#0F1B2A]" : "bg-[#0F1B2A] text-[#faf9f6]"
                  )}
                >
                  {step.num}
                </div>
                <span className={clsx(currentStep >= step.num ? "text-white" : "text-[#faf9f6]", "font-bold")}>
                  {step.label}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-1 bg-white mx-4"></div>}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: SEARCH */}
        {currentStep === 1 && (
          <div className={`${sectionStyle} p-10`} style={cardGradient}>
            <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">SEARCH</h2>
            <hr className="my-2 border-t border-white" />
            <br />
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#00FFFF] mb-6 flex items-center gap-2">
                <LocateFixed size={20} /> ROUTING
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mb-2">
                <LocationInput
                  label="START LOCATION"
                  value={formData.startLocation}
                  onChange={(code, display, row) => {
                    setFormData((f) => ({ ...f, startLocation: code }));
                    setStartLabel(display);
                    setStartMeta(row || null);
                    if (code && formData.endLocation && code.trim().toUpperCase() === formData.endLocation.trim().toUpperCase()) {
                      setFormData((f) => ({ ...f, endLocation: "" }));
                      setEndLabel("");
                      setEndMeta(null);
                    }
                  }}
                  excludeCodes={formData.endLocation ? [formData.endLocation] : undefined}
                  excludeLabels={endLabel ? [endLabel] : undefined}
                />
                <LocationInput
                  label="END LOCATION"
                  value={formData.endLocation}
                  onChange={(code, display, row) => {
                    setFormData((f) => ({ ...f, endLocation: code }));
                    setEndLabel(display);
                    setEndMeta(row || null);
                    if (code && formData.startLocation && code.trim().toUpperCase() === formData.startLocation.trim().toUpperCase()) {
                      setFormData((f) => ({ ...f, startLocation: "" }));
                      setStartLabel("");
                      setStartMeta(null);
                    }
                  }}
                  excludeCodes={formData.startLocation ? [formData.startLocation] : undefined}
                  excludeLabels={startLabel ? [startLabel] : undefined}
                />
              </div>

              {searchErrors.length > 0 && (
                <div className="mt-4 mb-2 rounded-lg border-2 border-red-400 bg-[#3b0b0b] text-red-200 px-4 py-2 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    {searchErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8 mt-6">
                {(["pickupType", "deliveryType"] as (keyof FormData)[]).map((field) => (
                  <div key={field}>
                    <h4 className="text-[#faf9f6] font-light mb-3">
                      {field === "pickupType" ? "PICKUP TYPE" : "DELIVERY TYPE"}
                    </h4>
                    <div className="space-y-2">
                      {(["door", "terminal"] as DeliveryType[]).map((opt) => (
                        <label key={opt} className="flex items-center gap-3 text-[#faf9f6] font-bold">
                          <input
                            type="radio"
                            name={field}
                            checked={(formData as any)[field] === opt}
                            onChange={() => handleInputChange(field as any, opt)}
                            className={`${radioButtonStyle}`}
                          />
                          {opt.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#00FFFF] mb-4 flex items-center gap-2 mb-6">
                <Calendar size={20} /> VALIDITY DATE
              </h3>
              <label className="block text-[#faf9f6] font-light mb-2">VALID FROM</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange("validFrom", e.target.value)}
                className={`bg-[#1d4595] hover:bg-[#1A2A4A] rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold w-full`}
              />
            </div>

            {/* Container & Commodity */}
            <div>
              <h3 className="text-lg font-bold text-[#00FFFF] mb-4 flex items-center gap-2 mb-6">
                <ContainerIcon size={20} /> CONTAINER & COMMODITY
              </h3>
              <label className="flex items-center gap-3 text-[#faf9f6] font-light mb-6">
                <input
                  type="checkbox"
                  checked={formData.shipperOwnedContainer}
                  onChange={(e) => handleInputChange("shipperOwnedContainer", e.target.checked)}
                  className="w-5 h-5 accent-[#00FFFF] bg-[#373737] border-2 border-black"
                />
                SHIPPER OWNED CONTAINER (SOC)
              </label>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">CONTAINER TYPE</label>
                  <select
                    value={formData.containerType}
                    onChange={(e) => handleInputChange("containerType", e.target.value)}
                    disabled={ctLoading || !containerTypes.length}
                    className={`rounded-xl hover:text-[#00FFFF] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#11235d] hover:bg-[#1a307a] w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {ctLoading && <option>Loading types…</option>}
                    {!ctLoading && !containerTypes.length && <option>No types available</option>}
                    {!ctLoading &&
                      containerTypes.map((ct) => (
                        <option key={ct.code} value={ct.code}>
                          {ct.label}
                        </option>
                      ))}
                  </select>
                  {ctError && <div className="mt-2 text-sm text-[#fa8a8a] font-bold">{ctError}</div>}
                </div>
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">QUANTITY</label>
                  <input
                    type="number"
                    value={formData.containerQuantity}
                    onChange={(e) => handleInputChange("containerQuantity", e.target.value)}
                    className={`rounded-xl hover:text-[#00FFFF] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#11235d] hover:bg-[#1a307a] w-full`}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">WEIGHT</label>
                  <input
                    type="number"
                    value={formData.weightPerContainer}
                    onChange={(e) => handleInputChange("weightPerContainer", e.target.value)}
                    className={`rounded-xl hover:text-[#00FFFF] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#11235d] hover:bg-[#1a307a] w-full`}
                  />
                </div>
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">UNIT</label>
                  <div className="flex gap-4 mt-2">
                    {(["kg", "lb"] as WeightUnit[]).map((u) => (
                      <label key={u} className="flex items-center gap-2 text-[#faf9f6] font-bold">
                        <input
                          type="radio"
                          name="weightUnit"
                          checked={formData.weightUnit === u}
                          onChange={() => handleInputChange("weightUnit", u)}
                          className="w-4 h-4 accent-[#1d4595] bg-[#373737] border-2 border-black"
                        />
                        {u}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* DANGEROUS GOODS */}
              <label className="flex items-center gap-3 text-[#faf9f6] font-light mb-4">
                <input
                  type="checkbox"
                  checked={formData.dangerousGoods}
                  onChange={(e) => handleInputChange("dangerousGoods", e.target.checked)}
                  className="w-5 h-5 accent-[#00FFFF] bg-[#373737] border-2 border-black"
                />
                DANGEROUS GOODS
              </label>

              {formData.dangerousGoods && (
                <div className="bg-[#290404] border-2 border-[#fa0404] rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4 ">
                    <AlertTriangle className="text-[#fa0404]" size={20} />
                    <h4 className="text-[#fa0404] font-bold text-lg">DANGEROUS GOODS DETAILS</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="block text-[#faf9f6] font-bold mb-2">IMO CLASS (OPTIONAL)</label>
                      <select
                        value={formData.imoClass}
                        onChange={(e) => handleInputChange("imoClass", e.target.value)}
                        className={`rounded-xl hover:text-white text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#fa0404] hover:bg-[#d93838] w-full font-bold`}
                      >
                        <option value="">Select IMO Class</option>
                        <optgroup label="1. EXPLOSIVES">
                          <option value="1.1">1.1 Substances and articles which have a mass explosion hazard</option>
                          <option value="1.2">1.2 Substances and articles which have a projection hazard</option>
                          <option value="1.3">1.3 Substances and articles which have a fire hazard</option>
                          <option value="1.4">1.4 Substances and articles which present no significant hazard</option>
                          <option value="1.5">1.5 Very insensitive substances which have a mass explosion hazard</option>
                          <option value="1.6">1.6 Extremely insensitive articles</option>
                        </optgroup>
                        <optgroup label="2. GASES">
                          <option value="2.1">2.1 Flammable gases</option>
                          <option value="2.2">2.2 Non-flammable, non-toxic gases</option>
                          <option value="2.3">2.3 Toxic gases</option>
                        </optgroup>
                        <optgroup label="3. FLAMMABLE LIQUIDS">
                          <option value="3">3. Flammable Liquids</option>
                        </optgroup>
                        <optgroup label="4. FLAMMABLE SOLIDS OR SUBSTANCES">
                          <option value="4.1">4.1 Flammable solids, self-reactive substances and solid desensitized explosives</option>
                          <option value="4.2">4.2 Substances liable to spontaneous combustion</option>
                          <option value="4.3">4.3 Substances which, in contact with water, emit flammable gases</option>
                        </optgroup>
                        <optgroup label="5. OXIDIZING AGENTS AND ORGANIC PEROXIDES">
                          <option value="5.1">5.1 Oxidizing substances</option>
                          <option value="5.2">5.2 Organic peroxides</option>
                        </optgroup>
                        <optgroup label="6. TOXIC AND INFECTIOUS SUBSTANCES">
                          <option value="6.1">6.1 Poison</option>
                          <option value="6.2">6.2 Biohazard (Not Available)</option>
                        </optgroup>
                        <optgroup label="7. RADIOACTIVE SUBSTANCES">
                          <option value="7">7. Radioactive substances (Not Available)</option>
                        </optgroup>
                        <optgroup label="8. CORROSIVE SUBSTANCES">
                          <option value="8">8. Corrosive substances</option>
                        </optgroup>
                        <optgroup label="9. MISCELLANEOUS">
                          <option value="9">9. Miscellaneous</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#faf9f6] font-bold mb-2">UN NUMBER (OPTIONAL)</label>
                      <input
                        type="text"
                        value={formData.unNumber}
                        onChange={(e) => handleInputChange("unNumber", e.target.value)}
                        className={`rounded-xl hover:text-white text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#fa0404] hover:bg-[#d93838] w-full font-bold`}
                        placeholder="e.g., UN1203"
                      />
                    </div>
                  </div>
                </div>
              )}

              <br />
              <div className="mb-6">
                <label className="block text-[#faf9f6] font-bold mb-2">COMMODITY</label>
                <select
                  value={formData.commodity}
                  onChange={(e) => handleInputChange("commodity", e.target.value)}
                  className={`${inputStyle} w-64 font-bold`}
                >
                  <option value="FAK">FAK – Freight All Kinds</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Food">Food Products</option>
                </select>
              </div>

              <br />
              <div className="flex justify-center">
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className={`bg-[#0A1A2F] rounded-3xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] text-[#faf9f6] px-12 py-3 text-lg shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[15px_5px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={!canProceedToNext() ? (searchErrors[0] || "Complete routing to continue") : undefined}
                >
                  SEARCH
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: OFFER (TARIFF) SELECTION */}
        {currentStep === 2 && (
          <div className={`${sectionStyle} p-13 mb-13`} style={cardGradient}>
            {/* Inline Route Bar */}
            <div className="mb-6">
              <div className="p-4 rounded-2xl flex items-center justify-between">
                {[
                  { name: startLabel || formData.startLocation, type: formData.pickupType },
                  { name: endLabel || formData.endLocation, type: formData.deliveryType },
                ].map((pt, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#2D4D8B] p-2 rounded-full">
                        {pt.type === "door" ? <MapPin size={30} className="text-white" /> : <Anchor size={30} className="text-white" />}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#22D3EE]">{pt.name}</div>
                      <div className="text-sm text-white font-bold mt-1">{pt.type.toUpperCase()}</div>
                    </div>

                    {idx < 1 && (
                      <div className="flex items-center flex-1 mx-2 relative">
                        <div className="w-2 h-2 bg-[#22D3EE] rounded-full"></div>
                        <div className="flex-1 h-0.5 border-t-2 border-dotted border-[#22D3EE] mx-1"></div>
                        <Sailboat size={55} className="text-[#22D3EE] mb-7" />
                        <div className="flex-1 h-0.5 border-t-2 border-dotted border-[#22D3EE] mx-1"></div>
                        <div className="w-2 h-2 bg-[#22D3EE] rounded-full"></div>

                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 ">
                          <button
                            onClick={() => setIsRouteModalOpen(true)}
                            className="uppercase px-4 py-1 text-sm bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] text-white rounded-xl shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 font-bold text-black "
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Departures Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 text-white font-bold uppercase">
                <Ship size={18} className="text-[#22D3EE]" />
                DEPARTURES
                <span className="ml-3 text-xs font-normal opacity-80">
                  {depLoading ? "Loading…" : depError ? depError : `${departures.length} sailings`}
                </span>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto pb-4">
                <button
                  className="p-2 text-[#22D3EE] hover:text-white transition-colors disabled:opacity-40"
                  onClick={() => setSelectedDepartureIdx((i) => Math.max(0, i - 1))}
                  disabled={selectedDepartureIdx === 0}
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>

                {(departures.length ? departures : [{ date: formData.validFrom }]).map((d, idx) => {
                  const selected = idx === selectedDepartureIdx;
                  const priceObj =
                    d.priceByType?.[selectedCode] ||
                    (tariffs.find((t) => (t.containerTypeCode || "").toUpperCase() === selectedCode)
                      ? {
                          currency: (tariffs.find((t) => (t.containerTypeCode || "").toUpperCase() === selectedCode) as Tariff).currency,
                          amount: (tariffs.find((t) => (t.containerTypeCode || "").toUpperCase() === selectedCode) as Tariff).amount,
                        }
                      : undefined);

                  return (
                    <div
                      key={`${d.date}-${idx}`}
                      onClick={() => setSelectedDepartureIdx(idx)}
                      className={clsx(
                        "flex flex-col items-center p-4 rounded-xl border-2 min-w-[140px] cursor-pointer transition-all",
                        selected
                          ? "bg-[#2D4D8B] border-[#22D3EE] text-white shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                          : "bg-[#1A2A4A] border-[#2D4D8B] text-white hover:bg-[#2D4D8B] hover:border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                      )}
                    >
                      <div className="text-sm font-bold">{d.date}</div>
                      <div className={clsx("text-lg font-bold mt-1", selected ? "text-[#22D3EE]" : "text-white")}>
                        {priceObj ? `${priceObj.currency} ${priceObj.amount.toLocaleString()}` : "—"}
                      </div>
                      <div className="mt-2 w-6 h-6 rounded-full border-2 border-[#22D3EE] flex items-center justify-center">
                        {selected && <div className="w-3 h-3 bg-[#22D3EE] rounded-full" />}
                      </div>
                    </div>
                  );
                })}

                <button
                  className="p-2 text-[#22D3EE] hover:text-white transition-colors disabled:opacity-40"
                  onClick={() =>
                    setSelectedDepartureIdx((i) => Math.min((departures.length || 1) - 1, i + 1))
                  }
                  disabled={selectedDepartureIdx >= (departures.length || 1) - 1}
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="text-center text-[#22D3EE] text-sm mt-4 font-semibold">
                Prices shown for {selectedCode} (switch type below)
              </div>
            </div>

            {/* CONTENT GRID: Left = offers; Right = snapshot+timeline+assumptions */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Left: Quick Quotes (Tariffs) */}
              <div className="md:col-span-2 bg-[#1A2A4A] rounded-2xl border-2 border-[#2D4D8B] shadow-[15px_15px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-[#2D4D8B] p-4 border-b-2 border-[#22D3EE]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#22D3EE] rounded-full flex items-center justify-center">
                      <Clock size={16} className="text-black" />
                    </div>
                    <h3 className="font-bold text-white uppercase text-lg">Quick Quotes</h3>
                  </div>
                </div>

                <div className="p-6 bg-[#0A1A2F]">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar size={16} className="text-[#22D3EE]" />
                    <span className="text-sm text-[#22D3EE] font-semibold">
                      {tariffsLoading ? "Loading…" : tariffsError ? tariffsError : "Public tariff"}
                    </span>
                  </div>

                  {/* Group CT switcher */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {allowed.map((ct) => {
                      const t = tariffs.find((x) => (x.containerTypeCode || "").toUpperCase() === ct);
                      return (
                        <button
                          key={ct}
                          onClick={() => setSelectedCtCode(ct)}
                          className={clsx(
                            "p-3 text-md font-bold transition shadow border-2 border-black cursor-pointer text-left",
                            selectedCode === ct
                              ? "bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0px_rgba(0,0,0,1)]"
                              : "bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                          )}
                          title={t ? `${t.currency} ${Number(t.amount || 0).toLocaleString()} / container` : "No rate"}
                        >
                          <div className="flex items-center justify-between">
                            <span>{ct}</span>
                            <span className="text-xs font-semibold">
                              {t ? `${t.currency} ${Number(t.amount || 0).toLocaleString()}` : "—"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    {allowed.map((code) => {
                      const t = tariffs.find((x) => (x.containerTypeCode || "").toUpperCase() === code);
                      return (
                        <div key={code} className="flex justify-between items-center bg-[#1A2A4A] p-3 rounded-lg border border-[#2D4D8B]">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-white">
                              {t ? `${t.currency} ${t.amount.toLocaleString()}` : "—"}
                            </span>
                            <span className="text-xs text-[#22D3EE] font-semibold">/Container</span>
                          </div>
                          <div className="bg-[#2D4D8B] px-3 py-1 rounded-lg border border-[#22D3EE]">
                            <span className="text-sm font-bold text-[#22D3EE]">{code}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSelectedCtCode(selectedCode)}
                    disabled={!tariffs.length}
                    className={clsx(
                      "w-full font-bold py-3 rounded-lg border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all uppercase mt-6",
                      tariffs.length
                        ? "bg-[#22D3EE] text-black hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:bg-[#00FFFF]"
                        : "bg-gray-500 text-gray-300 cursor-not-allowed"
                    )}
                  >
                    Select
                  </button>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowModal("breakdown")}
                      className="flex-1 bg-[#2D4D8B] text-white font-bold py-2 px-3 rounded border-2 border-[#22D3EE] text-sm hover:bg-[#1A2F4E] transition-colors"
                    >
                      <BarChart3 size={16} className="inline mr-1" />
                      Price Breakdown
                    </button>
                    <button
                      onClick={() => setShowModal("remarks")}
                      className="flex-1 bg-[#2D4D8B] text-white font-bold py-2 px-3 rounded border-2 border-[#22D3EE] text-sm hover:bg-[#1A2F4E] transition-colors"
                    >
                      <MessageCircle size={16} className="inline mr-1" />
                      Remarks
                    </button>
                  </div>

                  {/* Features */}
                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-[#22D3EE]">
                      <CheckCircle size={16} />
                      <span className="text-white">Equipment and Loading guarantee</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#22D3EE]">
                      <CheckCircle size={16} />
                      <span className="text-white">Instant booking confirmation</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#22D3EE]">
                      <DollarSign size={16} />
                      <span className="text-white">Fixed Ocean Freight (Surcharges valid at time of shipment)</span>
                    </div>
                  </div>

                  <button className="w-full text-[#22D3EE] text-sm font-bold mt-4 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <ChevronDown size={16} />
                    Show All Features
                  </button>
                </div>
              </div>

              {/* Right Rail: Snapshot + Timeline + Assumptions */}
              <div className="md:col-span-1 md:sticky top-4 h-fit space-y-6">
                {/* Quote Snapshot */}
                <div className="bg-[#1A2A4A] rounded-2xl border-2 border-[#22D3EE] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                  <div className="bg-[#2D4D8B] px-4 py-3 border-b-2 border-[#22D3EE] flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#22D3EE] rounded-full flex items-center justify-center">
                      <Package size={14} className="text-black" />
                    </div>
                    <div className="text-white font-bold uppercase text-sm">Quote Snapshot</div>
                  </div>
                  <div className="p-4 text-white space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Container Type</span>
                      <span className="font-bold text-[#22D3EE]">{selectedCode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quantity</span>
                      <span className="font-bold text-[#22D3EE]">{qty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Base / Ctr</span>
                      <span className="font-bold text-[#22D3EE]">
                        {selectedTariff ? `${selectedTariff.currency} ${selectedTariff.amount.toLocaleString()}` : "—"}
                      </span>
                    </div>
                    <div className="border-t border-[#2D4D8B] my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-[#00FFFF]">Est. Total</span>
                      <span className="text-[#00FFFF]">
                        {(() => {
                          const g = grandTotalForSelection(selectedTariff);
                          return `${g.currency} ${g.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sailing Timeline (cutoffs + countdown) */}
                <div className="bg-[#1A2A4A] rounded-2xl border-2 border-[#22D3EE] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                  <div className="bg-[#2D4D8B] px-4 py-3 border-b-2 border-[#22D3EE] flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#22D3EE] rounded-full flex items-center justify-center">
                      <Clock size={14} className="text-black" />
                    </div>
                    <div className="text-white font-bold uppercase text-sm">Sailing Timeline</div>
                  </div>
                  <div className="p-4 text-white space-y-3">
                    <div className="text-xs opacity-80">For departure: <span className="font-bold text-[#22D3EE]">{fmtDateTime(selectedDepartureDate)}</span></div>
                    <div className="space-y-2">
                      {cutoffs.map((m, i) => {
                        const cd = countdownTo(m.date);
                        return (
                          <div key={i} className="flex items-center justify-between bg-[#0F1B2A] border border-[#2D4D8B] rounded-xl px-3 py-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{m.label}</span>
                              <span className="text-xs opacity-90">{fmtDateTime(m.date)}</span>
                            </div>
                            <div
                              className={clsx(
                                "text-xs font-bold px-2 py-1 rounded-lg border",
                                cd.past
                                  ? "bg-[#3b0b0b] border-red-400 text-red-200"
                                  : "bg-[#0d767d] border-teal-300 text-white"
                              )}
                            >
                              {cd.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Assumptions & Exclusions (derived) */}
                <div className="bg-[#1A2A4A] rounded-2xl border-2 border-[#22D3EE] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                  <div className="bg-[#2D4D8B] px-4 py-3 border-b-2 border-[#22D3EE] flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#22D3EE] rounded-full flex items-center justify-center">
                      <CheckCircle size={14} className="text-black" />
                    </div>
                    <div className="text-white font-bold uppercase text-sm">Assumptions & Exclusions</div>
                  </div>
                  <div className="p-4 text-white text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>SOC</span>
                      <span className="font-bold">{formData.shipperOwnedContainer ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commodity</span>
                      <span className="font-bold">{formData.commodity || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight / Ctr</span>
                      <span className="font-bold">
                        {formData.weightPerContainer || "—"} {formData.weightUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dangerous Goods</span>
                      <span className="font-bold">
                        {formData.dangerousGoods ? `Yes${formData.imoClass ? ` (IMO ${formData.imoClass})` : ""}${formData.unNumber ? `, ${formData.unNumber}` : ""}` : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pickup</span>
                      <span className="font-bold">{formData.pickupType.toUpperCase()}</span>
                    </div>
                    <div className={clsx("text-xs rounded-md px-2 py-1 border",
                      formData.pickupType === "door" && pickupDoorAllowed === false
                        ? "bg-[#3b0b0b] border-red-400 text-red-200"
                        : "bg-[#0F1B2A] border-[#2D4D8B] text-white/90"
                    )}>
                      {formData.pickupType === "door"
                        ? pickupDoorAllowed === false
                          ? "Pickup at door not supported at origin."
                          : "Door pickup assumed."
                        : "Terminal pickup assumed."}
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span className="font-bold">{formData.deliveryType.toUpperCase()}</span>
                    </div>
                    <div className={clsx("text-xs rounded-md px-2 py-1 border",
                      formData.deliveryType === "door" && deliveryDoorAllowed === false
                        ? "bg-[#3b0b0b] border-red-400 text-red-200"
                        : "bg-[#0F1B2A] border-[#2D4D8B] text-white/90"
                    )}>
                      {formData.deliveryType === "door"
                        ? deliveryDoorAllowed === false
                          ? "Delivery at door not supported at destination."
                          : "Door delivery assumed."
                        : "Terminal delivery assumed."}
                    </div>

                    <div className="flex justify-between">
                      <span>Valid From</span>
                      <span className="font-bold">{formData.validFrom}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown / Remarks Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
                <div
                  className="rounded-xl w-4/5 max-w-4xl max-h-[80vh] overflow-hidden border-4 border-black shadow-[-8px_4px_16px_rgba(0,0,0,0.6)]"
                  onClick={(e) => e.stopPropagation()}
                  style={cardGradient}
                >
                  {/* Modal Header */}
                  <div className="flex border-b-4 rounded-xl border-black">
                    <button
                      onClick={() => setShowModal("breakdown")}
                      className={clsx(
                        "flex-1 px-6 py-4 font-bold border-r-4 border-black transition-all",
                        showModal === "breakdown" ? "bg-[#0057d9] text-white" : "bg-[#2a72dc] text-white hover:bg-[#1c437c]"
                      )}
                    >
                      Price Breakdown
                    </button>
                    <button
                      onClick={() => setShowModal("remarks")}
                      className={clsx(
                        "flex-1 px-6 py-4 font-bold transition-all",
                        showModal === "remarks" ? "bg-[#7000c6] text-white" : "bg-[#7b22bf] text-[#faf9f6] hover:bg-[#330358]"
                      )}
                    >
                      Remarks and Info
                    </button>
                    <button onClick={() => setShowModal(null)} className="px-4 py-4 bg-gray-300 text-black hover:bg-gray-400 transition-all">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto max-h-[60vh] text-white">
                    {showModal === "breakdown" && (
                      <div>
                        <h3 className="text-2xl font-bold mb-6">Total Price Estimate</h3>

                        {/* Summary across the selected family/group */}
                        <div className="bg-[#2D4D8B] border-4 border-black p-4 mb-6 shadow-[10px_10px_0px_rgba(0,0,0,1)] rounded-xl">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="font-bold">Container Type</div>
                            {allowed.map((c) => <div key={c} className="font-bold">{c}</div>)}
                            <div>Estimated Total / Container</div>
                            {allowed.map((c) => {
                              const t = tariffs.find((x) => (x.containerTypeCode || "").toUpperCase() === c) || null;
                              const per = perContainerTotalFor(t);
                              const cur = t?.currency || "USD";
                              return <div key={c}>{cur} {per.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>;
                            })}
                          </div>
                          <div className="text-xs mt-2 opacity-90 text-white/90">
                            Includes base ocean freight + any per-container / percent surcharges. Per-shipment charges are added once at checkout.
                          </div>
                        </div>

                        {/* Detailed lines for the selected type */}
                        {selectedTariff && (
                          <>
                            <h4 className="text-xl font-bold mb-4">
                              Selected: {selectedTariff.containerTypeCode}
                            </h4>

                            <div className="bg-[#1e3a8a] border-4 border-black p-4 mb-6 shadow-[10px_10px_0px_rgba(0,0,0,1)] rounded-xl">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-bold">Ocean Freight</div>
                                <div className="text-right">
                                  {selectedTariff.currency} {selectedTariff.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  <span className="opacity-80"> / container</span>
                                </div>
                              </div>
                            </div>

                            <h4 className="text-xl font-bold mb-4">Surcharges</h4>
                            <div className="bg-[#051241] border-4 border-black p-4 mb-6 shadow-[10px_10px_0px_rgba(0,0,0,1)] rounded-xl">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="font-bold">Code</div>
                                <div className="font-bold">Basis</div>
                                <div className="font-bold text-right">Amount</div>
                                {surcharges.map((s, i) => {
                                  let text = "-";
                                  if (s.basis === "PER_CONTAINER" && s.amount != null) {
                                    text = `${s.currency} ${s.amount.toLocaleString()} / container`;
                                  } else if (s.basis === "PER_SHIPMENT" && s.amount != null) {
                                    text = `${s.currency} ${s.amount.toLocaleString()} per shipment`;
                                  } else if (s.basis === "PERCENT" && s.percent != null) {
                                    text = `${s.percent}% of ocean freight`;
                                  }
                                  return (
                                    <React.Fragment key={i}>
                                      <div title={s.description || s.code}>{s.code}</div>
                                      <div>{s.basis.replace("_", " ")}</div>
                                      <div className="text-right">{text}</div>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="bg-[#0A1A2F] border-4 border-white p-4 rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)]">
                              {(() => {
                                const { currency, amount } = grandTotalForSelection(selectedTariff);
                                return (
                                  <>
                                    <div className="flex justify-between text-xl font-bold">
                                      <span className="text-[#00FFFF]">TOTAL ESTIMATE ({qty}× {selectedTariff.containerTypeCode}):</span>
                                      <span className="text-[#00FFFF]">
                                        {currency} {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="text-xs opacity-90 mt-1">
                                      Includes per-shipment charges once; actuals may vary at booking.
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {showModal === "remarks" && (
                      <div>
                        <h3 className="text-2xl font-bold mb-6">Remarks</h3>
                        <div className="bg-[#1A2A4A] rounded-xl border-4 border-black p-6 mb-6">
                          <p className="mb-4">
                            Future Marine Fuel Recovery (MFR) surcharge adjustments may not be reflected. Check your local tariff
                            notes and terms for full validity and exceptions.
                          </p>
                          <p>
                            Detention & Demurrage and country-specific fees may apply depending on equipment and terminal handling.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t-4 border-black p-4 bg-[#22546d] flex justify-end">
                    <button
                      onClick={() => setShowModal(null)}
                      className="bg-gray-300 text-black rounded-xl px-6 py-2 font-bold border-4 border-black shadow-[-4px_2px_8px_rgba(0,0,0,0.4)] hover:bg-gray-400 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {currentStep === 3 && (
          (() => {
            const t = selectedTariff;
            const totals = t ? grandTotalForSelection(t) : { currency: "USD", amount: 0 };
            const qty = Math.max(1, Number(formData.containerQuantity || 1));
            return (
              <div className={`${sectionStyle} p-10 mb-13`} style={cardGradient}>
                <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
                  <Package size={24} /> REVIEW & NEXT STEPS
                </h2>

                <div className="bg-[#0A5B61] rounded-xl border-4 border-white p-6 mb-8 shadow-[20px_20px_0px_rgba(0,0,0,1)] ">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8 ">
                      <div className="flex items-center gap-2 text-[#00FFFF] font-bold text-md">
                        <Ship size={50} /> ROUTE & SHIPMENT
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#00FFFF] rounded-full"></div>
                        <span className="text-[#faf9f6] font-bold">FROM:</span>
                        <span className="text-[#00FFFF] uppercase">{startLabel || formData.startLocation || "Start"}</span>
                        <div className="flex items-center gap-1 ml-2">
                          {formData.pickupType === "door" ? (
                            <MapPin size={16} className="text-[#00FFFF]" />
                          ) : (
                            <Anchor size={16} className="text-[#00FFFF]" />
                          )}
                          <span className="text-[#faf9f6] text-xs">{formData.pickupType.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#00FFFF] rounded-full"></div>
                        <div className="w-3 h-0.5 border-t-2 border-dotted border-[#00FFFF]"></div>
                        <div className="w-2 h-2 bg-[#00FFFF] rounded-full"></div>
                        <div className="w-3 h-0.5 border-t-2 border-dotted border-[#00FFFF]"></div>
                        <div className="w-2 h-2 bg-[#00FFFF] rounded-full"></div>
                        <div className="w-3 h-0.5 border-t-2 border-dotted border-[#00FFFF]"></div>
                        <div className="w-2 h-2 bg-[#00FFFF] rounded-full"></div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#00FFFF] rounded-full"></div>
                        <span className="text-[#faf9f6] font-bold">TO:</span>
                        <span className="uppercase text-[#00FFFF]">{endLabel || formData.endLocation || "End"}</span>
                        <div className="flex items-center gap-1 ml-2 mr-4">
                          {formData.deliveryType === "door" ? (
                            <MapPin size={16} className="text-[#00FFFF]" />
                          ) : (
                            <Anchor size={16} className="text-[#00FFFF]" />
                          )}
                          <span className="text-[#faf9f6] text-xs">{formData.deliveryType.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-l border-[#00FFFF] pl-6 flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-[#faf9f6] text-xs">CONTAINER</div>
                        <div className="uppercase text-[#00FFFF] text-sm font-bold">
                          {qty}× {(selectedCtCode || uiToPrimaryTariffCode(formData.containerType))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#faf9f6] text-xs">COMMODITY</div>
                        <div className="uppercase text-[#00FFFF] text-sm font-bold">{formData.commodity}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#faf9f6] text-xs">VALID FROM</div>
                        <div className="uppercase text-[#00FFFF] text-sm font-bold">{formData.validFrom}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Price Breakdown */}
                <div className="bg-[#22546d] border-4 border-white rounded-2xl p-10 mb-10 shadow-[30px_30px_0px_rgba(0,0,0,1)]" style={cardGradient}>
                  <h3 className="text-xl font-bold text-[#00FFFF] mb-4 flex items-center gap-2">
                    <Download size={24} /> DETAILED PRICE BREAKDOWN
                  </h3>

                  {t && (
                    <div className="bg-[#22546d] rounded-3xl border-2 border-white p-4 mb-10 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
                      <h4 className="text-lg font-bold text-[#faf9f6] mb-3">Ocean Freight</h4>
                      <div className="flex flex-col gap-2 text-sm text-[#faf9f6]">
                        <div className="flex justify-between w-full">
                          <span>Base Ocean Freight ({t.containerTypeCode})</span>
                          <span className="font-bold text-[#00FFFF]">
                            {t.currency} {t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} / container
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#0A1A2F] border-4 border-white p-4 rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span className="text-[#00FFFF]">TOTAL ESTIMATED PRICE:</span>
                      <span className="text-[#00FFFF]">
                        {totals.currency} {totals.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-xs text-white opacity-90 mt-1">*Final rates may vary.</div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-[#071e3d] rounded-2xl mb-10 border-4 border-white p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-lg font-bold text-[#00FFFF] mb-4 flex items-center gap-2">
                    <ArrowRight size={20} /> NEXT STEPS
                  </h3>
                  <div className="space-y-4 text-[#faf9f6]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#00FFFF] text-white rounded-full flex items-center justify-center font-bold border-2 border-black">
                        1
                      </div>
                      <span>Send quote request to carrier</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#555] text-[#faf9f6] rounded-full flex items-center justify-center font-bold border-2 border-black">
                        2
                      </div>
                      <span>Receive official quote via email</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#555] text-[#faf9f6] rounded-full flex items-center justify-center font-bold border-2 border-black">
                        3
                      </div>
                      <span>Book your shipment</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button className={`border-2 rounded-3xl text-white px-4 mr-2 py-3 bg-[#2a72dc] hover:bg-[#071e3d] hover:text-[#00FFFF] flex items-center gap-2 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow`}>
                      <Send size={20} /> SEND QUOTE REQUEST
                    </button>
                    <button className={`border-2 rounded-3xl text-white px-3 mr-2 py-2 bg-[#2a72dc] hover:bg-[#071e3d] hover:text-[#00FFFF] flex items-center gap-2 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow`}>
                      <Download size={20} /> DOWNLOAD QUOTE
                    </button>
                    <button className={`border-2 rounded-3xl text-white px-3 mr-2 py-2 bg-[#2a72dc] hover:bg-[#071e3d] hover:text-[#00FFFF] flex items-center gap-2 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow`}>
                      <Mail size={20} /> EMAIL QUOTE
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* NAV CONTROLS */}
        {currentStep > 1 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-white font-bold rounded-xl px-4 py-2 hover:bg-gray-400 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[17px_17px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              <ArrowLeft size={20} /> PREVIOUS
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className="bg-white rounded-XL font-bold px-4 py-2 flex flex-col justify-between hover:bg-gray-400 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[17px_17px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canProceedToNext() ? "Complete selections to continue" : undefined}
              >
                <span className="self-center">NEXT</span>
                <ArrowRight size={20} className="self-end" />
              </button>
            ) : (
              <button
                onClick={() => alert("Quote request submitted successfully!")}
                className="bg-white font-bold rounded-xl px-4 py-2 hover:bg-gray-400 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[17px_17px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="flex flex-col justify-center items-center ">
                  <Send size={20} />
                  <div>GET QUOTE</div>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewQuoteComponent;
