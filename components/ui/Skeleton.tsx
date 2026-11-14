import React, { type HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "rounded" | "circular" | "card";
}

export function Skeleton({
  variant = "rounded",
  className = "",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rounded: "rounded-lg",
    circular: "rounded-full",
    card: "rounded-xl",
  };

  return (
    <div
      className={`bg-[rgba(255,255,255,0.06)] animate-pulse ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkillRowSkeleton() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-4 space-y-2.5">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}
