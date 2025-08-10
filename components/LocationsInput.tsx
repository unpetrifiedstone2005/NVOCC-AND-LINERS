// components/LocationsInput.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

// --- normalize helpers ------------------------------------------------------
function tokenize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function normCode(s?: string | null) {
  return (s ?? "").toUpperCase().trim();
}
function normLabel(s?: string | null) {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
function tokensFor(loc: LocationRow): string[] {
  const code = (loc.unlocode ?? "").toLowerCase().trim();
  return [code, ...tokenize(loc.name), ...tokenize(loc.city ?? ""), ...tokenize(loc.country ?? "")].filter(Boolean);
}

// strict token-aware prefix rule
function strictPrefixMatch(loc: LocationRow, q: string) {
  const qTokens = tokenize(q);
  if (!qTokens.length) return true;
  const src = tokensFor(loc);
  return qTokens.every(t => src.some(st => st.startsWith(t)));
}

function rank(loc: LocationRow, q: string) {
  const qTokens = tokenize(q);
  if (!qTokens.length) return 0;
  const src = tokensFor(loc);
  const code = (loc.unlocode ?? "").toLowerCase().trim();
  let s = 0;
  const nq = qTokens.join(" ");
  if (code.startsWith(nq)) s += 200;
  if (src.join(" ").startsWith(nq)) s += 180;
  qTokens.forEach(t => {
    if (code.startsWith(t)) s += 40;
    if (src.some(st => st.startsWith(t))) s += 30;
  });
  if ((loc.type ?? "").toUpperCase() === "SEAPORT") s += 5;
  return s;
}

async function fetchLocations(q: string, limit = 50): Promise<LocationRow[]> {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(`/api/seed/locations/get?search=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

type Props = {
  label: string;
  placeholder?: string;
  value: string; // UN/LOCODE or ""
  onChange: (code: string, displayLabel: string, row?: LocationRow) => void;
  initialCode?: string;
  inputClassName?: string;
  menuClassName?: string;
  excludeCodes?: string[];   // exact codes to hide (e.g., ["USNYC"])
  excludeLabels?: string[];  // exact labels to hide (optional)
};

export default function LocationInput({
  label,
  placeholder = "Type port/city/UN/LOCODE",
  value,
  onChange,
  initialCode,
  inputClassName,
  menuClassName,
  excludeCodes,
  excludeLabels,
}: Props) {
  const [text, setText] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // NEW: prevent auto-open immediately after a selection
  const suppressOpenRef = useRef(false);

  const q = text.trim();
  const minChars = 2;

  // --- STABLE keys & memoized blocklists (avoid new objects in deps) --------
  const ecKey = useMemo(
    () => (excludeCodes && excludeCodes.length ? excludeCodes.join("|") : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeCodes?.join("|")]
  );
  const elKey = useMemo(
    () => (excludeLabels && excludeLabels.length ? excludeLabels.join("|") : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeLabels?.join("|")]
  );

  const blkCodes = useMemo(() => new Set((excludeCodes ?? []).map(normCode).filter(Boolean)), [ecKey]);
  const blkLabels = useMemo(() => new Set((excludeLabels ?? []).map(normLabel).filter(Boolean)), [elKey]);

  // --- one-time exact-code label resolver (prevents "Bengaluru" overwrite) ---
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true; // run only once on mount

    const pre = (initialCode || value || "").toUpperCase().trim();
    if (!pre) return;

    (async () => {
      const results = await fetchLocations(pre, 10);
      const exact = results.find(r => (r.unlocode ?? "").toUpperCase().trim() === pre);
      if (exact) setText(labelForLocation(exact));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, value]);

  // if current selection becomes excluded, clear it
  useEffect(() => {
    const shouldClear =
      (value && blkCodes.has(normCode(value))) ||
      (text && blkLabels.has(normLabel(text)));
    if (shouldClear) {
      onChange("", "");
      setText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecKey, elKey]); // depend on stable keys only

  // fetch + strict prefix + exclusions (only auto-open if focused & not suppressed)
  useEffect(() => {
    let handle: any;
    let cancelled = false;

    async function run() {
      const data = await fetchLocations(q, 50);

      let filtered = data.filter(r => strictPrefixMatch(r, q));
      filtered = filtered.filter(r => {
        const c = normCode(r.unlocode);
        const l = normLabel(labelForLocation(r));
        return !blkCodes.has(c) && !blkLabels.has(l);
      });

      const ranked = filtered
        .map(d => ({ d, s: rank(d, q) }))
        .sort((a, b) => b.s - a.s)
        .map(x => x.d)
        .slice(0, 50);

      if (!cancelled) {
        setRows(ranked);
        // Only toggle open if THIS input is focused and we're not suppressing
        setOpen(prev => (isFocused && !suppressOpenRef.current ? ranked.length > 0 : prev));
        setActive(0);
      }
    }

    if (q.length >= minChars) {
      handle = setTimeout(run, 180);
    } else {
      setRows([]);
      setOpen(false);
    }
    return () => { clearTimeout(handle); cancelled = true; };
  }, [q, ecKey, elKey, blkCodes, blkLabels, isFocused]);

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
    // prevent auto-open on the re-fetch that follows text change
    suppressOpenRef.current = true;
    setText(lbl);
    setOpen(false);
    onChange(code, lbl, row);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || rows.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(rows[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  // reset suppression on new typing or when field is re-focused
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    suppressOpenRef.current = false;
    setText(e.target.value);
  }

  // final render guard (uses memoized sets)
  const renderRows = rows
    .filter(r => strictPrefixMatch(r, q))
    .filter(r => !blkCodes.has(normCode(r.unlocode)) && !blkLabels.has(normLabel(labelForLocation(r))));

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-md text-[#faf9f6] font-light mb-2">{label}</label>
      <div className="relative group">
        <input
          ref={inputEl}
          value={text}
          onChange={handleChange}
          onFocus={() => {
            setIsFocused(true);
            // only open on focus if not suppressed
            if (!suppressOpenRef.current && renderRows.length > 0) setOpen(true);
          }}
          onBlur={() => { setIsFocused(false); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={inputClassName ?? "pl-12 w-full bg-[#2D4D8B] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold"}
        />
        <MapPin size={20} color="white" className="absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
      </div>

      {open && renderRows.length > 0 && (
        <div className={menuClassName ?? "absolute z-20 mt-2 w-full max-h-64 overflow-auto bg-[#0A1A2F] border-2 border-white rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,1)]"}>
          {renderRows.map((row, i) => {
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
