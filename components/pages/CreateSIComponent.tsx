    "use client";

    import React, { useState } from 'react';
    import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    FileText,
    Info,
    Ship,
    Container as ContainerIcon,
    Package,
    DollarSign,
    MessageSquare,
    Plus,
    Copy,
    Trash2,
    X
    } from 'lucide-react';

    type NotifyAddress = { address: string; taxId: string };
    
    type CargoItem = {
        id: number;
        numberOfPackages: string;
        kindOfPackages: string;
        printKindOfPackages: string;
        hsCode: string;
        marksAndNumbers: string;
        description: string;
        };

        type SIContainer = {
        id: number;
        containerNo: string;
        sealNo1: string;
        sealNo2: string;
        sealNo3: string;
        individualDescriptions: boolean;
        cargoItems: CargoItem[];
        };

    // Utilities
    function clsx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter((c): c is string => Boolean(c)).join(" ");
}

    const cardGradient = {
    backgroundImage: `
        linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
        linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
    `,
    backgroundBlendMode: "overlay",
    };

    export const CreateSIComponent = () => {
    const [currentStep, setCurrentStep] = useState(0);
    

    // Step 1 - Addresses & References
    const [shipperInfo, setShipperInfo] = useState("");
    const [shipperTaxId, setShipperTaxId] = useState("");
    const [consigneeInfo, setConsigneeInfo] = useState("");
    const [consigneeTaxId, setConsigneeTaxId] = useState("");
    const [notifyAddress, setNotifyAddress] = useState("");
    const [notifyTaxId, setNotifyTaxId] = useState("");
    const [bookingNumber, setBookingNumber] = useState("66845761");
    const [shippersReference, setShippersReference] = useState("");
    const [freightForwardersRef, setFreightForwardersRef] = useState("");
    const [forwardingAgent, setForwardingAgent] = useState("");
    const [forwardingAgentTaxId, setForwardingAgentTaxId] = useState("");
    const [consigneeReference, setConsigneeReference] = useState("");
    const [placeOfReceipt, setPlaceOfReceipt] = useState("");
    const [placeOfDelivery, setPlaceOfDelivery] = useState("");
    const [vessel, setVessel] = useState("M.V. FLORA V");
    const [voyageNo, setVoyageNo] = useState("QBE 24E14");
    const [portOfLoading, setPortOfLoading] = useState("WILHELMSHAVEN");
    const [portOfDischarge, setPortOfDischarge] = useState("SINGAPORE");
    const [toOrder, setToOrder] = useState(false);
    const [additionalNotifyAddresses, setAdditionalNotifyAddresses] =
  useState<NotifyAddress[]>([]);

    

    // Step 2 - Containers and Cargo
    const [sameDescriptionForAll, setSameDescriptionForAll] = useState(false);
    const [containers, setContainers] = useState<SIContainer[]>([
  {
    id: 1,
    containerNo: "",
    sealNo1: "",
    sealNo2: "",
    sealNo3: "",
    individualDescriptions: true,
    cargoItems: [
      {
        id: 1,
        numberOfPackages: "",
        kindOfPackages: "",
        printKindOfPackages: "",
        hsCode: "870800",
        marksAndNumbers: "",
        description: "AUTOMOTIVE PARTS",
      },
    ],
  },
]);

    // Step 3 - Freight
    const [chargesTo, setChargesTo] = useState("prepaid");
    const [originPortCharge, setOriginPortCharge] = useState("prepaid");
    const [seaFreight, setSeaFreight] = useState("prepaid");
    const [destinationPortCharge, setDestinationPortCharge] = useState("prepaid");

    // Step 4 - Document Issuance
    const [freightedOriginalBLs, setFreightedOriginalBLs] = useState("3");
    const [freightedCopies, setFreightedCopies] = useState("5");
    const [unfreightedOriginalBLs, setUnfreightedOriginalBLs] = useState("0");
    const [unfreightedCopies, setUnfreightedCopies] = useState("0");
    const [freightPayableAt, setFreightPayableAt] = useState("Origin");
    const [documentType, setDocumentType] = useState("Original");
    const [invoiceReference, setInvoiceReference] = useState("");

    // Step 5 - Comments
    const [generalComment, setGeneralComment] = useState("");

    // Step 6 - Confirmation
    const [acceptTerms, setAcceptTerms] = useState(false);
    

    const next = () => setCurrentStep(s => Math.min(s + 1, 5));
    const prev = () => setCurrentStep(s => Math.max(s - 1, 0));

    const addContainer = () => {
        const newContainer = {
        id: containers.length + 1,
        containerNo: "",
        sealNo1: "",
        sealNo2: "",
        sealNo3: "",
        individualDescriptions: true,
        cargoItems: [
            {
            id: 1,
            numberOfPackages: "",
            kindOfPackages: "",
            printKindOfPackages: "",
            hsCode: "",
            marksAndNumbers: "",
            description: ""
            }
        ]
        };
        setContainers([...containers, newContainer]);
    };

   const addCargoItem = (containerId: number): void => {
  setContainers(prev =>
    prev.map(container => {
      if (container.id === containerId) {
        const newItem: CargoItem = {
          id: container.cargoItems.length + 1,
          numberOfPackages: "",
          kindOfPackages: "",
          printKindOfPackages: "",
          hsCode: "",
          marksAndNumbers: "",
          description: "",
        };
        return { ...container, cargoItems: [...container.cargoItems, newItem] };
      }
      return container;
    })
  );
};

    const addNotifyAddress = () => {
        setAdditionalNotifyAddresses([...additionalNotifyAddresses, { address: "", taxId: "" }]);
    };

    const inputStyle = "w-full bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] placeholder:font-light transition-shadow border-2 border-[#22D3EE] px-4 py-3 font-bold";
    const textareaStyle = "w-full bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] placeholder:font-light transition-shadow border-2 border-[#22D3EE] px-4 py-3 font-bold resize-none";
    const selectStyle = "w-full bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-2 border-[#22D3EE] px-4 py-3 font-bold";
    const buttonStyle = "bg-[#0A1A2F] rounded-xl hover:bg-[#1A2A4A] hover:text-[#00FFFF] text-[#faf9f6] px-6 py-3 font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all border-2 border-[#22D3EE]";
    const primaryButtonStyle = "bg-[#00FFFF] text-black px-8 py-3 rounded-xl font-bold shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all border-2 border-black hover:bg-[#22D3EE]";
    const sectionStyle = "max-w-[1600px] rounded-2xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-4 border-white";
    const navButtonStyle = "bg-white rounded-xl px-6 py-3 font-bold hover:bg-gray-300 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] border-2 border-black text-black";

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-10 font-bold text-[#faf9f6]">
        {/* Header */}
        <div className="flex items-center justify-center mb-12">
            <div className="inline-flex items-center space-x-4 text-3xl bg-[#0A1A2F] border-4 border-white rounded-2xl p-6 shadow-[20px_20px_0px_rgba(0,0,0,1)]" style={cardGradient}>
            <FileText size={40} className="text-[#00FFFF]" />
            <span className="text-[#faf9f6] font-bold uppercase tracking-wide">SHIPPING INSTRUCTION</span>
            </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between bg-[#0F1B2A] border-4 border-white rounded-2xl px-8 py-6 mb-16 shadow-[20px_20px_0px_rgba(0,0,0,1)]">
            {[
            "ADDRESSES & REFERENCES",
            "CONTAINERS & CARGO",
            "FREIGHT",
            "DOCUMENT ISSUANCE",
            "COMMENTS",
            "CONFIRMATION"
            ].map((label, idx) => (
            <React.Fragment key={label}>
                <div className="flex items-center gap-3">
                <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)]",
                    currentStep >= idx ? 'bg-[#00FFFF] text-black border-black' : 'bg-[#0F1B2A] text-[#faf9f6] border-[#22D3EE]'
                )}>
                    {idx + 1}
                </div>
                <span className={clsx(
                    "font-bold text-sm uppercase tracking-wide",
                    currentStep >= idx ? 'text-[#00FFFF]' : 'text-[#faf9f6]'
                )}>
                    {label}
                </span>
                </div>
                {idx < 5 && <div className="flex-1 h-1 bg-[#22D3EE] mx-6 shadow-[0px_2px_0px_rgba(0,0,0,1)]" />}
            </React.Fragment>
            ))}
        </div>

        {/* Content */}
        <div className={sectionStyle} style={cardGradient}>
            {/* Step 0 - Addresses & References */}
            {currentStep === 0 && (
            <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                <Info size={28} />
                ADDRESSES & REFERENCES
                </h2>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Shipper</label>
                    <textarea
                        value={shipperInfo}
                        onChange={e => setShipperInfo(e.target.value)}
                        rows={4}
                        className={textareaStyle}
                        placeholder="Shipper Information"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">TAX ID for Shipper (optional)</label>
                    <input
                        type="text"
                        value={shipperTaxId}
                        onChange={e => setShipperTaxId(e.target.value)}
                        className={inputStyle}
                        placeholder="Tax ID"
                    />
                    </div>

                    <div className="flex items-center space-x-3 mb-4">
                    <input
                        type="checkbox"
                        checked={toOrder}
                        onChange={e => setToOrder(e.target.checked)}
                        className="w-6 h-6 accent-[#00FFFF] bg-[#0A1A2F] border-2 border-[#22D3EE] rounded"
                    />
                    <span className="text-[#faf9f6] font-bold">To Order</span>
                    <Info size={16} className="text-[#00FFFF]" />
                    <span className="text-[#faf9f6] font-bold text-sm">Consignee not yet specified</span>
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Consignee</label>
                    <textarea
                        value={consigneeInfo}
                        onChange={e => setConsigneeInfo(e.target.value)}
                        rows={4}
                        className={textareaStyle}
                        placeholder="Consignee Information"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">TAX ID for Consignee (optional)</label>
                    <input
                        type="text"
                        value={consigneeTaxId}
                        onChange={e => setConsigneeTaxId(e.target.value)}
                        className={inputStyle}
                        placeholder="Tax ID"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Notify Address (optional)</label>
                    <textarea
                        value={notifyAddress}
                        onChange={e => setNotifyAddress(e.target.value)}
                        rows={4}
                        className={textareaStyle}
                        placeholder="Notify Address"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">TAX ID for Notify (optional)</label>
                    <input
                        type="text"
                        value={notifyTaxId}
                        onChange={e => setNotifyTaxId(e.target.value)}
                        className={inputStyle}
                        placeholder="Tax ID"
                    />
                    </div>

                    <button
                    onClick={addNotifyAddress}
                    className={buttonStyle}
                    >
                    <Plus size={16} className="inline mr-2" />
                    Add additional Notify Address
                    </button>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Booking Number</label>
                    <input
                        type="text"
                        value={bookingNumber}
                        onChange={e => setBookingNumber(e.target.value)}
                        className={inputStyle}
                        placeholder="Booking Number"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Shippers Reference (optional)</label>
                    <input
                        type="text"
                        value={shippersReference}
                        onChange={e => setShippersReference(e.target.value)}
                        className={inputStyle}
                        placeholder="Shippers Reference"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Freight Forwarders Reference (optional)</label>
                    <input
                        type="text"
                        value={freightForwardersRef}
                        onChange={e => setFreightForwardersRef(e.target.value)}
                        className={inputStyle}
                        placeholder="Freight Forwarders Reference"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Forwarding Agent (optional)</label>
                    <textarea
                        value={forwardingAgent}
                        onChange={e => setForwardingAgent(e.target.value)}
                        rows={4}
                        className={textareaStyle}
                        placeholder="Forwarding Agent"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">TAX ID for Forwarding Agent (optional)</label>
                    <input
                        type="text"
                        value={forwardingAgentTaxId}
                        onChange={e => setForwardingAgentTaxId(e.target.value)}
                        className={inputStyle}
                        placeholder="Tax ID"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Consignee's Reference (optional)</label>
                    <input
                        type="text"
                        value={consigneeReference}
                        onChange={e => setConsigneeReference(e.target.value)}
                        className={inputStyle}
                        placeholder="Consignee's Reference"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Place of Receipt</label>
                    <textarea
                        value={placeOfReceipt}
                        onChange={e => setPlaceOfReceipt(e.target.value)}
                        rows={4}
                        className={textareaStyle}
                        placeholder="Place of Receipt"
                    />
                    </div>

                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Place of Delivery</label>
                    <textarea
                        value={placeOfDelivery}
                        onChange={e => setPlaceOfDelivery(e.target.value)}
                        rows={4}
                        className={textareaStyle}
                        placeholder="Place of Delivery"
                    />
                    </div>
                </div>
                </div>

                {/* Vessel Information */}
                <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] mb-8">
                <h3 className="text-xl font-bold text-[#00FFFF] mb-6 uppercase tracking-wide">Vessel Information</h3>
                <div className="grid md:grid-cols-4 gap-6">
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Vessel(s)</label>
                    <input
                        type="text"
                        value={vessel}
                        onChange={e => setVessel(e.target.value)}
                        className={inputStyle}
                        placeholder="Vessel Name"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Voyage No.</label>
                    <input
                        type="text"
                        value={voyageNo}
                        onChange={e => setVoyageNo(e.target.value)}
                        className={inputStyle}
                        placeholder="Voyage Number"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Port of Loading</label>
                    <input
                        type="text"
                        value={portOfLoading}
                        onChange={e => setPortOfLoading(e.target.value)}
                        className={inputStyle}
                        placeholder="Port of Loading"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Port of Discharge</label>
                    <input
                        type="text"
                        value={portOfDischarge}
                        onChange={e => setPortOfDischarge(e.target.value)}
                        className={inputStyle}
                        placeholder="Port of Discharge"
                    />
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Step 1 - Containers and Cargo */}
            {currentStep === 1 && (
            <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                <ContainerIcon size={28} />
                CONTAINERS AND CARGO
                </h2>

                <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                    <input
                    type="checkbox"
                    checked={sameDescriptionForAll}
                    onChange={e => setSameDescriptionForAll(e.target.checked)}
                    className="w-6 h-6 accent-[#00FFFF] bg-[#0A1A2F] border-2 border-[#22D3EE] rounded"
                    />
                    <span className="text-[#faf9f6] font-bold">Same description for whole SI</span>
                </div>

                {containers.map((container, containerIndex) => (
                    <div key={container.id} className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[#00FFFF] uppercase tracking-wide">
                        Container and Cargo for {container.id}
                        </h3>
                        <button className={buttonStyle}>
                        <Copy size={16} className="inline mr-2" />
                        Duplicate
                        </button>
                    </div>

                    {/* Container Details */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div>
                        <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Container No.</label>
                        <input
                            type="text"
                            value={container.containerNo}
                            onChange={e => {
                            const updatedContainers = [...containers];
                            updatedContainers[containerIndex].containerNo = e.target.value;
                            setContainers(updatedContainers);
                            }}
                            className={inputStyle}
                            placeholder="e.g. HLCU 1234567"
                        />
                        </div>
                        <div>
                        <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Seal No. (optional)</label>
                        <input
                            type="text"
                            value={container.sealNo1}
                            onChange={e => {
                            const updatedContainers = [...containers];
                            updatedContainers[containerIndex].sealNo1 = e.target.value;
                            setContainers(updatedContainers);
                            }}
                            className={inputStyle}
                            placeholder="Seal Number"
                        />
                        </div>
                        <div>
                        <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Seal No. (optional)</label>
                        <input
                            type="text"
                            value={container.sealNo2}
                            onChange={e => {
                            const updatedContainers = [...containers];
                            updatedContainers[containerIndex].sealNo2 = e.target.value;
                            setContainers(updatedContainers);
                            }}
                            className={inputStyle}
                            placeholder="Seal Number"
                        />
                        </div>
                        <div>
                        <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Seal No. (optional)</label>
                        <input
                            type="text"
                            value={container.sealNo3}
                            onChange={e => {
                            const updatedContainers = [...containers];
                            updatedContainers[containerIndex].sealNo3 = e.target.value;
                            setContainers(updatedContainers);
                            }}
                            className={inputStyle}
                            placeholder="Seal Number"
                        />
                        </div>
                    </div>

                    {/* Cargo Description Options */}
                    <div className="mb-8">
                        <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                            <input
                            type="radio"
                            checked={container.individualDescriptions}
                            onChange={() => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].individualDescriptions = true;
                                setContainers(updatedContainers);
                            }}
                            className="w-5 h-5 accent-[#00FFFF]"
                            />
                            <span className="text-orange-400">Individual Descriptions for the Cargo Items of such Container</span>
                        </label>
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                            <input
                            type="radio"
                            checked={!container.individualDescriptions}
                            onChange={() => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].individualDescriptions = false;
                                setContainers(updatedContainers);
                            }}
                            className="w-5 h-5 accent-[#00FFFF]"
                            />
                            <span>Same Description for the whole Container (Marks & Numbers and HS Code will be included)</span>
                        </label>
                        </div>
                    </div>

                    {/* Cargo Items */}
                    {container.cargoItems.map((cargoItem, cargoIndex) => (
                        <div key={cargoItem.id} className="bg-[#0A1A2F] border-2 border-[#22D3EE] rounded-xl p-6 mb-6">
                        <h4 className="text-lg font-bold text-[#00FFFF] mb-4 uppercase tracking-wide">
                            Cargo Item {cargoItem.id} of New Container {container.id}
                        </h4>

                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div>
                            <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">No. of</label>
                            <input
                                type="text"
                                value={cargoItem.numberOfPackages}
                                onChange={e => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].cargoItems[cargoIndex].numberOfPackages = e.target.value;
                                setContainers(updatedContainers);
                                }}
                                className={inputStyle}
                                placeholder="Number of packages"
                            />
                            </div>
                            <div>
                            <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Kind of Packages / UN Packing Code</label>
                            <input
                                type="text"
                                value={cargoItem.kindOfPackages}
                                onChange={e => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].cargoItems[cargoIndex].kindOfPackages = e.target.value;
                                setContainers(updatedContainers);
                                }}
                                className={inputStyle}
                                placeholder="Kind of packages"
                            />
                            </div>
                            <div>
                            <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Print the Kind of Packages on BL as</label>
                            <input
                                type="text"
                                value={cargoItem.printKindOfPackages}
                                onChange={e => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].cargoItems[cargoIndex].printKindOfPackages = e.target.value;
                                setContainers(updatedContainers);
                                }}
                                className={inputStyle}
                                placeholder="Package type as printed on BL"
                            />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">HS Code</label>
                            <div className="flex items-center gap-3">
                            <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-xl px-4 py-2 flex items-center gap-2">
                                <span className="text-[#faf9f6] font-bold">{cargoItem.hsCode}</span>
                                <span className="text-[#faf9f6] font-bold">• Parts and accessories</span>
                                <button className="text-[#00FFFF] hover:text-white transition-colors">
                                <X size={16} />
                                </button>
                            </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                            <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                                Marks & Nos (optional)
                                <Info size={16} className="inline ml-2" />
                            </label>
                            <textarea
                                value={cargoItem.marksAndNumbers}
                                onChange={e => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].cargoItems[cargoIndex].marksAndNumbers = e.target.value;
                                setContainers(updatedContainers);
                                }}
                                rows={4}
                                className={textareaStyle}
                                placeholder="Enter Marks and Numbers"
                            />
                            </div>
                            <div>
                            <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">
                                Description
                                <Info size={16} className="inline ml-2" />
                            </label>
                            <textarea
                                value={cargoItem.description}
                                onChange={e => {
                                const updatedContainers = [...containers];
                                updatedContainers[containerIndex].cargoItems[cargoIndex].description = e.target.value;
                                setContainers(updatedContainers);
                                }}
                                rows={4}
                                className={textareaStyle}
                                placeholder="AUTOMOTIVE PARTS"
                            />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                            onClick={() => addCargoItem(container.id)}
                            className={buttonStyle}
                            >
                            <Plus size={16} className="inline mr-2" />
                            Add Cargo Item
                            </button>
                            <button className={buttonStyle}>
                            <Copy size={16} className="inline mr-2" />
                            Duplicate Cargo Item
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                ))}

                <button
                    onClick={addContainer}
                    className={primaryButtonStyle}
                >
                    <Plus size={16} className="inline mr-2" />
                    Add Container
                </button>
                </div>
            </div>
            )}

            {/* Step 2 - Freight */}
            {currentStep === 2 && (
            <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                <DollarSign size={28} />
                FREIGHT
                </h2>

                <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-[#00FFFF] mb-6 uppercase tracking-wide">Set Charges to</h3>
                    <div className="flex gap-8">
                    <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                        type="radio"
                        checked={chargesTo === 'prepaid'}
                        onChange={() => setChargesTo('prepaid')}
                        className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span className="text-orange-400">All Prepaid</span>
                    </label>
                    <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                        type="radio"
                        checked={chargesTo === 'collect'}
                        onChange={() => setChargesTo('collect')}
                        className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span>All Collect</span>
                    </label>
                    <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                        type="radio"
                        checked={chargesTo === 'individually'}
                        onChange={() => setChargesTo('individually')}
                        className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span>Individually</span>
                    </label>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div>
                    <h4 className="text-lg font-bold text-[#00FFFF] mb-4 uppercase tracking-wide">Origin Port Charge</h4>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                            type="radio"
                            checked={originPortCharge === 'prepaid'}
                            onChange={() => setOriginPortCharge('prepaid')}
                            className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span className="text-orange-400">Prepaid</span>
                        </label>
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                            type="radio"
                            checked={originPortCharge === 'collect'}
                            onChange={() => setOriginPortCharge('collect')}
                            className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span>Collect</span>
                        </label>
                    </div>
                    </div>

                    <div>
                    <h4 className="text-lg font-bold text-[#00FFFF] mb-4 uppercase tracking-wide">Sea Freight</h4>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                            type="radio"
                            checked={seaFreight === 'prepaid'}
                            onChange={() => setSeaFreight('prepaid')}
                            className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span className="text-orange-400">Prepaid</span>
                        </label>
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                            type="radio"
                            checked={seaFreight === 'collect'}
                            onChange={() => setSeaFreight('collect')}
                            className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span>Collect</span>
                        </label>
                    </div>
                    </div>

                    <div>
                    <h4 className="text-lg font-bold text-[#00FFFF] mb-4 uppercase tracking-wide">Destination Port Charge</h4>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                            type="radio"
                            checked={destinationPortCharge === 'prepaid'}
                            onChange={() => setDestinationPortCharge('prepaid')}
                            className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span className="text-orange-400">Prepaid</span>
                        </label>
                        <label className="flex items-center gap-3 text-[#faf9f6] font-bold">
                        <input
                            type="radio"
                            checked={destinationPortCharge === 'collect'}
                            onChange={() => setDestinationPortCharge('collect')}
                            className="w-5 h-5 accent-[#00FFFF]"
                        />
                        <span>Collect</span>
                        </label>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Step 3 - Document Issuance */}
            {currentStep === 3 && (
            <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                <FileText size={28} />
                DOCUMENT ISSUANCE
                </h2>

                <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Number of Freighted Original BLs</label>
                    <input
                        type="text"
                        value={freightedOriginalBLs}
                        onChange={e => setFreightedOriginalBLs(e.target.value)}
                        className={inputStyle}
                        placeholder="3"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Number of Freighted Copies (optional)</label>
                    <input
                        type="text"
                        value={freightedCopies}
                        onChange={e => setFreightedCopies(e.target.value)}
                        className={inputStyle}
                        placeholder="5"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Number of Unfreighted Original BLs</label>
                    <input
                        type="text"
                        value={unfreightedOriginalBLs}
                        onChange={e => setUnfreightedOriginalBLs(e.target.value)}
                        className={inputStyle}
                        placeholder="0"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Number of Unfreighted Copies (optional)</label>
                    <input
                        type="text"
                        value={unfreightedCopies}
                        onChange={e => setUnfreightedCopies(e.target.value)}
                        className={inputStyle}
                        placeholder="0"
                    />
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Freight payable at</label>
                    <select
                        value={freightPayableAt}
                        onChange={e => setFreightPayableAt(e.target.value)}
                        className={selectStyle}
                    >
                        <option value="Origin">Origin</option>
                        <option value="Destination">Destination</option>
                    </select>
                    </div>
                    <div>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Document Type</label>
                    <select
                        value={documentType}
                        onChange={e => setDocumentType(e.target.value)}
                        className={selectStyle}
                    >
                        <option value="Original">Original</option>
                        <option value="Copy">Copy</option>
                    </select>
                    </div>
                </div>

                <div className="mt-8">
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">Invoice Reference (optional)</label>
                    <input
                    type="text"
                    value={invoiceReference}
                    onChange={e => setInvoiceReference(e.target.value)}
                    className={inputStyle}
                    placeholder="Invoice Reference"
                    />
                </div>
                </div>
            </div>
            )}

            {/* Step 4 - Comments */}
            {currentStep === 4 && (
            <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                <MessageSquare size={28} />
                COMMENTS
                </h2>

                <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#faf9f6] mb-4">Add a general comment if needed</h3>
                    <label className="block font-bold text-[#00FFFF] mb-2 text-sm uppercase tracking-wide">General comment (optional)</label>
                    <textarea
                    value={generalComment}
                    onChange={e => setGeneralComment(e.target.value)}
                    rows={8}
                    className={textareaStyle}
                    placeholder="Enter general comments here..."
                    />
                </div>
                </div>
            </div>
            )}

            {/* Step 5 - Confirmation */}
            {currentStep === 5 && (
            <div>
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-8 flex items-center gap-3">
                <CheckCircle size={28} />
                CONFIRMATION
                </h2>

                <div className="bg-[#1A2A4A] border-2 border-[#22D3EE] rounded-2xl p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start gap-4">
                    <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="w-6 h-6 mt-1 accent-[#00FFFF] bg-[#0A1A2F] border-2 border-[#22D3EE] rounded"
                    />
                    <div>
                    <span className="text-[#faf9f6] font-bold">I accept the </span>
                    <span className="text-orange-400 underline cursor-pointer font-bold">Terms and Conditions</span>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button
                    onClick={() => alert('Shipping Instruction Submitted!')}
                    disabled={!acceptTerms}
                    className={clsx(
                        primaryButtonStyle,
                        !acceptTerms && "opacity-50 cursor-not-allowed"
                    )}
                    >
                    <FileText size={24} className="inline mr-3" />
                    SUBMIT SHIPPING INSTRUCTION
                    </button>
                </div>
                </div>
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
            <ArrowLeft size={20} className="inline-block mr-2"/> 
            PREVIOUS
            </button>
            {currentStep < 5 && (
            <button 
                onClick={next} 
                className={navButtonStyle}
            >
                NEXT 
                <ArrowRight size={20} className="inline-block ml-2"/>
            </button>
            )}
        </div>
        </div>
    );
    };

    export default CreateSIComponent;