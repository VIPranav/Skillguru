"use client";

import React from "react";
import type { Profile } from "@/lib/types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { TagInput } from "./ui/TagInput";

export interface ProfileFormProps {
  profile: Profile;
  roleId: string;
  onChange: (profile: Profile) => void;
  onRoleChange: (value: string) => void;
  onAnalyze?: () => void;
  onStartInterview?: () => void;
  onLoadDemo: () => void;
  loading?: boolean;
}

const roleCards = [
  {
    id: "full-stack-developer",
    title: "Full Stack Developer",
    badge: "Web & API",
    desc: "Modern frontend architectures, REST/GraphQL services, and databases.",
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    badge: "Data & BI",
    desc: "Data cleaning, statistical querying, visualization, and metric reporting.",
  },
  {
    id: "ml-engineer",
    title: "ML Engineer",
    badge: "AI & Models",
    desc: "Machine learning pipelines, predictive modeling, and model serving.",
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    badge: "UI & UX",
    desc: "Interactive user interfaces, state management, and web performance.",
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    badge: "Systems & APIs",
    desc: "Server-side logic, database optimization, auth, and system reliability.",
  },
];

const popularSkills = [
  "Python",
  "SQL",
  "HTML",
  "CSS",
  "JavaScript",
  "React",
  "Node.js",
  "Git",
  "TypeScript",
  "REST APIs",
  "Pandas",
  "Machine Learning",
];

export function ProfileForm({
  profile,
  roleId,
  onChange,
  onRoleChange,
  onAnalyze,
  onStartInterview,
  onLoadDemo,
  loading = false,
}: ProfileFormProps) {
  const currentSkills = profile.claimedSkills || [];

  const handleSkillsChange = (newSkills: string[]) => {
    onChange({
      ...profile,
      claimedSkills: newSkills,
    });
  };

  const addQuickSkill = (skill: string) => {
    if (!currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      handleSkillsChange([...currentSkills, skill]);
    }
  };

  const handleSubmit = () => {
    if (onStartInterview) {
      onStartInterview();
    } else if (onAnalyze) {
      onAnalyze();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8eaf0]">Learner Profile</h1>
          <p className="text-sm text-[#8b91a1] mt-1">
            Tell us about your background to calibrate your personal career interview.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={loading}
          className="text-xs text-[#8b91a1] hover:text-[#7c8cff] font-medium transition-colors self-start sm:self-auto py-1 px-2 -mx-2 rounded hover:bg-[rgba(255,255,255,0.04)]"
        >
          Load demo learner →
        </button>
      </div>

      <Card className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
              Full Name
            </span>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onChange({ ...profile, name: e.target.value })}
              placeholder="e.g. Alex Chen"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.08)] px-3 text-sm text-[#e8eaf0] placeholder-[#8b91a1] focus:border-[#7c8cff] focus:ring-1 focus:ring-[#7c8cff] outline-none transition-colors"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
              Education or Current Background
            </span>
            <input
              type="text"
              value={profile.education}
              onChange={(e) => onChange({ ...profile, education: e.target.value })}
              placeholder="e.g. Computer Science student, self-taught, or bootcamp grad"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.08)] px-3 text-sm text-[#e8eaf0] placeholder-[#8b91a1] focus:border-[#7c8cff] focus:ring-1 focus:ring-[#7c8cff] outline-none transition-colors"
            />
          </label>
        </div>

        {/* Target Role Selector as Selectable Cards */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
            Target Career Role
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {roleCards.map((role) => {
              const isSelected = role.id === roleId;
              return (
                <div
                  key={role.id}
                  onClick={() => !loading && onRoleChange(role.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-[rgba(124,140,255,0.08)] border-[#7c8cff] shadow-sm"
                      : "bg-[#0b0c0f] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)]"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRoleChange(role.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#e8eaf0]">{role.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isSelected
                          ? "bg-[#7c8cff] text-[#0b0c0f]"
                          : "bg-[#171a21] text-[#8b91a1]"
                      }`}
                    >
                      {role.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#8b91a1] mt-1 line-clamp-2">{role.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claimed Skills Tag Input */}
        <div className="space-y-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
              Skills & Technologies
            </span>
            <TagInput
              tags={currentSkills}
              onChange={handleSkillsChange}
              placeholder="Add a skill and press Enter (e.g. Python, SQL)..."
              disabled={loading}
            />
          </label>

          {/* Quick-add popular chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-[#8b91a1] mr-1">Suggestions:</span>
            {popularSkills
              .filter((s) => !currentSkills.some((c) => c.toLowerCase() === s.toLowerCase()))
              .slice(0, 6)
              .map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addQuickSkill(skill)}
                  disabled={loading}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#171a21] text-[#8b91a1] hover:text-[#e8eaf0] hover:bg-[#1f232d] transition-colors border border-[rgba(255,255,255,0.06)]"
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>

        {/* Certifications Tag Input */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
            Certifications (Optional)
          </span>
          <TagInput
            tags={profile.certifications || []}
            onChange={(tags) => onChange({ ...profile, certifications: tags })}
            placeholder="Add certification and press Enter (e.g. AWS Cloud Practitioner)..."
            disabled={loading}
          />
        </div>

        {/* Projects Tag Input */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
            Key Projects or Work Experience (Optional)
          </span>
          <TagInput
            tags={profile.projects || []}
            onChange={(tags) => onChange({ ...profile, projects: tags })}
            placeholder="Add project title and press Enter (e.g. Flask blog, Portfolio site)..."
            disabled={loading}
          />
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={loading || !profile.name.trim()}
            loading={loading}
            className="w-full sm:w-auto"
          >
            Start Assessment Interview →
          </Button>
        </div>
      </Card>
    </div>
  );
}
