"use client";

import React from "react";

export interface GoalSwitcherProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const roles = [
  { id: "full-stack-developer", label: "Full Stack Developer" },
  { id: "data-analyst", label: "Data Analyst" },
  { id: "ml-engineer", label: "ML Engineer" },
  { id: "frontend-developer", label: "Frontend Developer" },
  { id: "backend-developer", label: "Backend Developer" },
];

export function GoalSwitcher({ value, onChange, disabled = false }: GoalSwitcherProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="goal-role-select" className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
        Target Goal Role
      </label>
      <div className="relative">
        <select
          id="goal-role-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-9 rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.08)] px-3 pr-8 text-xs font-medium text-[#e8eaf0] focus:border-[#7c8cff] focus:ring-1 focus:ring-[#7c8cff] outline-none appearance-none cursor-pointer transition-colors disabled:opacity-50"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id} className="bg-[#111318] text-[#e8eaf0]">
              {role.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-[#8b91a1]">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
