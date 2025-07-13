// components/BookingComponent.tsx
"use client";

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Package,
  Info,
  Ship,
  Container as ContainerIcon,
  AlertTriangle,
  Shield,
  FileText,
  Send
} from 'lucide-react';

type DeliveryType = 'door' | 'terminal';
type WeightUnit = 'kg' | 'lb';

interface RoutingOption {
  id: number;
  mode: string;
  pol: string;
  service: string;
  pod: string;
  commodity: string;
  type1: string;
  type2: string;
  type3: string;
}

interface ScheduleOption {
  id: number;
  pol: string;
  date: string;
  vessels: string[];
  pod: string;
  transitTime: number;
}

interface RouteDetail {
  id: number;
  location: string;
  arrival: string;
  departure: string;
  vessel: string;
  voyage: string;
  service: string;
}

// ─── Page 3 Header Component ───────────────────────────────────────────────
interface BookingSummaryHeaderProps {
  quotationNo: string;
  scheduleStart: string;
  scheduleDate: string;
  scheduleWeeks: string;
  pickupType: DeliveryType;
  via1: string;
  via2: string;
  endLocation: string;
  exportMoT: string;
  importMoT: string;
  optimizeReefer: boolean;
  onDateChange: (d: string) => void;
  onWeeksChange: (w: string) => void;
  onPickupTypeChange: (t: DeliveryType) => void;
}
export const BookingSummaryHeader: React.FC<BookingSummaryHeaderProps> = ({
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
}) => (
  <div className="bg-[#2D4D8B] border border-gray-300 rounded-xl p-6 mb-6">
    {/* Row 1 */}
    <div className="grid md:grid-cols-5 gap-4 items-end">
      <div>
        <label className="block font-bold mb-1">Quotation Number</label>
        <div className="h-9 px-3 bg-white border rounded">{quotationNo}</div>
      </div>
      <div>
        <label className="block font-bold mb-1">Start Location*</label>
        <div className="h-9 px-3 bg-white border rounded">{scheduleStart}</div>
      </div>
      <div>
        <label className="block font-bold mb-1">Start Date</label>
        <input
          type="date"
          value={scheduleDate}
          onChange={e => onDateChange(e.target.value)}
          className="h-9 w-full px-3 bg-white border rounded"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Plus</label>
        <div className="flex items-center space-x-2">
          <select
            value={scheduleWeeks}
            onChange={e => onWeeksChange(e.target.value)}
            className="h-9 px-2 bg-white border rounded"
          >
            {[...Array(8)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <span>week(s)</span>
        </div>
      </div>
      <div className="space-y-1">
        <label className="block font-bold mb-1">Received at</label>
        <label className="inline-flex items-center space-x-2">
          <input
            type="radio"
            checked={pickupType === 'door'}
            onChange={() => onPickupTypeChange('door')}
            className="accent-[#00FFFF]"
          />
          <span>your door (CH)</span>
        </label>
        <label className="inline-flex items-center space-x-2">
          <input
            type="radio"
            checked={pickupType === 'terminal'}
            onChange={() => onPickupTypeChange('terminal')}
            className="accent-[#00FFFF]"
          />
          <span>container terminal (MH)</span>
        </label>
      </div>
    </div>

    {/* Row 2 */}
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      <div>
        <label className="block font-bold mb-1">Via 1</label>
        <div className="h-9 px-3 bg-white border rounded">{via1}</div>
      </div>
      <div>
        <label className="block font-bold mb-1">Via 2</label>
        <div className="h-9 px-3 bg-white border rounded">{via2}</div>
      </div>
      <div>
        <label className="block font-bold mb-1">End Location*</label>
        <div className="h-9 px-3 bg-white border rounded">{endLocation}</div>
      </div>
    </div>

    {/* Row 3 */}
    <div className="grid md:grid-cols-3 gap-4 mt-6 items-center">
      <div>
        <label className="block font-bold mb-1">Export MoT</label>
        <select value={exportMoT} onChange={() => {}} className="h-9 w-full px-3 bg-white border rounded">
          <option value="">—</option>
          <option>Road</option>
          <option>Rail</option>
          <option>Sea</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-1">Import MoT</label>
        <select value={importMoT} onChange={() => {}} className="h-9 w-full px-3 bg-white border rounded">
          <option value="">—</option>
          <option>Road</option>
          <option>Rail</option>
          <option>Sea</option>
        </select>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={optimizeReefer}
          onChange={() => {}}
          className="accent-[#00FFFF] mr-2"
        />
        <span>Optimize routing for reefer equipment</span>
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
export const CreateBookingComponent: React.FC = () => {
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

  const [routingOptions] = useState<RoutingOption[]>([
    { id: 1, mode: 'Terminal', pol: 'SYDNEY, NSW', service: 'WAX', pod: 'TEMA', commodity: 'FAK', type1: "20'STD", type2: "40'STD", type3: "40'HC" },
  ]);
  const [selectedRoutingId, setSelectedRoutingId] = useState<number | null>(null);

  // Page 2 form
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleWeeks, setScheduleWeeks] = useState("1");
  const [via1, setVia1] = useState("");
  const [via2, setVia2] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [pickupType, setPickupType] = useState<DeliveryType>("terminal");
  const [exportMoT, setExportMoT] = useState("");
  const [importMoT, setImportMoT] = useState("");
  const [optimizeReefer, setOptimizeReefer] = useState(false);

  const [scheduleResults, setScheduleResults] = useState<ScheduleOption[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  const [routeDetails] = useState<RouteDetail[]>([
    { id:1, location: 'SYDNEY, NSW', arrival: '2022-12-12', departure: '—', vessel: 'APL BOSTON', voyage: '245N', service: 'SEA' },
    { id:2, location: 'SINGAPORE', arrival: '2022-12-29', departure: '2023-01-04', vessel: 'SPIL KARTIKA', voyage: '005W', service: 'CGX' },
    { id:3, location: 'ANTWERP', arrival: '2023-01-30', departure: '2023-02-02', vessel: 'SYNERGY ANTWERP', voyage: '2305S', service: 'WAX' },
    { id:4, location: 'TEMA', arrival: '2023-02-19', departure: '—', vessel: '—', voyage: '—', service: '—' },
  ]);

  // Steps 2–6 state
  const [startLocation, setStartLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('terminal');
  const [shipperOwnedContainer, setShipperOwnedContainer] = useState(false);
  const [containerType, setContainerType] = useState("40-general");
  const [containerQty, setContainerQty] = useState("1");
  const [weight, setWeight] = useState("20000");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [dangerousGoods, setDangerousGoods] = useState(false);
  const [imoClass, setImoClass] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [commodity, setCommodity] = useState("FAK");
  const [customsDetails, setCustomsDetails] = useState("");
  const [remarks, setRemarks] = useState("");
  const [filingAddress, setFilingAddress] = useState(""); 

  const next = () => setCurrentStep(s => Math.min(s + 1, 6));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 0));


  const [containerRows, setContainerRows] = useState(
  Array.from({ length: 4 }, () => ({ qty: '', type: '' }))
);

const [cargoDescription, setCargoDescription] = useState('');
// instead of const [hsCode, setHsCode] = useState('');
const [hsParts, setHsParts] = useState<string[]>(['', '', '']);

const [newContainerType, setNewContainerType] = useState('');
const [releaseDate, setReleaseDate] = useState('');
const [releaseTime, setReleaseTime] = useState('');
const [hasAssignedDetails, setHasAssignedDetails] = useState(false);

const [customsRefs, setCustomsRefs] = useState(
  Array.from({ length: 5 }, () => ({ type: '', ref: '' }))
);
const [wantsBoL, setWantsBoL] = useState(false);
const [boLCount, setBoLCount] = useState('');
const [exportFiling, setExportFiling] = useState(false);
const [filingBy, setFilingBy] = useState('');


  // Step 1 handlers
  const handleFindContract = () => {
    if (!quotationNo) return;
    setValidTo("2022-12-23");
    setContractualParty(customer);
    setContractualAddress(customerAddress);
    setHasFoundContract(true);
  };
  const handleClearContract = () => {
    setQuotationNo(""); setValidTo("");
    setContractualParty(""); setContractualAddress("");
    setHasFoundContract(false);
    setHasSelectedRouting(false);
    setHasLookedUp(false);
    setScheduleResults([]); setSelectedRoutingId(null);
  };
  const selectRouting = () => {
    if (selectedRoutingId !== null) setHasSelectedRouting(true);
  };

  const updateContainerRow = (idx: number, field: 'qty' | 'type', value: string) => {
  setContainerRows(rows =>
    rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
  );
};

const handleAssignDetails = () => {
  const fullHsCode = hsParts.join('');
  console.log('Assigning details:', {
    containerRows,
    shipperOwnedContainer,
    cargoDescription,
    hsCode: fullHsCode,
    releaseDate,
    releaseTime,
  });
  setHasAssignedDetails(true);      // ← show the “popup” and hide the buttons
};

const handleClearCargo = () => {
  setContainerRows(Array.from({ length: 4 }, () => ({ qty: '', type: '' })));
  setShipperOwnedContainer(false);
  setCargoDescription('');
  setHsParts(['', '', '']);
  setReleaseDate('');
  setReleaseTime('');
  setHasAssignedDetails(false);     // ← bring the buttons back
};


const handleAddContainer = () => {
  console.log('Adding container of type', newContainerType);
  // → call API or push into containerRows array…
};

  const handleLookupSchedule = () => {
    setScheduleResults([
      { id:1, pol:"SYDNEY, NSW | AU", date:"2022-12-12",
        vessels:[
          "APL BOSTON / 245N / SEA",
          "SPIL KARTIKA / 005W / CGX",
          "SYNERGY ANTWERP / 2305S / WAX"
        ],
        pod:"TEMA | GH", transitTime:69 },
      { id:2, pol:"SYDNEY, NSW | AU", date:"2022-12-20",
        vessels:[
          "CONTI CONQUEST / 246N / SEA",
          "SEASPAN SAIGON / 006W / CGX",
          "DALLAS EXPRESS / 2306S / WAX"
        ],
        pod:"TEMA | GH", transitTime:68 },
      { id:3, pol:"SYDNEY, NSW | AU", date:"2022-12-16",
        vessels:[
          "VENETIA / 2090N / SAL",
          "SEASPAN SAIGON / 006W / CGX",
          "DALLAS EXPRESS / 2306S / WAX"
        ],
        pod:"TEMA | GH", transitTime:72 },
    ]);
    setHasLookedUp(true);
  };
  const handleClearSchedule = () => {
    setScheduleResults([]); setSelectedScheduleId(null); setHasLookedUp(false);
  };

  const sectionStyle = "bg-[#0A1A2F] border-2 border-white rounded-xl p-8 mb-8";
  const navButtonStyle = "bg-white rounded-xl px-4 py-2 font-bold hover:bg-gray-300 transition";

  return (
    <div className="font-bold text-[#faf9f6] p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="inline-flex items-center space-x-3 text-2xl bg-[#0A1A2F] border-2 border-white rounded-xl p-4 mb-8 ">
        <Package size={32} /><span>NEW BOOKING REQUEST</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-[#0F1B2A] border-2 border-white rounded-xl px-6 py-4 mb-12">
        {[
          "CONTACT & REFERENCE",
          "CONTRACT & QUOTATION",
          "ROUTING & SCHEDULE",
          "CARGO & EQUIPMENT",
          "CUSTOMS & REMARKS",
          "REVIEW & COMPLETE",
          "BOOKING RECEIVED"
        ].map((label, idx) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= idx ? 'bg-white text-[#0F1B2A]' : 'bg-[#0F1B2A] text-[#faf9f6]'
              } font-bold text-sm`}>
                {idx + 1}
              </div>
              <span className={currentStep >= idx ? 'text-white' : 'text-[#faf9f6]'}>
                {label}
              </span>
            </div>
            {idx < 6 && <div className="flex-1 h-1 bg-white mx-4" />}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className={sectionStyle}>
        {/* Step 0 */}
        {currentStep === 0 && (
          <div className="grid md:grid-cols-2 gap-8 bg-[#0A1A2F] border-white rounded-xl p-6 mb-8">
            {/* Left */}
            <div className="space-y-4">
              <label className="block font-bold">Customer</label>
              <textarea
                readOnly
                value={`${customer}\n${customerAddress}`}
                rows={5}
                className="w-full bg-[#2D4D8B] rounded-xl p-3 text-[#faf9f6] shadow-inner resize-none"
              />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="font-light">Customer Reference</label>
                  <input
                    type="text"
                    value={contactReference}
                    onChange={e => setContactReference(e.target.value)}
                    className="w-full bg-[#2D4D8B] rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-light">Contact*</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full bg-[#2D4D8B] rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-light">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#2D4D8B] rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="font-light">Notification E-mail*</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#2D4D8B] rounded-xl p-2"
                  />
                </div>
              </div>
            </div>
            {/* Right */}
            <div className="rounded-xl p-6 shadow-inner">
              <div className="flex justify-between border-b border-white pb-2 mb-4">
                <span className="font-bold">Your contact</span>
                <Info size={16} />
              </div>
              <p className="text-sm">
                Your contact data is prefilled with the information you already provided during web registration.
              </p>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {currentStep === 1 && (
          <>
            {/* Page 1 */}
            {!hasSelectedRouting && !hasLookedUp && (
              <>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <label className="block font-bold mb-2">Quotation / Contract No.*</label>
                    <input
                      value={quotationNo}
                      onChange={e => setQuotationNo(e.target.value)}
                      className="w-full bg-[#2D4D8B] rounded-xl p-2 text-[#faf9f6]"
                    />
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={handleFindContract}
                        className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold"
                      >
                        Find
                      </button>
                      <button
                        onClick={handleClearContract}
                        className="bg-[#faf9f6] text-black px-6 py-2 rounded-xl font-bold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
                    <div className="flex justify-between border-b border-white pb-2 mb-4">
                      <span className="font-bold">Base for Freight Charges</span>
                      <Info size={16} />
                    </div>
                    <p className="mb-2 text-sm">
                      The freight basis is either a quotation or a (service-) contract you hold with Hapag-Lloyd.
                    </p>
                    <p className="mb-2 text-sm">
                      Formats: <strong>W1209RTM00001</strong>, <strong>Q1209RTM00001</strong>, <strong>S19ABC001</strong>, <strong>4682727</strong>.
                    </p>
                    <p className="text-sm">
                      If neither, use <span className="text-[#00FFFF] underline">Quick Quote</span> or contact your local <span className="text-[#00FFFF] underline">Sales Office</span>.
                    </p>
                  </div>
                </div>

                {hasFoundContract && (
                  <div className="space-y-6 mb-8">
                    <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
                      <div className="font-bold mb-4">Validity</div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="font-light">Quotation / Contract No.*</div>
                          <div>{quotationNo}</div>
                        </div>
                        <div>
                          <div className="font-light">Valid to</div>
                          <div>{validTo}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="font-light mb-1">Contractual Party</div>
                        <textarea
                          readOnly
                          rows={3}
                          value={`${contractualParty}\n${contractualAddress}`}
                          className="w-full bg-transparent resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="font-bold mb-2">Routing as per Quotation</div>
                      <div className="overflow-x-auto bg-[#2D4D8B] border-2 border-white rounded-xl p-4">
                        <table className="min-w-full text-sm">
                          <thead className="bg-white text-[#0A1A2F]">
                            <tr>
                              <th className="px-2 py-1">Select</th>
                              <th className="px-2 py-1">Export haulage</th>
                              <th className="px-2 py-1">Port of Loading</th>
                              <th className="px-2 py-1">Service</th>
                              <th className="px-2 py-1">Port of Discharge</th>
                              <th className="px-2 py-1">Commodity</th>
                              <th className="px-2 py-1">Ctr. Type 1</th>
                              <th className="px-2 py-1">Ctr. Type 2</th>
                              <th className="px-2 py-1">Ctr. Type 3</th>
                            </tr>
                          </thead>
                          <tbody>
                            {routingOptions.map(opt => (
                              <tr key={opt.id} className={opt.id === selectedRoutingId ? 'bg-[#FFD58E]' : ''}>
                                <td className="px-2 py-1 text-center">
                                  <input
                                    type="radio"
                                    checked={opt.id === selectedRoutingId}
                                    onChange={() => setSelectedRoutingId(opt.id)}
                                    className="accent-[#00FFFF]"
                                  />
                                </td>
                                <td className="px-2 py-1">{opt.mode}</td>
                                <td className="px-2 py-1">{opt.pol}</td>
                                <td className="px-2 py-1">{opt.service}</td>
                                <td className="px-2 py-1">{opt.pod}</td>
                                <td className="px-2 py-1">{opt.commodity}</td>
                                <td className="px-2 py-1">{opt.type1}</td>
                                <td className="px-2 py-1">{opt.type2}</td>
                                <td className="px-2 py-1">{opt.type3}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button
                          onClick={selectRouting}
                          className="mt-4 bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold"
                        >
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
              <div className="space-y-6">
                <div className="font-bold">Look-up Schedule</div>
                <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6 grid md:grid-cols-3 gap-6">
                  <div>
                    <label>Start Location*</label>
                    <input
                      value={scheduleStart}
                      onChange={e => setScheduleStart(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    />
                  </div>
                  <div>
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    />
                  </div>
                  <div>
                    <label>Plus (weeks)</label>
                    <select
                      value={scheduleWeeks}
                      onChange={e => setScheduleWeeks(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Via 1</label>
                    <input
                      value={via1}
                      onChange={e => setVia1(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    />
                  </div>
                  <div>
                    <label>Via 2</label>
                    <input
                      value={via2}
                      onChange={e => setVia2(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    />
                  </div>
                  <div>
                    <label>End Location*</label>
                    <input
                      value={endLocation}
                      onChange={e => setEndLocation(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    />
                  </div>
                  <div className="md:col-span-3 flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={pickupType === 'door'}
                        onChange={() => setPickupType('door')}
                        className="accent-[#00FFFF]"
                      />
                      Received at your door (CH)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={pickupType === 'terminal'}
                        onChange={() => setPickupType('terminal')}
                        className="accent-[#00FFFF]"
                      />
                      Received at container terminal (MH)
                    </label>
                  </div>
                  <div>
                    <label>Export MoT</label>
                    <select
                      value={exportMoT}
                      onChange={e => setExportMoT(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    >
                      <option value="">—</option>
                      <option>Road</option>
                      <option>Rail</option>
                      <option>Sea</option>
                    </select>
                  </div>
                  <div>
                    <label>Import MoT</label>
                    <select
                      value={importMoT}
                      onChange={e => setImportMoT(e.target.value)}
                      className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
                    >
                      <option value="">—</option>
                      <option>Road</option>
                      <option>Rail</option>
                      <option>Sea</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={optimizeReefer}
                      onChange={e => setOptimizeReefer(e.target.checked)}
                      className="accent-[#00FFFF]"
                    />
                    Optimize routing for reefer equipment
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-4">
                    <button
                      onClick={handleLookupSchedule}
                      className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold"
                    >
                      Find
                    </button>
                    <button
                      onClick={handleClearSchedule}
                      className="bg-[#faf9f6] text-black px-6 py-2 rounded-xl font-bold"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setHasSelectedRouting(false)}
                      className="underline text-sm text-[#faf9f6] hover:text-white"
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

                <table className="min-w-full text-sm mb-4 bg-[#2D4D8B] text-[#faf9f6]">
                  <thead className="bg-white text-[#0A1A2F]">
                    <tr>
                      <th className="px-2 py-1">Port of Loading</th>
                      <th className="px-2 py-1">Transshipments</th>
                      <th className="px-2 py-1">Vessels / Services</th>
                      <th className="px-2 py-1">Port of Discharge</th>
                      <th className="px-2 py-1">Transit Time (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleResults.map(opt => (
                      <tr
                        key={opt.id}
                        className={opt.id === selectedScheduleId ? 'bg-[#FFD58E]' : 'bg-[#164070] hover:bg-[#1d4595]'}
                      >
                        <td className="px-2 py-1">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={opt.id === selectedScheduleId}
                              onChange={() => setSelectedScheduleId(opt.id)}
                              className="accent-[#00FFFF]"
                            />
                            <div>
                              <strong>{opt.pol}</strong><br/>{opt.date}
                            </div>
                          </label>
                        </td>
                        <td className="px-2 py-1 text-center">{opt.vessels.length}</td>
                        <td className="px-2 py-1">{opt.vessels.map((v,i)=><div key={i}>{v}</div>)}</td>
                        <td className="px-2 py-1">{opt.pod}</td>
                        <td className="px-2 py-1 text-right">{opt.transitTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex gap-4 mb-4">
                  <button className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold">Routing Details</button>
                  <button
                    disabled={!selectedScheduleId}
                    className="bg-[#faf9f6] text-black px-6 py-2 rounded-xl font-bold disabled:opacity-50"
                  >
                    Select for Booking
                  </button>
                  <button className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold">Vessel Details</button>
                  <button className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold">Vessel Tracing</button>
                  <button className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold">Closings & Terminal Details</button>
                </div>

                <div className="underline mb-2 text-sm">
                  Selected routings not in accordance may incur extra charges
                </div>
                <table className="min-w-full text-sm bg-[#2D4D8B] text-[#faf9f6]">
                  <thead className="bg-white text-[#0A1A2F]">
                    <tr>
                      <th className="px-2 py-1">Location</th>
                      <th className="px-2 py-1">Arrival</th>
                      <th className="px-2 py-1">Departure</th>
                      <th className="px-2 py-1">Vessel / Mode</th>
                      <th className="px-2 py-1">Voyage</th>
                      <th className="px-2 py-1">Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeDetails.map(rd => (
                      <tr key={rd.id} className="even:bg-[#1d4595] odd:bg-[#164070]">
                        <td className="px-2 py-1">{rd.location}</td>
                        <td className="px-2 py-1">{rd.arrival}</td>
                        <td className="px-2 py-1">{rd.departure}</td>
                        <td className="px-2 py-1">{rd.vessel}</td>
                        <td className="px-2 py-1">{rd.voyage}</td>
                        <td className="px-2 py-1">{rd.service}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  onClick={() => { setHasLookedUp(false); setHasSelectedRouting(true); }}
                  className="underline text-sm text-[#faf9f6] hover:text-white mt-4"
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
    {/* ── Step 1 Overview ────────────────────────────────── */}
    <div className="mb-6 bg-[#F5F5F5] p-4 rounded-lg">
      <p className="mb-2 font-bold">You have selected the following routing:</p>
      <table className="min-w-full text-sm">
        <thead className="bg-white text-[#0A1A2F]">
          <tr>
            <th className="px-2 py-1b">Location</th>
            <th className="px-2 py-1">Arrival</th>
            <th className="px-2 py-1">Departure</th>
            <th className="px-2 py-1">Vessel / Mode of transport</th>
            <th className="px-2 py-1">Voyage No.</th>
            <th className="px-2 py-1">Service</th>
          </tr>
        </thead>
        <tbody>
          {routeDetails.map(rd => (
            <tr key={rd.id} className="even:bg-white odd:bg-[#F9F9F9]">
              <td className="px-2 py-1">{rd.location}</td>
              <td className="px-2 py-1">{rd.arrival}</td>
              <td className="px-2 py-1">{rd.departure}</td>
              <td className="px-2 py-1">{rd.vessel}</td>
              <td className="px-2 py-1">{rd.voyage}</td>
              <td className="px-2 py-1">{rd.service}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ── Routing & Schedule Form ────────────────────────── */}
    <div>
      <h2 className="text-xl mb-6 flex items-center gap-2">
        <Ship size={24} /> ROUTING & SCHEDULE
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block mb-1">Start Location*</label>
          <input
            type="text"
            value={startLocation}
            onChange={e => setStartLocation(e.target.value)}
            className="w-full bg-[#2D4D8B] rounded-xl p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Pickup Date</label>
          <input
            type="date"
            value={pickupDate}
            onChange={e => setPickupDate(e.target.value)}
            className="w-full bg-[#2D4D8B] rounded-xl p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Delivery Date</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
            className="w-full bg-[#2D4D8B] rounded-xl p-2"
          />
        </div>
        <div>
          <label className="block mb-1">Delivered at</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={deliveryType === 'door'}
                onChange={() => setDeliveryType('door')}
                className="accent-[#00FFFF]"
              />
              Door
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={deliveryType === 'terminal'}
                onChange={() => setDeliveryType('terminal')}
                className="accent-[#00FFFF]"
              />
              Terminal
            </label>
          </div>
        </div>
      </div>
    </div>
  </>
)}

    {/* Step 3 */}
{currentStep === 3 && (
  <div className="space-y-8">
    <h2 className="text-xl mb-6 flex items-center gap-2">
      <ContainerIcon size={24} /> CARGO & EQUIPMENT
    </h2>

    {/* ── Container Type & Equipment Owner ── */}
    <div className="grid md:grid-cols-2 gap-6">
      {/* Container Type */}
      <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
        <div className="font-bold mb-4">Container Type</div>
        {containerRows.map((row, idx) => (
          <div key={idx} className="flex gap-4 items-center mb-4">
            <input
              type="text"
              placeholder="Qty*"
              value={row.qty}
              onChange={e => updateContainerRow(idx, 'qty', e.target.value)}
              className="w-20 bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
            />
            <select
              value={row.type}
              onChange={e => updateContainerRow(idx, 'type', e.target.value)}
              className="flex-1 bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
            >
              <option value="">--</option>
              {/* map your available container types here */}
            </select>
          </div>
        ))}

        
      </div>

      {/* Equipment Owned */}
      <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
        <div className="font-bold mb-4">Equipment owned by</div>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="radio"
            checked={!shipperOwnedContainer}
            onChange={() => setShipperOwnedContainer(false)}
            className="accent-[#00FFFF]"
          />
          <span>Hapag-Lloyd Container</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={shipperOwnedContainer}
            onChange={() => setShipperOwnedContainer(true)}
            className="accent-[#00FFFF]"
          />
          <span>Shipper’s own Container</span>
        </label>
      </div>
    </div>

    {/* ── Cargo Description, HS-Code & Depot Release ── */}
    <div className="grid md:grid-cols-2 gap-6">
      {/* Cargo */}
      <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
        <div className="font-bold mb-4">Cargo</div>
        <label className="block mb-1">Description</label>
        <input
          type="text"
          value={cargoDescription}
          onChange={e => setCargoDescription(e.target.value)}
          className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6] mb-4"
        />

        <label className="block mb-1">HS Code</label>
        <div className="flex gap-2 mb-4">
          {hsParts.map((part, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={2}
              value={part}
              onChange={e => {
                const tmp = [...hsParts];
                tmp[idx] = e.target.value.toUpperCase();
                setHsParts(tmp);
              }}
              className="w-16 bg-[#1d4595] rounded-xl p-2 text-center text-[#faf9f6]"
            />
          ))}
          <button
            type="button"
            onClick={() => console.log('Lookup HS code', hsParts.join(''))}
            className="bg-[#00FFFF] px-4 rounded font-bold"
          >
            🔍
          </button>
        </div>
      </div>

      {/* Empty Container from Depot */}
      <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
        <div className="font-bold mb-4">Empty Container from Depot</div>
        <label className="block mb-1">Release*</label>
        <div className="flex gap-2 items-center mb-4">
          <input
            type="date"
            value={releaseDate}
            onChange={e => setReleaseDate(e.target.value)}
            className="bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
          />
          <input
            type="time"
            value={releaseTime}
            onChange={e => setReleaseTime(e.target.value)}
            className="bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
          />
        </div>
        <p className="text-sm mb-2">
          The depot information will be provided with the final booking confirmation.
        </p>
        <p className="text-sm">
          Please note free time regulations in our{' '}
          <span className="underline text-[#00FFFF]">
            Detention &amp; Demurrage Tariff Information
          </span>.
        </p>
      </div>
    </div>
    {/* Buttons: Clear, Previous, Assign */}
        {!hasAssignedDetails && (
          <div className="mt-4 flex justify-end gap-4">
            <button
              onClick={handleClearCargo}
              className="bg-[#faf9f6] text-black px-6 py-2 rounded-xl font-bold"
            >
              Clear
            </button>
            <button
              onClick={() => prev()}
              className="bg-[#faf9f6] text-black px-6 py-2 rounded-xl font-bold"
            >
              Previous
            </button>
            <button
              onClick={handleAssignDetails}
              className="bg-[#00FFFF] text-black px-6 py-2 rounded-xl font-bold"
            >
              Assign Details
            </button>
          </div>
        )}

    {/* ── Pop-up summary after Assign Details ── */}
    {hasAssignedDetails && (
      <div className="bg-white border border-gray-300 rounded-xl p-6 mt-8">
        <div className="text-gray-700 font-semibold mb-4">Container 1</div>
        <div className="overflow-x-auto">
          <table className="table-auto mx-auto text-sm">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-2 py-1 text-left">Container Type</th>
                <th className="px-2 py-1 text-left">Cargo Description *</th>
                <th className="px-2 py-1 text-left">HS Code</th>
                <th className="px-2 py-1 text-left">Cargo Weight *</th>
                <th className="px-2 py-1 text-left">Unit *</th>
                <th className="px-2 py-1 text-left">DG Details</th>
              </tr>
            </thead>
            <tbody>
              {containerRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.type}
                      onChange={e => updateContainerRow(i, 'type', e.target.value)}
                      className="w-24 bg-white border rounded p-1 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={cargoDescription}
                      onChange={e => setCargoDescription(e.target.value)}
                      className="w-40 bg-white border rounded p-1 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center gap-1">
                      {hsParts.map((part, j) => (
                        <input
                          key={j}
                          type="text"
                          maxLength={2}
                          value={part}
                          onChange={e => {
                            const tmp = [...hsParts];
                            tmp[j] = e.target.value.toUpperCase();
                            setHsParts(tmp);
                          }}
                          className="w-8 bg-white border rounded p-1 text-center text-sm"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => console.log('Lookup HS', hsParts.join(''))}
                        className="px-2 bg-gray-200 border rounded text-sm"
                      >
                        🔍
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="w-24 bg-white border rounded p-1 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={weightUnit}
                      onChange={e => setWeightUnit(e.target.value as WeightUnit)}
                      className="w-20 bg-white border rounded p-1 text-sm"
                    >
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => console.log('Open DG details for row', i)}
                      className="px-2 bg-gray-200 border rounded text-sm"
                    >
                      🔍
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-4 mt-6 mb-2">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold">
            Copy Container with Cargo
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold">
            Copy This Cargo to all Containers
          </button>
        </div>
        <div className="flex justify-center gap-4 mb-6">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold">
            Out-Of-Gauge
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold">
            Change Type
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold">
            Remove
          </button>
        </div>
      </div>
    )}

    {/* ── Add Container Bar (only after assigning) ── */}
    {hasAssignedDetails && (
      <div className="flex justify-center items-center gap-4 mt-6 mb-8">
        <select
          value={newContainerType}
          onChange={e => setNewContainerType(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg p-2"
        >
          <option value="">-- select container --</option>
          {/* TODO: map your real types here */}
        </select>
        <button
          onClick={handleAddContainer}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold"
        >
          Add Container
        </button>
        <button
          onClick={handleClearCargo}
          className="bg-[#faf9f6] text-black px-6 py-2 rounded-xl font-bold"
        >
          Clear
        </button>
      </div>
    )}
  </div>
)}

        {/* Step 4 */}
        {currentStep === 4 && (
  <div className="space-y-8">
    <h2 className="text-xl mb-6 flex items-center gap-2">
      <Shield size={24} /> CUSTOMS & REMARKS
    </h2>

    {/* ── Customs References ── */}
    <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
      <div className="font-bold mb-4">Customs References</div>
      <div className="grid grid-cols-5 gap-4">
        {customsRefs.map((cr, idx) => (
          <React.Fragment key={idx}>
            <select
              value={cr.type}
              onChange={e => {
                const tmp = [...customsRefs]
                tmp[idx].type = e.target.value
                setCustomsRefs(tmp)
              }}
              className="bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
            >
              <option value="">--</option>
              {/* … */}
            </select>
            <input
              type="text"
              value={cr.ref}
              onChange={e => {
                const tmp = [...customsRefs]
                tmp[idx].ref = e.target.value
                setCustomsRefs(tmp)
              }}
              className="bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
            />
          </React.Fragment>
        ))}
      </div>
    </div>

    {/* ── Bill of Lading Numbers ── */}
    <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
      <div className="font-bold mb-2">Bill of Lading Numbers</div>
      <p className="text-sm mb-4">
        You may receive the bill of lading numbers with the booking confirmation. How many do you need?
      </p>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!wantsBoL}
            onChange={() => setWantsBoL(false)}
            className="accent-[#00FFFF]"
          />
          <span>Not needed with Booking confirmation</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={wantsBoL}
            onChange={() => setWantsBoL(true)}
            className="accent-[#00FFFF]"
          />
          <span>No. of Bill of lading numbers:</span>
        </label>
        <input
        type="text"
        inputMode="numeric"
        value={boLCount}
        onChange={e => {
          // Remove all non-digit characters
          const value = e.target.value.replace(/[^0-9]/g, '');
          setBoLCount(value);
        }}
        disabled={!wantsBoL}
        placeholder="0"
        className="w-20 bg-[#1d4595] rounded-xl p-2 text-[#faf9f6]"
      />
      </div>
    </div>

    {/* ── Export Customs Filing ── */}
    <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
      <div className="font-bold mb-4">Export Customs Filing</div>
      <div className="flex items-start gap-4">
        <label className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            checked={exportFiling}
            onChange={e => setExportFiling(e.target.checked)}
            className="accent-[#00FFFF]"
          />
          <span>Export customs filing performed by third party.</span>
        </label>
        <div className="flex-1">
          <label className="block mb-1">Performed by (address):</label>
          <textarea
            value={filingBy}
            onChange={e => setFilingBy(e.target.value)}
            rows={3}
            className="w-full bg-[#1d4595] rounded-xl p-2 text-[#faf9f6] resize-none"
          />
        </div>
      </div>
    </div>

    {/* ── Remarks ── */}
    <div className="bg-[#2D4D8B] border-2 border-white rounded-xl p-6">
      <div className="font-bold mb-2">Remarks (optional Shipper/Consignee address)</div>
      <textarea
        value={remarks}
        onChange={e => setRemarks(e.target.value)}
        rows={6}
        className="w-full bg-[#1d4595] rounded-xl p-3 text-[#faf9f6] resize-none"
        placeholder="Enter any remarks here…"
      />
    </div>
  </div>
)}

        {/* Step 5 */}
        {currentStep === 5 && (
  <div className="space-y-8">
    {/* Contact & Reference */}
    <div className="bg-[#F5F5F5] border border-gray-300 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Contact &amp; Reference</h2>
        <button
          onClick={() => setCurrentStep(0)}
          className="bg-[#FF6600] text-white px-4 py-2 rounded-lg font-bold"
        >
          Edit Contact &amp; Reference
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <div><strong>Customer</strong></div>
          <div>{customer}</div>
          <div>{customerAddress.split('\n').map((l,i) => <div key={i}>{l}</div>)}</div>
        </div>
        <div>
          <div><strong>Customer Reference</strong> {contactReference}</div>
          <div><strong>Contact*</strong> {contactName}</div>
          <div><strong>Phone</strong> {phone}</div>
          <div><strong>Notification E-mail*</strong> {email}</div>
        </div>
      </div>
    </div>

    {/* Contract & Quotation */}
    <div className="bg-[#F5F5F5] border border-gray-300 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Contract &amp; Quotation</h2>
        <button
          onClick={() => setCurrentStep(1)}
          className="bg-[#FF6600] text-white px-4 py-2 rounded-lg font-bold"
        >
          Edit Contract &amp; Quotation
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <div><strong>Quotation / Contract No.*</strong> {quotationNo}</div>
          <div><strong>Valid to</strong> {validTo}</div>
        </div>
        <div>
          <div><strong>Contractual Party</strong></div>
          <div>{contractualParty}</div>
          <div>{contractualAddress.split('\n').map((l,i) => <div key={i}>{l}</div>)}</div>
        </div>
      </div>
    </div>

    {/* Routing & Schedule */}
    <div className="bg-[#F5F5F5] border border-gray-300 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Routing &amp; Schedule</h2>
        <button
          onClick={() => setCurrentStep(2)}
          className="bg-[#FF6600] text-white px-4 py-2 rounded-lg font-bold"
        >
          Edit Schedule
        </button>
      </div>
      <div className="text-sm mb-4">
        <div><strong>Pickup:</strong> {pickupType === 'door' ? 'Received at your door (CH)' : 'Received at container terminal (MH)'}</div>
        <div><strong>Delivery:</strong> {deliveryType === 'door' ? 'Delivered at your door (CH)' : 'Delivered at container terminal (MH)'}</div>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-white text-[#0A1A2F]">
          <tr>
            <th className="px-2 py-1">Location</th>
            <th className="px-2 py-1">Arrival</th>
            <th className="px-2 py-1">Departure</th>
            <th className="px-2 py-1">Vessel / Mode</th>
            <th className="px-2 py-1">Voyage No.</th>
            <th className="px-2 py-1">Service</th>
          </tr>
        </thead>
        <tbody>
          {routeDetails.map((rd, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9F9F9]'}>
              <td className="px-2 py-1">{rd.location}</td>
              <td className="px-2 py-1">{rd.arrival}</td>
              <td className="px-2 py-1">{rd.departure}</td>
              <td className="px-2 py-1">{rd.vessel || '—'}</td>
              <td className="px-2 py-1">{rd.voyage || '—'}</td>
              <td className="px-2 py-1">{rd.service || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Cargo & Equipment */}
    <div className="bg-[#F5F5F5] border border-gray-300 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Cargo &amp; Equipment</h2>
        <button
          onClick={() => setCurrentStep(3)}
          className="bg-[#FF6600] text-white px-4 py-2 rounded-lg font-bold"
        >
          Edit Cargo &amp; Equipment
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <div><strong>Equipment owned by</strong> {shipperOwnedContainer ? "Shipper’s own Container" : "Hapag-Lloyd Container"}</div>
          <div><strong>Release</strong> {releaseDate} {releaseTime}</div>
        </div>
        <div>
          <div className="flex gap-4">
            <div><strong>Container Type</strong> {containerRows[0].type || '—'}</div>
            <div><strong>Cargo Description*</strong> {cargoDescription}</div>
            <div><strong>HS Code</strong> {hsParts.join('')}</div>
            <div><strong>Cargo Weight*</strong> {weight}</div>
            <div><strong>Unit*</strong> {weightUnit}</div>
            <div><strong>DG Details</strong> {dangerousGoods ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    </div>

    {/* Customs & Remarks */}
    <div className="bg-[#F5F5F5] border border-gray-300 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Customs &amp; Remarks</h2>
        <button
          onClick={() => setCurrentStep(4)}
          className="bg-[#FF6600] text-white px-4 py-2 rounded-lg font-bold"
        >
          Edit Customs &amp; Remarks
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <div><strong>Bill of Lading Numbers:</strong> {wantsBoL ? boLCount : 'Not needed'}</div>
        </div>
        <div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={exportFiling}
              onChange={e => setExportFiling(e.target.checked)}
              className="mt-1"
            />
            <div>
              <strong>Export customs filing performed by third party</strong>
              {exportFiling && <div className="mt-2"><strong>Performed by (address):</strong> {filingAddress}</div>}
            </div>
          </div>
        </div>
      </div>
      <div>
        <div><strong>Remarks (optional Shipper/Consignee address)</strong></div>
        <div className="mt-2 bg-white border rounded p-4 min-h-[100px] text-sm">
          {remarks || '—'}
        </div>
      </div>
    </div>

    {/* Final Submit */}
    <div className="border-t border-gray-400 pt-6 text-center">
      <p className="text-sm mb-4">
        By clicking on “Submit Booking”, you acknowledge that you have accepted the Hapag-Lloyd Bill of Lading or Sea Waybill Terms and Conditions and agree to place a legally binding booking request.
      </p>
      <button
        onClick={() => alert('Booking Submitted')}
        className="bg-[#00FFFF] text-black px-8 py-3 rounded-xl font-bold"
      >
        Submit Booking
      </button>
    </div>
  </div>
)}

        {/* Step 6 */}
        {currentStep === 6 && (
          <div className="text-center">
            <CheckCircle size={64} className="text-[#00FFFF] mx-auto mb-4" />
            <h2 className="text-2xl mb-2">BOOKING RECEIVED</h2>
            <p>Your booking request has been successfully submitted.</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between max-w-[1600px] mx-auto">
        <button onClick={prev} disabled={currentStep === 0} className={navButtonStyle}>
          <ArrowLeft size={20} className="inline-block mr-1"/> PREVIOUS
        </button>
        {currentStep < 6 && (
          <button onClick={next} className={navButtonStyle}>
            NEXT <ArrowRight size={20} className="inline-block ml-1"/>
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateBookingComponent;
