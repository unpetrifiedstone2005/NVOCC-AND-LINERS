"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  sub: Array<{ key: string; label: string; pathPattern: string }>;
  pathPattern?: string; // Add optional pathPattern for menu items without subs
};

const menuData: MenuItem[] = [
  {
    key: "quotes",
    label: "QUOTES",
    icon: <FileText size={24} />,
    sub: [
      { label: "NEW QUOTE", key: "new_quote", pathPattern: "/main/quotes/new" },
      { label: "MY QUOTATIONS", key: "my_quotations", pathPattern: "/main/quotes/my" },
      { label: "SPECIAL CARGO QUOTES", key: "special_cargo", pathPattern: "/main/quotes/special" },
      { label: "TARIFFS", key: "tariffs", pathPattern: "/main/quotes/tariffs" },
      { label: "DETENTION AND DEMURRAGE TARIFFS", key: "demurrage", pathPattern: "/main/quotes/demurrage" },
      { label: "RATE OF EXCHANGE TARIFFS", key: "exchange_tariffs", pathPattern: "/main/quotes/exchange" },
    ],
  },
  {
    key: "schedule",
    label: "SCHEDULE",
    icon: <Calendar size={24} />,
    pathPattern: "/main/schedules", // Changed back to plural
    sub: [],
  },
  {
    key: "book",
    label: "BOOK",
    icon: <Book size={24} />,
    sub: [
      { label: "NEW BOOKING", key: "book_new", pathPattern: "/main/book/new" },
      { label: "MY BOOKINGS", key: "book_my", pathPattern: "/main/book/my" },
      { label: "SPECIAL CARGO BOOKING", key: "book_special_cargo", pathPattern: "/main/book/special" },
      { label: "BOOKING TARIFFS", key: "book_tariffs", pathPattern: "/main/book/tariffs" },
      { label: "DETENTION AND DEMURRAGE", key: "book_demurrage", pathPattern: "/main/book/demurrage" },
      { label: "RATE OF EXCHANGE TARIFFS", key: "book_exchange_tariffs", pathPattern: "/main/book/exchange" },
    ],
  },
  {
    key: "documentation",
    label: "DOCUMENTATION",
    icon: <ClipboardList size={24} />,
    sub: [
      { label: "MY SHIPMENT", key: "my_shipment", pathPattern: "/main/documentation/shipment" },
      { label: "VERIFIED GROSS MASS", key: "gross_mass", pathPattern: "/main/documentation/mass" },
      { label: "SHIPPING INSTRUCTIONS", key: "shipping_instructions", pathPattern: "/main/documentation/instructions" },
      { label: "BL DRAFT APPROVAL", key: "bl_approval", pathPattern: "/main/documentation/approval" },
      { label: "CUSTOMS STATUS", key: "customs_status", pathPattern: "/main/documentation/customs-status" },
      { label: "CUSTOMS REFERENCE", key: "customs_reference", pathPattern: "/main/documentation/customs-ref" },
      { label: "CARGO CLAIMS", key: "cargo_claims", pathPattern: "/main/documentation/claims" },
      { label: "ELECTRONIC BILL OF LADING", key: "e_bl", pathPattern: "/main/documentation/ebl" },
    ],
  },
  {
    key: "finance",
    label: "FINANCE",
    icon: <DollarSign size={24} />,
    sub: [
      { label: "MY INVOICE", key: "my_invoice", pathPattern: "/main/finance/invoice" },
      { label: "MY DISPUTES", key: "my_disputes", pathPattern: "/main/finance/disputes" },
    ],
  },
  {
    key: "track",
    label: "TRACK",
    icon: <Map size={24} />,
    sub: [
      { label: "BY BOOKING", key: "by_booking", pathPattern: "/main/tracking/byBooking" },
      { label: "BY CONTAINER", key: "by_container", pathPattern: "/main/tracking/byContainer" },
      { label: "BY VESSEL", key: "by_vessel", pathPattern: "/main/tracking/byVessel" },
      { label: "SUBSCRIPTION", key: "subscription", pathPattern: "/main/tracking/subscription" },
      { label: "VESSEL TRACKER", key: "vessel_tracker", pathPattern: "/main/tracking/vesselTracker" },
      { label: "LIVE POSITION", key: "live_position", pathPattern: "/main/tracking/livePosition" },
    ],
  },
];

// Simple function to check if a path is active
function isPathActive(currentPath: string, targetPath: string): boolean {
  return currentPath === targetPath || currentPath.startsWith(targetPath);
}

// Updated function to find which menu should be open based on current path
function getActiveMenuKey(pathname: string): string | null {
  for (const menu of menuData) {
    // Check if the menu itself has a pathPattern and matches
    if (menu.pathPattern && isPathActive(pathname, menu.pathPattern)) {
      return menu.key;
    }
    // Check submenu items
    for (const sub of menu.sub) {
      if (isPathActive(pathname, sub.pathPattern)) {
        return menu.key;
      }
    }
  }
  return null;
}

// Function to check if a menu item should be highlighted
function isMenuItemActive(pathname: string, menuItem: MenuItem): boolean {
  // If menu has its own pathPattern, check that
  if (menuItem.pathPattern && isPathActive(pathname, menuItem.pathPattern)) {
    return true;
  }
  // Otherwise check if any submenu item is active
  return menuItem.sub.some(sub => isPathActive(pathname, sub.pathPattern));
}

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [delayedOpenMenu, setDelayedOpenMenu] = useState<string | null>(null);
  const [sidebarJustOpened, setSidebarJustOpened] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize the active menu on mount and when pathname changes
  useEffect(() => {
    const activeMenuKey = getActiveMenuKey(pathname);
    setDelayedOpenMenu(activeMenuKey);
  }, [pathname]);

  // Auto-open the menu that contains the active page only when sidebar opens
  useEffect(() => {
    const activeMenuKey = getActiveMenuKey(pathname);
    if (activeMenuKey && sidebarJustOpened) {
      // Wait for sidebar to fully expand (400ms) then open the dropdown
      setTimeout(() => {
        setDelayedOpenMenu(activeMenuKey);
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

  const handleMenuClick = (key: string) => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => setDelayedOpenMenu(key), 400);
    } else {
      // Toggle the menu - if it's open, close it; if it's closed, open it
      const currentOpenMenu = openMenu || delayedOpenMenu;
      if (currentOpenMenu === key) {
        setDelayedOpenMenu(null);
      } else {
        setDelayedOpenMenu(key);
      }
    }
  };

  const handleSidebarToggle = () => {
    setIsOpen((open) => {
      const next = !open;
      if (next) {
        // When opening sidebar, set flag to trigger delayed dropdown opening
        setSidebarJustOpened(true);
      } else {
        // When closing sidebar, immediately close any open menus
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
    "flex rounded-lg hover:shadow-[-12px_5px_0px_rgba(0,0,0,1)] items-center mt-1 mb-1 w-[95%] m text-left px-2 py-2  text-sm font-medium text-white hover:bg-[#2D4D8B]/70 hover:text-[#00FFFF] hover:font-bold";
  const collapsedButtonStyle =
    "flex rounded-lg items-center justify-center w-full h-[60px] bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white shadow-[-8px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] transition-shadow border-black border-4 font-bold shadow-md shadow-black/100 px-0";



  return (
    <div className="flex flex-col min-h-screen container-texture-bg  overflow-x-hidden">
      <div className="w-full flex-1 text-md pt-8 overflow-x-hidden">
        {/* Topbar */}
        <div
          className="flex items-center gap-4 third-container-texture-bg justify-between px-6 py-4 w-full shadow-[0px_16px_0px_0px_rgba(0,0,0,0.8)]"
         
        >
          {/* Logo */}
          <div className="flex items-center">
            <Image
                src="/logo.png"
                width={70}
                height={70}
                alt="SCMT Logo"
                className="inline-block align-middle mb-2"
                style={{ objectFit: 'contain' }}
              />
            <div className="font-bold text-4xl text-[#162f5c] ml-2">SCMT</div>
          </div>

        {/* Middle buttons & search */}
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div
              className="
                flex items-center
                group                                    /* enable group-hover */
                bg-[#2D4D8B] hover:bg-[#1A2F4E]          /* bg change */
                rounded-xl
                text-white hover:text-[#00FFFF]     /* text & hover-text on parent */
                border-black border-4
                px-4 py-2
                font-bold
                shadow shadow-[4px_4px_0px_rgba(0,0,0,1)]
                hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                transition-shadow
              "
            >
              {/* Remove text-white; inherit from parent */}
              <button
                onClick={() => setSearchOpen(false)}
                className="mr-2"                    /* no text-color here */
              >
                <Search size={24} />
              </button>

              {/* Remove text-white here too */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="
                  bg-transparent outline-none
                  w-48
                  placeholder-white/70
                  group-hover:text-[#00FFFF]         /* optional, but parent hover already sets text */
                "
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="
                uppercase
                bg-[#2D4D8B] hover:bg-[#1A2F4E]
                rounded-xl
                text-[#faf9f6] hover:text-[#00FFFF]  /* hover-text on the button itself */
                border-black border-4
                px-4 py-2
                font-bold
                shadow shadow-[4px_4px_0px_rgba(0,0,0,1)]
                hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                transition-shadow
              "
            >
              <Search size={24} />
            </button>
          )}

         <button
         onClick={()=>[
          router.push('/')
         ]}
         className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            home
          </button>
          <button className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
              services and information
          </button>
          <button 
          onClick={()=>[
          router.push('/main/aboutus')
         ]}
          className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            about us
          </button>
          <button 
          onClick={()=>[
          router.push('/main/dashboard')
         ]}
          className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            dashboard
          </button>
        </div>

        <button className="uppercase bg-[#0A5B61] text-lg hover:bg-[#FFB343] rounded-2xl hover:text-[#1c1c1c] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold ">
          log in
        </button>
      </div>

      {/* Sidebar + toggle */}
      <div className="relative flex-1">
        <div
          ref={sidebarRef}
          className={`${
      isOpen
        ? "w-[301px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),-15px_20px_0px_rgba(0,0,0,1)]"
        : "w-[81px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),15px_8px_0px_rgba(0,0,0,1)]"
    } min-h-0 overflow-hidden bg-[#0A1A2F] rounded-lg fixed left-1 top-[190px] border-t-4 border-r-4 border-b-4 border-[#2D4D8B]`}
        style={{
      height: "auto",
      transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    }}

        >
          <div className="flex flex-col">
            {menuData.map((item) =>
              isOpen ? (
                <div key={item.key}>
                  <button
                    onClick={() => handleMenuClick(item.key)}
                    className={`
                      border-black border-4 px-4 py-2 font-bold shadow-md shadow-black/100 
                      hover:font-bold w-full flex items-center justify-between
                      shadow-[-8px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] 
                      transition-shadow
                      ${isMenuItemActive(pathname, item) 
                        ? 'bg-[#1A2F4E] text-[#00FFFF]' 
                        : 'bg-[#2D4D8B] text-white hover:bg-[#1A2F4E] hover:text-[#00FFFF]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="mt-1">{item.icon}</span>
                      <span>
                        {item.label}
                      </span>
                    </div>
                    {item.sub.length > 0 && (
                      <span>
                        {openMenu === item.key ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </span>
                    )}
                  </button>

                  {/* submenu */}
                  <div
                    className={`
                      ml-8 transition-all duration-300
                      ${openMenu === item.key
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                      }
                    `}
                  >
                    {item.sub.map(sub => {
                      // Simple check if this submenu item is active
                      const isActive = isPathActive(pathname, sub.pathPattern);
                      return (
                        <button
                          key={sub.key}
                          className={`
                            ${subButtonStyle} text-md font-bold
                            ${isActive
                              ? "border-l-10 border-l-[#00FFFF] pl-4 bg-[#00FFFF]/20 text-[#2D4D8B]"
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
                    flex rounded-lg items-center justify-center w-full h-[60px] 
                    shadow-[-8px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] 
                    transition-shadow border-black border-4 font-bold shadow-md shadow-black/100 px-0
                    ${isMenuItemActive(pathname, item) 
                      ? 'bg-[#1A2F4E] text-[#00FFFF]' 
                      : 'bg-[#2D4D8B] text-white hover:bg-[#1A2F4E] hover:text-[#00FFFF]'
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
          className={`w-8 h-8 bg-[#2D4D8B] text-white rounded-r-full flex items-center justify-center fixed z-50 ${
              isOpen
                ? ""
                : "shadow-[15px_8px_0px_rgba(0,0,0,1)]"
            }`}
          style={{
            left: isOpen ? "305px" : "85px",
            top: "198px",
            transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {isOpen ? <ArrowBigLeft size={24} /> : <ArrowBigRight size={24} />}
        </button>
  
          {/* main content */}
          <div
            className={`
              pt-[96px] pb-6
              transition-all duration-300
              ${isOpen ? "pl-[300px]" : "pl-[80px]"}
            `}
          >
            {children}
          </div>
          <br/>
          <br/>
        </div>
      </div>

      {/* Footer - Now outside the main content area */}
     <footer className="w-full third-container-texture-bg mb-8 border-t-7 border-black shadow-[0px_20px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center py-6 px-6 relative">
          {/* Centered group */}
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-3 font-bold text-4xl text-[#162f5c]">
              <Image
                src="/logo.png"
                width={70}
                height={70}
                alt="SCMT Logo"
                className="inline-block align-middle mb-2"
                style={{ objectFit: 'contain' }}
              />
              <span className="align-middle">SCMT</span>
            </div>
            <div className="text-black font-bold text-lg uppercase hover:underline cursor-pointer">
              terms and conditions
            </div>
            <div className="text-black font-bold text-lg uppercase hover:underline cursor-pointer">
              privacy policy
            </div>
            <div className="text-black font-bold text-lg uppercase hover:underline cursor-pointer">
              cookie policy
            </div>
          </div>
        </div>
        <div className="text-white py-2 border-t-2 border-b-2 font-bold text-md uppercase flex justify-center items-center bg-[#1e3a8a]">
          Copyright &copy; 2025 SCMT
        </div>
      </footer>
          
    </div>
  );
}