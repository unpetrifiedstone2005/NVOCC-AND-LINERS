"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
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
  Link,
  SignpostBig,
} from "lucide-react";

// --- TYPES ---------------------------------------------------------------
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

// --- MENU DATA -----------------------------------------------------------
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
    pathPattern: "/main/schedules",
    sub: [],
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
      { key: "seed_serviceaddons", label: "ADD ON SERVICES", pathPattern: "/main/seed/serviceaddons", roles: ["CLIENT"] },
    ],
  },
];

// --- HELPERS -------------------------------------------------------------
function isPathActive(current: string, target: string) {
  return current === target || current.startsWith(target);
}

function getActiveMenuKey(pathname: string): string | null {
  for (const menu of menuData) {
    if (menu.pathPattern && isPathActive(pathname, menu.pathPattern)) return menu.key;
    for (const sub of menu.sub) {
      if (isPathActive(pathname, sub.pathPattern)) return menu.key;
    }
  }
  return null;
}

function isMenuItemActive(pathname: string, menuItem: MenuItem): boolean {
  if (menuItem.pathPattern && isPathActive(pathname, menuItem.pathPattern)) return true;
  return menuItem.sub.some(sub => isPathActive(pathname, sub.pathPattern));
}

// --- MAIN LAYOUT ---------------------------------------------------------
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const filteredMenu = menuData;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [delayedOpenMenu, setDelayedOpenMenu] = useState<string | null>(null);
  const [sidebarJustOpened, setSidebarJustOpened] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDelayedOpenMenu(getActiveMenuKey(pathname));
  }, [pathname]);

  useEffect(() => {
    const activeKey = getActiveMenuKey(pathname);
    if (activeKey && sidebarJustOpened) {
      setTimeout(() => {
        setDelayedOpenMenu(activeKey);
        setSidebarJustOpened(false);
      }, 400);
    }
  }, [pathname, sidebarJustOpened]);

  useEffect(() => {
    if (!isOpen) {
      setOpenMenu(null);
      setDelayedOpenMenu(null);
      setSidebarJustOpened(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!userMenuOpen) return;
      if (!(e.target instanceof HTMLElement)) return;
      if (!e.target.closest(".relative")) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleMenuClick = (key: string) => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => setDelayedOpenMenu(key), 400);
    } else {
      const current = openMenu || delayedOpenMenu;
      setDelayedOpenMenu(current === key ? null : key);
    }
  };

  const handleSidebarToggle = () => {
    setIsOpen(o => {
      const next = !o;
      if (next) setSidebarJustOpened(true);
      else {
        setOpenMenu(null);
        setDelayedOpenMenu(null);
        setSidebarJustOpened(false);
      }
      return next;
    });
  };

  useEffect(() => {
    setOpenMenu(delayedOpenMenu);
  }, [delayedOpenMenu]);

  const subButtonStyle =
    "flex rounded-lg hover:shadow-[-12px_5px_0px_rgba(0,0,0,1)] items-center mt-1 mb-1 w-[95%] text-left px-2 py-2 text-sm font-medium text-white hover:bg-[#2D4D8B]/70 hover:text-[#00FFFF] hover:font-bold";
  const collapsedButtonStyle =
    "flex rounded-lg items-center justify-center w-full h-[60px] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] transition-shadow border-black border-4 font-bold px-0";

  // Highlight classes
  const highlightClass = "bg-[#1A2F4E] text-[#00FFFF] font-bold";
  const normalClass = "bg-[#2D4D8B] text-white hover:bg-[#1A2F4E] hover:text-[#00FFFF]";

  return (
    <div className="flex flex-col min-h-screen container-texture-bg overflow-x-hidden pt-8">
      {/* Header */}
      <div className="flex items-center gap-4 third-container-texture-bg justify-between px-6 py-4 w-full shadow-[0px_16px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="flex items-center">
          <Image src="/logo.png" width={70} height={70} alt="SCMT Logo" style={{ objectFit: "contain" }} />
          <div className="font-bold text-4xl text-[#162f5c] ml-2">SCMT</div>
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
              className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-xl text-[#faf9f6] hover:text-[#00FFFF] border-black border-4 px-4 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              <Search size={24} />
            </button>
          )}
          <button onClick={() => router.push("/")} className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white border-black border-4 px-6 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow">
            home
          </button>
          <button onClick={() => router.push("/main/services&info")} className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white border-black border-4 px-6 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow">
            services and information
          </button>
          <button onClick={() => router.push("/main/aboutus")} className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white border-black border-4 px-6 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow">
            about us
          </button>
          <button onClick={() => router.push("/main/dashboard")} className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white border-black border-4 px-6 py-2 font-bold shadow shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow">
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
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200"
                >
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Personal Information
                </button>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200"
                >
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Account Settings
                </button>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200"
                >
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  Company Details
                </button>
                {session.user.role !== "CLIENT" && (
                  <button
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200"
                  >
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
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors duration-200"
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

      {/* Sidebar + toggle */}
      <div className="relative flex-1">
        <div
          ref={sidebarRef}
          className={`${
            isOpen
              ? "w-[301px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),-15px_20px_0px_rgba(0,0,0,1)]"
              : "w-[81px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),15px_8px_0px_rgba(0,0,0,1)]"
          } min-h-0 overflow-hidden bg-[#0A1A2F] rounded-lg fixed left-1 top-[190px] border-t-4 border-r-4 border-b-4 border-[#2D4D8B] transition-width duration-300`}
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
                    className={`
                      border-black border-4 px-4 py-2 font-bold shadow-md shadow-black/100 transition-shadow w-full flex items-center justify-between
                      ${
                        isMenuItemActive(pathname, item)
                          ? highlightClass
                          : normalClass
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="mt-1">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.sub.length > 0 &&
                      (openMenu === item.key ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                  </button>
                  <div
                    className={`
                      ml-8 transition-all duration-300
                      ${openMenu === item.key ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}
                    `}
                  >
                    {item.sub.map((sub) => {
                      const active = isPathActive(pathname, sub.pathPattern);
                      return (
                        <button
                          key={sub.key}
                          onClick={() => router.push(sub.pathPattern)}
                          className={`
                            ${subButtonStyle} text-md font-bold
                            ${
                              active
                                ? "border-l-4 border-[#00FFFF] pl-4 bg-[#00FFFF]/20 text-[#2D4D8B]"
                                : "border-l border-white/20 pl-4"
                            }
                          `}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button
                  key={item.key}
                  onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => setDelayedOpenMenu(item.key), 400);
                  }}
                  className={`
                    ${collapsedButtonStyle}
                    ${
                      isMenuItemActive(pathname, item)
                        ? highlightClass + " shadow-[-8px_4px_12px_rgba(0,0,0,0.4)]"
                        : normalClass + " shadow-[-8px_4px_12px_rgba(0,0,0,0.4)]"
                    }
                  `}
                  title={item.label}
                >
                  {item.icon}
                </button>
              )
            )}
          </div>
        </div>

        <button
          onClick={handleSidebarToggle}
          className="w-8 h-8 bg-[#2D4D8B] text-white rounded-r-full fixed z-50"
          style={{
            left: isOpen ? "305px" : "85px",
            top: "198px",
            transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {isOpen ? <ArrowBigLeft size={24} /> : <ArrowBigRight size={24} />}
        </button>

        {/* Main Content */}
        <div className={`pt-[96px] pb-6 transition-all duration-300 ${isOpen ? "pl-[300px]" : "pl-[80px]"}`}>
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full third-container-texture-bg mb-8 border-t-7 border-black shadow-[0px_20px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center py-6 px-6 relative">
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-3 font-bold text-4xl text-[#162f5c]">
              <Image src="/logo.png" width={70} height={70} alt="SCMT Logo" style={{ objectFit: "contain" }} />
              <span className="align-middle">SCMT</span>
            </div>
            <div className="text-black font-bold text-lg uppercase hover:underline cursor-pointer">terms and conditions</div>
            <div className="text-black font-bold text-lg uppercase hover:underline cursor-pointer">privacy policy</div>
            <div className="text-black font-bold text-lg uppercase hover:underline cursor-pointer">cookie policy</div>
          </div>
        </div>
        <div className="text-white py-2 border-t-2 border-b-2 font-bold text-md uppercase flex justify-center items-center bg-[#1e3a8a]">
          Copyright © 2025 SCMT
        </div>
      </footer>
    </div>
  );
}