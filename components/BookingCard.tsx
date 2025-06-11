"use client";
import React from "react";
import { Book } from "lucide-react";

export const BookingCard: React.FC = () => {
  return (
    <div  className="p-6 border-2 border-white rounded-xl shadow-[15px_15px_0px_rgba(0,0,0,1)]"
        style={{
          backgroundImage: `
            linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
            linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
          `,
          backgroundBlendMode: 'overlay',
      }}>
      {/* Icon + Title (on top line) */}
      <div className="flex items-center mb-4 ">
        <Book size={24} className="text-[#faf9f6] mr-2" />
        <span className="text-[#faf9f6] font-semibold text-xl">
          BOOKING
        </span>
      </div>

      {/* Text + Button (below) */}
      <div className="flex items-center justify-between space-x-56">
        <div className="text-[#faf9f6] text-sm">
          BOOK SMARTER. BOOK FASTER.
        </div>
        <button className="uppercase bg-[#0A1A2F] hover:bg-[#2D4D8B] opacity-90 rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold whitespace:nowrap">
          BOOK NOW
        </button>
      </div>
    </div>
  );
};
