import { useState } from "react";
import { MessageCircle, Users, Headphones, ExternalLink, HelpCircle, ChevronDown, TrendingUp, Shield, DollarSign, Smartphone, Clock, Award, Wallet, ArrowUpDown, UserPlus, Zap, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const faqCategories = [
  { id: "earning", icon: DollarSign, color: "#10B981" },
  { id: "withdrawal", icon: Wallet, color: "#3B82F6" },
  { id: "vip", icon: Award, color: "#F59E0B" },
  { id: "referral", icon: UserPlus, color: "#8B5CF6" },
  { id: "security", icon: Shield, color: "#EF4444" },
  { id: "technical", icon: Smartphone, color: "#06B6D4" },
] as const;

export default function HelpPage() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const helpSections = [
    {
      title: t("help.techSupport"),
      description: t("help.techSupportDesc"),
      icon: Headphones,
      color: "#3B82F6",
      items: [
        { label: t("help.techHelp"), value: "@vem_ms", link: "https://t.me/vem_ms", icon: Headphones },
      ],
    },
    {
      title: t("help.telegramGroup"),
      description: t("help.telegramGroupDesc"),
      icon: Users,
      color: "#10B981",
      items: [
        { label: t("help.officialChannel"), value: "t.me/Vem_Official", link: "https://t.me/Vem_Official", icon: MessageCircle },
        { label: t("help.communityGroup"), value: t("help.userGroup"), link: "https://t.me/+rO6-eoMDl0EyYWNh", icon: Users },
      ],
    },
  ];

  const faqItems = [
    { q: t("help.faqQ1"), a: t("help.faqA1"), category: "earning", icon: DollarSign, color: "#10B981" },
    { q: t("help.faqQ2"), a: t("help.faqA2"), category: "earning", icon: Zap, color: "#10B981" },
    { q: t("help.faqQ3"), a: t("help.faqA3"), category: "withdrawal", icon: ArrowUpDown, color: "#3B82F6" },
    { q: t("help.faqQ4"), a: t("help.faqA4"), category: "withdrawal", icon: Clock, color: "#3B82F6" },
    { q: t("help.faqQ5"), a: t("help.faqA5"), category: "vip", icon: Award, color: "#F59E0B" },
    { q: t("help.faqQ6"), a: t("help.faqA6"), category: "vip", icon: TrendingUp, color: "#F59E0B" },
    { q: t("help.faqQ7"), a: t("help.faqA7"), category: "referral", icon: UserPlus, color: "#8B5CF6" },
    { q: t("help.faqQ8"), a: t("help.faqA8"), category: "referral", icon: Users, color: "#8B5CF6" },
    { q: t("help.faqQ9"), a: t("help.faqA9"), category: "security", icon: Shield, color: "#EF4444" },
    { q: t("help.faqQ10"), a: t("help.faqA10"), category: "security", icon: BookOpen, color: "#EF4444" },
    { q: t("help.faqQ11"), a: t("help.faqA11"), category: "technical", icon: Smartphone, color: "#06B6D4" },
    { q: t("help.faqQ12"), a: t("help.faqA12"), category: "technical", icon: HelpCircle, color: "#06B6D4" },
  ];

  const filteredFaqs = activeCategory
    ? faqItems.filter(f => f.category === activeCategory)
    : faqItems;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 shadow-xl shadow-primary/20">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">{t("help.title")}</h2>
              <p className="text-white/60 text-xs">{t("help.subtitle")}</p>
            </div>
          </div>
          <p className="text-white/50 text-[11px] leading-relaxed">
            {t("help.description")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {helpSections.map((section, i) => (
          <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm" data-testid={`help-section-${i}`}>
            <div className="p-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: section.color + "15" }}>
                <section.icon className="w-5 h-5" style={{ color: section.color }} />
              </div>
              <h3 className="text-foreground font-bold text-[13px] mb-0.5">{section.title}</h3>
              <p className="text-muted-foreground text-[10px] leading-relaxed">{section.description}</p>
            </div>
            <div className="border-t border-border/50">
              {section.items.map((item, j) => (
                <a
                  key={j}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-muted/50 transition-colors"
                  data-testid={`help-link-${i}-${j}`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-foreground text-xs font-medium">{item.label}</p>
                      <p className="text-muted-foreground text-[10px]">{item.value}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-sm">{t("help.faq")}</h3>
            <p className="text-muted-foreground text-[10px]">{t("help.faqCount", { count: String(faqItems.length) })}</p>
          </div>
        </div>

        <div className="px-3 py-2.5 border-b border-border/50 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveCategory(null); setOpenFaq(null); }}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
              !activeCategory
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/50 border border-transparent"
            }`}
            data-testid="faq-filter-all"
          >
            {t("common.all")}
          </button>
          {faqCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(activeCategory === cat.id ? null : cat.id); setOpenFaq(null); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all border ${
                activeCategory === cat.id
                  ? ""
                  : "text-muted-foreground hover:bg-muted/50 border-transparent"
              }`}
              style={activeCategory === cat.id ? { backgroundColor: cat.color + "15", color: cat.color, borderColor: cat.color + "30" } : undefined}
              data-testid={`faq-filter-${cat.id}`}
            >
              <cat.icon className="w-3 h-3" />
              {t(`help.cat_${cat.id}`)}
            </button>
          ))}
        </div>

        <div>
          {filteredFaqs.map((faq, i) => {
            const globalIndex = faqItems.indexOf(faq);
            return (
              <div
                key={globalIndex}
                className="border-b border-border/50 last:border-b-0"
                data-testid={`faq-item-${globalIndex}`}
              >
                <button
                  onClick={() => toggleFaq(globalIndex)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  data-testid={`faq-toggle-${globalIndex}`}
                >
                  <div className="flex items-center gap-2.5 pr-3 flex-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: faq.color + "12" }}>
                      <faq.icon className="w-3.5 h-3.5" style={{ color: faq.color }} />
                    </div>
                    <span className="text-[13px] font-medium leading-snug text-foreground">
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 text-muted-foreground ${openFaq === globalIndex ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === globalIndex ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-4 pt-0">
                    <div className="rounded-xl p-3.5 ml-9" style={{ backgroundColor: faq.color + "08", borderColor: faq.color + "15", borderWidth: 1, borderStyle: "solid" }}>
                      <p className="text-muted-foreground text-[12px] leading-relaxed whitespace-pre-line">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
