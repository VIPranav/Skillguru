import type { Gap, RoleDefinition, SkillMapItem } from "@/lib/types";

export function computeGapsForRole(skillMap: SkillMapItem[], role: RoleDefinition): Gap[] {
  const map = new Map(skillMap.map((item) => [item.name, item]));
  return role.skills.map((skillDef) => {
    const item = map.get(skillDef.name);
    const currentLevel = item?.level ?? 0;
    const gapSize = Math.max(0, skillDef.requiredLevel - currentLevel);
    return gapSize === 0 ? null : { skill: skillDef.name, currentLevel, requiredLevel: skillDef.requiredLevel, importance: skillDef.importance, gapSize, assessed: Boolean(item && item.evidence !== "Not assessed") };
  }).filter(Boolean).sort((a, b) => b!.importance - a!.importance || b!.gapSize - a!.gapSize || a!.skill.localeCompare(b!.skill)) as Gap[];
}

export function computeMatchPercent(skillMap: SkillMapItem[], role: RoleDefinition): number {
  const totals = role.skills.reduce((sum, skill) => sum + skill.requiredLevel * skill.importance, 0);
  const achieved = role.skills.reduce((sum, skill) => sum + Math.min(skillMap.find((item) => item.name === skill.name)?.level ?? 0, skill.requiredLevel) * skill.importance, 0);
  return totals === 0 ? 0 : Math.round((achieved / totals) * 100);
}

export function getCanonicalSkillNames(roleSkills: RoleDefinition[] | undefined) {
  const skillSet = new Set<string>();
  roleSkills?.forEach((role) => role.skills.forEach((skill) => skillSet.add(skill.name)));
  return [...skillSet].sort((a, b) => a.localeCompare(b));
}
