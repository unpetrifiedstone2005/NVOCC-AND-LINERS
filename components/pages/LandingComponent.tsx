"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import SCMT from "@/videos/SCMT.mp4";
import Image from "next/image";
import Video from "next-video";
import {
  Search,
  ArrowBigLeft,
  ArrowBigRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  Book,
  ClipboardList,
  Map,
  DollarSign,
  SignpostBig,
} from "lucide-react";

import { BookingCard } from "../BookingCard";
import { QuotationCard } from "../QuotationCard";
import { SchedulesCard } from "../SchedulesCard";
import { TrackingCard } from "../TrackingCard";

type SubMenuItem = {
  key: string;
  label: string;
  pathPattern: string;
  roles: string[];
};

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  pathPattern?: string;
  roles: string[];
  sub: SubMenuItem[];
};

const menuData: MenuItem[] = [
  {
    key: "quotes",
    label: "QUOTES",
    icon: <FileText size={24} />,
    roles: ["ADMIN", "OPERATOR"],
    sub: [
      { key: "new_quote", label: "NEW QUOTE", pathPattern: "/main/quotes/newquote", roles: ["OPERATOR"] },
      { key: "my_quotations", label: "MY QUOTATIONS", pathPattern: "/main/quotes/myquotes", roles: ["OPERATOR", "ADMIN"] },
      { key: "special_cargo", label: "SPECIAL CARGO QUOTES", pathPattern: "/main/quotes/special", roles: ["ADMIN"] },
      { key: "tariffs", label: "TARIFFS", pathPattern: "/main/quotes/tariffs", roles: ["ADMIN"] },
      { key: "demurrage", label: "DETENTION AND DEMURRAGE TARIFFS", pathPattern: "/main/quotes/demurrage", roles: ["ADMIN"] },
      { key: "exchange_tariffs", label: "RATE OF EXCHANGE TARIFFS", pathPattern: "/main/quotes/exchange", roles: ["ADMIN"] },
    ],
  },
  {
    key: "schedule",
    label: "SCHEDULE",
    icon: <Calendar size={24} />,
    roles: ["ADMIN", "OPERATOR", "CLIENT"],
    sub: [],
    pathPattern: "/main/schedules",
  },
  {
    key: "book",
    label: "BOOK",
    icon: <Book size={24} />,
    roles: ["ADMIN", "OPERATOR"],
    sub: [
      { key: "book_new", label: "CREATE BOOKING", pathPattern: "/main/book/createbooking", roles: ["OPERATOR"] },
      { key: "book_templates", label: "BOOKING TEMPLATES", pathPattern: "/main/book/templates", roles: ["ADMIN"] },
      { key: "book_my", label: "MY BOOKINGS", pathPattern: "/main/book/mybookings", roles: ["OPERATOR", "CLIENT"] },
      { key: "book_amendments", label: "BOOKING AMENDMENTS", pathPattern: "/main/book/amendments", roles: ["ADMIN"] },
      { key: "book_additional_services", label: "ADDITIONAL SERVICES", pathPattern: "/main/book/additionalservices", roles: ["OPERATOR"] },
      { key: "book_us_military", label: "US MILITARY BOOKING", pathPattern: "/main/book/usmilitary", roles: ["ADMIN"] },
    ],
  },
  {
    key: "documentation",
    label: "DOCUMENTATION",
    icon: <ClipboardList size={24} />,
    roles: ["ADMIN", "OPERATOR", "CLIENT"],
    sub: [
      { key: "my_shipment", label: "MY SHIPMENT", pathPattern: "/main/documentation/shipment", roles: ["CLIENT", "OPERATOR"] },
      { key: "gross_mass", label: "VERIFIED GROSS MASS", pathPattern: "/main/documentation/mass", roles: ["OPERATOR"] },
      { key: "shipping_instructions", label: "SHIPPING INSTRUCTIONS", pathPattern: "/main/documentation/instructions", roles: ["ADMIN"] },
      { key: "bl_approval", label: "BL DRAFT APPROVAL", pathPattern: "/main/documentation/approval", roles: ["ADMIN"] },
      { key: "customs_status", label: "CUSTOMS STATUS", pathPattern: "/main/documentation/customs-status", roles: ["OPERATOR"] },
      { key: "customs_reference", label: "CUSTOMS REFERENCE", pathPattern: "/main/documentation/customs-ref", roles: ["OPERATOR"] },
      { key: "cargo_claims", label: "CARGO CLAIMS", pathPattern: "/main/documentation/claims", roles: ["CLIENT"] },
      { key: "e_bl", label: "ELECTRONIC BILL OF LADING", pathPattern: "/main/documentation/ebl", roles: ["CLIENT"] },
    ],
  },
  {
    key: "finance",
    label: "FINANCE",
    icon: <DollarSign size={24} />,
    roles: ["ADMIN", "CLIENT"],
    sub: [
      { key: "my_invoice", label: "MY INVOICE", pathPattern: "/main/finance/invoice", roles: ["CLIENT"] },
      { key: "my_disputes", label: "MY DISPUTES", pathPattern: "/main/finance/disputes", roles: ["CLIENT"] },
    ],
  },
  {
    key: "track",
    label: "TRACK",
    icon: <Map size={24} />,
    roles: ["ADMIN", "OPERATOR", "CLIENT"],
    sub: [
      { key: "by_booking", label: "BY BOOKING", pathPattern: "/main/tracking/byBooking", roles: ["CLIENT", "OPERATOR"] },
      { key: "by_container", label: "BY CONTAINER", pathPattern: "/main/tracking/byContainer", roles: ["OPERATOR"] },
      { key: "by_vessel", label: "BY VESSEL", pathPattern: "/main/tracking/byVessel", roles: ["OPERATOR"] },
      { key: "subscription", label: "SUBSCRIPTION", pathPattern: "/main/tracking/subscription", roles: ["CLIENT"] },
      { key: "vessel_tracker", label: "VESSEL TRACKER", pathPattern: "/main/tracking/vesselTracker", roles: ["CLIENT"] },
      { key: "live_position", label: "LIVE POSITION", pathPattern: "/main/tracking/livePosition", roles: ["CLIENT"] },
    ],
  },
  {
    key: "seed",
    label: "SEED",
    icon: <SignpostBig size={24} />,
    roles: ["ADMIN", "OPERATOR", "CLIENT"],
    sub: [
      { key: "seed_containers", label: "CONTAINERS", pathPattern: "/main/seed/containers", roles: ["CLIENT", "OPERATOR"] },
      { key: "seed_serviceschedule", label: "SERVICE SCHEDULE", pathPattern: "/main/seed/serviceschedules", roles: ["OPERATOR"] },
      { key: "seed_surcharges", label: "SURCHARGES", pathPattern: "/main/seed/surcharges", roles: ["OPERATOR"] },
      { key: "seed_tariffs", label: "TARRIFFS", pathPattern: "/main/seed/tariffs", roles: ["CLIENT"] },
    ],
  },
];

export function LandingComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // for now show every field/subfield regardless of role
  const filteredMenu = menuData;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [delayedOpenMenu, setDelayedOpenMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ids = [
      "about-section",
      "stats-section",
      "video-section",
      "services-section",
      "card-tracking",
      "card-booking",
      "card-schedules",
      "card-quotation",
    ];
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: entry.isIntersecting,
            }));
          }
        });
      },
      { threshold: 0.15 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuOpen) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (!event.target.closest(".relative")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!isOpen) {
      setOpenMenu(null);
      setDelayedOpenMenu(null);
    }
  }, [isOpen]);

  const handleMenuClick = (key: string) => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => setDelayedOpenMenu(key), 400);
    } else {
      setDelayedOpenMenu((prev) => (prev === key ? null : key));
    }
  };

  useEffect(() => {
    setOpenMenu(delayedOpenMenu);
  }, [delayedOpenMenu]);

  const subButtonStyle =
    "flex rounded-lg hover:shadow-[-12px_5px_0px_rgba(0,0,0,1)] items-center mt-1 mb-1 w-[95%] text-left px-2 py-2 text-sm font-medium text-white hover:bg-[#2D4D8B]/70 hover:text-[#00FFFF] hover:font-bold";
  const collapsedButtonStyle =
    "flex rounded-lg items-center justify-center w-full h-[60px] bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white shadow-[-8px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] transition-shadow border-black border-4 font-bold px-0";

  return (
    <div className="w-full min-h-screen container-texture-bg text-md pt-8 overflow-x-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 third-container-texture-bg justify-between px-6 py-4 w-full shadow-[0px_16px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            width={70}
            height={70}
            alt="SCMT Logo"
            className="inline-block align-middle mb-2"
            style={{ objectFit: "contain" }}
          />
          <div className="font-bold text-4xl text-[#1e3a8a] ml-2">SCMT</div>
        </div>
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center group bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl text-white hover:text-[#00FFFF] border-black border-4 px-4 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow">
              <button onClick={() => setSearchOpen(false)} className="mr-2">
                <Search size={24} />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none w-48 placeholder-white/70 group-hover:text-[#00FFFF]"
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl text-white hover:text-[#00FFFF] border-black border-4 px-4 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              <Search size={24} />
            </button>
          )}
          <button
            onClick={() => {
              router.push("/");
            }}
            className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold"
          >
            home
          </button>
          <button
            onClick={() => {
              router.push("/main/services&info");
            }}
            className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold"
          >
            services and information
          </button>
          <button
            onClick={() => {
              router.push("/main/aboutus");
            }}
            className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold"
          >
            about us
          </button>
          <button
            onClick={() => {
              router.push("/main/dashboard");
            }}
            className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold"
          >
            dashboard
          </button>
        </div>
        {session?.user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl text-white hover:text-[#00FFFF] shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-2 font-bold w-full"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold text-lg">
                {session.user.firstName?.charAt(0) || "U"}
              </div>
              <span className="uppercase">Hello {session.user.firstName}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`absolute right-0 top-full mt-2 w-full bg-white rounded-lg shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black z-50 transition-all duration-300 ease-in-out origin-top ${
                userMenuOpen ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="py-2">
                <button onClick={() => setUserMenuOpen(false)} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Personal Information
                </button>
                <button onClick={() => setUserMenuOpen(false)} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Account Settings
                </button>
                <button onClick={() => setUserMenuOpen(false)} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex	items-center	gap-3 transition-colors duration-200">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Company Details
                </button>
                {session.user.role !== "CLIENT" && (
                  <button onClick={() => setUserMenuOpen(false)} className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex	items-center gap-3 transition-colors duration-200">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    User List
                  </button>
                )}
                <hr className="my-2 border-gray-200" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-4 py-3	text-gray-700 hover:bg-gray-100 font-medium flex	items-center gap-3 transition-colors duration-200"
                >
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="uppercase bg-[#105cb8] text-lg hover:bg-[#022e63] hover:text-cyan-300 rounded-2xl text-white shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold"
          >
            log in
          </button>
        )}
      </div>

      <div className="flex-1">
        <div className="relative">
          {/* Sidebar */}
          <div
            ref={sidebarRef}
            className={`${
              isOpen
                ? "w-[300px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),-15px_20px_0px_rgba(0,0,0,1)]"
                : "w-[80px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),15px_8px_0px_rgba(0,0,0,1)]"
            } min-h-0 overflow-hidden bg-[#0A1A2F] rounded-lg fixed left-1 top-[190px] border-t-4 border-r-4	border-b-4 border-[#2D4D8B] transition-width duration-300`}
          >
            <div className="flex flex-col">
              {filteredMenu.map((item) =>
                isOpen ? (
                  <div key={item.key}>
                    <button
                      onClick={() => {
                        if (!item.sub.length && item.pathPattern) {
                          router.push(item.pathPattern);
                        } else {
                          handleMenuClick(item.key);
                        }
                      }}
                      className="rounded-lg bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-4 py-2 font-bold w-full flex	items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="mt-1">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.sub.length > 0 && (openMenu === item.key ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                    </button>
                    <div
                      className="ml-8	pl-4 border-l border-[#faf9f6]/20 overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: openMenu === item.key ? "500px" : "0px",
                        opacity: openMenu === item.key ? 1 : 0,
                      }}
                    >
                      {item.sub.map((sub) => (
                        <button key={sub.key} onClick={() => router.push(sub.pathPattern)} className={subButtonStyle}>
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.key}
                    onClick={() => {
                      setIsOpen(true);
                      setTimeout(() => setDelayedOpenMenu(item.key), 400);
                    }}
                    className={collapsedButtonStyle}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            onClick={() => setIsOpen((o) => !o)}
            className="w-8 h-8 bg-[#2D4D8B] text-white rounded-r-full fixed z-50"
            style={{ left: isOpen ? "301px" : "81px", top: "198px", transition: "left 300ms cubic-bezier(0.4,0,0.2,1)" }}
          >
            {isOpen ? <ArrowBigLeft size={24} /> : <ArrowBigRight size={24} />}
          </button>

          {/* Main Content */}
          <div className={`pt-[96px] transition-all duration-300 ${isOpen ? "pl-[300px]" : "pl-[80px]"}`}>
            <br />
            <div className="max-w-[1600.24px] mx-auto w-full px-4 items-center">
              {/* TOP CARDS */}
              <div className="flex flex-col font-bold gap-4">
                <div className="flex justify-center gap-8">
                  <div
                    id="card-tracking"
                    className={`transition-all duration-1000 ${
                      visibleSections["card-tracking"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                  >
                    <TrackingCard />
                  </div>
                  <div
                    id="card-booking"
                    className={`transition-all duration-1000 ${
                      visibleSections["card-booking"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                  >
                    <BookingCard />
                  </div>
                </div>
                <br />
                <div className="flex justify-center gap-8 mt-4">
                  <div
                    id="card-schedules"
                    className={`transition-all duration-1000 ${
                      visibleSections["card-schedules"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                  >
                    <SchedulesCard />
                  </div>
                  <div
                    id="card-quotation"
                    className={`transition-all duration-1000 ${
                      visibleSections["card-quotation"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                  >
                    <QuotationCard />
                  </div>
                </div>
              </div>
              <br />
              <br />
              <br />
              {/* ABOUT US SECTION */}
              <div
                id="about-section"
                className={`
                  max-w-[1600.24px] mx-auto w-full px-4 mb-8
                  transition-all duration-1000
                  ${visibleSections["about-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                `}
              >
                <div
                  className="bg-[#0F1B2A] rounded-xl shadow-[30px_30px_0px_rgba(0,0,0,1)] border-4 border-black p-10 flex flex-col items-center text-center relative overflow-hidden"
                  style={{
                    backgroundImage: `
                      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                    `,
                    backgroundBlendMode: "overlay",
                  }}
                >
                  <div className="bg-white rounded-full border-4 border-[#2D4D8B] shadow-[8px_8px_0px_rgba(0,0,0,1)] p-2 mb-4">
                    <img src="/logo.png" alt="SCMT Logo" className="w-20 h-20 object-contain" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#00FFFF] mb-4 tracking-wide drop-shadow-lg">
                    About State Company for Maritime Transport
                  </h2>
                  <p className="text-white/90 text-lg md:text-xl mb-6 max-w-3xl mx-auto font-semibold">
                    Since 1952, SCMT has stood as Iraq’s national shipping lifeline, connecting local trade to global
                    markets with a modern fleet, advanced logistics, and a legacy of reliability.
                    Backed by the Ministry of Transportation, our mission is to deliver secure, efficient, and world-class
                    maritime services—empowering Iraq’s growth at sea.
                  </p>
                  <button
                    onClick={() => {
                      router.push("/main/aboutus");
                    }}
                    className="bg-[#2a72dc] hover:bg-[#00FFFF] text-white hover:text-black px-8 py-3 rounded-xl font-bold border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-all text-lg uppercase tracking-wide"
                  >
                    Learn More
                  </button>
                </div>
              </div>
              <br />
              <br />
              <br />
              {/* QUICK STATS SECTION */}
              <div
                id="stats-section"
                className={`
                  max-w-[1600.24px] mx-auto w-full px-4 mb-8
                  transition-all duration-1000
                  ${visibleSections["stats-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                `}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div
                    className="bg-[#2D4D8B] rounded-xl border-4 border-black p-6 text-center shadow-[15px_15px_0px_rgba(0,0,0,1)]"
                    style={{
                      backgroundImage: `
                        linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                        linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                      `,
                      backgroundBlendMode: "overlay",
                    }}
                  >
                    <div className="text-3xl font-bold text-[#00FFFF] mb-2">150+</div>
                    <div className="text-white font-bold uppercase text-sm">Global Ports</div>
                  </div>
                  <div
                    className="bg-[#2D4D8B] rounded-xl border-4 border-black p-6 text-center shadow-[15px_15px_0px_rgba(0,0,0,1)]"
                    style={{
                      backgroundImage: `
                        linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                        linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                      `,
                      backgroundBlendMode: "overlay",
                    }}
                  >
                    <div className="text-3xl font-bold text-[#00FFFF] mb-2">24/7</div>
                    <div className="text-white font-bold uppercase text-sm">Customer Support</div>
                  </div>
                  <div
                    className="bg-[#2D4D8B] rounded-xl border-4 border-black p-6 text-center shadow-[15px_15px_0px_rgba(0,0,0,1)]"
                    style={{
                      backgroundImage: `
                        linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                        linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                      `,
                      backgroundBlendMode: "overlay",
                    }}
                  >
                    <div className="text-3xl font-bold text-[#00FFFF] mb-2">50K+</div>
                    <div className="text-white font-bold uppercase text-sm">Containers Monthly</div>
                  </div>
                  <div
                    className="bg-[#2D4D8B] rounded-xl border-4 border-black p-6 text-center shadow-[15px_15px_0px_rgba(0,0,0,1)]"
                    style={{
                      backgroundImage: `
                        linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                        linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                      `,
                      backgroundBlendMode: "overlay",
                    }}
                  >
                    <div className="text-3xl font-bold text-[#00FFFF] mb-2">98%</div>
                    <div className="text-white font-bold uppercase text-sm">On-Time Delivery</div>
                  </div>
                </div>
              </div>
              {/* VIDEO SECTION */}
              <div
                id="video-section"
                className={`transition-all duration-1000 p-12 ${
                  visibleSections["video-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <Video src={SCMT} className="shadow-[40px_40px_0px_rgba(0,0,0,1)]" />
              </div>
              <br />
              <br />
              {/* FEATURED SERVICES SECTION */}
              <div
                id="services-section"
                className={`max-w-[1600.24px] mx-auto w-full px-4 mb-8 transition-all duration-1000 ${
                  visibleSections["services-section"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <div
                  className="bg-[#888888] rounded-xl shadow-[15px_15px_0px_rgba(0,0,0,1)] border-4	border-black p-8"
                  style={{
                    backgroundImage: `
                      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                    `,
                    backgroundBlendMode: "overlay",
                  }}
                >
                  <h2 className="text-3xl	font-bold text-white mb-6 text-center">FEATURED SERVICES</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                      className="bg-[#0A1A2F] rounded-xl p-6 border-4	border-[#2D4D8B] shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow"
                      style={{
                        backgroundImage: `
                          linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                          linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                        `,
                        backgroundBlendMode: "overlay",
                      }}
                    >
                      <Map size={48} className="text-[#00FFFF] mb-4" />
                      <h3 className="text-xl font-bold text-white mb-3">CONTAINER TRACKING</h3>
                      <p className="text-white/80 mb-4">Real-time tracking of your containers with GPS precision and automated notifications.</p>
                      <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] text-white hover:text-[#00FFFF] px-4 py-2 rounded-lg font-bold border-2	border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow">
                        LEARN MORE
                      </button>
                    </div>
                    <div
                      className="bg-[#0A1A2F] rounded-xl p-6 border-4	border-[#2D4D8B] shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow"
                      style={{
                        backgroundImage: `
                          linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                          linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                        `,
                        backgroundBlendMode: "overlay",
                      }}
                    >
                      <Book size={48} className="text-[#00FFFF] mb-4" />
                      <h3 className="text-xl font-bold text-white mb-3">INSTANT BOOKING</h3>
                      <p className="text-white/80 mb-4">Book your cargo space instantly with our automated booking system and get confirmation in seconds.</p>
                      <button className="bg-[#2D4D8B] hover:bg-[#1A2F4E] text-white hover:text-[#00FFFF] px-4 py-2 rounded-lg font-bold border-2	border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow">
                        LEARN MORE
                      </button>
                    </div>
                    <div
                      className="bg-[#0A1A2F] rounded-xl p-6	border-4	border-[#2D4D8B] shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow"
                      style={{
                        backgroundImage: `
                          linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                          linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                        `,
                        backgroundBlendMode: "overlay",
                      }}
                    >
                      <DollarSign size={48} className="text-[#00FFFF] mb-4" />
                      <h3 className="text-xl font-bold text-white mb-3">COMPETITIVE RATES</h3>
                      <p className="text-white/80 mb-4">Get the best shipping rates with our dynamic pricing engine and volume discounts.</p>
                      <button className="bg-[#2D4D8B]	hover:bg-[#1A2F4E] text-white hover:text-[#00FFFF] px-4 py-2 rounded-lg font-bold border-2	border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow">
                        LEARN MORE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <br />
              <br />
            </div>
          </div>
        </div>
        <footer className="w-full third-container-texture-bg mb-8 border-t-7 border-black shadow-[0px_20px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-center py-6 px-6 relative">
            <div className="flex items-center space-x-10">
              <div className="flex items-center space-x-3 font-bold text-4xl text-[#162f5c]">
                <Image src="/logo.png" width={70} height={70} alt="SCMT Logo" className="inline-block align-middle mb-2" style={{ objectFit: "contain" }} />
                <span className="align-middle">SCMT</span>
              </div>
              <div className="text-black font-bold text-md uppercase hover:underline cursor-pointer">terms and conditions</div>
              <div className="text-black font-bold text-md uppercase hover:underline cursor-pointer">privacy policy</div>
              <div className="text-black font-bold text-md uppercase hover:underline cursor-pointer">cookie policy</div>
            </div>
          </div>
          <div className="text-white py-2 border-t-2 border-b-2 font-bold text-md uppercase flex justify-center items-center bg-[#1e3a8a]">
            Copyright © 2025 SCMT
          </div>
        </footer>
      </div>
    </div>
  );
}
