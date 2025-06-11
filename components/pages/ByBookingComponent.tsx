"use client"
import React, { useState } from "react";
import { Map } from "lucide-react";
import Link from "next/link";


export function ByBooking(){
    const [bookingValue, setBookingValue] = useState("");
    const [billValue, setBillValue] = useState("");

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
                            <div className="flex items-center mb-2 "
                            >
                   
                                <span className="text-white border-white
                            border-2 rounded-lg font-semibold text-lg bg-[#0A1A2F] px-4 py-2  shadow-[20px_20px_0px_rgba(0,0,0,1)]"
                                >
                                TRACK  {'\u00A0\u00A0>\u00A0\u00A0'} BY BOOKING
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
                                <div className="text-[#faf9f6] font-bold text-3xl">
                                   {`\u00A0`} TRACING {`\u00A0`} BY {`\u00A0`} BOOKING  
                                </div>
                            </div><br/>
                            <div className="uppercase text-white text-md font-light">
                                Please {`\u00A0`}enter a Booking No. or a Bill of Lading No. to perform your search. {`\u00A0`}Use also the <span className="inline-block px-2"><Link href="/main/tracker/vesseltracker" className="text-[#FFB343] hover:text-[#00FFFF] hover:underline">Vessel Tracing</Link></span> for the current vessel schedule
                            </div><br/>
                            <br/>

                            

                    {/* Input and Button Row */}
                    <div className="flex flex-wrap items-center space-y-4 md:space-y-0">
                        {/* Input Field */}
                        <div className="uppercase text-white text-md font-bold">Booking no: {`\u00A0\u00A0`} </div> 
                        <div className="flex-1">
                        
                            <input
                                type="text"
                                value={bookingValue}
                                onChange={(e) => setBookingValue(e.target.value)}
                                className="
                                bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6]
                                text-white 
                                shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] 
                                transition-shadow 
                                border-black border-4 
                                px-2 py-1
                                rounded-xl                                
                                placeholder: opacity-90
                                placeholder:  font-light
                                "
                            />
                        </div>

                        <div className="uppercase text-white text-md font-bold">Bill of lading no: {`\u00A0\u00A0`} </div> 
                        <div className="flex-1">
                        
                            <input
                                type="text"
                                value={billValue}
                                onChange={(e) => setBillValue(e.target.value)}
                                className="
                                bg-[#0A1A2F] hover:bg-[#2D4D8B] hover:text-[#00FFFF] placeholder-[#faf9f6]
                                text-white 
                                shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] 
                                transition-shadow 
                                border-black border-4 
                                px-2 py-1 
                                rounded-xl 
                                placeholder: opacity-90
                                placeholder:  font-light
                                opacity-90
                                "
                            />
                        </div>
                        
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