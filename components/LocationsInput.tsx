// components/LocationInput.tsx
"use client";
import React, {useEffect, useMemo, useRef, useState} from "react";
import { MapPin } from "lucide-react";

export type LocationRow = {
  unlocode: string | null;
  name: string;
  city?: string | null;
  country?: string | null;
  type?: "SEAPORT" | "INLAND_CITY" | string | null;
};

function labelForLocation(loc: LocationRow) {
  const left = [loc.name, loc.city, loc.country].filter(Boolean).join(", ");
  const code = loc.unlocode ? ` (${loc.unlocode})` : "";
  return `${left}${code}`;
}

function normalize(s: string) {
  return (s || "").toLowerCase().trim();
}

// simple rank so typing “new york city” puts USNYC on top if present
function rank(loc: LocationRow, q: string) {
  const L = normalize(`${loc.name} ${loc.city ?? ""} ${loc.country ?? ""}`);
  const C = (loc.unlocode ?? "").toLowerCase();
  let score = 0;
  if (!q) return score;
  if (C === q.toLowerCase()) score += 200;                // exact UN/LOCODE
  if (C.startsWith(q.toLowerCase())) score += 120;        // code prefix
  if (L.includes(q)) score += 90;                         // full phrase found
  // token bonus (e.g., "new york")
  q.split(/\s+/).forEach(t => {
    if (!t) return;
    if (L.includes(t)) score += 20;
    if (C.startsWith(t)) score += 15;
  });
  // type nudge
  if ((loc.type ?? "").toUpperCase() === "SEAPORT") score += 5;
  return score;
}

async function fetchLocations(q: string, limit = 10): Promise<LocationRow[]> {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(`/api/seed/locations/get?search=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

type Props = {
  label: string;
  placeholder?: string;
  // current selected value (UN/LOCODE or empty)
  value: string;
  onChange: (code: string, displayLabel: string, row?: LocationRow) => void;
  // optional prefill from parent (e.g., "USNYC") – will resolve to a pretty label on mount
  initialCode?: string;
  inputClassName?: string;
  menuClassName?: string;
};

export default function LocationInput({
  label,
  placeholder = "Type port/city/UN/LOCODE",
  value,
  onChange,
  initialCode,
  inputClassName,
  menuClassName
}: Props) {
  const [text, setText] = useState<string>("");         // what user sees/types
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const q = text.trim();

  // resolve initialCode->label once (e.g., “USNYC” => “New York, US (USNYC)”)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const code = initialCode || value;
      if (!code) return;
      const r = await fetchLocations(code, 1);
      if (ignore) return;
      if (r[0]) setText(labelForLocation(r[0]));
    })();
    return () => { ignore = true; };
  }, [initialCode, value]);

  // debounce search
  useEffect(() => {
    let handle: any;
    if (q.length >= 2) {
      handle = setTimeout(async () => {
        const data = await fetchLocations(q, 10);
        // sort by rank so “new york city” bubbles USNYC up
        const ranked = data
          .map(d => ({ d, s: rank(d, q.toLowerCase()) }))
          .sort((a, b) => b.s - a.s)
          .map(x => x.d);
        setRows(ranked);
        setOpen(true);
        setActive(0);
      }, 250);
    } else {
      setRows([]);
      setOpen(false);
    }
    return () => clearTimeout(handle);
  }, [q]);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(row: LocationRow) {
    const code = row.unlocode ?? row.name;
    const lbl = labelForLocation(row);
    setText(lbl);
    setOpen(false);
    onChange(code, lbl, row);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(rows[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-md text-[#faf9f6] font-light mb-2">{label}</label>
      <div className="relative group">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => { if (rows.length) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={inputClassName ?? "pl-12 w-full bg-[#2D4D8B] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold"}
        />
        <MapPin size={20} color="white" className="absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
      </div>

      {open && rows.length > 0 && (
        <div className={menuClassName ?? "absolute z-20 mt-2 w-full max-h-64 overflow-auto bg-[#0A1A2F] border-2 border-white rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,1)]"}>
          {rows.map((row, i) => {
            const lbl = labelForLocation(row);
            const isActive = i === active;
            return (
              <button
                key={`${row.unlocode ?? row.name}-${i}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(row)}
                className={`w-full text-left px-3 py-2 ${isActive ? "bg-[#2D4D8B]" : "hover:bg-[#2D4D8B]"} text-white`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{lbl}</span>
                  {row.type && <span className="uppercase text-xs text-[#00FFFF]">{row.type}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
