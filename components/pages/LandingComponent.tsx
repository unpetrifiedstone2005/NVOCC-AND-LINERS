"use client";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

import { BookingCard } from "../BookingCard";
import { QuotationCard } from "../QuotationCard";
import { SchedulesCard } from "../SchedulesCard";
import { TrackingCard } from "../TrackingCard";

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  sub: Array<{ key: string; label: string }>;
};

const menuData: MenuItem[] = [
  {
    key: "quotes",
    label: "QUOTES",
    icon: <FileText size={24} />,
    sub: [
      { label: "NEW QUOTE", key: "new_quote" },
      { label: "MY QUOTATIONS", key: "my_quotations" },
      { label: "SPECIAL CARGO QUOTES", key: "special_cargo" },
      { label: "TARIFFS", key: "tariffs" },
      { label: "DETENTION AND DEMURRAGE TARIFFS", key: "demurrage" },
      { label: "RATE OF EXCHANGE TARIFFS", key: "exchange_tariffs" },
    ],
  },
  {
    key: "schedule",
    label: "SCHEDULE",
    icon: <Calendar size={24} />,
    sub: [],
  },
  {
    key: "book",
    label: "BOOK",
    icon: <Book size={24} />,
    sub: [
      { label: "NEW QUOTE", key: "book_new_quote" },
      { label: "MY QUOTATIONS", key: "book_my_quotations" },
      { label: "SPECIAL CARGO QUOTES", key: "book_special_cargo" },
      { label: "TARIFFS", key: "book_tariffs" },
      { label: "DETENTION AND DEMURRAGE", key: "book_demurrage" },
      { label: "RATE OF EXCHANGE TARIFFS", key: "book_exchange_tariffs" },
    ],
  },
  {
    key: "documentation",
    label: "DOCUMENTATION",
    icon: <ClipboardList size={24} />,
    sub: [
      { label: "MY SHIPMENT", key: "my_shipment" },
      { label: "VERIFIED GROSS MASS", key: "gross_mass" },
      { label: "SHIPPING INSTRUCTIONS", key: "shipping_instructions" },
      { label: "BL DRAFT APPROVAL", key: "bl_approval" },
      { label: "CUSTOMS STATUS", key: "customs_status" },
      { label: "CUSTOMS REFERENCE", key: "customs_reference" },
      { label: "CARGO CLAIMS", key: "cargo_claims" },
      { label: "ELECTRONIC BILL OF LADING", key: "e_bl" },
    ],
  },
  {
    key: "finance",
    label: "FINANCE",
    icon: <DollarSign size={24} />,
    sub: [
      { label: "MY INVOICE", key: "my_invoice" },
      { label: "MY DISPUTES", key: "my_disputes" },
    ],
  },
  {
    key: "track",
    label: "TRACK",
    icon: <Map size={24} />,
    sub: [
      { label: "BY BOOKING", key: "by_booking" },
      { label: "BY CONTAINER", key: "by_container" },
      { label: "SUBSCRIPTION", key: "subscription" },
      { label: "VESSEL TRACKER", key: "vessel_tracker" },
      { label: "LIVE POSITION", key: "live_position" },
    ],
  },
];

export function LandingComponent() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [delayedOpenMenu, setDelayedOpenMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    "flex rounded-lg hover:shadow-[-12px_5px_0px_rgba(0,0,0,1)] items-center mt-1 mb-1 w-[95%] m text-left px-2 py-2  text-sm font-medium text-white hover:bg-[#2D4D8B]/70 hover:text-[#00FFFF] hover:font-bold";
  const collapsedButtonStyle =
    "flex rounded-lg items-center justify-center w-full h-[60px] bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white shadow-[-8px_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[-12px_6px_16px_rgba(0,0,0,0.5)] transition-shadow border-black border-4 font-bold shadow-md shadow-black/100 px-0";

  return (
    <div className="w-full min-h-screen container-texture-bg text-md pt-8 overflow-x-hidden flex flex-col">
      <div
        className="flex items-center gap-4 third-container-texture-bg x justify-between px-6 py-4 w-full shadow-[0px_16px_0px_0px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center">
          

          <div className="font-bold text-4xl text-[#1e3a8a] ml-2">SCMT</div>
        </div>

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
                text-white hover:text-[#00FFFF]  /* hover-text on the button itself */
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

          <button className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            home
          </button>
          <button className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            services and information
          </button>
          <button className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            about us
          </button>
          <button className="uppercase bg-[#2D4D8B] hover:bg-[#1A2F4E] rounded-2xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold">
            dashboard
          </button>
        </div>

        <button className="uppercase bg-[#1c1c1c] text-lg hover:bg-[#FFB343] rounded-2xl hover:text-[#1c1c1c] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold ">
          log in
        </button>
      </div>

      <div className="flex-1">
        <div className="relative">
         <div
              ref={sidebarRef}
              className={`${
                isOpen
                  ? "w-[300px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),-15px_20px_0px_rgba(0,0,0,1)]"
                  : "w-[80px] shadow-[inset_0_0_20px_20px_rgba(0,0,0,0.7),15px_8px_0px_rgba(0,0,0,1)]"
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
                        className="rounded-lg bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[[10px_8px_0px_rgba(0,0,0,1)]] transition-shadow border-black border-4 px-4 py-2 font-bold hover:font-bold w-full flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="mt-1">{item.icon}</span>
                          <span>{item.label}</span>
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
                      <div
                        className="ml-8 pl-4 border-l border-[#faf9f6]/20 overflow-hidden transition-all duration-300"
                        style={{
                          maxHeight: openMenu === item.key ? "500px" : "0px",
                          opacity: openMenu === item.key ? "1" : "0",
                        }}
                      >
                        {item.sub.map((sub) => (
                          <button key={sub.key} className={`${subButtonStyle} text-md font-bold`}>
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
    onClick={() => setIsOpen((open) => !open)}
    className={`w-8 h-8 bg-[#2D4D8B] text-white rounded-r-full flex items-center justify-center fixed z-50 ${
      isOpen
        ? ""
        : "shadow-[15px_8px_0px_rgba(0,0,0,1)]"
    }`}
    style={{
      left: isOpen ? "301px" : "81px",
      top: "198px",
      transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    }}
  >
    {isOpen ? <ArrowBigLeft size={24} className="" /> : <ArrowBigRight size={24} />}
  </button>



          {/* Main Content  */}

          <div
            className={`
              pt-[96px]
              transition-all duration-300
              ${isOpen ? "pl-[300px]" : "pl-[80px]"}
            `}
          >
            <br/>
            <div className="max-w-[1600.24px] mx-auto w-full px-4">
              <div
                className="
                  flex flex-col
                  font-bold gap-4
                "
              >
                <div className="flex justify-center gap-8">
                  <TrackingCard />
                  <BookingCard />
                </div>
                <div className="flex justify-center gap-8 mt-4">
                  <SchedulesCard />
                  <QuotationCard />
                </div>
              </div>
            </div>
            <br/>
            <br/>
            
              <div className="max-w-[1600.24px] mx-auto w-full px-4">
              <div
                className="
                  flex flex-col
                  font-bold gap-4
                "
              >
                <div className="flex justify-center gap-8">
                  <TrackingCard />
                  <BookingCard />
                </div>
                <div className="flex justify-center gap-8 mt-4">
                  <SchedulesCard />
                  <QuotationCard />
                </div>
              </div>
            </div>
   
          <br/>
          <br/>
        </div>
      </div>
    </div>
    

            <footer className=" w-full third-container-texture-bg mb-8 justify-center border-t-7 border-black shadow-[0px_20px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center py-[26px] p-6 justify-center relative">
                            {/* Centered group */}
                            <div className="flex space-x-10 items-center">
                              <div className="flex space-x-3 font-bold text-4xl text-[#1e3a8a] ml-2">
                                SCMT
                              </div>
                              <div className="text-black-900 hover:underline font-bold text-lg uppercase">
                                terms and conditions
                              </div>
                              <div className="text-black-900 hover:underline font-bold text-lg uppercase">
                                privacy policy
                              </div>
                              <div className="text-black-900 hover:underline font-bold text-lg uppercase">
                                cookie policy
                              </div>
                            </div>
                            {/* Right-aligned item (if needed) */}
                            {/* <div className="text-[#faf9f6] font-bold text-md uppercase absolute right-6">
                              Contact Info:
                            </div> */}
                          </div>
                
                          <div className="text-white py-1  border-t-2 border-b-2 font-bold text-md uppercase flex justify-center items-center bg-[#1e3a8a]">
                            Copyright &copy; 2025 Afcont
                          </div>
            </footer>
            <br/>
            <br/>

    </div>
  );
}