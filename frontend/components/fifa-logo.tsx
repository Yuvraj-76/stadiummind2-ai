"use client";

import React from "react";

export function FifaLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer spinning soccer ball */}
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full animate-spin hover:animate-[spin_1.5s_linear_infinite] transition-all duration-500"
        style={{ animationDuration: "8s" }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ball outer boundary shadow */}
        <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" className="text-foreground/10" />
        
        {/* Ball main body */}
        <circle cx="24" cy="24" r="21" fill="currentColor" className="text-card fill-card stroke-foreground" strokeWidth="2.5" />
        
        {/* Central Pentagon (Fifa Signature Patch) */}
        <polygon
          points="24,16.5 31.1,21.6 28.4,30 19.6,30 16.9,21.6"
          fill="currentColor"
          className="text-primary stroke-foreground"
          strokeWidth="1.5"
        />
        
        {/* Seam Lines radiating outward */}
        <line x1="24" y1="16.5" x2="24" y2="4.5" stroke="currentColor" strokeWidth="2" className="text-foreground" />
        <line x1="31.1" y1="21.6" x2="42.5" y2="18.5" stroke="currentColor" strokeWidth="2" className="text-foreground" />
        <line x1="28.4" y1="30" x2="35.5" y2="40.5" stroke="currentColor" strokeWidth="2" className="text-foreground" />
        <line x1="19.6" y1="30" x2="12.5" y2="40.5" stroke="currentColor" strokeWidth="2" className="text-foreground" />
        <line x1="16.9" y1="21.6" x2="5.5" y2="18.5" stroke="currentColor" strokeWidth="2" className="text-foreground" />

        {/* Shaded Outer Pentagon Patches for 3D Shading effect */}
        {/* Top Outer Patch */}
        <polygon points="20,7 28,7 24,13" fill="currentColor" className="text-foreground/10" />
        {/* Right Outer Patch */}
        <polygon points="41,21 39,29 33,24" fill="currentColor" className="text-foreground/20" />
        {/* Bottom Right Outer Patch */}
        <polygon points="31,40 23,38 27,33" fill="currentColor" className="text-foreground/10" />
        {/* Bottom Left Outer Patch */}
        <polygon points="17,40 25,38 21,33" fill="currentColor" className="text-foreground/25" />
        {/* Left Outer Patch */}
        <polygon points="7,21 9,29 15,24" fill="currentColor" className="text-foreground/15" />
      </svg>

      {/* Glowing pulse at the center of the football */}
      <div className="absolute h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
    </div>
  );
}
