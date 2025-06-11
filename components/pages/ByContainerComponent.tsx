"use client"
import React, { useState } from "react";
import { Map } from "lucide-react";
import Link from "next/link";


export function ByContainerComponent(){
    const [containerValue, setContainerValue] = useState("");
  

    return (
        <div>
             <div className="max-w-[1600.24px] mx-auto w-full px-4 ">
                        <div
                          className="p-10 rounded-xl "
                        >
                            <div className="flex items-center mb-2 border-white "
                            >
                   
                                <span className="uppercase rounded-lg text-white bg-[#0A1A2F] font-semibold text-lg border-white border-2 px-4 py-2 shadow-[20px_20px_0px_rgba(0,0,0,1)] "
                                >
                                track  {'\u00A0\u00A0>\u00A0\u00A0'} by container
                                </span>
                            </div>
                            <br/>   

                          <div
                            className="
                                border-white border-2 
                                shadow-[inset_0px_20px_18px_20px_rgba(0,0,0,0.5),30px_30px_0px_rgba(0,0,0,1)] 
                                p-6  py-[26px] 
                                rounded-xl
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
                                   {`\u00A0`} tracing {`\u00A0`} by {`\u00A0`} container  
                                </div>
                            </div><br/>
                            <div className="uppercase text-white text-md font-light">
                                Enter a container number to receive tracing information. {`\u00A0`}Use also the <span className="inline-block px-2"><Link href="/main/tracker/vesseltracker" className="text-[#FFB343] hover:text-[#00FFFF] hover:underline">Vessel Tracing</Link></span> for the current vessel schedule
                            </div><br/>
                            <br/>

                            

                    {/* Input and Button Row */}
                    <div className="flex flex-wrap items-center space-y-4 md:space-y-0">
                        {/* Input Field */}
                        <div className="uppercase text-white text-md font-bold">container no: {`\u00A0\u00A0`} </div> 
                        <div className="flex-1">
                        
                            <input
                                type="text"
                                value={containerValue}
                                placeholder="(e.g. HLCU1234567)"
                                onChange={(e) => setContainerValue(e.target.value)}
                                className="
                                bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6]
                                text-[#faf9f6] 
                                shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)]
                                transition-shadow 
                                border-black border-4
                                rounded-xl 
                                px-3 py-1  
                                placeholder: opacity-90
                                placeholder:  font-light
                                "
                            />
                        </div>

                        
                    </div>
                    <div className="flex justify-end space-x-6">
                        <button
                            className="uppercase bg-[#0A1A2F] opacity-90 hover:bg-[#2D4D8B] rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold"
                        >
                            Find
                    </button>
                    <button 
                            className="uppercase bg-[#0A1A2F] opacity-90 hover:bg-[#2D4D8B] rounded-3xl hover:text-[#00FFFF] text-white shadow  shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-6 py-2 font-bold hover:font-bold "
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