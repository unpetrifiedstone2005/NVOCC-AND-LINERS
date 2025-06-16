"use client"

import React, { useState, useEffect } from "react";
import {
  Ship,
  Container,
  Truck,
  Droplets,
  Anchor,
  Package,
  Globe,
  Shield,
  Award,
  Users,
  ArrowRight,
  Star,
  BookOpenText,
} from "lucide-react";

// Types
interface Service {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  features: string[];
}
interface FleetVessel {
  name: string;
  type: string;
  capacity: string;
}

// Data
const services: Service[] = [
  {
    icon: Container,
    title: "Container Shipping",
    description: "FCL & LCL solutions with regular international routes",
    features: ["Import/Export", "Door-to-Door", "Global Network"],
  },
  {
    icon: Package,
    title: "Bulk & General Cargo",
    description: "Specialized handling of bulk commodities and heavy machinery",
    features: ["Grains & Minerals", "Project Cargo", "Heavy Equipment"],
  },
  {
    icon: Droplets,
    title: "Oil & Liquid Tankers",
    description: "Safe transport of crude oil and petroleum products",
    features: ["Crude Oil", "Chemicals", "IMO Compliance"],
  },
  {
    icon: Ship,
    title: "Port & Logistics",
    description: "Complete port services and multimodal logistics",
    features: ["Stevedoring", "Warehousing", "Customs Clearance"],
  },
];

const flagshipVessels: FleetVessel[] = [
  { name: "BAGHDAD", type: "Container", capacity: "2,500 TEU" },
  { name: "BASRAH", type: "General Cargo", capacity: "15,000 DWT" },
  { name: "AL MOTHANNA", type: "Oil Tanker", capacity: "35,000 DWT" },
  { name: "AL-HADBAA", type: "Bulk Carrier", capacity: "25,000 DWT" },
];

const advantages = [
  { icon: Shield, title: "Government Backing", value: "Ministry Support" },
  { icon: Globe, title: "Global Network", value: "45+ Ports" },
  { icon: Users, title: "70+ Years", value: "Experience" },
  { icon: Award, title: "IMO Certified", value: "Standards" },
];

const cardGradientStyle = {
  backgroundImage: `
    linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
    linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
  `,
  backgroundBlendMode: "overlay",
};

export function ServicesInfoComponent() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full max-w-[1600.24px] mx-auto min-h-screen text-white uppercase">
      {/* Header & Quick Stats */}
      <header className="py-14 px-6 md:px-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Main title & mission */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
                <div className="rounded-full bg-[#1A2A4A] p-3" style={cardGradientStyle} >
                  <BookOpenText height={50} width={50}  className="text-[#00FFFF]" />
                </div>           
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
              SCMT Maritime
              <span className="block text-cyan-400 mt-2">Services & Fleet</span>
            </h1>
            <p className="text-lg text-slate-100 mb-4 max-w-xl leading-relaxed mx-auto md:mx-0">
              Connecting Iraq to the world with trusted maritime transport, logistics, and flagship vessels.
            </p>
          </div>
          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-[#1A2A4A] rounded-2xl border border-slate-700 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center px-8 py-5 flex flex-col items-center" style={cardGradientStyle}>
              <div className="text-2xl font-bold text-cyan-400">156</div>
              <div className="text-slate-100 text-sm mt-1">Total Vessels</div>
            </div>
            <div className="bg-[#1A2A4A] rounded-2xl border border-slate-700 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center px-8 py-5 flex flex-col items-center" style={cardGradientStyle}>
              <div className="text-2xl font-bold text-cyan-400">2.1M</div>
              <div className="text-slate-100 text-sm mt-1">TEU Capacity</div>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
          <button className="group uppercase bg-[#600f9e] hover:bg-[#491174] px-7 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 text-white shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow">
            <span>Sign in</span>
          </button>
          <button className="group uppercase bg-[#2a72dc] hover:bg-[#00FFFF] hover:text-black px-7 py-3 rounded-lg font-semibold flex items-center justify-center shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow">
            Contact Us
          </button>
        </div>
      </header>

      {/* Services - horizontal scroll section */}
      <section
        id="services"
        className={`py-14 px-6 md:px-16 bg-[#121c2d] rounded-3xl shadow-[0px_30px_0px_rgba(0,0,0,1)] mt-10 mb-16 transition-all duration-1000 ${isVisible.services ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={cardGradientStyle}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Our Core Maritime Services
        </h2>
        <div className="flex overflow-x-auto gap-8 pb-2 hide-scrollbar snap-x">
          {services.map((service, idx) => {
            const IconComponent = service.icon;
            return (
              <div
                key={idx}
                className="min-w-[320px] max-w-[350px]  rounded-2xl p-7 flex flex-col shadow-[20px_20px_0px_rgba(0,0,0,1)]   transition-all duration-300 snap-center"
                style={cardGradientStyle}
              >
                <div className="flex items-center mb-5">
                  <span className="w-12 h-12 bg-[#2a72dc] rounded-lg flex items-center justify-center shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                    <IconComponent className="w-7 h-7 text-white" />
                  </span>
                  <h4 className="text-xl font-bold ml-4">{service.title}</h4>
                </div>
                <p className="text-white mb-4 text-sm">{service.description}</p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {service.features.map((f, fi) => (
                    <span key={fi} className="bg-[#1A2A4A] px-3 py-2 rounded-xl text-sm font-bold text-white" style={cardGradientStyle}>{f}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fleet - block cards with image accent */}
      <section
        id="fleet"
        className={`py-14 px-6 md:px-16 transition-all duration-1000 ${isVisible.fleet ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Our Flagship Vessels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {flagshipVessels.map((vessel, idx) => (
            <div
              key={idx}
              className="border border-slate-700/50 bg-[#1A2A4A] rounded-2xl p-6 flex flex-col md:flex-row items-center shadow-[10px_10px_0px_rgba(0,0,0,1)]"
              style={cardGradientStyle}
            >
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <Anchor className="w-14 h-14 text-cyan-400" />
              </div>
              <div className="flex-grow w-full">
                <h4 className="text-lg font-bold text-white">{vessel.name}</h4>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-slate-100 text-base">{vessel.type}</span>
                  <span className="text-cyan-300 font-medium">{vessel.capacity}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-xs">Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages - horizontal pill scroll */}
      <section
        id="advantages"
        className={`py-16 px-6 md:px-16 bg-[#121c2d] rounded-3xl mt-16 shadow-[0px_30px_0px_rgba(0,0,0,1)] transition-all duration-1000 ${isVisible.advantages ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={cardGradientStyle}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Why Choose SCMT?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-9 mb-8">
          {advantages.map((adv, idx) => {
            const IconComponent = adv.icon;
            return (
              <div
                key={idx}
                className=" border border-slate-600/50 rounded-2xl p-7 text-center flex flex-col items-center shadow-[20px_20px_0px_rgba(0,0,0,1)]"
                style={cardGradientStyle}
              >
                <IconComponent className="w-10 h-10 text-white mb-2" />
                <div className="font-bold text-base mb-1">{adv.title}</div>
                <div className="text-xs text-slate-100">{adv.value}</div>
              </div>
            );
          })}
        </div>
        {/* CTA */}
        <div className="text-center mt-12">
          <button className="uppercase bg-[#600f9e] hover:bg-[#491174] text-white px-10 py-4 rounded-lg font-bold shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow flex items-center mx-auto space-x-2 group" >
            <span>Sign Up</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}
