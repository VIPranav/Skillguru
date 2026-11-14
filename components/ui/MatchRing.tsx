"use client";

import React, { useEffect, useState } from "react";

export interface MatchRingProps {
  percent: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function MatchRing({
  percent,
  size = 104,
  strokeWidth = 8,
  label = "Role Match",
  className = "",
}: MatchRingProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      setAnimatedPercent(percent);
    }, reduced ? 0 : 50);
    return () => clearTimeout(timer);
  }, [percent]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.min(100, Math.max(0, animatedPercent));
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated accent ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#7c8cff"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      {/* Centered label and number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span className="font-mono text-2xl font-bold tracking-tight text-[#e8eaf0]">
          {percent}%
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8b91a1] -mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
