"use client";
import React, { useState } from "react";
import {
  Ship,
  Container,
  Clock,
  AlertTriangle,
  Thermometer,
  FileText,
  DollarSign,
  Bell,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Globe,
  Settings,
  User,
  CalendarCheck,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
} from "lucide-react";

// Data types
type KPI = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color?: string;
};

type ContainerStatusDatum = {
  name: string;
  value: number;
  color: string;
};

type RevenueDatum = {
  lane: string;
  amount: number;
};

type PerformanceDatum = {
  month: string;
  onTime: number;
};

type Vessel = {
  name: string;
  voyage: string;
  eta: string;
  port: string;
  status: "on-time" | "delayed";
};

type ActivityItem = {
  type: string;
  message: string;
  time: string;
};

type Notification = {
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
};

type APIStatus = {
  dpWorld: string;
  temperature: string;
  erp: string;
  edi: string;
};

type Invoice = {
  number: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  issued: string;
  due: string;
};

type MockData = {
  kpis: {
    totalShipments: number;
    upcomingETAs: number;
    demurrageAlerts: number;
    tempExcursions: number;
    openQuotations: number;
    pendingInvoices: number;
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
  invoices: Invoice[];
};

type ContainerEvent = {
  number: string;
  status: "in-port" | "in-transit" | "delivered" | "exception";
  lastEvent: string;
  eta: string;
  port: string;
};

// Mock Data
const myContainers: ContainerEvent[] = [
  {
    number: "HLCU1234567",
    status: "in-transit",
    lastEvent: "Temperature alert cleared",
    eta: "2025-06-17 09:00",
    port: "Jebel Ali",
  },
  {
    number: "MSKU9876543",
    status: "in-port",
    lastEvent: "Customs hold released",
    eta: "2025-06-20 16:30",
    port: "Mundra",
  },
  {
    number: "TEMU9991112",
    status: "exception",
    lastEvent: "Temperature deviation detected",
    eta: "2025-06-19 21:00",
    port: "Nhava Sheva",
  },
  {
    number: "CMAU2345231",
    status: "delivered",
    lastEvent: "Delivered to consignee",
    eta: "-",
    port: "Chennai",
  },
  ...Array.from({ length: 14 }).map((_, i) => ({
    number: `TESTCNTR${i + 1000}`,
    status: (["in-transit", "in-port", "delivered", "exception"] as const)[i % 4],
    lastEvent: "Sample event",
    eta: "2025-06-22 10:00",
    port: "Kolkata",
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
  },
  {
    number: "INV-2025-003422",
    customer: "Blue Marine LLC",
    amount: 13800,
    status: "pending",
    issued: "2025-06-04",
    due: "2025-06-14",
  },
  {
    number: "INV-2025-003423",
    customer: "Greenline Impex",
    amount: 9700,
    status: "overdue",
    issued: "2025-05-25",
    due: "2025-06-01",
  },
  ...Array.from({ length: 7 }).map((_, i) => ({
    number: `INV-2025-0034${24 + i}`,
    customer: `Customer ${i + 1}`,
    amount: 1000 * (i + 1),
    status: (["paid", "pending", "overdue"] as const)[i % 3],
    issued: "2025-06-02",
    due: "2025-06-10",
  })),
];

const mockData: MockData = {
  kpis: {
    totalShipments: 1247,
    upcomingETAs: 23,
    demurrageAlerts: 8,
    tempExcursions: 3,
    openQuotations: 156,
    pendingInvoices: 42,
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
      { name: "In Port", value: 30, color: "#FFB343" },
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
  invoices,
};

export function DashboardComponent() {
  const [mapView, setMapView] = useState<"containers" | "vessels">("containers");
  const [containerPage, setContainerPage] = useState(0);
  const containersPerPage = 10;
  const [invoicePage, setInvoicePage] = useState(0);
  const invoicesPerPage = 10;

  // KPI Card Component
  const KPICard: React.FC<KPI> = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "text-white",
  }) => (
    <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-4 shadow-[20px_20px_0px_rgba(0,0,0,1)] transition-shadow flex items-stretch">
      <div className="flex flex-col justify-between flex-1">
        <div>
          <p className="text-white/70 text-sm font-bold uppercase">{title}</p>
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

  // Chart Component
  const PieChart: React.FC<{ data: ContainerStatusDatum[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center justify-center">
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
              <div
                className="w-4 h-4 rounded mr-2 border border-black"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-white text-sm font-bold">
                {item.name}: {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Status badge color
  const statusBadge = (status: ContainerEvent["status"]) => {
    switch (status) {
      case "in-port":
        return "bg-[#FFB343] text-black";
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

  // Invoice badge color
  const invoiceBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-yellow-400 text-black";
      case "overdue":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-400 text-black";
    }
  };

  return (
    <div className="max-w-[1650px] mx-auto w-full px-4">
      {/* Page Header */}
      <div className="mb-10">
        <span className="uppercase rounded-lg text-white bg-[#0A1A2F] font-semibold text-lg border-white border-2 px-4 py-2 shadow-[20px_20px_0px_rgba(0,0,0,1)]">
          Dashboard
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-7 mb-10">
        <KPICard
          title="Total Shipments"
          value={mockData.kpis.totalShipments.toLocaleString()}
          icon={Container}
          trend={8}
        />
        <KPICard
          title="Upcoming ETAs"
          value={mockData.kpis.upcomingETAs}
          icon={Clock}
          trend={-2}
        />
        <KPICard
          title="Demurrage Alerts"
          value={mockData.kpis.demurrageAlerts}
          icon={AlertTriangle}
          color="text-[#FFB343]"
        />
        <KPICard
          title="Temp Excursions"
          value={mockData.kpis.tempExcursions}
          icon={Thermometer}
          color="text-red-400"
        />
        <KPICard
          title="Open Quotations"
          value={mockData.kpis.openQuotations}
          icon={FileText}
          trend={12}
        />
        <KPICard
          title="Pending Invoices"
          value={mockData.kpis.pendingInvoices}
          icon={DollarSign}
          color="text-green-400"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* World Map Section */}
        <div className="lg:col-span-2 mb-12 ">
          <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-10 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)]">
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
            <div className="bg-[#1A2F4E] rounded-lg h-120 flex items-center justify-center border-2 border-[#22D3EE] shadow-[25px_25px_0px_rgba(0,0,0,1)] ">
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
        <div className="space-y-10">
          {/* Notifications */}
          <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-4 shadow-[30px_30px_0px_rgba(0,0,0,1)] mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Bell size={20} className="text-[#FFB343] mr-4" />
                <h4 className="text-white font-bold uppercase">Alerts</h4>
              </div>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                {mockData.notifications.length}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mockData.notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border-l-4 ${
                    notification.severity === "high"
                      ? "bg-red-900/20 border-red-400"
                      : notification.severity === "medium"
                      ? "bg-yellow-900/20 border-yellow-400"
                      : "bg-blue-900/20 border-blue-400"
                  }`}
                >
                  <p className="text-white text-sm font-medium">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-4 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center mb-4">
              <Activity size={20} className="text-[#22D3EE] mr-2" />
              <h4 className="text-white font-bold uppercase">Recent Activity</h4>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {mockData.activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#22D3EE] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">{activity.message}</p>
                    <p className="text-white/50 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Containers: Live Events */}
      <div className="mb-12">
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center mb-4">
            <Container size={24} className="text-[#22D3EE] mr-4" />
            <h3 className="text-white font-bold text-xl uppercase">My Containers: Live Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-4">
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
                {myContainers
                  .slice(containerPage * containersPerPage, (containerPage + 1) * containersPerPage)
                  .map((ctn) => (
                    <tr
                      key={ctn.number}
                      className="bg-[#1A2F4E] border-2 border-[#2D4D8B] rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                    >
                      <td className="py-2 px-3 text-white font-bold">{ctn.number}</td>
                      <td className="py-2 px-3">
                        <span className={`px-3 py-1 rounded font-bold text-xs ${statusBadge(ctn.status)}`}>
                          {ctn.status.replace("-", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-white">{ctn.lastEvent}</td>
                      <td className="py-2 px-3 text-white">{ctn.eta}</td>
                      <td className="py-2 px-3 text-white">{ctn.port}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {myContainers.length > containersPerPage && (
              <div className="flex justify-center mt-6 gap-6">
                <button
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#2D4D8B] hover:bg-[#1A2F4E] border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  onClick={() => setContainerPage((p) => Math.max(p - 1, 0))}
                  disabled={containerPage === 0}
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#2D4D8B] hover:bg-[#1A2F4E] border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  onClick={() => setContainerPage((p) => Math.min(p + 1, Math.floor((myContainers.length - 1) / containersPerPage)))}
                  disabled={containerPage >= Math.floor((myContainers.length - 1) / containersPerPage)}
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="mb-12">
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center mb-4">
            <FileSpreadsheet size={24} className="text-[#22D3EE] mr-4" />
            <h3 className="text-white font-bold text-xl uppercase">Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-4">
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
                {mockData.invoices
                  .slice(invoicePage * invoicesPerPage, (invoicePage + 1) * invoicesPerPage)
                  .map((inv) => (
                    <tr
                      key={inv.number}
                      className="bg-[#1A2F4E] border-2 border-[#2D4D8B] rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                    >
                      <td className="py-2 px-3 text-white font-bold">{inv.number}</td>
                      <td className="py-2 px-3 text-white">{inv.customer}</td>
                      <td className="py-2 px-3 text-white font-bold">${inv.amount.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span className={`px-3 py-1 rounded font-bold text-xs ${invoiceBadge(inv.status)}`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-white">{inv.issued}</td>
                      <td className="py-2 px-3 text-white">{inv.due}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {mockData.invoices.length > invoicesPerPage && (
              <div className="flex justify-center mt-6 gap-6">
                <button
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#2D4D8B] hover:bg-[#1A2F4E] border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  onClick={() => setInvoicePage((p) => Math.max(p - 1, 0))}
                  disabled={invoicePage === 0}
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#2D4D8B] hover:bg-[#1A2F4E] border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  onClick={() => setInvoicePage((p) => Math.min(p + 1, Math.floor((mockData.invoices.length - 1) / invoicesPerPage)))}
                  disabled={invoicePage >= Math.floor((mockData.invoices.length - 1) / invoicesPerPage)}
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vessel Schedule */}
      <div className="mb-12">
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center mb-4">
            <CalendarCheck size={24} className="text-[#22D3EE] mr-4" />
            <h3 className="text-white font-bold text-xl uppercase">Vessel Schedule</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockData.vessels.map((vessel, index) => (
              <div
                key={index}
                className="bg-[#1A2F4E] border-2 border-[#2D4D8B] rounded-lg p-4 hover:border-[#22D3EE] transition-colors shadow-[10px_10px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-bold text-sm">{vessel.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      vessel.status === "on-time"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {vessel.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-white/70 text-sm">Voyage: {vessel.voyage}</p>
                <p className="text-white/70 text-sm">ETA: {vessel.eta}</p>
                <p className="text-white/70 text-sm">Port: {vessel.port}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        {/* Container Status Chart */}
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
          <h3 className="text-white font-bold text-xl uppercase mb-4">Container Status</h3>
          <PieChart data={mockData.chartData.containerStatus} />
        </div>

        {/* Revenue by Trade Lane */}
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
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
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
          <h3 className="text-white font-bold text-xl uppercase mb-4">On-Time Performance</h3>
          <div className="w-full h-36 flex items-center justify-center">
            <svg viewBox="0 0 220 100" className="w-full h-24">
              {/* Background grid lines */}
              <line x1="0" y1="90" x2="220" y2="90" stroke="#1e3a8a" strokeWidth="1" />
              <line x1="0" y1="50" x2="220" y2="50" stroke="#1e3a8a" strokeWidth="1" />
              <line x1="0" y1="10" x2="220" y2="10" stroke="#1e3a8a" strokeWidth="1" />
              {/* The polyline itself */}
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
              {/* Dots for each point */}
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

      {/* API Status & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-11 mb-12">
        {/* API Status */}
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
          <h3 className="text-white font-bold text-xl uppercase mb-4">System Status</h3>
          <div className="space-y-3">
            {Object.entries(mockData.apiStatus).map(([system, status]) => (
              <div key={system} className="flex items-center justify-between">
                <span className="text-white font-medium capitalize">
                  {system === "dpWorld"
                    ? "DP World API"
                    : system === "erp"
                    ? "ERP Sync"
                    : system === "edi"
                    ? "EDI/Customs"
                    : "Temperature Sensors"}
                </span>
                <div className="flex items-center">
                  {status === "online" ? (
                    <CheckCircle size={20} className="text-green-400 mr-2" />
                  ) : (
                    <XCircle size={20} className="text-red-400 mr-2" />
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      status === "online"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[30px_30px_0px_rgba(0,0,0,1)]">
          <h3 className="text-white font-bold text-xl uppercase mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm">
              NEW BOOKING
            </button>
            <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm">
              GET QUOTE
            </button>
            <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm">
              TRACK CARGO
            </button>
            <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-3 font-bold text-sm">
              VIEW SCHEDULE
            </button>
          </div>
        </div>
      </div>

      {/* Settings & Account Controls */}
      <div className="bg-[#0A1A2F] border-white border-2 rounded-xl p-6 shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)] mb-8">
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
