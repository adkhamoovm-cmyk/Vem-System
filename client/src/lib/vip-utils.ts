export function getVipName(level: number, locale: string): string {
  if (level < 0) return "—";
  if (level === 0) {
    if (locale === "ru") return "Стажёр";
    if (locale === "en") return "Intern";
    return "Stajyor";
  }
  return `M${level}`;
}
