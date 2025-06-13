"use client";
import React, { useState } from "react";
import { Map } from "lucide-react";

export const TrackingCard: React.FC = () => {
  const [trackingValue, setTrackingValue] = useState("");

  return (
    <div
        className="p-6 rounded-xl shadow-[15px_15px_0px_rgba(0,0,0,1)] border-2 border-white"
        style={{
          backgroundImage: `
            linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
            linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
          `,
          backgroundBlendMode: 'overlay',
      }}>
  
      {/* Header with icon + text */}
      <div className="flex items-center mb-2">
        <Map size={24} className="text-[#faf9f6] mr-2" />
        <span className="text-[#faf9f6] font-semibold text-xl">
          TRACKING
        </span>
      </div>

      {/* Description */}
      <p className="text-[#faf9f6] text-sm mb-4">
        ENTER A CONTAINER-/ BOOKING- or B/L-NUMBER
      </p>

      {/* Input and Button Row */}
      <div className="flex flex-wrap items-end space-y-4 md:space-y-0 md:space-x-55 ">
        {/* Input Field */}
        <div className="flex-1 min-w-[500px]">
          <input
            type="text"
            placeholder="Container-/ Booking- or B/L-Number"
            value={trackingValue}
            onChange={(e) => setTrackingValue(e.target.value)}
            className="
              w-full rounded-xl bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6]
              text-white 
              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] placeholder:font-light
              transition-shadow 
              border-black border-4 
              px-3 py-2 font-bold 
              placeholder: opacity-90
              opacity-90
            "
          />
        </div>

        {/* Track Button */}
        <div className="flex-shrink-0">
          <button
            className="
              uppercase bg-[#0A1A2F] hover:bg-[#2D4D8B] opacity-90 rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold
            "
          >
            TRACK
          </button>
        </div>
      </div>
    </div>
  );
};
