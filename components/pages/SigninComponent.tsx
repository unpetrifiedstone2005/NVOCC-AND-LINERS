// File: SigninAspectRatio.jsx
"use client";
import { SigninCard } from "../SigninCard";

export const SigninComponent = () => {
  return (
    <div className="relative w-full aspect-video overflow-hidden">
      {/* 
        1) The real <img> for your background (16:9). 
           object-cover ensures the image still fills the entire box.
      */}
      <img
        src="/signin-bg.png"
        alt="Background with logo"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/*
        2) Overlay the SigninCard so its center is at (28% down, 50% over). 
           Adjust these percentages (28%, 50%) until the card exactly covers your logo.
        
        - top-[28%] & left-[50%]: place the card’s top-left corner at that fraction
          of the container.  
        - transform -translate-x-1/2 -translate-y-1/2: shift it back by half its width/
          height so the CARD’S CENTER is exactly at the (28%, 50%) point in the image.
      */}
      <div
        className="
          absolute 
          top-[28%] 
          left-[50%] 
          transform -translate-x-1/2 -translate-y-1/2 
          w-full max-w-md px-4
        "
      >
        <SigninCard />
      </div>
    </div>
  );
};
