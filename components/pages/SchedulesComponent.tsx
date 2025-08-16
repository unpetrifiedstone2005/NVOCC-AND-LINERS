"use client";
import {
  MapPin,
  Settings,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Ship,
  Clock3,
  Copy,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ---------------- form + API types ---------------- */
type DeliveryType = "door" | "terminal";

interface FormData {
  startLocation: string;
  endLocation: string;
  pickupType: DeliveryType;   // <-- separate state for pickup
  deliveryType: DeliveryType; // <-- separate state for delivery
  validFrom: string;
}

/* row returned by /api/seed/voyages/get */
type VoyageRow = {
  id: string;
  voyageNumber: string;
  vesselName: string;
  departure: string; // ISO
  arrival: string;   // ISO
  loadPortUnlocode: string;
  dischargePortUnlocode: string;
};

type Connection = {
  hub: string;
  leg1: VoyageRow;
  layoverHours: number;
  leg2: VoyageRow;
  totalTransitDays: number;
};

type DisplayItem =
  | {
      kind: "direct";
      id: string;
      from: string;
      to: string;
      dep: string;
      arr: string;
      transitDays: number;
      legA: { vessel: string; voyage: string };
      _voyage: VoyageRow; // hidden original voyage
    }
  | {
      kind: "conn";
      id: string; // leg1.id + leg2.id
      from: string;
      hub: string;
      to: string;
      dep: string;
      arr: string;
      transitDays: number;
      layoverHours: number;
      legA: { vessel: string; voyage: string };
      legB: { vessel: string; voyage: string };
      _leg1: VoyageRow;
      _leg2: VoyageRow;
    };

type CutoffKind = "ERD" | "FCL_GATEIN" | "VGM" | "DOC_SI";
const CUTOFF_LABEL: Record<CutoffKind, string> = {
  ERD: "Earliest Receiving",
  FCL_GATEIN: "FCL Cut-off",
  VGM: "VGM Cut-off",
  DOC_SI: "Doc (SI) Cut-off",
};

type VoyageCutoff = { id: string; kind: CutoffKind; at: string; source?: string };
type CutoffPayload = { timezone?: string; cutoffs?: VoyageCutoff[] };

/* ---------------- helpers ---------------- */
const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

function extractUnlocode(s: string): string | null {
  if (!s) return null;
  const m = s.toUpperCase().match(/([A-Z0-9]{5})/);
  return m ? m[1] : null;
}
function fmtDate(dISO: string) {
  try {
    return new Date(dISO).toLocaleDateString();
  } catch {
    return dISO;
  }
}
function fmtDateTimeLocal(iso: string, tz?: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
function hoursBetween(aISO: string, bISO: string) {
  return (new Date(bISO).getTime() - new Date(aISO).getTime()) / 36e5;
}
function daysBetween(aISO: string, bISO: string) {
  return hoursBetween(aISO, bISO) / 24;
}
function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== "") sp.set(k, String(v));
  }
  return sp.toString();
}
function buildConnections(
  legsFromPol: VoyageRow[],
  legsToPod: VoyageRow[],
  opts = { minLayoverHrs: 6, maxLayoverHrs: 240, maxTotalDays: 60 }
): Connection[] {
  const byHub = new Map<string, VoyageRow[]>();
  for (const v of legsToPod) {
    const list = byHub.get(v.loadPortUnlocode) ?? [];
    list.push(v);
    byHub.set(v.loadPortUnlocode, list);
  }
  const out: Connection[] = [];
  for (const leg1 of legsFromPol) {
    const hub = leg1.dischargePortUnlocode;
    const nexts = byHub.get(hub);
    if (!nexts?.length) continue;

    for (const leg2 of nexts) {
      const lay = hoursBetween(leg1.arrival, leg2.departure);
      if (lay < opts.minLayoverHrs || lay > opts.maxLayoverHrs) continue;

      const totalDays = Math.ceil(daysBetween(leg1.departure, leg2.arrival));
      if (totalDays > opts.maxTotalDays) continue;

      out.push({
        hub,
        leg1,
        layoverHours: Math.round(lay),
        leg2,
        totalTransitDays: totalDays,
      });
    }
  }
  out.sort(
    (a, b) =>
      new Date(a.leg2.arrival).getTime() - new Date(b.leg2.arrival).getTime()
  );
  return out;
}

/* ---------------- component ---------------- */
export const SchedulesComponent: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    startLocation: "",
    endLocation: "",
    pickupType: "terminal",
    deliveryType: "terminal",
    validFrom: "2025-08-12",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [direct, setDirect] = useState<VoyageRow[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // row->open
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  // row->detail payload
  const [detailMap, setDetailMap] = useState<
    Record<
      string,
      {
        loading: boolean;
        tz?: string;
        cutoffs?: Record<CutoffKind, string>;
        error?: string;
      }
    >
  >({});

  const radioButtonStyle =
    "w-4 h-4 accent-[#1d4595] bg-[#373737] border-2 border-black";
  const sectionStyle =
    "max-w-[1600.24px] rounded-xl shadow-[40px_40px_0px_rgba(0,0,0,1)] p-6 py-[26px] border-white border-2";

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value } as FormData));
  };

  async function onFind() {
    setHasSearched(true);
    setError(null);
    setLoading(true);
    setDirect([]);
    setConnections([]);
    setOpenRows({});
    setDetailMap({});

    try {
      const pol = extractUnlocode(formData.startLocation);
      const pod = extractUnlocode(formData.endLocation);
      if (!pol) throw new Error("Enter a valid Start Location (UN/LOCODE like USNYC)");
      if (!pod) throw new Error("Enter a valid End Location (UN/LOCODE like IEDUB)");

      // Direct
      const q1 = qs({ pol, pod, validFrom: formData.validFrom, limit: 100 });
      const r1 = await fetch(`/api/seed/voyages/get?${q1}`);
      if (!r1.ok) throw new Error("Failed to fetch direct voyages");
      const j1 = await r1.json();
      const directRows: VoyageRow[] = j1.voyages ?? [];
      setDirect(directRows);

      // One-stop (legs)
      const qA = qs({ pol, validFrom: formData.validFrom, limit: 200 });
      const rA = await fetch(`/api/seed/voyages/get?${qA}`);
      if (!rA.ok) throw new Error("Failed to fetch legs from POL");
      const legsFromPol: VoyageRow[] = (await rA.json()).voyages ?? [];

      const qB = qs({ pod, validFrom: formData.validFrom, limit: 200 });
      const rB = await fetch(`/api/seed/voyages/get?${qB}`);
      if (!rB.ok) throw new Error("Failed to fetch legs to POD");
      const legsToPod: VoyageRow[] = (await rB.json()).voyages ?? [];

      const stitched = buildConnections(legsFromPol, legsToPod, {
        minLayoverHrs: 6,
        maxLayoverHrs: 240,
        maxTotalDays: 60,
      }).slice(0, 50);

      setConnections(stitched);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function onClear() {
    setFormData({
      startLocation: "",
      endLocation: "",
      pickupType: "terminal",
      deliveryType: "terminal",
      validFrom: "2025-08-12",
    });
    setHasSearched(false);
    setDirect([]);
    setConnections([]);
    setError(null);
    setOpenRows({});
    setDetailMap({});
  }

  /* ------- unified display list (direct + 1-stop) ------- */
  const displayList: DisplayItem[] = useMemo(() => {
    const items: DisplayItem[] = [];

    // direct
    for (const v of direct) {
      items.push({
        kind: "direct",
        id: v.id,
        from: v.loadPortUnlocode,
        to: v.dischargePortUnlocode,
        dep: v.departure,
        arr: v.arrival,
        transitDays: Math.ceil(daysBetween(v.departure, v.arrival)),
        legA: { vessel: v.vesselName, voyage: v.voyageNumber },
        _voyage: v,
      });
    }

    // one-stop
    for (const c of connections) {
      items.push({
        kind: "conn",
        id: `${c.leg1.id}-${c.leg2.id}`,
        from: c.leg1.loadPortUnlocode,
        hub: c.hub,
        to: c.leg2.dischargePortUnlocode,
        dep: c.leg1.departure,
        arr: c.leg2.arrival,
        transitDays: c.totalTransitDays,
        layoverHours: c.layoverHours,
        legA: { vessel: c.leg1.vesselName, voyage: c.leg1.voyageNumber },
        legB: { vessel: c.leg2.vesselName, voyage: c.leg2.voyageNumber },
        _leg1: c.leg1,
        _leg2: c.leg2,
      } as DisplayItem);
    }

    // sort by final arrival (soonest first)
    items.sort(
      (a, b) => new Date(a.arr).getTime() - new Date(b.arr).getTime()
    );

    return items;
  }, [direct, connections]);

  /* ------- details fetch (universal cutoffs endpoint) ------- */
  async function ensureDetails(row: DisplayItem) {
    if (detailMap[row.id]?.loading || detailMap[row.id]?.cutoffs) return;

    // For direct, show its cutoffs; for 1-stop, show first-leg cutoffs
    const v = row.kind === "direct" ? row._voyage : row._leg1;

    if (!v) {
      setDetailMap((m) => ({
        ...m,
        [row.id]: { loading: false, error: "Missing voyage for details" },
      }));
      return;
    }

    setDetailMap((m) => ({ ...m, [row.id]: { loading: true } }));

    try {
      const r = await fetch(`/api/seed/voyages/${v.id}/cutoffs/get`);
      if (!r.ok) throw new Error("Failed to fetch cut-offs");
      const j: CutoffPayload = await r.json();

      const byKind: Record<CutoffKind, string> = {
        ERD: "",
        FCL_GATEIN: "",
        VGM: "",
        DOC_SI: "",
      };
      (j.cutoffs ?? []).forEach((c) => {
        if (c.kind in byKind) byKind[c.kind as CutoffKind] = c.at;
      });

      setDetailMap((m) => ({
        ...m,
        [row.id]: {
          loading: false,
          tz: j.timezone || "UTC",
          cutoffs: byKind,
        },
      }));
    } catch (e: any) {
      setDetailMap((m) => ({
        ...m,
        [row.id]: { loading: false, error: e?.message || "Failed to load" },
      }));
    }
  }

  function toggleDetails(row: DisplayItem) {
    setOpenRows((o) => {
      const next = { ...o, [row.id]: !o[row.id] };
      return next;
    });
    const becomingOpen = !openRows[row.id];
    if (becomingOpen) ensureDetails(row);
  }

  async function copyDetails(row: DisplayItem) {
    const det = detailMap[row.id];
    const tz = det?.tz || "UTC";
    const lines: string[] = [];

    lines.push(
      `${row.from} → ${row.kind === "conn" ? `via ${row.hub} → ` : ""}${row.to}`
    );
    lines.push(`Departure: ${row.dep}`);
    lines.push(`Arrival:   ${row.arr}`);
    lines.push(`Transit:   ${row.transitDays} days`);
    if (row.kind === "conn") lines.push(`Layover at ${row.hub}: ${row.layoverHours} h`);
    lines.push(`Leg A: ${row.legA.vessel} / ${row.legA.voyage}`);
    if (row.kind === "conn") {
      lines.push(`Leg B: ${row.legB.vessel} / ${row.legB.voyage}`);
    }
    lines.push("");
    lines.push("Cut-offs" + (det?.tz ? ` (${tz})` : "") + ":");
    const co = det?.cutoffs;
    (["DOC_SI", "FCL_GATEIN", "VGM", "ERD"] as CutoffKind[]).forEach((k) => {
      const label = CUTOFF_LABEL[k];
      const val = co?.[k] ? fmtDateTimeLocal(co[k]!, tz) : "—";
      lines.push(`${label}: ${val}`);
    });

    await navigator.clipboard.writeText(lines.join("\n"));
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-[1600.24px] mx-auto w-full px-4 ">
      {/* SEARCH */}
      <div className={`${sectionStyle} p-10`} style={cardGradient}>
        <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
          SEARCH
        </h2>
        <hr className="my-2 border-t border-white" />
        <br />

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Start Location */}
            <div className="space-y-4">
              <label className="block text-md text-[#faf9f6] font-light mb-2">
                START LOCATION
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.startLocation}
                  onChange={(e) => handleInputChange("startLocation", e.target.value)}
                  className={`w-full uppercase text-sm bg-[#2D4D8B] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] hover:placeholder-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold pl-12`}
                  placeholder="Location name or code (e.g., USNYC)"
                />
                <MapPin size={20} color="white" className="absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
              </div>
              {/* pickup radios (separate state) */}
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
                  <input
                    type="radio"
                    checked={formData.pickupType === "door"}
                    onChange={() => handleInputChange("pickupType", "door")}
                    className={radioButtonStyle}
                  />
                  Picked up at Door
                </label>
                <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
                  <input
                    type="radio"
                    checked={formData.pickupType === "terminal"}
                    onChange={() => handleInputChange("pickupType", "terminal")}
                    className={radioButtonStyle}
                  />
                  Picked up at Terminal/Ramp
                </label>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-md text-[#faf9f6] font-light mb-2 mt-5">START DATE</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleInputChange("validFrom", e.target.value)}
                className="rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#11235d] w-full "
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* End Location */}
            <div className="space-y-4">
              <label className="block text-md text-[#faf9f6] font-light mb-2">
                END LOCATION
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.endLocation}
                  onChange={(e) => handleInputChange("endLocation", e.target.value)}
                  className={`w-full uppercase text-sm bg-[#2D4D8B] hover:placeholder-[#00FFFF] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold pl-12`}
                  placeholder="Location name or code (e.g., IEDUB)"
                />
                <MapPin size={20} color="white" className="absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
              </div>
              {/* delivery radios (separate state) */}
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
                  <input
                    type="radio"
                    checked={formData.deliveryType === "door"}
                    onChange={() => handleInputChange("deliveryType", "door")}
                    className={radioButtonStyle}
                  />
                  Delivered to your Door
                </label>
                <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
                  <input
                    type="radio"
                    checked={formData.deliveryType === "terminal"}
                    onChange={() => handleInputChange("deliveryType", "terminal")}
                    className={radioButtonStyle}
                  />
                  Delivered to Terminal/Ramp
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Clear + Find */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClear}
            className="bg-[#0A1A2F] rounded-3xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] text-[#faf9f6] px-6 py-2 text-lg shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[15px_5px_0px_rgba(0,0,0,1)]"
          >
            Clear
          </button>
          <button
            onClick={onFind}
            disabled={loading}
            className="bg-[#0A1A2F] rounded-3xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] text-[#faf9f6] px-6 py-2 text-lg shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[15px_5px_0px_rgba(0,0,0,1)] disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Settings className="w-5 h-5 animate-spin" /> Searching…
              </span>
            ) : (
              "Find"
            )}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      <div className="mt-8 space-y-8">
        {error && (
          <div className="p-4 rounded-xl border-2 border-red-400 text-red-200 bg-red-900/20">
            {error}
          </div>
        )}

        {loading && (
          <div
            className="rounded-xl p-6 border-2 border-white shadow-[20px_20px_0_rgba(0,0,0,1)] flex items-center gap-3"
            style={cardGradient}
          >
            <Settings className="w-6 h-6 animate-spin text-cyan-300" />
            <span className="text-white">Fetching voyages…</span>
          </div>
        )}

        {/* Empty state AFTER a search */}
        {!loading && hasSearched && !error && displayList.length === 0 && (
          <div
            className="rounded-xl p-6 border-2 border-white shadow-[20px_20px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-cyan-300 mt-1" />
              <div className="text-white">
                <div className="text-2xl font-bold text-cyan-300 mb-1">No voyages found</div>
                <div className="text-sm opacity-90">
                  We couldn’t find direct or 1-stop sailings for your selection. Try a different date or nearby ports.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unified list (direct + 1-stop) */}
        {!loading && displayList.length > 0 && (
          <div
            className="rounded-xl p-6 border-2 border-white shadow-[20px_20px_0_rgba(0,0,0,1)]"
            style={cardGradient}
          >
            <h3 className="text-2xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
              <Ship className="w-6 h-6" /> Available sailings for your selection: {displayList.length}
            </h3>

            <div className="space-y-5">
              {displayList.map((row) => {
                const isOpen = !!openRows[row.id];
                const det = detailMap[row.id];

                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-white/20 bg-[#0f1e39] p-4 shadow-[10px_10px_0_rgba(0,0,0,1)]"
                  >
                    {/* header line with dates & transit */}
                    <div className="flex items-center justify-between text-white mb-3">
                      <div className="font-semibold">{fmtDate(row.dep)}</div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#132a52] text-cyan-200 text-xs font-bold border border-cyan-400/30">
                        <Clock3 className="w-4 h-4" />
                        {row.transitDays} days
                      </div>
                      <div className="font-semibold">{fmtDate(row.arr)}</div>
                    </div>

                    {/* main line: PoL ---- via ---- PoD */}
                    <div className="grid grid-cols-3 items-start text-white">
                      <div>
                        <div className="text-xs opacity-80">Terminal / Ramp (PoL)</div>
                        <div className="text-base font-extrabold">{row.from}</div>
                      </div>

                      <div className="text-center">
                        {row.kind === "conn" ? (
                          <>
                            <div className="text-xs opacity-80">via:</div>
                            <div className="text-base font-extrabold">{row.hub}</div>
                          </>
                        ) : (
                          <div className="text-xs opacity-50 h-[38px] flex items-center justify-center">
                            &nbsp;
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs opacity-80">Terminal / Ramp (PoD)</div>
                        <div className="text-base font-extrabold">{row.to}</div>
                      </div>
                    </div>

                    {/* badges row */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {/* Leg A */}
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#132a52] text-white border border-white/20 text-xs">
                        {row.legA.vessel}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#132a52] text-white border border-white/20 text-xs">
                        Voyage no.: {row.legA.voyage}
                      </span>

                      {row.kind === "conn" && (
                        <>
                          <ChevronRight className="w-4 h-4 text-cyan-300" />
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#132a52] text-white border border-white/20 text-xs">
                            {row.legB.vessel}
                          </span>
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#132a52] text-white border border-white/20 text-xs">
                            Voyage no.: {row.legB.voyage}
                          </span>
                          <span className="ml-auto text-xs text-cyan-200">
                            Layover: <b>{(row as any).layoverHours}</b> h
                          </span>
                        </>
                      )}

                      {/* Details button */}
                      <button
                        onClick={() => toggleDetails(row)}
                        className="ml-auto px-4 py-2 rounded-lg bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10 inline-flex items-center gap-2"
                        title={isOpen ? "Hide Details" : "Show Details"}
                      >
                        {isOpen ? "Hide Details" : "Show Details"}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {/* DETAILS PANEL */}
                    {isOpen && (
                      <div className="mt-4 rounded-xl border border-white/15 bg-[#0c1931] p-4">
                        {/* Loader inside the panel while fetching */}
                        {(!det || det.loading) && (
                          <div className="flex items-center gap-2 text-cyan-200">
                            <Settings className="w-5 h-5 animate-spin" />
                            Loading details…
                          </div>
                        )}

                        {/* Error in details fetch */}
                        {det && det.error && (
                          <div className="text-red-300">Failed to load details: {det.error}</div>
                        )}

                        {/* Loaded */}
                        {det && !det.loading && !det.error && (
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* LEFT: Timeline */}
                            <div>
                              <div className="space-y-4">
                                {/* POL */}
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-full bg-cyan-400/70 mt-1" />
                                  <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-sm text-white/90 font-bold">
                                      {row.from}
                                    </div>
                                    <div className="text-xs text-white/70 mt-1">
                                      ETD: {fmtDate(row.dep)}
                                    </div>
                                  </div>
                                </div>

                                {/* Leg A (vessel) */}
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded bg-white/30 mt-1" />
                                  <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-sm text-white/90 font-bold">
                                      {row.legA.vessel}
                                    </div>
                                    <div className="text-xs text-white/70 mt-1">
                                      Transit time{" "}
                                      {row.kind === "conn"
                                        ? Math.max(
                                            1,
                                            Math.ceil(
                                              daysBetween(row.dep, (row as any)._leg1.arrival)
                                            )
                                          )
                                        : row.transitDays}{" "}
                                      Days
                                    </div>
                                  </div>
                                </div>

                                {/* Hub (if any) */}
                                {row.kind === "conn" && (
                                  <>
                                    <div className="flex items-start gap-3">
                                      <div className="w-3 h-3 rounded-full bg-white/60 mt-2" />
                                      <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-sm text-white/90 font-bold">
                                          {row.hub}
                                        </div>
                                        <div className="text-xs text-white/70 mt-1">
                                          ETA: {fmtDate((row as any)._leg1.arrival)} &nbsp; &nbsp;
                                          ETD: {fmtDate((row as any)._leg2.departure)}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Leg B */}
                                    <div className="flex items-start gap-3">
                                      <div className="w-5 h-5 rounded bg-white/30 mt-1" />
                                      <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-sm text-white/90 font-bold">
                                          {row.legB.vessel}
                                        </div>
                                        <div className="text-xs text-white/70 mt-1">
                                          Transit time{" "}
                                          {Math.max(
                                            1,
                                            Math.ceil(
                                              daysBetween(
                                                (row as any)._leg2.departure,
                                                row.arr
                                              )
                                            )
                                          )}{" "}
                                          Day(s)
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* POD */}
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-full bg-cyan-400/70 mt-1" />
                                  <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-sm text-white/90 font-bold">
                                      {row.to}
                                    </div>
                                    <div className="text-xs text-white/70 mt-1">
                                      ETA: {fmtDate(row.arr)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* RIGHT: Cut-off list + copy */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-white font-bold flex items-center gap-2">
                                  <span className="inline-block w-5 h-5 rounded bg-white/20" />
                                  Cut-off Dates
                                  {det.tz ? (
                                    <span className="ml-2 text-xs text-cyan-200 opacity-90">
                                      ({det.tz})
                                    </span>
                                  ) : null}
                                </div>
                                <button
                                  onClick={() => copyDetails(row)}
                                  className="px-3 py-2 rounded-lg bg-[#1A2A4A] hover:bg-[#0A1A2F] text-cyan-300 font-semibold shadow-[6px_6px_0_rgba(0,0,0,1)] border border-white/10 inline-flex items-center gap-2"
                                  title="Copy Details"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Details
                                </button>
                              </div>

                              <div className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                                {(["DOC_SI", "FCL_GATEIN", "VGM", "ERD"] as CutoffKind[]).map(
                                  (k) => (
                                    <div
                                      key={k}
                                      className="grid grid-cols-2 items-center p-3 bg-white/5"
                                    >
                                      <div className="text-sm text-white/90">
                                        {CUTOFF_LABEL[k]}
                                      </div>
                                      <div className="text-sm text-white/90 text-right">
                                        {det.cutoffs?.[k]
                                          ? fmtDateTimeLocal(det.cutoffs[k]!, det.tz)
                                          : "—"}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>

                              {/* Receiving (ERD) box */}
                              <div className="mt-4">
                                <div className="text-white font-bold flex items-center gap-2">
                                  <span className="inline-block w-5 h-5 rounded bg-white/20" />
                                  Receiving (Loading Group)
                                </div>
                                <div className="mt-2 grid grid-cols-2 text-sm text-white/90 bg-white/5 p-3 rounded-xl border border-white/10">
                                  <div>Earliest:</div>
                                  <div className="text-right">
                                    {det.cutoffs?.ERD
                                      ? fmtDateTimeLocal(det.cutoffs.ERD, det.tz)
                                      : "—"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
