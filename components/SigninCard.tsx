"use client"
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export const SigninCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      className="
        w-full max-w-md 
        p-8                  
        bg-white
        rounded-md 
        shadow-2xl 
        -mt-15
      "
    >
      {/* Header: logo / "Sign in" / signup link */}
      <div className="flex flex-col items-center text-center gap-y-1 mx-5">
        <Image
          src="/logo.png"
          alt="company logo"
          width={120}
          height={120}
          className="object-contain translate-x-[11px] mb-2"
        />
        <div className="text-2xl font-bold">Log in</div>
        <div className="flex text-md gap-x-2 mb-3">
          <span>Not Registered?</span>
          <Link href="/auth/signup" className="hover:underline font-bold">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Form: reduced spacing between fields */}
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-bold">Email Address</label>
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            className="
              mt-1 w-full 
              border font-bold border-gray-300 
              rounded-md px-3 py-2 
              focus:outline-none focus:ring focus:border-blue-500
            "
            placeholder="Your Email"
          />
        </div>

        <div>
          <label className="block text-black text-sm font-bold">Password</label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            className="
              mt-1 w-full 
              border font-bold border-gray-300 
              rounded-md px-3 py-2 
              focus:outline-none focus:ring focus:border-blue-500
            "
            placeholder="Your password"
          />
          <div className="text-right mt-1">
            <a href="#" className="text-black text-sm hover:underline font-semibold">
              Forgot password?
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            className="
              px-6 py-2 
              bg-gradient-to-r from-orange-400 to-orange-600 
              hover:from-orange-600 hover:to-orange-800
              text-white rounded-md
            "
          >
            Log in
          </button>
          <button
            type="submit"
            className="
              px-6 py-2 
              bg-gradient-to-r from-blue-400 to-blue-600 
              hover:from-blue-600 hover:to-blue-800
              text-white rounded-md
            "
          >
            Admin Log in
          </button>
        </div>
      </div>
    </div>
  );
};
