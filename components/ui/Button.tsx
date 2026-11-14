import React, { type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 ease-out select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7c8cff] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-base gap-2.5",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[#7c8cff] text-[#0b0c0f] font-semibold hover:bg-[#6b7bf7] active:bg-[#5a6ae5]",
    secondary:
      "bg-[#111318] text-[#e8eaf0] border border-[rgba(255,255,255,0.08)] hover:bg-[#171a21] hover:border-[rgba(255,255,255,0.16)] active:bg-[#1a1e27]",
    ghost:
      "bg-transparent text-[#8b91a1] hover:text-[#e8eaf0] hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.08)]",
    danger:
      "bg-[rgba(239,91,91,0.12)] text-[#ef5b5b] border border-[rgba(239,91,91,0.25)] hover:bg-[rgba(239,91,91,0.2)] active:bg-[rgba(239,91,91,0.3)]",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
