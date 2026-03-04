export function getVipName(level: number, locale: string): string {
  if (level < 0) return "—";
  if (level === 0) {
    const names: Record<string, string> = { uz: "Stajyor", ru: "Стажёр", en: "Intern", es: "Pasante", tr: "Stajyer" };
    return names[locale] || "Stajyor";
  }
  return `M${level}`;
}
