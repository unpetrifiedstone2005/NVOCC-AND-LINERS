"use client";

import React, { useState, ChangeEvent } from 'react';
import {
  MapPin,
  Calendar,
  Container as ContainerIcon,
  Package,
  Info,
  Ship,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Shield,
  ArrowRight,
  ArrowLeft,
  Send,
  Download,
  Mail,
  LocateFixed,
  AlertTriangle,
  Calculator,
  X
} from 'lucide-react';

type DeliveryType = 'door' | 'terminal';
type WeightUnit = 'kg' | 'lb';

interface FormData {
  startLocation: string;
  endLocation: string;
  pickupType: DeliveryType;
  deliveryType: DeliveryType;
  validFrom: string;
  shipperOwnedContainer: boolean;
  containerType: string;
  containerQuantity: string;
  weightPerContainer: string;
  weightUnit: WeightUnit;
  dangerousGoods: boolean;
  imoClass: string;
  multipleContainerTypes: boolean;
  unNumber: string;
  commodity: string;
}

interface Offer {
  id: number;
  carrier: string;
  service: string;
  transitTime: string;
  price: string;
  departure: string;
  arrival: string;
  vesselName: string;
  features: string[];
  selectionKey?: string;
}

interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
}

const offers: Offer[] = [
  {
    id: 1,
    carrier: "HAPAG-LLOYD",
    service: "Express Service",
    transitTime: "14 days",
    price: "$2,450",
    departure: "2025-06-15",
    arrival: "2025-06-29",
    vesselName: "MONTREAL EXPRESS",
    features: ["Door-to-Door", "Real-time Tracking", "Priority Loading"]
  },
  {
    id: 2,
    carrier: "MSC",
    service: "Standard Service",
    transitTime: "18 days",
    price: "$1,890",
    departure: "2025-06-18",
    arrival: "2025-07-06",
    vesselName: "MSC EMMA",
    features: ["Terminal-to-Terminal", "Standard Tracking"]
  },
  {
    id: 3,
    carrier: "MAERSK",
    service: "Economy Service",
    transitTime: "21 days",
    price: "$1,650",
    departure: "2025-06-20",
    arrival: "2025-07-11",
    vesselName: "MAERSK DETROIT",
    features: ["Basic Service", "Email Updates"]
  }
];



const additionalServices: Service[] = [
  { id: 'insurance', name: 'CARGO INSURANCE', price: '$125', description: 'Comprehensive cargo protection' },
  { id: 'inspection', name: 'CONTAINER INSPECTION', price: '$75', description: 'Pre-loading container inspection' },
  { id: 'customs', name: 'CUSTOMS CLEARANCE', price: '$200', description: 'Full customs documentation service' },
  { id: 'tracking', name: 'PREMIUM TRACKING', price: '$50', description: 'Real-time GPS tracking with alerts' },
  { id: 'storage', name: 'TEMPORARY STORAGE', price: '$100', description: 'Warehouse storage up to 7 days' },
  { id: 'handling', name: 'SPECIAL HANDLING', price: '$150', description: 'Fragile or hazardous goods handling' }
];

export const NewQuoteComponent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
     startLocation: '',
    endLocation: '',
    pickupType: 'terminal',
    deliveryType: 'terminal',
    validFrom: '2025-06-08',
    shipperOwnedContainer: false,
    multipleContainerTypes: false,
    containerType: '40-general',
    containerQuantity: '1',
    weightPerContainer: '20000',
    weightUnit: 'kg',
    dangerousGoods: false,
    imoClass: '',
    unNumber: '',
    commodity: 'FAK'
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const nextStep = () => { if (currentStep < 4) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };
  const canProceedToNext = () => {
    if (currentStep === 1) return !!(formData.startLocation && formData.endLocation);
    if (currentStep === 2) return selectedOffer !== null;
    return true;
  };
 
  const [showModal, setShowModal] = useState<'breakdown' | 'remarks' | null>(null);

  

  const buttonStyle =
    "bg-[#0A1A2F] rounded-xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] text-[#faf9f6] shadow-[-8px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] transition-shadow border-black border-4 px-4 py-2 font-bold shadow-md shadow-black/100 hover:font-bold";
  const inputStyle =
    " w-full bg-[#0A1A2F] rounded-xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90";
  const radioButtonStyle = "w-4 h-4 accent-[#1d4595] bg-[#373737] border-2 border-black";
  const sectionStyle =
    "max-w-[1600.24px] rounded-xl shadow-[40px_4  0px_0px_rgba(0,0,0,1)] p-6  py-[26px] border-white border-2";

  return (
    <div className="max-w-[1600.24px] mx-auto px-4 flex flex-col font-bold rounded-xl p-10">
      <div >
        
        <div className="inline-flex items-center space-x-4 gap-3 rounded-xl text-2xl font-bold text-[#faf9f6] mb-8 border-2 border-white shadow-[20px_20px_0px_rgba(0,0,0,1)] px-6 py-2 bg-[#0A1A2F] mx-auto">
        <div><Package size={32} /></div> 
        <div>NEW QUOTE REQUEST</div>
        </div>

        {/* Progress */}
        <div className="flex items-center rounded-xl justify-between bg-[#0F1B2A] border-white shadow-[30px_30px_0px_rgba(0,0,0,1)] border-2 px-6 py-4 mb-12">
          {[
            { num: 1, label: 'SEARCH' },
            { num: 2, label: 'OFFER SELECTION' },
            { num: 3, label: 'ADDITIONAL SERVICES' },
            { num: 4, label: 'REVIEW & NEXT STEPS' }
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center border-white justify-center font-bold border-2 ${
                  currentStep >= step.num ? 'bg-white text-[#0F1B2A]' : 'bg-[#0F1B2A] text-[#faf9f6]'
                }`}>{step.num}</div>
                <span className={`${currentStep >= step.num ? 'text-white' : 'text-[#faf9f6]'} font-bold`}>{step.label}</span>
              </div>
              {i < 3 && <div className="flex-1 h-1 bg-white mx-4"></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Search */}
        {currentStep === 1 && (
          <div className={sectionStyle}
          style={{
                  backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                  `,
               backgroundBlendMode: 'overlay',
              }}
          > 
            <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
              SEARCH
            </h2>
            <hr className="my-2 border-t border-white" />
            <br/>
            {/* Routing Inputs */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#00FFFF] mb-6 flex items-center gap-2">
                <LocateFixed size={20} /> ROUTING
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {['startLocation', 'endLocation'].map((field) => (
                  <div key={field}>
                    <label className="block text-md text-[#faf9f6] font-light mb-2">
                      {field === 'startLocation' ? 'START LOCATION' : 'END LOCATION'}
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={formData[field as 'startLocation' | 'endLocation']}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(field as any, e.target.value)}
                        className={`w-full bg-[#2D4D8B] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90 pl-12 `}
                        placeholder={field === 'startLocation' ? 'Enter start location' : 'Enter end location'}
                      />
                      <MapPin size={20} color="white" className=" absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
                    </div>
                  </div>
                ))}
              </div>
              <br/>
              <div className="grid md:grid-cols-2 gap-8">
                {(['pickupType', 'deliveryType'] as (keyof FormData)[]).map(field => (
                  <div key={field}>
                    <h4 className="text-[#faf9f6] font-light mb-3">
                      {field === 'pickupType' ? 'PICKUP TYPE' : 'DELIVERY TYPE'}
                    </h4>
                    <div className="space-y-2">
                      {(['door', 'terminal'] as DeliveryType[]).map(opt => (
                        <label key={opt} className="flex items-center gap-3 text-[#faf9f6] font-bold">
                          <input
                            type="radio"
                            name={field}
                            checked={(formData as any)[field] === opt}
                            onChange={() => handleInputChange(field as any, opt)}
                            className={` ${radioButtonStyle} bg-[#]`}
                          />
                          {opt.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <br/>
            {/* Date */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#00FFFF] mb-4 flex items-center gap-2 mb-6">
                <Calendar size={20} /> VALIDITY DATE
              </h3>
              <label className="block text-[#faf9f6] font-light mb-2">VALID FROM</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('validFrom', e.target.value)}
                className={`bg-[#1d4595] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90  w-full font-light`}
              />
            </div>
            <br/>
            {/* Container & Commodity */}
            <div>
              <h3 className="text-lg font-bold text-[#00FFFF] mb-4 flex items-center gap-2 mb-6">
                <ContainerIcon size={20} /> CONTAINER & COMMODITY
              </h3>
              <label className="flex items-center gap-3 text-[#faf9f6] font-light mb-6">
                <input
                  type="checkbox"
                  checked={formData.shipperOwnedContainer}
                  onChange={e => handleInputChange('shipperOwnedContainer', e.target.checked)}
                  className="w-5 h-5 accent-[#00FFFF] bg-[#373737] border-2 border-black"
                />
                SHIPPER OWNED CONTAINER (SOC)
              </label>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">CONTAINER TYPE</label>
                  <select
                    value={formData.containerType}
                    onChange={e => handleInputChange('containerType', e.target.value)}
                    className={`rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90 bg-[#11235d] hover:bg-[#1a307a] w-full font-light  w-full font-light`}
                  >
                    <option  value="20-general">20' GP HC</option>
                    <option value="40-general">40' GP HC</option>
                    <option value="40-hc">40' HC</option>
                    <option value="45-hc">45' HC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">QUANTITY</label>
                  <input
                    type="number"
                    value={formData.containerQuantity}
                    onChange={e => handleInputChange('containerQuantity', e.target.value)}
                    className={`rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90 bg-[#11235d] hover:bg-[#1a307a] w-full font-light `}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">WEIGHT</label>
                  <input
                    type="number"
                    value={formData.weightPerContainer}
                    onChange={e => handleInputChange('weightPerContainer', e.target.value)}
                    className={`rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90 bg-[#11235d] hover:bg-[#1a307a] w-full font-light  w-full font-light`}
                  />
                </div>
                <div>
                  <label className="block text-[#faf9f6] font-light mb-2">UNIT</label>
                  <div className="flex gap-4 mt-2">
                    {(['kg','lb'] as WeightUnit[]).map(u => (
                      <label key={u} className="flex items-center gap-2 text-[#faf9f6] font-bold">
                        <input
                          type="radio"
                          name="weightUnit"
                          checked={formData.weightUnit === u}
                          onChange={() => handleInputChange('weightUnit', u)}
                          className={radioButtonStyle}
                        />
                        {u}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <br/>
              <label className="flex items-center gap-3 text-[#faf9f6] font-light mb-4">
                <input
                  type="checkbox"
                  checked={formData.dangerousGoods}
                  onChange={e => handleInputChange('dangerousGoods', e.target.checked)}
                  className="w-5 h-5 accent-[#00FFFF] bg-[#373737] border-2 border-black"
                />
                DANGEROUS GOODS
              </label>
              {/* Dangerous Goods Details - Only show when checkbox is checked */}
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
                        onChange={e => handleInputChange('imoClass', e.target.value)}
                        className={`rounded-xl hover:text-white placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90 bg-[#fa0404] hover:bg-[#d93838] w-full font-bold`}
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
                        onChange={e => handleInputChange('unNumber', e.target.value)}
                        className={`rounded-xl hover:text-white placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]  placeholder:font-light transition-shadow border-black border-4 px-3 py-2 font-bold  placeholder: opacity-90 bg-[#fa0404] hover:bg-[#d93838] w-full font-bold`}
                        placeholder="e.g., UN1203"
                      />
                    </div>
                  </div>
                
                  <div className="bg-[#df992f] border border-[#444] rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-[#1c1c1c] font-bold mt-1 flex-shrink-0" size={20} />
                      <div className="text-[#1c1c1c] text-md ">
                        <p className="font-bold text-lg mb-2">Important Notice:</p>
                        <p className="mb-2">
                          Please provide the most restrictive UN number of your planned cargo. Dangerous Goods IMO Classes 1, 6.2 and 7, 
                          Military Cargo and Waste Shipments (Amber Listed under the Basel Convention and used / waste Batteries) are 
                          excluded from the web quotation.
                        </p>
                        
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <br/>
              <div className="mb-6">
                <label className="block text-[#faf9f6] font-bold mb-2">COMMODITY</label>
                <select
                  value={formData.commodity}
                  onChange={e => handleInputChange('commodity', e.target.value)}
                  className={`${inputStyle} w-64 font-bold`}
                >
                  <option value="FAK">FAK – Freight All Kinds</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Food">Food Products</option>
                </select>
              </div>
              <br/>
              <div className="flex justify-center">
                <button className={`${buttonStyle} px-12 py-3 text-lg`}>SEARCH</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Offer Selection */}
        {currentStep === 2 && (
        <div className={sectionStyle}
          style={{
                          backgroundImage: `
                          linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                          linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                          `,
                      backgroundBlendMode: 'overlay',
                      }}
          >
            <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
               OFFER SELECTION
            </h2>
    
    {/* Quick Quotes Header */}
    <div className="bg-[#1e3a8a] p-4 mb-4 border-4 border-black">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={20} className="text-[#FFB343]" />
        <h3 className="text-lg font-bold text-[#faf9f6]">Quick Quotes</h3>
      </div>
      <div className="text-sm text-[#faf9f6] mb-2">
        Valid 2025-06-09 to 2025-07-31 • Ocean Freight (all in one document)
      </div>
      <div className="text-xs text-[#faf9f6] opacity-80">
        Freights as per 20STD - others also included for Quick Quotes
      </div>
    </div>

    {/* Container Type Selector */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      {['20STD', '40STD', '40HC'].map(containerType => (
        <button
          key={containerType}
          className="bg-[#2a2a2a] hover:bg-[#333] border-4 border-black p-3 text-[#faf9f6] font-bold transition-all shadow-[-4px_2px_8px_rgba(0,0,0,0.4)]"
        >
          {containerType}
        </button>
      ))}
    </div>

    {/* Scrollable Offers Container */}
    <div className="bg-[#2a2a2a] border-4 border-black shadow-[-4px_2px_8px_rgba(0,0,0,0.4)] max-h-96 overflow-y-auto">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-[#1e3a8a] border-b-4 border-black sticky top-0 z-10">
        <div className="col-span-1 text-[#faf9f6] font-bold text-sm">SELECT</div>
        <div className="col-span-3 text-[#faf9f6] font-bold text-sm">CARRIER & SERVICE</div>
        <div className="col-span-2 text-[#faf9f6] font-bold text-sm">PRICE/CONTAINER</div>
        <div className="col-span-2 text-[#faf9f6] font-bold text-sm">TRANSIT TIME</div>
        <div className="col-span-2 text-[#faf9f6] font-bold text-sm">DEPARTURE</div>
        <div className="col-span-2 text-[#faf9f6] font-bold text-sm">ARRIVAL</div>
      </div>

      {/* Table Rows - Multiple offers for scrolling */}
      {[...offers, ...offers, ...offers].map((o, index) => {
        const selectionKey = `${o.id}-${index}`;
        const isSelected = selectedOffer && selectedOffer.id === o.id && selectedOffer.selectionKey === selectionKey;
        
        return (
        <div key={selectionKey}>
          <div
            onClick={() => setSelectedOffer({...o, selectionKey})}
            className={`grid grid-cols-12 gap-4 p-4 cursor-pointer transition-all border-b-2 border-[#373737] hover:bg-[#333] ${
              isSelected
                ? 'bg-[#1e3a8a] shadow-[inset_0_0_20px_12px_rgba(255,179,67,0.2)]'
                : 'bg-[#2a2a2a]'
            }`}
          >
            {/* Select Radio */}
            <div className="col-span-1 flex items-center">
              <div className={`w-5 h-5 rounded-full border-3 border-[#FFB343] flex items-center justify-center ${
                isSelected ? 'bg-[#FFB343]' : 'bg-transparent'
              }`}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                )}
              </div>
            </div>

            {/* Carrier & Service */}
            <div className="col-span-3">
              <div className="text-[#FFB343] font-bold text-lg mb-1">{o.carrier}</div>
              <div className="bg-[#0A5B61] text-[#faf9f6] px-2 py-1 text-xs font-bold border-2 border-black inline-block mb-2">
                {o.service}
              </div>
              <div className="text-[#faf9f6] text-sm">{o.vesselName}</div>
            </div>

            {/* Price */}
            <div className="col-span-2">
              <div className="text-[#FFB343] font-bold text-xl">USD {o.price}</div>
              <div className="text-[#faf9f6] text-xs">/Container</div>
            </div>

            {/* Transit Time */}
            <div className="col-span-2 flex items-center">
              <div className="text-[#faf9f6] font-bold">{o.transitTime}</div>
            </div>

            {/* Departure */}
            <div className="col-span-2 flex items-center">
              <div className="text-[#faf9f6]">{o.departure}</div>
            </div>

            {/* Arrival */}
            <div className="col-span-2 flex items-center">
              <div className="text-[#faf9f6]">{o.arrival}</div>
            </div>
          </div>

          {/* Action Buttons Row - Only show for selected offer */}
          {isSelected && (
            <div className="bg-[#1e3a8a] p-4 border-b-4 border-black">
              <div className="flex gap-4 mb-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal('breakdown');
                  }}
                  className="bg-[#FFB343] text-black px-4 py-2 font-bold border-2 border-black shadow-[-2px_1px_4px_rgba(0,0,0,0.4)] hover:bg-[#e6a139] transition-all flex items-center gap-2"
                >
                  <Calculator size={16} /> Price Breakdown
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal('remarks');
                  }}
                  className="bg-[#0A5B61] text-[#faf9f6] px-4 py-2 font-bold border-2 border-black shadow-[-2px_1px_4px_rgba(0,0,0,0.4)] hover:bg-[#085055] transition-all flex items-center gap-2"
                >
                  <Info size={16} /> Remarks
                </button>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {o.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#faf9f6]">
                    <CheckCircle size={14} className="text-[#FFB343]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )
      })}
    </div>

    {/* Continue Button */}
    {selectedOffer && (
      <div className="mt-6 flex justify-end">
        <button className="bg-[#FFB343] text-black px-8 py-3 font-bold border-4 border-black shadow-[-4px_2px_8px_rgba(0,0,0,0.4)] hover:bg-[#e6a139] transition-all">
          SELECT & CONTINUE
        </button>
      </div>
    )}

    {/* Modal Popup */}
    {showModal && (
      <div className="fixed inset-0 bg-transparent bg-backdrop-blur bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
        <div className="bg-[#faf9f6] w-4/5 max-w-4xl max-h-[80vh] overflow-hidden border-4 border-black shadow-[-8px_4px_16px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex border-b-4 border-black">
            <button
              onClick={() => setShowModal('breakdown')}
              className={`flex-1 px-6 py-4 font-bold border-r-4 border-black transition-all ${
                showModal === 'breakdown' 
                  ? 'bg-[#FFB343] text-black' 
                  : 'bg-[#2a2a2a] text-[#faf9f6] hover:bg-[#333]'
              }`}
            >
              Price Breakdown
            </button>
            <button
              onClick={() => setShowModal('remarks')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                showModal === 'remarks' 
                  ? 'bg-[#FFB343] text-black' 
                  : 'bg-[#2a2a2a] text-[#faf9f6] hover:bg-[#333]'
              }`}
            >
              Remarks and Info
            </button>
            <button
              onClick={() => setShowModal(null)}
              className="px-4 py-4 bg-[#2a2a2a] text-[#faf9f6] hover:bg-[#333] transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {showModal === 'breakdown' && (
              <div>
                <h3 className="text-2xl font-bold text-black mb-6">Total Price Estimate</h3>
                
                {/* Estimated Total */}
                <div className="bg-[#2a2a2a] border-4 border-black p-4 mb-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="text-[#faf9f6] font-bold">Container Type</div>
                    <div className="text-[#FFB343] font-bold">20STD</div>
                    <div className="text-[#FFB343] font-bold">40STD</div>
                    <div className="text-[#FFB343] font-bold">40HC</div>
                    <div className="text-[#faf9f6]">Estimated Total per Container</div>
                    <div className="text-[#FFB343] font-bold text-lg">USD 6213</div>
                    <div className="text-[#FFB343] font-bold text-lg">USD 9554</div>
                    <div className="text-[#FFB343] font-bold text-lg">USD 9554</div>
                  </div>
                </div>

                {/* Freight Charges */}
                <h4 className="text-xl font-bold text-black mb-4">Freight Charges</h4>
                <div className="bg-[#1e3a8a] border-4 border-black p-4 mb-6">
                  <div className="grid grid-cols-4 gap-4 text-center text-[#faf9f6]">
                    <div className="font-bold">Ocean Freight</div>
                    <div>USD 2832</div>
                    <div>USD 5068</div>
                    <div>USD 5068</div>
                  </div>
                </div>

                {/* Surcharges */}
                <h4 className="text-xl font-bold text-black mb-4">Export Surcharges</h4>
                <div className="bg-[#0A5B61] border-4 border-black p-4 mb-4">
                  <div className="grid grid-cols-4 gap-4 text-center text-[#faf9f6] text-sm">
                    <div className="font-bold">Fuel Surcharge Origin Land</div>
                    <div>AUD 225</div>
                    <div>AUD 307</div>
                    <div>AUD 307</div>
                    <div className="font-bold">Origin Landfreight Rail</div>
                    <div>AUD 805</div>
                    <div>AUD 1095</div>
                    <div>AUD 1095</div>
                    <div className="font-bold">Terminal Handling Charge</div>
                    <div>AUD 584</div>
                    <div>AUD 796</div>
                    <div>AUD 796</div>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-black mb-4">Import Surcharges</h4>
                <div className="bg-[#373737] border-4 border-black p-4">
                  <div className="grid grid-cols-4 gap-4 text-center text-[#faf9f6] text-sm">
                    <div className="font-bold">Fuel Destination Inland</div>
                    <div>USD 138</div>
                    <div>USD 138</div>
                    <div>USD 138</div>
                    <div className="font-bold">Terminal Handling Charge Dest.</div>
                    <div>USD 500</div>
                    <div>USD 650</div>
                    <div>USD 650</div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-black opacity-80">
                  Exchange rate as of 6 Jun 2025. Actual exchange rates may vary at time of purchase.
                </div>
              </div>
            )}

            {showModal === 'remarks' && (
              <div>
                <h3 className="text-2xl font-bold text-black mb-6">Remarks</h3>
                
                <div className="bg-[#2a2a2a] border-4 border-black p-6 mb-6">
                  <p className="text-[#faf9f6] mb-4">
                    Future Marine Fuel Recovery (MFR) surcharge adjustments may not be considered in above offer. 
                    You can find all global MFR values and validity at <span className="text-[#FFB343] underline cursor-pointer">Marine Fuel Recovery Surcharge (MFR)</span>.
                  </p>
                  <p className="text-[#faf9f6]">
                    To get more information check <span className="text-[#FFB343] underline cursor-pointer">Quick Quotes Terms and Conditions</span>.
                  </p>
                </div>

                <h4 className="text-xl font-bold text-black mb-4">Relevant Links</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['FAK Definition', 'Local Charges', 'Detention & Demurrage', 'Country Specific Remarks'].map(link => (
                    <div key={link} className="bg-[#FFB343] border-4 border-black p-3 text-black font-bold hover:bg-[#e6a139] cursor-pointer transition-all">
                      {link}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t-4 border-black p-4 bg-[#f0f0f0] flex justify-end">
            <button 
              onClick={() => setShowModal(null)}
              className="bg-[#2a2a2a] text-[#faf9f6] px-6 py-2 font-bold border-4 border-black shadow-[-4px_2px_8px_rgba(0,0,0,0.4)] hover:bg-[#333] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* Step 3: Additional Services */}
        {currentStep === 3 && (
          <div className={sectionStyle}>
            <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
              <Shield size={24} /> ADDITIONAL SERVICES
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {additionalServices.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedServices(prev =>
                      prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                    );
                  }}
                  className={`border-4 p-4 cursor-pointer transition-all ${
                    selectedServices.includes(s.id)
                      ? 'bg-[#1e3a8a] shadow-[inset_0_0_20px_12px_rgba(255,179,67,0.2)]'
                      : 'bg-[#2a2a2a] hover:bg-[#333] shadow-[-4px_2px_8px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="text-lg font-bold text-[#FFB343]">{s.name}</h3>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#FFB343]">{s.price}</div>
                      {selectedServices.includes(s.id) && <CheckCircle className="text-[#FFB343]" size={20}/>}
                    </div>
                  </div>
                  <p className="text-[#faf9f6] text-sm">{s.description}</p>
                </div>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-6 bg-[#1e3a8a] border-4 p-4 shadow-[inset_0_0_10px_6px_rgba(0,0,0,0.4)]">
                <h3 className="text-[#FFB343] font-bold mb-2">SELECTED SERVICES:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map(id => {
                    const svc = additionalServices.find(s => s.id === id);
                    return svc ? (
                      <span key={id} className="bg-[#FFB343] text-[#1c1c1c] px-3 py-1 text-sm font-bold border-2 border-black">
                        {svc.name} – {svc.price}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (() => {
          const servicesTotal = selectedServices.reduce((sum, id) => {
            const svc = additionalServices.find(s => s.id === id);
            return svc ? sum + parseInt(svc.price.replace('$',''), 10) : sum;
          }, 0);
          const base = selectedOffer ? parseInt(selectedOffer.price.replace(/[^0-9]/g,''), 10) : 0;
          const totalPrice = base + servicesTotal;
          return (
            <div className={sectionStyle}>
              <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
                <FileText size={24} /> REVIEW & NEXT STEPS
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#2a2a2a] border-4 p-4 shadow-[-4px_2px_8px_rgba(0,0,0,0.4)]">
                  <h3 className="text-lg font-bold text-[#FFB343] mb-4 flex items-center gap-2">
                    <Package size={20} /> SHIPMENT DETAILS
                  </h3>
                  <div className="space-y-2 text-[#faf9f6] text-sm">
                    <div><strong>Route:</strong> {formData.startLocation} → {formData.endLocation}</div>
                    <div><strong>Container:</strong> {formData.containerQuantity}× {formData.containerType}</div>
                    <div><strong>Weight:</strong> {formData.weightPerContainer} {formData.weightUnit}</div>
                    <div><strong>Commodity:</strong> {formData.commodity}</div>
                    <div><strong>Valid From:</strong> {formData.validFrom}</div>
                    <div><strong>Pickup:</strong> {formData.pickupType}</div>
                    <div><strong>Delivery:</strong> {formData.deliveryType}</div>
                  </div>
                </div>
                {selectedOffer && (
                  <div className="bg-[#2a2a2a] border-4 p-4 shadow-[-4px_2px_8px_rgba(0,0,0,0.4)]">
                    <h3 className="text-lg font-bold text-[#FFB343] mb-4 flex items-center gap-2">
                      <Ship size={20} /> SELECTED CARRIER
                    </h3>
                    <div className="space-y-2 text-[#faf9f6] text-sm">
                      <div><strong>Carrier:</strong> {selectedOffer.carrier}</div>
                      <div><strong>Service:</strong> {selectedOffer.service}</div>
                      <div><strong>Vessel:</strong> {selectedOffer.vesselName}</div>
                      <div><strong>Transit Time:</strong> {selectedOffer.transitTime}</div>
                      <div><strong>Departure:</strong> {selectedOffer.departure}</div>
                      <div><strong>Arrival:</strong> {selectedOffer.arrival}</div>
                      <div className="text-lg font-bold text-[#FFB343]">Base Price: {selectedOffer.price}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-[#1e3a8a] border-4 p-6 mb-6 shadow-[inset_0_0_10px_6px_rgba(0,0,0,0.4)]">
                <h3 className="text-xl font-bold text-[#FFB343] mb-4 flex items-center gap-2">
                  <DollarSign size={24} /> PRICE BREAKDOWN
                </h3>
                <div className="space-y-3 text-[#faf9f6]">
                  {selectedOffer && (
                    <div className="flex justify-between font-bold">
                      <span>Base Shipping ({selectedOffer.service})</span>
                      <span>{selectedOffer.price}</span>
                    </div>
                  )}
                  {selectedServices.length > 0 && (
                    <>
                      <div className="text-[#FFB343] font-bold mt-4 mb-2">Additional Services:</div>
                      {selectedServices.map(id => {
                        const svc = additionalServices.find(s => s.id === id);
                        return svc ? (
                          <div key={id} className="flex justify-between pl-4">
                            <span>• {svc.name}</span>
                            <span>{svc.price}</span>
                          </div>
                        ) : null;
                      })}
                    </>
                  )}
                  <div className="border-t-2 border-[#FFB343] pt-3 mt-4">
                    <div className="flex justify-between text-xl font-bold text-[#FFB343]">
                      <span>TOTAL PRICE:</span>
                      <span>${totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] border-4 p-6 shadow-[-4px_2px_8px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-bold text-[#FFB343] mb-4 flex items-center gap-2">
                  <ArrowRight size={20} /> NEXT STEPS
                </h3>
                <div className="space-y-4 text-[#faf9f6]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FFB343] text-[#1c1c1c] rounded-full flex items-center justify-center font-bold border-2 border-black">1</div>
                    <span>Send quote request to carrier</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#555] text-[#faf9f6] rounded-full flex items-center justify-center font-bold border-2 border-black">2</div>
                    <span>Receive official quote via email</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#555] text-[#faf9f6] rounded-full flex items-center justify-center font-bold border-2 border-black">3</div>
                    <span>Book your shipment</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button className={`${buttonStyle} flex items-center gap-2`}>
                    <Send size={20} /> SEND QUOTE REQUEST
                  </button>
                  <button className={`${buttonStyle} flex items-center gap-2`}>
                    <Download size={20} /> DOWNLOAD QUOTE
                  </button>
                  <button className={`${buttonStyle} flex items-center gap-2`}>
                    <Mail size={20} /> EMAIL QUOTE
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Navigation Controls */}
        <div className="flex justify-between mt-8 ">
          <button onClick={prevStep} disabled={currentStep === 1} className="bg-white font-bold rounded-xl px-4 py-2">
            <ArrowLeft size={20} /> PREVIOUS
          </button>
          {currentStep < 4 ? (
             <button
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className={`bg-white rounded-xl font-bold px-4 py-2 flex flex-col justify-between`}
                style={{ height: '100%' }} // ensure full height so justify-between works
                >
                {/* Top: NEXT text */}
                <span className="self-center">NEXT</span>
                {/* Bottom-right: arrow */}
                <ArrowRight size={20} className="self-end" />
            </button>
          ) : (
            <button onClick={() => alert('Quote request submitted successfully!')} className="bg-white font-bold rounded-xl px-4 py-2">
              <CheckCircle size={20} /> SUBMIT QUOTE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewQuoteComponent;
