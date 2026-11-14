"use client";

import React, { useState, type KeyboardEvent } from "react";
import { Chip } from "./Chip";

export interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Type and press Enter...",
  disabled = false,
  maxTags,
  className = "",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      return;
    }
    if (maxTags && tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className={`min-h-[42px] w-full rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.08)] px-2.5 py-1.5 focus-within:border-[#7c8cff] focus-within:ring-1 focus-within:ring-[#7c8cff] transition-all flex flex-wrap items-center gap-1.5 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {tags.map((tag, index) => (
        <Chip
          key={`${tag}-${index}`}
          variant="default"
          size="sm"
          onRemove={disabled ? undefined : () => removeTag(index)}
        >
          {tag}
        </Chip>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue);
          }
        }}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b91a1] outline-none px-1 py-0.5"
      />
    </div>
  );
}
