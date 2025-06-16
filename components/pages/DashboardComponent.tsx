"use client";
import React, { useState, useMemo } from "react";
import {
  Ship, Container, Clock, AlertTriangle, Thermometer, FileText, DollarSign, Bell, Activity, MapPin, TrendingUp,
  TrendingDown, CheckCircle, XCircle, Globe, Settings, User, CalendarCheck, ChevronLeft, ChevronRight, X, Search, List, Info
} from "lucide-react";

// TYPES
type KPI = { title: string; value: string | number; icon: React.ElementType; trend?: number; color?: string };
type ContainerStatusDatum = { name: string; value: number; color: string };
type RevenueDatum = { lane: string; amount: number };
type PerformanceDatum = { month: string; onTime: number };
type Vessel = { name: string; voyage: string; eta: string; port: string; status: "on-time" | "delayed" };
type ActivityItem = { type: string; message: string; time: string };
type Notification = { type: string; message: string; severity: "high" | "medium" | "low" };
type APIStatus = { dpWorld: string; temperature: string; erp: string; edi: string };
type ContainerEvent = {
  number: string;
  status: "in-port" | "in-transit" | "delivered" | "exception";
  lastEvent: string;
  eta: string;
  port: string;
  eventLog?: { time: string; desc: string }[];
  timeline?: { status: string; time: string }[];
};
type Invoice = {
  number: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  issued: string;
  due: string;
  log?: { date: string; info: string }[];
};

type MockData = {
  kpis: {
    totalShipments: number;
    upcomingETAs: number;
    demurrageAlerts: number;
    tempExcursions: number;
    openQuotations: number;
  };
  vessels: Vessel[];
  activities: ActivityItem[];
  notifications: Notification[];
  chartData: {
    containerStatus: ContainerStatusDatum[];
    revenue: RevenueDatum[];
    performance: PerformanceDatum[];
  };
  apiStatus: APIStatus;
};

const mockData: MockData = {
  kpis: {
    totalShipments: 1247,
    upcomingETAs: 23,
    demurrageAlerts: 8,
    tempExcursions: 3,
    openQuotations: 156,
  },
  vessels: [
    { name: "MSC GULSUN", voyage: "425W", eta: "2025-06-15 08:00", port: "Mumbai", status: "on-time" },
    { name: "EVER GIVEN", voyage: "321E", eta: "2025-06-16 14:30", port: "Chennai", status: "delayed" },
    { name: "CMA CGM MARCO POLO", voyage: "156N", eta: "2025-06-18 22:15", port: "Kolkata", status: "on-time" },
  ],
  activities: [
    { type: "booking", message: "New booking BKG-2025-001547 created", time: "2 mins ago" },
    { type: "container", message: "Container HLCU1234567 departed Mumbai", time: "15 mins ago" },
    { type: "invoice", message: "Invoice INV-2025-003421 issued", time: "1 hour ago" },
    { type: "message", message: "New customer message received", time: "2 hours ago" },
    { type: "update", message: "Container MSKU9876543 arrived at destination", time: "3 hours ago" },
  ],
  notifications: [
    { type: "temperature", message: "Reefer container TEMP1234567 temperature deviation", severity: "high" },
    { type: "customs", message: "Container CSTM9876543 on customs hold", severity: "medium" },
    { type: "demurrage", message: "Demurrage accruing for container DEMR1111111", severity: "high" },
    { type: "message", message: "Customer inquiry awaiting response", severity: "low" },
  ],
  chartData: {
    containerStatus: [
      { name: "In Transit", value: 45, color: "#22D3EE" },
      { name: "In Port", value: 30, color: "#7b22bf" },
      { name: "Delivered", value: 25, color: "#10B981" },
    ],
    revenue: [
      { lane: "Asia-Europe", amount: 850000 },
      { lane: "Trans-Pacific", amount: 720000 },
      { lane: "Asia-Middle East", amount: 420000 },
      { lane: "Intra-Asia", amount: 380000 },
    ],
    performance: [
      { month: "Jan", onTime: 92 },
      { month: "Feb", onTime: 89 },
      { month: "Mar", onTime: 94 },
      { month: "Apr", onTime: 91 },
      { month: "May", onTime: 96 },
    ],
  },
  apiStatus: {
    dpWorld: "online",
    temperature: "online",
    erp: "offline",
    edi: "online",
  },
};

const myContainers: ContainerEvent[] = [
  ...Array.from({ length: 16 }).map((_, i) => ({
    number: `MSKU${1000000 + i}`,
    status: (["in-transit", "in-port", "delivered", "exception"] as const)[i % 4],
    lastEvent: `Event #${i + 1} `,
    eta: `2025-06-${10 + i} 08:00`,
    port: ["Jebel Ali", "Mundra", "Nhava Sheva", "Chennai"][i % 4],
    eventLog: [
      { time: "2025-06-01 09:00", desc: "Gate in" },
      { time: "2025-06-03 12:00", desc: "Loaded on vessel" },
      { time: "2025-06-09 19:00", desc: "Vessel arrived" },
    ],
    timeline: [
      { status: "Gate in", time: "2025-06-01 09:00" },
      { status: "Loaded on vessel", time: "2025-06-03 12:00" },
      { status: "At port", time: "2025-06-09 19:00" },
    ],
  })),
];

const invoices: Invoice[] = [
  {
    number: "INV-2025-003421",
    customer: "Acme Foods",
    amount: 5200,
    status: "paid",
    issued: "2025-06-01",
    due: "2025-06-08",
    log: [
      { date: "2025-06-01", info: "Invoice issued" },
      { date: "2025-06-03", info: "Sent to customer" },
      { date: "2025-06-05", info: "Paid" },
    ],
  },
  {
    number: "INV-2025-003422",
    customer: "Blue Marine LLC",
    amount: 13800,
    status: "pending",
    issued: "2025-06-04",
    due: "2025-06-14",
    log: [
      { date: "2025-06-04", info: "Invoice issued" },
      { date: "2025-06-06", info: "Sent to customer" },
    ],
  },
  {
    number: "INV-2025-003423",
    customer: "Greenline Impex",
    amount: 9700,
    status: "overdue",
    issued: "2025-05-25",
    due: "2025-06-01",
    log: [
      { date: "2025-05-25", info: "Invoice issued" },
      { date: "2025-06-01", info: "Due date passed" },
    ],
  },
  ...Array.from({ length: 7 }).map((_, i) => ({
    number: `INV-2025-0034${24 + i}`,
    customer: `Customer ${i + 1}`,
    amount: 1000 * (i + 1),
    status: (["paid", "pending", "overdue"] as const)[i % 3],
    issued: "2025-06-02",
    due: "2025-06-10",
    log: [{ date: "2025-06-02", info: "Invoice issued" }],
  })),
];

// STATUS BADGE
const statusBadge = (status: ContainerEvent["status"]) => {
  switch (status) {
    case "in-port":
      return "bg-[#7b22bf] text-white";
    case "in-transit":
      return "bg-[#22D3EE] text-black";
    case "delivered":
      return "bg-[#10B981] text-white";
    case "exception":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-400 text-black";
  }
};

const invoiceBadge = (status: Invoice["status"]) => {
  switch (status) {
    case "paid":
      return "bg-green-600 text-white";
    case "overdue":
      return "bg-red-600 text-white";
    default:
      return "bg-[#7b22bf] text-white";
  }
};

// KPI CARDS
const KPICard: React.FC<KPI & { onClick?: () => void }> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "text-white",
  onClick,
}) => (
  <div
    className="bg-[#1A2A4A] border-white border-2 rounded-xl p-4   flex items-stretch cursor-pointer w-full"
  
     style={{
      backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
      backgroundBlendMode: 'overlay',
    transition: "box-shadow 0.25s cubic-bezier(.4,0,.2,1)",
    boxShadow:
      "inset 0px 10px 18px 0px rgba(0,0,0,0.3) ,10px 10px 0px 0px rgba(0,0,0,1)",
    minWidth: 0 
  }}
  onMouseEnter={e =>
    (e.currentTarget.style.boxShadow =
      "inset 0px 10px 18px 0px rgba(0,0,0,0.3) ,25px 25px 0px 0px rgba(0,0,0,1)")
  }
  onMouseLeave={e =>
    (e.currentTarget.style.boxShadow =
      "inset 0px 10px 18px 0px rgba(0,0,0,0.3),15px 15px 0px 0px rgba(0,0,0,1)")
  }

    onClick={onClick}
  >
    <div className="flex flex-col justify-between flex-1">
      <div>
        <p className="text-[#00FFFF] text-sm font-bold uppercase">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className="h-5 mt-1">
        {typeof trend === "number" ? (
          <div className="flex items-center">
            {trend > 0 ? (
              <TrendingUp size={16} className="text-green-400 mr-1" />
            ) : (
              <TrendingDown size={16} className="text-red-400 mr-1" />
            )}
            <span className={`text-sm ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        ) : null}
      </div>
    </div>
    <div className="flex items-center ml-4">
      <Icon size={32} className="text-[#22D3EE]" />
    </div>
  </div>
);

// PIE CHART
const PieChart: React.FC<{ data: ContainerStatusDatum[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  return (
    <div className="flex items-center justify-center"
    >
      <svg width="200" height="200" className="mr-4">
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 100 + 80 * Math.cos(((startAngle + angle) * Math.PI) / 180);
          const y2 = 100 + 80 * Math.sin(((startAngle + angle) * Math.PI) / 180);
          const largeArc = angle > 180 ? 1 : 0;
          return (
            <path
              key={index}
              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              stroke="#000"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-4 h-4 rounded mr-2 border border-black" style={{ backgroundColor: item.color }} />
            <span className="text-white text-sm font-bold">{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// MAIN COMPONENT
export function DashboardComponent() {
  // Modal state: can hold type and payload for any detail or drill-down
  const [showModal, setShowModal] = useState<null | { type: string; payload: any }> (null);

  // Paging/search for containers and invoices
  const containersPerPage = 5;
  const invoicesPerPage = 5;
  const [containerPage, setContainerPage] = useState(0);
  const [invoicePage, setInvoicePage] = useState(0);
  const [searchContainer, setSearchContainer] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [containerList, setContainerList] = useState(myContainers);
  const [invoiceList, setInvoiceList] = useState(invoices);

  // FILTERS & PAGING
  const filteredContainers = useMemo(
    () =>
      containerList.filter((c) =>
        c.number.toLowerCase().includes(searchContainer.toLowerCase()) ||
        c.port.toLowerCase().includes(searchContainer.toLowerCase()) ||
        c.status.toLowerCase().includes(searchContainer.toLowerCase())
      ),
    [searchContainer, containerList]
  );
  const pagedContainers = useMemo(
    () => filteredContainers.slice(containerPage * containersPerPage, (containerPage + 1) * containersPerPage),
    [filteredContainers, containerPage, containersPerPage]
  );

  const filteredInvoices = useMemo(
    () =>
      invoiceList.filter((i) =>
        i.number.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        i.customer.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        i.status.toLowerCase().includes(searchInvoice.toLowerCase())
      ),
    [searchInvoice, invoiceList]
  );
  const pagedInvoices = useMemo(
    () => filteredInvoices.slice(invoicePage * invoicesPerPage, (invoicePage + 1) * invoicesPerPage),
    [filteredInvoices, invoicePage, invoicesPerPage]
  );

  // REMOVE PAID INVOICE
  function handleDeleteInvoice(number: string) {
    setInvoiceList((prev) => prev.filter((inv) => inv.number !== number));
  }

  // MODAL CONTENT
  const ModalShell: React.FC<{ children: React.ReactNode; onClose?: () => void }> = ({ children, onClose }) => (
    <div className="fixed uppercase inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-xl  w-[68vw] max-w-[1200px] max-h-[80vh] overflow-hidden border-4 border-black shadow-[inset_0px_30px_30px_10px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: `
            linear-gradient(to bottom left, #0A1A2F 0%, #0e4163 60%, #22D3EE 100%),
            linear-gradient(to bottom right, #0A1A2F 0%, #0e4163 60%, #22D3EE 100%)
          `,
          backgroundBlendMode: 'overlay',
        }}

      >
        <div className="flex  rounded-xl  items-center ">
          <div className="flex-1 flex ">
            {/* Place for modal section tabs/buttons if needed */}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-4 bg-gray-300 text-black  hover:bg-gray-400 transition-all ml-auto"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">{children}</div>
      </div>
    </div>
  );

  // KPI Drilldown
  function renderKPIDrilldown(kpi: string) {
    if (kpi === "Demurrage Alerts") {
      const affected = containerList.filter((c) => c.status === "in-port" || c.status === "exception");
      return (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6">Demurrage Alerts: Affected Containers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-5">
              <thead>
                <tr>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Container #</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Status</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">ETA</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Port</th>
                </tr>
              </thead>
              <tbody>
                {affected.map((ctn) => (
                  <tr
                    key={ctn.number}
                    className="bg-[#1A2F4E] border-2 border-[#2D4D8B] rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-[#2D4D8B] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
                    onClick={() => setShowModal({ type: "container-details", payload: ctn })}
                  >
                    <td className="py-2 px-3 text-white font-bold">{ctn.number}</td>
                    <td className="py-2 px-3">
                      <span className={`px-3 py-1 rounded font-bold text-xs ${statusBadge(ctn.status)}`}>
                        {ctn.status.replace("-", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-white">{ctn.eta}</td>
                    <td className="py-2 px-3 text-white">{ctn.port}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    // You can add more drilldowns for other KPIs
    return <div className="text-white font-bold">Drilldown for {kpi} coming soon!</div>;
  }

  // Container Details Modal  
  function renderContainerDetails(ctn: ContainerEvent) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Container {ctn.number} Details</h3>
        <div className="flex gap-4 mb-4">
          <span className={`px-3 py-1 rounded font-bold text-xs ${statusBadge(ctn.status)}`}>
            {ctn.status.replace("-", " ").toUpperCase()}
          </span>
          <span className="text-[#faf9f6] font-bold">Port:</span>
          <span className="text-white">{ctn.port}</span>
          <span className="text-[#faf9f6] font-bold">ETA:</span>
          <span className="text-white">{ctn.eta}</span>
        </div>
        <h4 className="text-lg font-bold text-[#00FFFF] mb-2">Event Log</h4>
        <ul className="mb-4 space-y-2">
          {(ctn.eventLog || []).map((e, idx) => (
            <li key={idx} className="text-white text-lg">
              <span className="text-[#00FFFF]">{e.time}:</span> {e.desc}
            </li>
          ))}
        </ul>
        <h4 className="text-lg font-bold text-[#00FFFF] mb-2">Timeline</h4>
        <ul className="space-y-2">
          {(ctn.timeline || []).map((t, idx) => (
            <li key={idx} className="text-white text-lg">
              <span className="font-bold">{t.status}</span> at <span className="text-[#00FFFF]">{t.time}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Invoice Details Modal
  function renderInvoiceDetails(inv: Invoice) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Invoice {inv.number} Details</h3>
        <div className="flex gap-4 mb-4">
          <span className={`px-3 py-1 rounded font-bold text-xs ${invoiceBadge(inv.status)}`}>
            {inv.status.toUpperCase()}
          </span>
          <span className="text-[#faf9f6] font-bold">Customer:</span>
          <span className="text-white">{inv.customer}</span>
          <span className="text-[#faf9f6] font-bold">Issued:</span>
          <span className="text-white">{inv.issued}</span>
          <span className="text-[#faf9f6] font-bold">Due:</span>
          <span className="text-white">{inv.due}</span>
        </div>
        <h4 className="text-lg font-bold text-[#00FFFF] mb-2">Log</h4>
        <ul className="mb-4 space-y-2">
          {(inv.log || []).map((e, idx) => (
            <li key={idx} className="text-white text-md">
              <span className="text-[#22D3EE]">{e.date}:</span> {e.info}
            </li>
          ))}
        </ul>
        {inv.status === "paid" && (
          <button
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-bold"
            onClick={() => {
              handleDeleteInvoice(inv.number);
              setShowModal(null);
            }}
          >
            Delete Invoice
          </button>
        )}
      </div>
    );
  }

  // Notification Alert Modal
  function renderAlertDetails(alert: Notification) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Alert Details</h3>
        <div className="mb-4">
          <span
            className={`px-3 py-1 rounded font-bold text-xs ${
              alert.severity === "high"
                ? "bg-red-900/80 text-white"
                : alert.severity === "medium"
                ? "bg-[#7b22bf] text-white"
                : "bg-blue-700 text-white"
            }`}
          >
            {alert.severity.toUpperCase()}
          </span>
        </div>
        <div className="text-white mb-6">{alert.message}</div>
        <div className="flex gap-2">
          <button className="bg-[#2a72dc] hover:bg-[#1A2F4E] text-white px-4 py-2 rounded font-bold">Acknowledge</button>
          <button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-bold">Mark Resolved</button>
          <button className="bg-[#C0C0C0] hover:bg-[#888888] text-black px-4 py-2 rounded font-bold">Send Email/SMS</button>
        </div>
      </div>
    );
  }

  // Vessel Details Modal -- ADDED HERE
  function renderVesselDetails(vessel: Vessel) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Vessel Details</h3>
        <div className="flex gap-6 mb-4 items-center">
          <Ship size={28} className="text-[#22D3EE]" />
          <span className="text-white font-bold text-xl">{vessel.name}</span>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <span className="text-[#faf9f6] font-bold">Voyage: </span>
            <span className="text-white">{vessel.voyage}</span>
          </div>
          <div>
            <span className="text-[#faf9f6] font-bold">ETA: </span>
            <span className="text-white">{vessel.eta}</span>
          </div>
          <div>
            <span className="text-[#faf9f6] font-bold">Port: </span>
            <span className="text-white">{vessel.port}</span>
          </div>
          <div>
            <span className="text-[#faf9f6] font-bold">Status: { "\u00A0" } </span>
            <span className={
              vessel.status === "on-time"
                ? "bg-green-500 px-3 py-1 text-sm rounded font-bold text-white"
                : "bg-red-600 px-3 py-1 text-sm rounded font-bold text-white"
            }>
              {vessel.status.toUpperCase()}
            </span>
          </div>
        </div>
        {/* Timeline/Event Log - replace with real log if available */}
        <h4 className="text-lg font-bold text-[#00FFFF] mb-2">Event Timeline</h4>
        <ul className="mb-4 space-y-2">
          <li className="text-white text-lg">
            <span className="text-[#22D3EE]">2025-06-01:</span> Loaded at origin port
          </li>
          <li className="text-white text-lg">
            <span className="text-[#22D3EE]">2025-06-10:</span> Departed ({vessel.port})
          </li>
          <li className="text-white text-lg">
            <span className="text-[#22D3EE]">{vessel.eta}:</span> ETA at {vessel.port}
          </li>
        </ul>
      </div>
    );
  }

  // Map section view
  const [mapView, setMapView] = useState<"containers" | "vessels">("containers");

  return (
    <div className="max-w-[1650px] mx-auto w-full px-4">
      {/* Modal */}
      {showModal && (
        <ModalShell onClose={() => setShowModal(null)}>
          {showModal.type === "kpi-drilldown" && renderKPIDrilldown(showModal.payload)}
          {showModal.type === "container-details" && renderContainerDetails(showModal.payload)}
          {showModal.type === "invoice-details" && renderInvoiceDetails(showModal.payload)}
          {showModal.type === "alert-details" && renderAlertDetails(showModal.payload)}
          {showModal.type === "vessel-details" && renderVesselDetails(showModal.payload)}
        </ModalShell>
      )}

      {/* Page Header */}
      <div className="mb-10">
        <span className="uppercase rounded-lg text-white bg-[#0A1A2F] font-semibold text-lg border-white border-2 px-4 py-2 shadow-[20px_20px_0px_rgba(0,0,0,1)]">
          Dashboard
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-7 mb-10">
        <KPICard
          title="Total Shipments"
          value={mockData.kpis.totalShipments.toLocaleString()}
          icon={Container}
          trend={8}
          onClick={() => setShowModal({ type: "kpi-drilldown", payload: "Total Shipments" })}
        />
        <KPICard
          title="Upcoming ETAs"
          value={mockData.kpis.upcomingETAs}
          icon={Clock}
          trend={-2}
          onClick={() => setShowModal({ type: "kpi-drilldown", payload: "Upcoming ETAs" })}
        />
        <KPICard
          title="Demurrage Alerts"
          value={mockData.kpis.demurrageAlerts}
          icon={AlertTriangle}
          color="text-[#FFB343]"
          onClick={() => setShowModal({ type: "kpi-drilldown", payload: "Demurrage Alerts" })}
        />
        <KPICard
          title="Temp Excursions"
          value={mockData.kpis.tempExcursions}
          icon={Thermometer}
          color="text-red-400"
          onClick={() => setShowModal({ type: "kpi-drilldown", payload: "Temp Excursions" })}
        />
        <KPICard
          title="Open Quotations"
          value={mockData.kpis.openQuotations}
          icon={FileText}
          trend={12}
          onClick={() => setShowModal({ type: "kpi-drilldown", payload: "Open Quotations" })}
        />
      </div>

      <br/>
      <br/>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
        {/* World Map Section */}
        <div className="lg:col-span-2 mb-12 ">
          <div className=" border-white border-2 rounded-xl p-10 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)]"
          style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
              >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Globe size={24} className="text-[#22D3EE] mr-4" />
                <h3 className="text-white font-bold text-xl uppercase">Global Tracking</h3>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setMapView("containers")}
                  className={`uppercase rounded-xl px-3 py-1 rounded text-md font-bold border-2 border-black ${
                    mapView === "containers"
                      ? "bg-[#22D3EE] text-black shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                      : "bg-[#2D4D8B] text-white hover:bg-[#1A2F4E] hover:text-[#00FFFF] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  Containers
                </button>
                <button
                  onClick={() => setMapView("vessels")}
                  className={`uppercase rounded-xl px-3 py-1 rounded text-md font-bold border-2 border-black ${
                    mapView === "vessels"
                      ? "bg-[#22D3EE] text-black shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                      : "bg-[#2D4D8B] text-white hover:bg-[#1A2F4E] hover:text-[#00FFFF] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  Vessels
                </button>
              </div>
            </div>
            {/* Mock World Map */}
            <div className="bg-[#1A2F4E] uppercase rounded-lg h-120 flex items-center justify-center border-2 border-[#22D3EE] shadow-[25px_25px_0px_rgba(0,0,0,1)] "
            style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
            >
              <div className="text-center">
                <MapPin size={48} className="text-[#22D3EE] mx-auto mb-4" />
                <p className="text-white font-bold">Interactive World Map</p>
                <p className="text-white/70 text-sm">
                  Showing {mapView === "containers" ? "1,247 containers" : "156 vessels"} in transit
                </p>
                <div className="flex justify-center space-x-4 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm text-white">On Time</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    <span className="text-sm text-white">Delayed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span className="text-sm text-white">Exception</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Notifications & Activity Panel */}
        <div className="space-y-10 uppercase">
          {/* Notifications */}
          <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-4 shadow-[30px_30px_0px_rgba(0,0,0,1)] mt-7"
          style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Bell size={20} className="text-[#FFB343] mr-4" />
                <h4 className="text-white font-bold uppercase">Alerts</h4>
              </div>
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                {mockData.notifications.length}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mockData.notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border-l-4 cursor-pointer ${
                    notification.severity === "high"
                      ? "bg-red-900/20 border-red-400"
                      : notification.severity === "medium"
                      ? "bg-purple-900/20 border-purple-400"
                      : "bg-blue-900/20 border-blue-400"
                  } hover:bg-[#1e3a8a] hover:shadow-[0_0_0_4px_#22D3EE]`}
                  onClick={() => setShowModal({ type: "alert-details", payload: notification })}
                >
                  <p className="text-white text-md font-medium">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-4 shadow-[30px_30px_0px_rgba(0,0,0,1)]"
          style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}>
            <div className="flex items-center mb-4">
              <Activity size={20} className="text-[#22D3EE] mr-2" />
              <h4 className="text-white font-bold uppercase">Recent Activity</h4>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {mockData.activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#22D3EE] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-md font-medium">{activity.message}</p>
                    <p className="text-white/50 text-md">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <br/>
      <br/>

      {/* Dual Section: My Containers (left) & Invoices (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 mb-12 uppercase">
        {/* My Containers: Live Events */}
        <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)] flex flex-col"
        style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
        >
          {/* Search + Pagination */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Container size={24} className="text-[#22D3EE] mr-2" />
              <h3 className="text-[#00FFFF] font-bold text-xl uppercase">My Containers</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded bg-[#1A2F4E] border-2 border-[#22D3EE]">
                <Search className="text-[#22D3EE] ml-2" size={20} />
                <input
                  value={searchContainer}
                  onChange={e => {
                    setContainerPage(0);
                    setSearchContainer(e.target.value);
                  }}
                  placeholder="Search containers"
                  className="bg-transparent outline-none text-white p-2 w-36"
                />
              </div>
              {filteredContainers.length > containersPerPage && (
                <div className="flex items-center gap-1 ml-4">
                  <button
                    className="p-2 rounded border-2 border-black bg-[#22D3EE] hover:bg-[#2D4D8B] text-black font-bold"
                    onClick={() => setContainerPage((p) => Math.max(0, p - 1))}
                    disabled={containerPage === 0}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="p-2 rounded border-2 border-black bg-[#22D3EE] hover:bg-[#2D4D8B] text-black font-bold"
                    onClick={() => setContainerPage((p) => (p + 1) * containersPerPage < filteredContainers.length ? p + 1 : p)}
                    disabled={(containerPage + 1) * containersPerPage >= filteredContainers.length}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-8">
              <thead>
                <tr>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Container #</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Status</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Last Event</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">ETA</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Port</th>
                </tr>
              </thead>
              <tbody>
                {pagedContainers.map((ctn) => (
                  <tr
                    key={ctn.number}
                    className="bg-[#24407a] border-2 border-[#1A2F4E] rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-[#1A2F4E] hover:shadow-[17px_17px_0px_rgba(0,0,0,1)] transition shadow"
                    onClick={() => setShowModal({ type: "container-details", payload: ctn })}
                  >
                    <td className="py-4 px-3 text-white font-bold">{ctn.number}</td>
                    <td className="py-4 px-3">
                      <span className={`px-3 py-1 rounded font-bold text-xs ${statusBadge(ctn.status)}`}>
                        {ctn.status.replace("-", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-white">{ctn.lastEvent}</td>
                    <td className="py-4 px-3 text-white">{ctn.eta}</td>
                    <td className="py-4 px-3 text-white">{ctn.port}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagedContainers.length === 0 && (
              <div className="text-center text-[#faf9f6] p-4 font-bold">No containers found.</div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)] flex flex-col"
        style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
        >
          {/* Search + Pagination */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <DollarSign size={24} className="text-[#22D3EE] mr-2" />
              <h3 className="text-[#00FFFF] font-bold text-xl uppercase">Invoices</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded bg-[#1A2F4E] border-2 border-[#22D3EE]">
                <Search className="text-[#22D3EE] ml-2" size={20} />
                <input
                  value={searchInvoice}
                  onChange={e => {
                    setInvoicePage(0);
                    setSearchInvoice(e.target.value);
                  }}
                  placeholder="Search invoices"
                  className="bg-transparent outline-none text-white p-2 w-36"
                />
              </div>
              {filteredInvoices.length > invoicesPerPage && (
                <div className="flex items-center gap-1 ml-4">
                  <button
                    className="p-2 rounded border-2 border-black bg-[#22D3EE] hover:bg-[#2D4D8B] text-black font-bold"
                    onClick={() => setInvoicePage((p) => Math.max(0, p - 1))}
                    disabled={invoicePage === 0}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="p-2 rounded border-2 border-black bg-[#22D3EE] hover:bg-[#2D4D8B] text-black font-bold"
                    onClick={() => setInvoicePage((p) => (p + 1) * invoicesPerPage < filteredInvoices.length ? p + 1 : p)}
                    disabled={(invoicePage + 1) * invoicesPerPage >= filteredInvoices.length}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-8">
              <thead>
                <tr>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Invoice #</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Customer</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Amount</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Status</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Issued</th>
                  <th className="text-[#00FFFF] font-bold uppercase text-sm py-2 px-3 text-left">Due</th>
                </tr>
              </thead>
              <tbody>
                {pagedInvoices.map((inv) => (
                  <tr
                    key={inv.number}
                    className="bg-[#24407a]  border-2 border-[#1A2F4E]  shadow-[8px_8px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-[#1A2F4E] hover:shadow-[17px_17px_0px_rgba(0,0,0,1)] transition-shadow"
                    onClick={() => setShowModal({ type: "invoice-details", payload: inv })}
                  >
                    <td className="py-4 px-3 text-white font-bold">{inv.number}</td>
                    <td className="py-4 px-3 text-white">{inv.customer}</td>
                    <td className="py-4 px-3 text-white">${inv.amount.toLocaleString()}</td>
                    <td className="py-4 px-3">
                      <span className={`px-3 py-1 rounded font-bold text-xs ${invoiceBadge(inv.status)}`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-white">{inv.issued}</td>
                    <td className="py-4 px-3 text-white">{inv.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagedInvoices.length === 0 && (
              <div className="text-center text-[#faf9f6] p-4 font-bold">No invoices found.</div>
            )}
          </div>
        </div>
      </div>
      <br/>
      <br/>

      {/* Vessel Schedule */}
      <div className="mb-12 uppercase">
        <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)]"
        style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
        >
          <div className="flex items-center mb-4">
            <CalendarCheck size={24} className="text-[#22D3EE] mr-4" />
            <h3 className="text-white font-bold text-xl uppercase">Vessel Schedule</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockData.vessels.map((vessel, index) => (
              <div
                key={index}
                className="bg-[#062c6c] border-4 border-[#2D4D8B] rounded-lg p-4 hover:border-[#22D3EE] transition-colors shadow-[10px_10px_0px_rgba(0,0,0,1)] cursor-pointer"
                onClick={() => setShowModal({ type: "vessel-details", payload: vessel })}
                style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#00FFFF] font-bold text-md">{vessel.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      vessel.status === "on-time"
                        ? "bg-green-400 font-bold text-black"
                        : "bg-red-500 font-bold text-white"
                    }`}
                  >
                    {vessel.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-md">Voyage: {vessel.voyage}</p>
                <p className="text-white text-md">ETA: {vessel.eta}</p>
                <p className="text-white text-md">Port: {vessel.port}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <br/>
      <br/>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12 uppercase">
        {/* Container Status Chart */}
        <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]"
        style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
        >
          <h3 className="text-white font-bold text-xl uppercase mb-4">Container Status</h3>
          <PieChart data={mockData.chartData.containerStatus} />
        </div>
        {/* Revenue by Trade Lane */}
        <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]"
        style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
        >
          <h3 className="text-white font-bold text-xl uppercase mb-4">Revenue by Trade Lane</h3>
          <div className="space-y-4">
            {mockData.chartData.revenue.map((item, index) => {
              const maxAmount = Math.max(...mockData.chartData.revenue.map(r => r.amount));
              const percentage = (item.amount / maxAmount) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between text-white text-sm mb-1">
                    <span className="font-bold">{item.lane}</span>
                    <span className="font-bold">${(item.amount / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="bg-[#1A2F4E] rounded-full h-3 border border-black">
                    <div
                      className="bg-[#22D3EE] h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* On-Time Performance Chart */}
        <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]"
        style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
        >
          <h3 className="text-white font-bold text-xl uppercase mb-4">On-Time Performance</h3>
          <div className="w-full h-36 flex items-center justify-center">
            <svg viewBox="0 0 220 100" className="w-full h-24">
              <line x1="0" y1="90" x2="220" y2="90" stroke="#1e3a8a" strokeWidth="1" />
              <line x1="0" y1="50" x2="220" y2="50" stroke="#1e3a8a" strokeWidth="1" />
              <line x1="0" y1="10" x2="220" y2="10" stroke="#1e3a8a" strokeWidth="1" />
              <polyline
                fill="none"
                stroke="#22D3EE"
                strokeWidth="4"
                points={
                  mockData.chartData.performance
                    .map((d, i) => `${20 + i * 40},${100 - d.onTime}`)
                    .join(" ")
                }
              />
              {mockData.chartData.performance.map((d, i) => (
                <circle
                  key={d.month}
                  cx={20 + i * 40}
                  cy={100 - d.onTime}
                  r={5}
                  fill="#22D3EE"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </svg>
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#faf9f6]">
            {mockData.chartData.performance.map((d) => (
              <span key={d.month} className="font-bold">{d.month}</span>
            ))}
          </div>
        </div>
      </div>
      <br/> 
      {/* Settings & Account Controls */}
      <div className="bg-[#1A2A4A] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)] mb-8"
      style={{
                backgroundImage: `
                  linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                  linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                `,
                backgroundBlendMode: 'overlay',
              }}
      >
        <div className="flex items-center mb-4">
          <Settings size={24} className="text-[#22D3EE] mr-2" />
          <h3 className="text-white font-bold text-xl uppercase">Account & Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm flex items-center justify-center">
            <User size={16} className="mr-2" />
            PROFILE
          </button>
          <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm flex items-center justify-center">
            <Settings size={16} className="mr-2" />
            COMPANY
          </button>
          <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm flex items-center justify-center">
            <Bell size={16} className="mr-2" />
            NOTIFICATIONS
          </button>
          <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm flex items-center justify-center">
            <FileText size={16} className="mr-2" />
            API KEYS
          </button>
        </div>
      </div>
    </div>
  );
}
