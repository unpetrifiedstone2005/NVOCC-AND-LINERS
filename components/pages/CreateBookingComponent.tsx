"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Package,
  Info,
  Ship,
  Boxes as ContainerIcon, // ✅ reliable icon
  Shield,
  FileText,
  Send,
} from "lucide-react";

// Utilities
function clsx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const cardGradient = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

// ─── Page 3 Header Component ───────────────────────────────────────────────
export const BookingSummaryHeader = ({
  quotationNo,
  scheduleStart,
  scheduleDate,
  scheduleWeeks,
  pickupType,
  via1,
  via2,
  endLocation,
  exportMoT,
  importMoT,
  optimizeReefer,
  onDateChange,
  onWeeksChange,
  onPickupTypeChange,
}: {
  quotationNo: string;
  scheduleStart: string;
  scheduleDate: string;
  scheduleWeeks: string;
  pickupType: "door" | "terminal";
  via1: string;
  via2: string;
  endLocation: string;
  exportMoT: string;
  importMoT: string;
  optimizeReefer: boolean;
  onDateChange: (v: string) => void;
  onWeeksChange: (v: string) => void;
  onPickupTypeChange: (v: "door" | "terminal") => void;
}) => (
  <div className="bg-[#1A2A4A] border-4 border-white rounded-2xl p-8 mb-8 shadow-[20px_20px_0px_rgba(0,0,0,1)]">
    {/* Row 1 */}
    <div className="grid md:grid-cols-5 gap-6 items-end">
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Quotation Number
        </label>
        <div className="h-12 px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl flex items-center text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {quotationNo || "—"}
        </div>
      </div>
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Start Location*
        </label>
        <div className="h-12 px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl flex items-center text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {scheduleStart || "—"}
        </div>
      </div>
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Start Date
        </label>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="h-12 w-full px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
        />
      </div>
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Plus
        </label>
        <div className="flex items-center space-x-3">
          <select
            value={scheduleWeeks}
            onChange={(e) => onWeeksChange(e.target.value)}
            className="h-12 px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
          >
            {[...Array(8)].map((_, i) => (
              <option key={i} value={String(i + 1)}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-[#faf9f6] font-bold">week(s)</span>
        </div>
      </div>
      <div className="space-y-3">
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Received at
        </label>
        <label className="flex items-center space-x-3 text-[#faf9f6] font-bold">
          <input
            type="radio"
            checked={pickupType === "door"}
            onChange={() => onPickupTypeChange("door")}
            className="w-5 h-5 accent-[#00FFFF] bg-[#0A1A2F] border-2 border-[#22D3EE]"
          />
          <span>your door (CH)</span>
        </label>
        <label className="flex items-center space-x-3 text-[#faf9f6] font-bold">
          <input
            type="radio"
            checked={pickupType === "terminal"}
            onChange={() => onPickupTypeChange("terminal")}
            className="w-5 h-5 accent-[#00FFFF] bg-[#0A1A2F] border-2 border-[#22D3EE]"
          />
          <span>container terminal (MH)</span>
        </label>
      </div>
    </div>

    {/* Row 2 */}
    <div className="grid md:grid-cols-3 gap-6 mt-8">
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Via 1
        </label>
        <div className="h-12 px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl flex items-center text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {via1 || "—"}
        </div>
      </div>
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Via 2
        </label>
        <div className="h-12 px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl flex items-center text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {via2 || "—"}
        </div>
      </div>
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          End Location*
        </label>
        <div className="h-12 px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl flex items-center text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {endLocation || "—"}
        </div>
      </div>
    </div>

    {/* Row 3 */}
    <div className="grid md:grid-cols-3 gap-6 mt-8 items-center">
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Export MoT
        </label>
        <select
          defaultValue={exportMoT}
          className="h-12 w-full px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
        >
          <option value="">—</option>
          <option>Road</option>
          <option>Rail</option>
          <option>Sea</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-2 text-[#00FFFF] text-sm uppercase tracking-wide">
          Import MoT
        </label>
        <select
          defaultValue={importMoT}
          className="h-12 w-full px-4 bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl text-[#faf9f6] font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
        >
          <option value="">—</option>
          <option>Road</option>
          <option>Rail</option>
          <option>Sea</option>
        </select>
      </div>
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={optimizeReefer}
          readOnly // ✅ silence controlled-without-onChange warning
          className="w-6 h-6 accent-[#00FFFF] bg-[#0A1A2F] border-2 border-[#22D3EE] rounded"
        />
        <span className="text-[#faf9f6] font-bold">
          Optimize routing for reefer equipment
        </span>
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
export const CreateBookingComponent = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0
  const [customer] = useState("DHL GLOBAL, AUCKLAND");
  const [customerAddress] = useState(`18 VERISSIMO DRIVE
WESTNEY INDUSTRY PARK
AUCKLAND
NZ-2022`);
  const [contactReference, setContactReference] = useState("");
  const [contactName, setContactName] = useState("OCEANIA, HAPAG LLOYD");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 1 sub‐pages
  const [quotationNo, setQuotationNo] = useState("");
  const [validTo, setValidTo] = useState("");
  const [contractualParty, setContractualParty] = useState("");
  const [contractualAddress, setContractualAddress] = useState("");
  const [hasFoundContract, setHasFoundContract] = useState(false);
  const [hasSelectedRouting, setHasSelectedRouting] = useState(false);
  const [hasLookedUp, setHasLookedUp] = useState(false);

  const [routingOptions] = useState([
    {
      id: 1,
      mode: "Terminal",
      pol: "SYDNEY, NSW",
      service: "WAX",
      pod: "TEMA",
      commodity: "FAK",
      type1: "20'STD",
      type2: "40'STD",
      type3: "40'HC",
    },
  ]);
  const [selectedRoutingId, setSelectedRoutingId] = useState<number | null>(
    null
  );

  // Page 2 form
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleWeeks, setScheduleWeeks] = useState("1");
  const [via1, setVia1] = useState("");
  const [via2, setVia2] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [pickupType, setPickupType] = useState<"terminal" | "door">("terminal");
  const [exportMoT, setExportMoT] = useState("");
  const [importMoT, setImportMoT] = useState("");
  const [optimizeReefer, setOptimizeReefer] = useState(false);

  const [scheduleResults, setScheduleResults] = useState<
    {
      id: number;
      pol: string;
      date: string;
      vessels: string[];
      pod: string;
      transitTime: number;
    }[]
  >([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );

  const [routeDetails] = useState<
    {
      id: number;
      location: string;
      arrival: string;
      departure: string;
      vessel: string;
      voyage: string;
      service: string;
    }[]
  >([
    {
      id: 1,
      location: "SYDNEY, NSW",
      arrival: "2022-12-12",
      departure: "—",
      vessel: "APL BOSTON",
      voyage: "245N",
      service: "SEA",
    },
    {
      id: 2,
      location: "SINGAPORE",
      arrival: "2022-12-29",
      departure: "2023-01-04",
      vessel: "SPIL KARTIKA",
      voyage: "005W",
      service: "CGX",
    },
    {
      id: 3,
      location: "ANTWERP",
      arrival: "2023-01-30",
      departure: "2023-02-02",
      vessel: "SYNERGY ANTWERP",
      voyage: "2305S",
      service: "WAX",
    },
    {
      id: 4,
      location: "TEMA",
      arrival: "2023-02-19",
      departure: "—",
      vessel: "—",
      voyage: "—",
      service: "—",
    },
  ]);

  // Steps 2–6 state
  const [startLocation, setStartLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryType, setDeliveryType] = useState<"terminal" | "door">(
    "terminal"
  );
  const [remarks, setRemarks] = useState<string>("");
  const [shipperOwnedContainer, setShipperOwnedContainer] = useState(false);
  const [weight, setWeight] = useState("20000");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [dangerousGoods] = useState(false); // kept but fixed to avoid unused setState

  const next = () => setCurrentStep((s) => Math.min(s + 1, 6));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const [containerRows, setContainerRows] = useState<
    { qty: string; type: string }[]
  >([{ qty: "", type: "" }, { qty: "", type: "" }, { qty: "", type: "" }, { qty: "", type: "" }]);

  const [cargoDescription, setCargoDescription] = useState("");
  const [hsParts, setHsParts] = useState<string[]>(["", "", ""]);

  const [newContainerType, setNewContainerType] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [hasAssignedDetails, setHasAssignedDetails] = useState(false);

  const [customsRefs, setCustomsRefs] = useState<
    { type: string; ref: string }[]
  >([{ type: "", ref: "" }, { type: "", ref: "" }, { type: "", ref: "" }, { type: "", ref: "" }, { type: "", ref: "" }]);
  const [wantsBoL, setWantsBoL] = useState(false);
  const [boLCount, setBoLCount] = useState("");
  const [exportFiling, setExportFiling] = useState(false);
  const [filingBy, setFilingBy] = useState("");

  // Step 1 handlers
  const handleFindContract = () => {
    if (!quotationNo) return;
    setValidTo("2022-12-23");
    setContractualParty(customer);
    setContractualAddress(customerAddress);
    setHasFoundContract(true);
  };
  const handleClearContract = () => {
    setQuotationNo("");
    setValidTo("");
    setContractualParty("");
    setContractualAddress("");
    setHasFoundContract(false);
    setHasSelectedRouting(false);
    setHasLookedUp(false);
    setScheduleResults([]);
    setSelectedRoutingId(null);
  };
  const selectRouting = () => {
    if (selectedRoutingId !== null) setHasSelectedRouting(true);
  };

  const updateContainerRow = (
    idx: number,
    field: "qty" | "type",
    value: string
  ) => {
    setContainerRows((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleAssignDetails = () => {
    const fullHsCode = hsParts.join("");
    console.log("Assigning details:", {
      containerRows,
      shipperOwnedContainer,
      cargoDescription,
      hsCode: fullHsCode,
      releaseDate,
      releaseTime,
    });
    setHasAssignedDetails(true);
  };

  const handleClearCargo = () => {
    setContainerRows([
      { qty: "", type: "" },
      { qty: "", type: "" },
      { qty: "", type: "" },
      { qty: "", type: "" },
    ]);
    setShipperOwnedContainer(false);
    setCargoDescription("");
    setHsParts(["", "", ""]);
    setReleaseDate("");
    setReleaseTime("");
    setHasAssignedDetails(false);
  };

  const handleAddContainer = () => {
    console.log("Adding container of type", newContainerType);
  };

  const handleLookupSchedule = () => {
    setScheduleResults([
      {
        id: 1,
        pol: "SYDNEY, NSW | AU",
        date: "2022-12-12",
        vessels: [
          "APL BOSTON / 245N / SEA",
          "SPIL KARTIKA / 005W / CGX",
          "SYNERGY ANTWERP / 2305S / WAX",
        ],
        pod: "TEMA | GH",
        transitTime: 69,
      },
      {
        id: 2,
        pol: "SYDNEY, NSW | AU",
        date: "2022-12-20",
        vessels: [
          "CONTI CONQUEST / 246N / SEA",
          "SEASPAN SAIGON / 006W / CGX",
          "DALLAS EXPRESS / 2306S / WAX",
        ],
        pod: "TEMA | GH",
        transitTime: 68,
      },
      {
        id: 3,
        pol: "SYDNEY, NSW | AU",
        date: "2022-12-16",
        vessels: [
          "VENETIA / 2090N / SAL",
          "SEASPAN SAIGON / 006W / CGX",
          "DALLAS EXPRESS / 2306S / WAX",
        ],
        pod: "TEMA | GH",
        transitTime: 72,
      },
    ]);
    setHasLookedUp(true);
  };
  const handleClearSchedule = () => {
    setScheduleResults([]);
    setSelectedScheduleId(null);
    setHasLookedUp(false);
  };

  const inputStyle =
    "w-full bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] placeholder:font-light transition-shadow border-2 border-[#22D3EE] px-4 py-3 font-bold";
  const selectStyle =
    "w-full bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-2 border-[#22D3EE] px-4 py-3 font-bold";
  const buttonStyle =
    "bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] text-[#faf9f6] px-6 py-3 font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-[#22D3EE]";
  const primaryButtonStyle =
    "bg-[#00FFFF] text-black px-8 py-3 rounded-xl font-bold shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-[#22D3EE]";
  const sectionStyle =
    "max-w-[1600px] rounded-2xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-4 border-white";
  const navButtonStyle =
    "bg-white rounded-xl px-6 py-3 font-bold hover:bg-gray-300 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] border-2 border-black text-black";

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 font-bold text-[#faf9f6]">
      {/* Header */}
      <div className="flex items-center justify-center mb-12">
        <div
          className="inline-flex items-center space-x-4 text-3xl bg-[#0A1A2F] border-4 border-white rounded-2xl p-6 shadow-[20px_20px_0px_rgba(0,0,0,1)]"
          style={cardGradient}
        >
          <Package size={40} className="text-[#00FFFF]" />
          <span className="text-[#faf9f6] font-bold uppercase tracking-wide">
            NEW BOOKING REQUEST
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-[#0F1B2A] border-4 border-white rounded-2xl px-8 py-6 mb-16 shadow-[20px_20px_0px_rgba(0,0,0,1)]">
        {[
          "CONTACT & REFERENCE",
          "CONTRACT & QUOTATION",
          "ROUTING & SCHEDULE",
          "CARGO & EQUIPMENT",
          "CUSTOMS & REMARKS",
          "REVIEW & COMPLETE",
          "BOOKING RECEIVED",
        ].map((label, idx) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)]",
                  currentStep >= idx
                    ? "bg-[#00FFFF] text-black border-black"
                    : "bg-[#0F1B2A] text-[#faf9f6] border-[#22D3EE]"
                )}
              >
                {idx + 1}
              </div>
              <span
                className={clsx(
                  "font-bold text-sm uppercase tracking-wide",
                  currentStep >= idx ? "text-[#00FFFF]" : "text-[#faf9f6]"
                )}
              >
                {label}
              </span>
            </div>
            {idx < 6 && (
              <div className="flex-1 h-1 bg-[#22D3EE] mx-6 shadow-[0px_2px_0px_rgba(0,0,0,1)]" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className={sectionStyle} style={cardGradient}>
        {/* Step 0 */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
              <Info size={28} />
              CONTACT & REFERENCE
            </h2>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Left */}
              <div className="space-y-6">
                <div>
                  <label className="block font-bold text-[#00FFFF] mb-3 text-sm uppercase tracking-wide">
                    Customer
                  </label>
                  <textarea
                    readOnly
                    value={`${customer}\n${customerAddress}`}
                    rows={6}
                    className="w-full bg-[#1A2A4A] rounded-xl p-4 text-[#faf9f6] shadow-[8px_8px_0px_rgba(0,0,0,1)] resize-none border-2 border-[#22D3EE] font-bold"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                      Customer Reference
                    </label>
                    <input
                      type="text"
                      value={contactReference}
                      onChange={(e) => setContactReference(e.target.value)}
                      className={inputStyle}
                      placeholder="Enter customer reference"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                      Contact*
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={inputStyle}
                      placeholder="Contact name"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputStyle}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                      Notification E-mail*
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputStyle}
                      placeholder="Email address"
                    />
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="bg-[#1A2A4A] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] border-2 border-[#22D3EE]">
                <div className="flex justify-between border-b-2 border-[#00FFFF] pb-4 mb-6">
                  <span className="font-bold text-[#00FFFF] text-lg uppercase tracking-wide">
                    Your Contact
                  </span>
                  <Info size={20} className="text-[#00FFFF]" />
                </div>
                <p className="text-[#faf9f6] font-bold leading-relaxed">
                  Your contact data is prefilled with the information you
                  already provided during web registration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {currentStep === 1 && (
          <>
            {/* Page 1 */}
            {!hasSelectedRouting && !hasLookedUp && (
              <>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                  <FileText size={28} />
                  CONTRACT & QUOTATION
                </h2>

                <div className="grid md:grid-cols-2 gap-10 mb-8">
                  <div>
                    <label className="block font-bold mb-3 text-[#00FFFF] text-sm uppercase tracking-wide">
                      Quotation / Contract No.*
                    </label>
                    <input
                      value={quotationNo}
                      onChange={(e) => setQuotationNo(e.target.value)}
                      className={inputStyle}
                      placeholder="Enter quotation number"
                    />
                    <div className="flex gap-6 mt-6">
                      <button onClick={handleFindContract} className={primaryButtonStyle}>
                        Find Contract
                      </button>
                      <button onClick={handleClearContract} className={buttonStyle}>
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between border-b-2 border-[#00FFFF] pb-4 mb-6">
                      <span className="font-bold text-[#00FFFF] text-lg uppercase tracking-wide">
                        Base for Freight Charges
                      </span>
                      <Info size={20} className="text-[#00FFFF]" />
                    </div>
                    <div className="space-y-4 text-[#faf9f6] font-bold">
                      <p>
                        The freight basis is either a quotation or a
                        (service-) contract you hold with Hapag-Lloyd.
                      </p>
                      <p>
                        Formats:{" "}
                        <span className="text-[#00FFFF]">W1209RTM00001</span>,{" "}
                        <span className="text-[#00FFFF]">Q1209RTM00001</span>,{" "}
                        <span className="text-[#00FFFF]">S19ABC001</span>,{" "}
                        <span className="text-[#00FFFF]">4682727</span>.
                      </p>
                      <p>
                        If neither, use{" "}
                        <span className="text-[#00FFFF] underline cursor-pointer">
                          Quick Quote
                        </span>{" "}
                        or contact your local{" "}
                        <span className="text-[#00FFFF] underline cursor-pointer">
                          Sales Office
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                {hasFoundContract && (
                  <div className="space-y-8">
                    <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                      <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                        Validity
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <div className="font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                            Quotation / Contract No.*
                          </div>
                          <div className="text-[#faf9f6] font-bold text-lg">
                            {quotationNo}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                            Valid to
                          </div>
                          <div className="text-[#faf9f6] font-bold text-lg">
                            {validTo}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <div className="font-bold text-[#00FFFF] mb-3 text-sm uppercase tracking-wide">
                          Contractual Party
                        </div>
                        <textarea
                          readOnly
                          rows={4}
                          value={`${contractualParty}\n${contractualAddress}`}
                          className="w-full bg-transparent text-[#faf9f6] font-bold resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="font-bold mb-4 text-[#00FFFF] text-xl uppercase tracking-wide">
                        Routing as per Quotation
                      </div>
                      <div className="overflow-x-auto bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-6 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                        <table className="min-w-full">
                          <thead className="bg-[#00FFFF] text-black">
                            <tr>
                              <th className="px-4 py-3 font-bold text-sm">Select</th>
                              <th className="px-4 py-3 font-bold text-sm">Export haulage</th>
                              <th className="px-4 py-3 font-bold text-sm">Port of Loading</th>
                              <th className="px-4 py-3 font-bold text-sm">Service</th>
                              <th className="px-4 py-3 font-bold text-sm">Port of Discharge</th>
                              <th className="px-4 py-3 font-bold text-sm">Commodity</th>
                              <th className="px-4 py-3 font-bold text-sm">Ctr. Type 1</th>
                              <th className="px-4 py-3 font-bold text-sm">Ctr. Type 2</th>
                              <th className="px-4 py-3 font-bold text-sm">Ctr. Type 3</th>
                            </tr>
                          </thead>
                          <tbody>
                            {routingOptions.map((opt) => (
                              <tr
                                key={opt.id}
                                className={clsx(
                                  "border-b border-[#22D3EE]",
                                  opt.id === selectedRoutingId
                                    ? "bg-[#00FFFF] text-black"
                                    : "text-[#faf9f6]"
                                )}
                              >
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="radio"
                                    checked={opt.id === selectedRoutingId}
                                    onChange={() => setSelectedRoutingId(opt.id)}
                                    className="w-5 h-5 accent-[#00FFFF]"
                                  />
                                </td>
                                <td className="px-4 py-3 font-bold">{opt.mode}</td>
                                <td className="px-4 py-3 font-bold">{opt.pol}</td>
                                <td className="px-4 py-3 font-bold">{opt.service}</td>
                                <td className="px-4 py-3 font-bold">{opt.pod}</td>
                                <td className="px-4 py-3 font-bold">{opt.commodity}</td>
                                <td className="px-4 py-3 font-bold">{opt.type1}</td>
                                <td className="px-4 py-3 font-bold">{opt.type2}</td>
                                <td className="px-4 py-3 font-bold">{opt.type3}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button onClick={selectRouting} className={`${primaryButtonStyle} mt-6`}>
                          Select Routing
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Page 2 */}
            {hasSelectedRouting && !hasLookedUp && (
              <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                  <Ship size={28} />
                  LOOK-UP SCHEDULE
                </h2>

                <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Start Location*
                      </label>
                      <input
                        value={scheduleStart}
                        onChange={(e) => setScheduleStart(e.target.value)}
                        className={inputStyle}
                        placeholder="Start location"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Plus (weeks)
                      </label>
                      <select
                        value={scheduleWeeks}
                        onChange={(e) => setScheduleWeeks(e.target.value)}
                        className={selectStyle}
                      >
                        {[...Array(8)].map((_, i) => (
                          <option key={i} value={String(i + 1)}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Via 1
                      </label>
                      <input
                        value={via1}
                        onChange={(e) => setVia1(e.target.value)}
                        className={inputStyle}
                        placeholder="Via 1"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Via 2
                      </label>
                      <input
                        value={via2}
                        onChange={(e) => setVia2(e.target.value)}
                        className={inputStyle}
                        placeholder="Via 2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        End Location*
                      </label>
                      <input
                        value={endLocation}
                        onChange={(e) => setEndLocation(e.target.value)}
                        className={inputStyle}
                        placeholder="End location"
                      />
                    </div>

                    <div className="md:col-span-3 flex gap-8 items-center">
                      <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                          type="radio"
                          checked={pickupType === "door"}
                          onChange={() => setPickupType("door")}
                          className="w-5 h-5 accent-[#00FFFF]"
                        />
                        Received at your door (CH)
                      </label>
                      <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                          type="radio"
                          checked={pickupType === "terminal"}
                          onChange={() => setPickupType("terminal")}
                          className="w-5 h-5 accent-[#00FFFF]"
                        />
                        Received at container terminal (MH)
                      </label>
                    </div>

                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Export MoT
                      </label>
                      <select
                        value={exportMoT}
                        onChange={(e) => setExportMoT(e.target.value)}
                        className={selectStyle}
                      >
                        <option value="">—</option>
                        <option>Road</option>
                        <option>Rail</option>
                        <option>Sea</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                        Import MoT
                      </label>
                      <select
                        value={importMoT}
                        onChange={(e) => setImportMoT(e.target.value)}
                        className={selectStyle}
                      >
                        <option value="">—</option>
                        <option>Road</option>
                        <option>Rail</option>
                        <option>Sea</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={optimizeReefer}
                        onChange={(e) => setOptimizeReefer(e.target.checked)}
                        className="w-6 h-6 accent-[#00FFFF] rounded"
                      />
                      <span className="text-[#faf9f6] font-bold">
                        Optimize routing for reefer equipment
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-6 mt-8">
                    <button onClick={handleLookupSchedule} className={primaryButtonStyle}>
                      Find Schedule
                    </button>
                    <button onClick={handleClearSchedule} className={buttonStyle}>
                      Clear
                    </button>
                    <button
                      onClick={() => setHasSelectedRouting(false)}
                      className="text-[#00FFFF] underline hover:text-white transition-colors font-bold"
                    >
                      Previous
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Page 3 */}
            {hasLookedUp && (
              <>
                <BookingSummaryHeader
                  quotationNo={quotationNo}
                  scheduleStart={scheduleStart}
                  scheduleDate={scheduleDate}
                  scheduleWeeks={scheduleWeeks}
                  pickupType={pickupType}
                  via1={via1}
                  via2={via2}
                  endLocation={endLocation}
                  exportMoT={exportMoT}
                  importMoT={importMoT}
                  optimizeReefer={optimizeReefer}
                  onDateChange={setScheduleDate}
                  onWeeksChange={setScheduleWeeks}
                  onPickupTypeChange={setPickupType}
                />

                <div className="bg-[#1A2A4A] rounded-2xl border-2 border-[#22D3EE] overflow-hidden shadow-[15px_15px_0px_rgba(0,0,0,1)] mb-8">
                  <table className="min-w-full">
                    <thead className="bg-[#00FFFF] text-black">
                      <tr>
                        <th className="px-4 py-3 font-bold">Port of Loading</th>
                        <th className="px-4 py-3 font-bold">Transshipments</th>
                        <th className="px-4 py-3 font-bold">Vessels / Services</th>
                        <th className="px-4 py-3 font-bold">Port of Discharge</th>
                        <th className="px-4 py-3 font-bold">Transit Time (days)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleResults.map((opt) => (
                        <tr
                          key={opt.id}
                          className={clsx(
                            "border-b border-[#22D3EE] cursor-pointer transition-colors",
                            opt.id === selectedScheduleId
                              ? "bg-[#00FFFF] text-black"
                              : "text-[#faf9f6] hover:bg-[#2D4D8B]"
                          )}
                        >
                          <td className="px-4 py-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                checked={opt.id === selectedScheduleId}
                                onChange={() => setSelectedScheduleId(opt.id)}
                                className="w-5 h-5 accent-[#00FFFF]"
                              />
                              <div>
                                <div className="font-bold">{opt.pol}</div>
                                <div className="text-sm opacity-80">{opt.date}</div>
                              </div>
                            </label>
                          </td>
                          <td className="px-4 py-4 text-center font-bold">
                            {opt.vessels.length}
                          </td>
                          <td className="px-4 py-4">
                            {opt.vessels.map((v, i) => (
                              <div key={i} className="font-bold text-sm mb-1">
                                {v}
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-4 font-bold">{opt.pod}</td>
                          <td className="px-4 py-4 text-right font-bold">
                            {opt.transitTime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                  {[
                    "Routing Details",
                    "Select for Booking",
                    "Vessel Details",
                    "Vessel Tracing",
                    "Closings & Terminal Details",
                  ].map((label, i) => (
                    <button
                      key={label}
                      disabled={label === "Select for Booking" && !selectedScheduleId}
                      className={clsx(
                        "font-bold px-6 py-3 rounded-xl border-2 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]",
                        i === 1
                          ? "bg-[#00FFFF] text-black border-black hover:bg-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
                          : "bg-[#1A2A4A] text-[#00FFFF] border-[#22D3EE] hover:bg-[#2D4D8B]"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="text-[#00FFFF] underline mb-4 font-bold">
                  Selected routings not in accordance may incur extra charges
                </div>

                <div className="bg-[#1A2A4A] rounded-2xl border-2 border-[#22D3EE] overflow-hidden shadow-[15px_15px_0px_rgba(0,0,0,1)]">
                  <table className="min-w-full">
                    <thead className="bg-[#00FFFF] text-black">
                      <tr>
                        <th className="px-4 py-3 font-bold">Location</th>
                        <th className="px-4 py-3 font-bold">Arrival</th>
                        <th className="px-4 py-3 font-bold">Departure</th>
                        <th className="px-4 py-3 font-bold">Vessel / Mode</th>
                        <th className="px-4 py-3 font-bold">Voyage</th>
                        <th className="px-4 py-3 font-bold">Service</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeDetails.map((rd) => (
                        <tr
                          key={rd.id}
                          className="even:bg-[#2D4D8B] odd:bg-[#1A2A4A] text-[#faf9f6] border-b border-[#22D3EE]"
                        >
                          <td className="px-4 py-3 font-bold">{rd.location}</td>
                          <td className="px-4 py-3 font-bold">{rd.arrival}</td>
                          <td className="px-4 py-3 font-bold">{rd.departure}</td>
                          <td className="px-4 py-3 font-bold">{rd.vessel}</td>
                          <td className="px-4 py-3 font-bold">{rd.voyage}</td>
                          <td className="px-4 py-3 font-bold">{rd.service}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => {
                    setHasLookedUp(false);
                    setHasSelectedRouting(true);
                  }}
                  className="text-[#00FFFF] underline hover:text-white transition-colors mt-6 font-bold"
                >
                  Previous
                </button>
              </>
            )}
          </>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <>
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
              <Ship size={28} />
              ROUTING & SCHEDULE
            </h2>

            {/* Step 1 Overview */}
            <div className="mb-8 bg-[#1A2A4A] p-6 rounded-2xl border-2 border-[#22D3EE] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <p className="mb-4 font-bold text-[#00FFFF] text-lg">
                You have selected the following routing:
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#00FFFF] text-black">
                    <tr>
                      <th className="px-4 py-3 font-bold">Location</th>
                      <th className="px-4 py-3 font-bold">Arrival</th>
                      <th className="px-4 py-3 font-bold">Departure</th>
                      <th className="px-4 py-3 font-bold">Vessel / Mode of transport</th>
                      <th className="px-4 py-3 font-bold">Voyage No.</th>
                      <th className="px-4 py-3 font-bold">Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeDetails.map((rd) => (
                      <tr
                        key={rd.id}
                        className="even:bg-[#2D4D8B] odd:bg-[#1A2A4A] text-[#faf9f6] border-b border-[#22D3EE]"
                      >
                        <td className="px-4 py-3 font-bold">{rd.location}</td>
                        <td className="px-4 py-3 font-bold">{rd.arrival}</td>
                        <td className="px-4 py-3 font-bold">{rd.departure}</td>
                        <td className="px-4 py-3 font-bold">{rd.vessel}</td>
                        <td className="px-4 py-3 font-bold">{rd.voyage}</td>
                        <td className="px-4 py-3 font-bold">{rd.service}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Routing & Schedule Form */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block mb-3 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                  Start Location*
                </label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className={inputStyle}
                  placeholder="Start location"
                />
              </div>
              <div>
                <label className="block mb-3 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="block mb-3 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="block mb-3 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                  Delivered at
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                    <input
                      type="radio"
                      checked={deliveryType === "door"}
                      onChange={() => setDeliveryType("door")}
                      className="w-5 h-5 accent-[#00FFFF]"
                    />
                    Door
                  </label>
                  <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                    <input
                      type="radio"
                      checked={deliveryType === "terminal"}
                      onChange={() => setDeliveryType("terminal")}
                      className="w-5 h-5 accent-[#00FFFF]"
                    />
                    Terminal
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
              <ContainerIcon size={28} />
              CARGO & EQUIPMENT
            </h2>

            {/* Container Type & Equipment Owner */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Container Type */}
              <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                  Container Type
                </div>
                {containerRows.map((row, idx) => (
                  <div key={idx} className="flex gap-4 items-center mb-4">
                    <input
                      type="text"
                      placeholder="Qty*"
                      value={row.qty}
                      onChange={(e) => updateContainerRow(idx, "qty", e.target.value)}
                      className="w-24 bg-[#0A1A2F] rounded-xl p-3 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                    />
                    <select
                      value={row.type}
                      onChange={(e) => updateContainerRow(idx, "type", e.target.value)}
                      className="flex-1 bg-[#0A1A2F] rounded-xl p-3 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                    >
                      <option value="">-- Select Container Type --</option>
                      <option value="20STD">20' Standard</option>
                      <option value="40STD">40' Standard</option>
                      <option value="40HC">40' High Cube</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Equipment Owned */}
              <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                  Equipment owned by
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                    <input
                      type="radio"
                      checked={!shipperOwnedContainer}
                      onChange={() => setShipperOwnedContainer(false)}
                      className="w-5 h-5 accent-[#00FFFF]"
                    />
                    <span>Hapag-Lloyd Container</span>
                  </label>
                  <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                    <input
                      type="radio"
                      checked={shipperOwnedContainer}
                      onChange={() => setShipperOwnedContainer(true)}
                      className="w-5 h-5 accent-[#00FFFF]"
                    />
                    <span>Shipper's own Container</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Cargo Description, HS-Code & Depot Release */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Cargo */}
              <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                  Cargo
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                      Description
                    </label>
                    <input
                      type="text"
                      value={cargoDescription}
                      onChange={(e) => setCargoDescription(e.target.value)}
                      className={inputStyle}
                      placeholder="Cargo description"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                      HS Code
                    </label>
                    <div className="flex gap-2">
                      {hsParts.map((part, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={2}
                          value={part}
                          onChange={(e) => {
                            const tmp = [...(hsParts as string[])];
                            tmp[idx] = e.target.value.toUpperCase();
                            setHsParts(tmp);
                          }}
                          className="w-16 bg-[#0A1A2F] rounded-xl p-3 text-center text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => console.log("Lookup HS code", hsParts.join(""))}
                        className="bg-[#00FFFF] px-4 rounded-xl font-bold text-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                      >
                        🔍
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty Container from Depot */}
              <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                  Empty Container from Depot
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                      Release*
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="bg-[#0A1A2F] rounded-xl p-3 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                      />
                      <input
                        type="time"
                        value={releaseTime}
                        onChange={(e) => setReleaseTime(e.target.value)}
                        className="bg-[#0A1A2F] rounded-xl p-3 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-[#faf9f6] font-bold text-sm">
                    <p>
                      The depot information will be provided with the final booking
                      confirmation.
                    </p>
                    <p>
                      Please note free time regulations in our{" "}
                      <span className="underline text-[#00FFFF] cursor-pointer">
                        Detention &amp; Demurrage Tariff Information
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            {!hasAssignedDetails && (
              <div className="flex justify-end gap-6">
                <button onClick={handleClearCargo} className={buttonStyle}>
                  Clear
                </button>
                <button onClick={() => prev()} className={buttonStyle}>
                  Previous
                </button>
                <button onClick={handleAssignDetails} className={primaryButtonStyle}>
                  Assign Details
                </button>
              </div>
            )}

            {/* Pop-up summary after Assign Details */}
            {hasAssignedDetails && (
              <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[20px_20px_0px_rgba(0,0,0,1)]">
                <div className="text-black font-bold mb-6 text-xl">Container 1</div>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full">
                    <thead className="bg-gray-200 text-black">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Container Type</th>
                        <th className="px-4 py-3 text-left font-bold">Cargo Description *</th>
                        <th className="px-4 py-3 text-left font-bold">HS Code</th>
                        <th className="px-4 py-3 text-left font-bold">Cargo Weight *</th>
                        <th className="px-4 py-3 text-left font-bold">Unit *</th>
                        <th className="px-4 py-3 text-left font-bold">DG Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {containerRows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.type}
                              onChange={(e) => updateContainerRow(i, "type", e.target.value)}
                              className="w-full bg-white border-2 border-black rounded-lg p-2 font-bold"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={cargoDescription}
                              onChange={(e) => setCargoDescription(e.target.value)}
                              className="w-full bg-white border-2 border-black rounded-lg p-2 font-bold"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {hsParts.map((part, j) => (
                                <input
                                  key={j}
                                  type="text"
                                  maxLength={2}
                                  value={part}
                                  onChange={(e) => {
                                    const tmp = [...(hsParts as string[])];
                                    tmp[j] = e.target.value.toUpperCase();
                                    setHsParts(tmp);
                                  }}
                                  className="w-10 bg-white border-2 border-black rounded-lg p-1 text-center font-bold"
                                />
                              ))}
                              <button
                                type="button"
                                onClick={() => console.log("Lookup HS", hsParts.join(""))}
                                className="px-2 bg-gray-200 border-2 border-black rounded-lg font-bold"
                              >
                                🔍
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                              className="w-full bg-white border-2 border-black rounded-lg p-2 font-bold"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={weightUnit}
                              onChange={(e) => setWeightUnit(e.target.value)}
                              className="w-full bg-white border-2 border-black rounded-lg p-2 font-bold"
                            >
                              <option value="kg">kg</option>
                              <option value="lb">lb</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => console.log("Open DG details for row", i)}
                              className="px-2 bg-gray-200 border-2 border-black rounded-lg font-bold"
                            >
                              🔍
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                    Copy Container with Cargo
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                    Copy This Cargo to all Containers
                  </button>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                    Out-Of-Gauge
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                    Change Type
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Add Container Bar */}
            {hasAssignedDetails && (
              <div className="flex justify-center items-center gap-6 bg-[#1A2A4A] p-6 rounded-2xl border-2 border-[#22D3EE] shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <select
                  value={newContainerType}
                  onChange={(e) => setNewContainerType(e.target.value)}
                  className="bg-white border-2 border-black rounded-xl p-3 font-bold text-black"
                >
                  <option value="">-- select container --</option>
                  <option value="20STD">20' Standard</option>
                  <option value="40STD">40' Standard</option>
                  <option value="40HC">40' High Cube</option>
                </select>
                <button
                  onClick={handleAddContainer}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black"
                >
                  Add Container
                </button>
                <button onClick={handleClearCargo} className={buttonStyle}>
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
              <Shield size={28} />
              CUSTOMS & REMARKS
            </h2>

            {/* Customs References */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                Customs References
              </div>
              <div className="grid grid-cols-2 gap-6">
                {customsRefs.map((cr, idx) => (
                  <React.Fragment key={idx}>
                    <select
                      value={cr.type}
                      onChange={(e) => {
                        const tmp = [...customsRefs];
                        tmp[idx].type = e.target.value;
                        setCustomsRefs(tmp);
                      }}
                      className={selectStyle}
                    >
                      <option value="">-- Select Type --</option>
                      <option value="BOL">Bill of Lading</option>
                      <option value="INV">Invoice</option>
                      <option value="PO">Purchase Order</option>
                    </select>
                    <input
                      type="text"
                      value={cr.ref}
                      onChange={(e) => {
                        const tmp = [...customsRefs];
                        tmp[idx].ref = e.target.value;
                        setCustomsRefs(tmp);
                      }}
                      className={inputStyle}
                      placeholder="Reference number"
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Bill of Lading Numbers */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="font-bold mb-4 text-[#00FFFF] text-xl uppercase tracking-wide">
                Bill of Lading Numbers
              </div>
              <p className="text-[#faf9f6] font-bold mb-6">
                You may receive the bill of lading numbers with the booking confirmation. How many do you need?
              </p>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                  <input
                    type="radio"
                    checked={!wantsBoL}
                    onChange={() => setWantsBoL(false)}
                    className="w-5 h-5 accent-[#00FFFF]"
                  />
                  <span>Not needed with Booking confirmation</span>
                </label>
                <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                  <input
                    type="radio"
                    checked={wantsBoL}
                    onChange={() => setWantsBoL(true)}
                    className="w-5 h-5 accent-[#00FFFF]"
                  />
                  <span>No. of Bill of lading numbers:</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={boLCount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setBoLCount(value);
                  }}
                  disabled={!wantsBoL}
                  placeholder="0"
                  className="w-24 bg-[#0A1A2F] rounded-xl p-3 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50"
                />
              </div>
            </div>

            {/* Export Customs Filing */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="font-bold mb-6 text-[#00FFFF] text-xl uppercase tracking-wide">
                Export Customs Filing
              </div>
              <div className="flex items-start gap-6">
                <label className="flex items-center gap-3 pt-1 text-[#faf9f6] font-bold">
                  <input
                    type="checkbox"
                    checked={exportFiling}
                    onChange={(e) => setExportFiling(e.target.checked)}
                    className="w-6 h-6 accent-[#00FFFF] rounded"
                  />
                  <span>Export customs filing performed by third party.</span>
                </label>
                <div className="flex-1">
                  <label className="block mb-2 font-bold text-[#00FFFF] text-sm uppercase tracking-wide">
                    Performed by (address):
                  </label>
                  <textarea
                    value={filingBy}
                    onChange={(e) => setFilingBy(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0A1A2F] rounded-xl p-4 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                    placeholder="Enter address..."
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="font-bold mb-4 text-[#00FFFF] text-xl uppercase tracking-wide">
                Remarks (optional Shipper/Consignee address)
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={8}
                className="w-full bg-[#0A1A2F] rounded-xl p-4 text-[#faf9f6] font-bold border-2 border-[#22D3EE] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                placeholder="Enter any remarks here…"
              />
            </div>
          </div>
        )}

        {/* Step 5 */}
        {currentStep === 5 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
              <CheckCircle size={28} />
              REVIEW & COMPLETE
            </h2>

            {/* Contact & Reference */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#00FFFF] text-xl uppercase tracking-wide">
                  Contact &amp; Reference
                </h3>
                <button
                  onClick={() => setCurrentStep(0)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-orange-700"
                >
                  Edit Contact &amp; Reference
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-8 text-[#faf9f6] font-bold">
                <div className="space-y-2">
                  <div>
                    <span className="text-[#00FFFF]">Customer:</span> {customer}
                  </div>
                  <div className="ml-4">
                    {customerAddress.split("\n").map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[#00FFFF]">Customer Reference:</span>{" "}
                    {contactReference || "—"}
                  </div>
                  <div>
                    <span className="text-[#00FFFF]">Contact:</span> {contactName}
                  </div>
                  <div>
                    <span className="text-[#00FFFF]">Phone:</span> {phone || "—"}
                  </div>
                  <div>
                    <span className="text-[#00FFFF]">Notification E-mail:</span>{" "}
                    {email || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contract & Quotation */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#00FFFF] text-xl uppercase tracking-wide">
                  Contract &amp; Quotation
                </h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-orange-700"
                >
                  Edit Contract &amp; Quotation
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-8 text-[#faf9f6] font-bold">
                <div className="space-y-2">
                  <div>
                    <span className="text-[#00FFFF]">Quotation / Contract No.:</span>{" "}
                    {quotationNo}
                  </div>
                  <div>
                    <span className="text-[#00FFFF]">Valid to:</span> {validTo}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[#00FFFF]">Contractual Party:</span>
                  </div>
                  <div className="ml-4">{contractualParty}</div>
                  <div className="ml-4">
                    {contractualAddress.split("\n").map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Routing & Schedule */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#00FFFF] text-xl uppercase tracking-wide">
                  Routing &amp; Schedule
                </h3>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-orange-700"
                >
                  Edit Schedule
                </button>
              </div>
              <div className="text-[#faf9f6] font-bold mb-6 space-y-2">
                <div>
                  <span className="text-[#00FFFF]">Pickup:</span>{" "}
                  {pickupType === "door"
                    ? "Received at your door (CH)"
                    : "Received at container terminal (MH)"}
                </div>
                <div>
                  <span className="text-[#00FFFF]">Delivery:</span>{" "}
                  {deliveryType === "door"
                    ? "Delivered at your door (CH)"
                    : "Delivered at container terminal (MH)"}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#00FFFF] text-black">
                    <tr>
                      <th className="px-4 py-3 font-bold">Location</th>
                      <th className="px-4 py-3 font-bold">Arrival</th>
                      <th className="px-4 py-3 font-bold">Departure</th>
                      <th className="px-4 py-3 font-bold">Vessel / Mode</th>
                      <th className="px-4 py-3 font-bold">Voyage No.</th>
                      <th className="px-4 py-3 font-bold">Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeDetails.map((rd, i) => (
                      <tr
                        key={i}
                        className={clsx(
                          "border-b border-[#22D3EE] text-[#faf9f6] font-bold",
                          i % 2 === 0 ? "bg-[#2D4D8B]" : "bg-[#1A2A4A]"
                        )}
                      >
                        <td className="px-4 py-3">{rd.location}</td>
                        <td className="px-4 py-3">{rd.arrival}</td>
                        <td className="px-4 py-3">{rd.departure}</td>
                        <td className="px-4 py-3">{rd.vessel || "—"}</td>
                        <td className="px-4 py-3">{rd.voyage || "—"}</td>
                        <td className="px-4 py-3">{rd.service || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cargo & Equipment */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#00FFFF] text-xl uppercase tracking-wide">
                  Cargo &amp; Equipment
                </h3>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-orange-700"
                >
                  Edit Cargo &amp; Equipment
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-8 text-[#faf9f6] font-bold">
                <div className="space-y-2">
                  <div>
                    <span className="text-[#00FFFF]">Equipment owned by:</span>{" "}
                    {shipperOwnedContainer
                      ? "Shipper's own Container"
                      : "Hapag-Lloyd Container"}
                  </div>
                  <div>
                    <span className="text-[#00FFFF]">Release:</span> {releaseDate}{" "}
                    {releaseTime}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="text-[#00FFFF]">Container Type:</span>{" "}
                      {containerRows[0].type || "—"}
                    </div>
                    <div>
                      <span className="text-[#00FFFF]">Cargo Description:</span>{" "}
                      {cargoDescription || "—"}
                    </div>
                    <div>
                      <span className="text-[#00FFFF]">HS Code:</span>{" "}
                      {hsParts.join("") || "—"}
                    </div>
                    <div>
                      <span className="text-[#00FFFF]">Cargo Weight:</span>{" "}
                      {weight}
                    </div>
                    <div>
                      <span className="text-[#00FFFF]">Unit:</span> {weightUnit}
                    </div>
                    <div>
                      <span className="text-[#00FFFF]">DG Details:</span>{" "}
                      {dangerousGoods ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customs & Remarks */}
            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#00FFFF] text-xl uppercase tracking-wide">
                  Customs &amp; Remarks
                </h3>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-orange-700"
                >
                  Edit Customs &amp; Remarks
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-8 text-[#faf9f6] font-bold mb-6">
                <div>
                  <div>
                    <span className="text-[#00FFFF]">Bill of Lading Numbers:</span>{" "}
                    {wantsBoL ? boLCount || "0" : "Not needed"}
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={exportFiling}
                      onChange={(e) => setExportFiling(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-[#00FFFF]"
                      disabled
                    />
                    <div>
                      <span className="text-[#00FFFF]">
                        Export customs filing performed by third party
                      </span>
                      {exportFiling && (
                        <div className="mt-2">
                          <span className="text-[#00FFFF]">Performed by (address):</span>{" "}
                          {filingBy}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <span className="text-[#00FFFF] font-bold">
                    Remarks (optional Shipper/Consignee address)
                  </span>
                </div>
                <div className="bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl p-4 min-h-[120px] text-[#faf9f6] font-bold shadow-inner">
                  {remarks || "—"}
                </div>
              </div>
            </div>

            {/* Final Submit */}
            <div className="border-t-4 border-[#00FFFF] pt-10 text-center">
              <p className="text-[#faf9f6] font-bold mb-8 text-lg leading-relaxed max-w-4xl mx-auto">
                By clicking on "Submit Booking", you acknowledge that you have
                accepted the Hapag-Lloyd Bill of Lading or Sea Waybill Terms and
                Conditions and agree to place a legally binding booking request.
              </p>
              <button
                onClick={() => alert("Booking Submitted Successfully!")}
                className="bg-[#00FFFF] text-black px-12 py-4 rounded-2xl font-bold text-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_rgba(0,0,0,1)] transition-all border-4 border-black hover:bg-[#22D3EE]"
              >
                <Send size={24} className="inline mr-3" />
                SUBMIT BOOKING
              </button>
            </div>
          </div>
        )}

        {/* Step 6 */}
        {currentStep === 6 && (
          <div className="text-center py-20">
            <CheckCircle
              size={80}
              className="text-[#00FFFF] mx-auto mb-8 drop-shadow-lg"
            />
            <h2 className="text-4xl mb-6 text-[#00FFFF] font-bold uppercase tracking-wide">
              BOOKING RECEIVED
            </h2>
            <p className="text-xl text-[#faf9f6] font-bold">
              Your booking request has been successfully submitted.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-16">
        <button
          onClick={prev}
          disabled={currentStep === 0}
          className={clsx(
            navButtonStyle,
            currentStep === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft size={20} className="inline-block mr-2" />
          PREVIOUS
        </button>
        {currentStep < 6 && (
          <button onClick={next} className={navButtonStyle}>
            NEXT
            <ArrowRight size={20} className="inline-block ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateBookingComponent;
