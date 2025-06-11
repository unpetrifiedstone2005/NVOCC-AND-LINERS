"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export const SignupComponent = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  return (
    <div
      className="
        min-h-screen 
        flex flex-col justify-center 
        bg-[url('/signup-bg.jpeg')] bg-cover bg-center 
        pl-32 pr-32 py-7 space-y-6
        overflow-x-hidden overflow-y-hidden
      "
    >
      {/* Sign-up card */}
      <div
        className="
          w-full max-w-xl 
          p-8                  
          bg-white/50 
          backdrop-blur-[15px] 
          rounded-md 
          shadow-2xl 
          mt-10 
          ml-auto 
          mx-50
        "
      >
         <div className="flex flex-col items-center text-center gap-y-1 mx-5">
          {/* gap-y-1 = 0.25rem (4px) between each child */}
          <Image
            src="/logo.png"
            alt="company logo"
            width={120}
            height={120}
            className="object-contain translate-x-[11px] mb-2"
          /> 
        </div>

        {/* Header: "Register Account" + subheading */}
        <div className="flex flex-col items-center text-center gap-y-1 mx-5 mb-4">
          <div className="text-2xl font-bold mb-3">Register Account</div>
          <div className="flex text-md gap-x-2">
            <span>Already have an account?</span>
            <Link href="/auth/signin" className="hover:underline font-semibold">
              Log in
            </Link>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-bold">First Name</label>
            <input
              type="text"
              onChange={(e) => setFirstName(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="First Name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-bold">Last Name</label>
            <input
              type="text"
              onChange={(e) => setLastName(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="Last Name"
            />
          </div>

          {/* Country Code */}
          <div>
            <label className="block text-sm font-bold">Country Code</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                bg-white 
                focus:outline-none focus:ring focus:border-blue-500
              "
            >
              <option value="">Country Code</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+971">+971</option>
              {/* Add more codes as needed */}
            </select>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-bold">Phone Number</label>
            <input
              type="tel"
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="Phone Number"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-bold">Company Name</label>
            <input
              type="text"
              onChange={(e) => setCompanyName(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="Company Name"
            />
          </div>

          {/* Company Tax / Registration / VAT Number */}
          <div>
            <label className="block text-sm font-bold">Company Tax / Registration / VAT Number</label>
            <input
              type="text"
              onChange={(e) => setVatNumber(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="VAT Number"
            />
          </div>

          {/* Street Address / Number */}
          <div>
            <label className="block text-sm font-bold">Street Address / Number</label>
            <input
              type="text"
              onChange={(e) => setStreetAddress(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="Street Address / Number"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-bold">City</label>
            <input
              type="text"
              onChange={(e) => setCity(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="City"
            />
          </div>

          {/* Postal / ZIP Code */}
          <div>
            <label className="block text-sm font-bold">Postal / ZIP Code</label>
            <input
              type="text"
              onChange={(e) => setPostalCode(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                focus:outline-none focus:ring focus:border-blue-500
              "
              placeholder="Postal / ZIP Code"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-bold">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="
                mt-1 w-full 
                border font-bold border-gray-300 
                rounded-md px-3 py-2 
                bg-white 
                focus:outline-none focus:ring focus:border-blue-500
              "
            >
              <option value="">Country</option>
              <option value="UAE">UAE</option>
              <option value="USA">USA</option>
              <option value="India">India</option>
              {/* Add more countries as needed */}
            </select>
          </div>
        </div>

        {/* Continue / Cancel Buttons */}
        <div className="mt-6">
          <button
            type="submit"
            className="
              w-full px-6 py-2 
              bg-gradient-to-r from-blue-400 to-blue-600 
              hover:from-blue-600 hover:to-blue-800
              text-white rounded-md
            "
          >
            Continue
          </button>
          <div className="text-center mt-3">
            <a href="#" className="text-blue-600 font-bold hover:underline">
              Cancel
            </a>
          </div>
        </div>
      </div>

      {/* Footer aligned under the card */}
      <div className="w-full max-w-xl ml-auto mx-35 space-x-4 text-sm font-bold text-white">
        <span>©2025 Afcont</span>
        <a href="#" className="hover:underline">
          Terms & Conditions
        </a>
        <a href="#" className="hover:underline">
          Support Portal
        </a>
        <a href="#" className="hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};
