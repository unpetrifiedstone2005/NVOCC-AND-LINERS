"use client"
import React, { useState } from "react";
import { Map } from "lucide-react";
import Link from "next/link";


export function ByVesselComponent(){
    const [vesselValue, setVesselValue] = useState("");
    const [showMainlineOnly, setShowMainlineOnly] = useState(false);
  

    return (
        <div>
             <div className="max-w-[1600.24px] mx-auto w-full px-4 ">
                        <div
                          className="
                            flex flex-col
                            font-bold
                            rounded-xl
                            p-10
                          "
                        >
                            <div className="flex items-center mb-2 border-[#FFB343] ">
                   
                                <span className=" uppercase text-white border-white
                            border-2 rounded-lg font-semibold text-lg bg-[#0A1A2F] px-4 py-2  shadow-[20px_20px_0px_rgba(0,0,0,1)]">
                                track  {'\u00A0\u00A0>\u00A0\u00A0'} by vessel  
                                </span>
                            </div>
                            <br/>   

                          <div
                             className="
                                 rounded-xl shadow-[30px_30px_0px_rgba(0,0,0,1)]
                                p-6  py-[26px] border-white
                            border-2
                            "

                            style={{
                                        backgroundImage: `
                                            linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
                                            linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
                                        `,
                                        backgroundBlendMode: 'overlay',
                                    }}
    
                            >
                            
                            
                            {/* Header with icon + text */}
                            <div className="flex items-center mb-2">
                                <Map size={30} className="text-[#faf9f6] mr-2" />
                                <div className="uppercase text-[#faf9f6] font-bold text-3xl">
                                  {`\u00A0`} vessel {`\u00A0`}tracker 
                                </div>
                            </div><br/>
                            <div className="uppercase text-white text-md font-light">
                                Please select a mainline or feeder vessel to show the current schedule.
                            </div><br/>
                            <br/>

                            

                    {/* Input and Button Row */}
                    <div className="flex items-center justify-center space-y-4 md:space-y-0">
                        {/* Input Field */}
                        <div className="uppercase text-white text-md font-bold">
                            {showMainlineOnly ? "Mainline Vessels:" : "Feeder Vessels:"} {`\u00A0\u00A0`} 
                        </div> 
                        <div >
                        
                            <input
                                type="text"
                                value={vesselValue}
                                placeholder="(e.g. HLCU1234567)"
                                onChange={(e) => setVesselValue(e.target.value)}
                                className="
                                bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6] rounded-xl
                                text-white 
                               shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] 
                                transition-shadow 
                                border-black border-4 
                                px-4 py-1  
                                placeholder: opacity-90
                                placeholder:  font-light
                                "
                            />
                        </div>

                        <button
                            onClick={() => setShowMainlineOnly(!showMainlineOnly)}
                            className=" uppercase
                            text-[#faf9f6] hover:bg-[#2D4D8B] hover:text-[#00FFFF] rounded-xl
                            flex items-center bg-[#0A1A2F] 
                            shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                            transition-shadow border-black border-4 
                            px-6 py-2 font-bold 
                            hover:font-bold ml-5
                            opacity-90
                            "
                        >
                            {showMainlineOnly ? "Show Feeder only" : "Show Mainliner only"}
                        </button>

                        
                    </div>
                    <div className="flex justify-end space-x-6">
                        <button
                            className=" uppercase bg-[#0A1A2F] opacity-90 hover:bg-[#2D4D8B] rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold"
                        >
                            Find
                    </button>
                    <button 
                            className="uppercase bg-[#0A1A2F] opacity-90 hover:bg-[#2D4D8B] rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold"
                        >
                            Clear
                    </button>
                    </div>
                    
                </div>
                
            </div>
           
        </div>
    </div>
    )
}