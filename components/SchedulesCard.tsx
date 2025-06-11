// components/SchedulesCard.tsx
"use client";
import React, { useState, useRef } from "react";
import { Calendar } from "lucide-react";

export const SchedulesCard: React.FC = () => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [shipDate, setShipDate] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format the date for display
  const displayDate = shipDate
    ? new Date(shipDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  // Handle date picker click
  const handleDateClick = () => {
    if (dateInputRef.current) {
      try {
        if (dateInputRef.current.showPicker) {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.click();
        }
      } catch (error) {
        // Fallback if showPicker fails
        dateInputRef.current.click();
      }
    }
  };

  return (
    <div
     className="p-6 border-2 border-white rounded-xl shadow-[15px_15px_0px_rgba(0,0,0,1)]"
        style={{
          backgroundImage: `
            linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
            linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
          `,
          backgroundBlendMode: 'overlay',
      }}
>
      {/* Header with icon + text */}
      <div className="flex items-center mb-6 text-xl">
        <Calendar size={24} className="text-white mr-2" />
        <span className="text-white font-semibold">
          SCHEDULES
        </span>
      </div>

      {/* Inputs Row */}
      <div className="flex flex-wrap items-end space-y-4 md:space-y-0 space-x-7 ">
        {/* From Input */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm text-white mb-1">FROM</label>
          <input
            type="text"
            placeholder="Location"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
            className="
              w-full rounded-xl bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6]
              text-white 
              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow  placeholder:font-light
              
              border-black border-4 
              px-5 py-2 font-bold 
              placeholder: opacity-90
              opacity-90
            "
          />
        </div>

        {/* To Input */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm text-white mb-1">TO</label>
          <input
            type="text"
            placeholder="Location"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
            className="
             w-full rounded-xl bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6]
              text-white 
              shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] placeholder:font-light
              transition-shadow 
              border-black border-4 
              px-5 py-2 font-bold 
              placeholder: opacity-90
              opacity-90
            "
          />
        </div>

        {/* Date Picker */}
        {/* Date Picker */}
<div className="flex-1 min-w-[120px]">
  <label className="block text-sm text-white mb-1 ">DATE</label>
  <div className="relative group">
    <input
      id="shipDate"
      type="date"
      value={shipDate}
      onChange={(e) => setShipDate(e.target.value)}
      ref={dateInputRef}
      className="
        w-full bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF]
        text-white
        rounded-xl 
        shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow
        border-black border-4 px-3 py-2 font-bold 
        [&::-webkit-calendar-picker-indicator]:opacity-0
        [&::-webkit-calendar-picker-indicator]:absolute
        [&::-webkit-calendar-picker-indicator]:right-2
        [&::-webkit-calendar-picker-indicator]:w-5
        [&::-webkit-calendar-picker-indicator]:h-5  
        [&::-webkit-calendar-picker-indicator]:cursor-pointer
        placeholder: opacity-90
        placeholder: font-light
        opacity-90
      "
      style={{
        colorScheme: 'dark'
      }}
    />
    <div 
      className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
      onClick={handleDateClick}
    >
      <Calendar size={20} className="text-white group-hover:text-[#00FFFF] pointer-events-none mr-2" />
    </div>
  </div>
</div>


        {/* Find Button */}
        <div className="flex-shrink-0">
          <button
              className="uppercase bg-[#0A1A2F] opacity-90 hover:bg-[#2D4D8B] rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold"
            >
            FIND
          </button>
        </div>
      </div>
    </div>
  );
};