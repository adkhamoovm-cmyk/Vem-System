import { useState } from "react";
import { MessageCircle, Users, Headphones, ExternalLink, HelpCircle, ChevronDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function HelpPage() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      color: "#4ADE80",
      items: [
        { label: t("help.officialChannel"), value: "t.me/Vem_Official", link: "https://t.me/Vem_Official", icon: MessageCircle },
        { label: t("help.communityGroup"), value: "VEM Hamjamiyat", link: "https://t.me/+rO6-eoMDl0EyYWNh", icon: Users },
      ],
    },
  ];

  const faqItems = [
    { q: t("help.faqQ1"), a: t("help.faqA1") },
    { q: t("help.faqQ2"), a: t("help.faqA2") },
    { q: t("help.faqQ3"), a: t("help.faqA3") },
    { q: t("help.faqQ4"), a: t("help.faqA4") },
    { q: t("help.faqQ5"), a: t("help.faqA5") },
    { q: t("help.faqQ6"), a: t("help.faqA6") },
    { q: t("help.faqQ7"), a: t("help.faqA7"), highlight: true },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="p-4 space-y-4">
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

        {helpSections.map((section, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden" data-testid={`help-section-${i}`}>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: section.color + "20" }}>
                <section.icon className="w-5 h-5" style={{ color: section.color }} />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm">{section.title}</h3>
                <p className="text-muted-foreground text-[10px]">{section.description}</p>
              </div>
            </div>
            <div className="border-t border-border divide-y divide-border">
              {section.items.map((item, j) => (
                <a
                  key={j}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                  data-testid={`help-link-${i}-${j}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-foreground text-sm">{item.label}</p>
                      <p className="text-muted-foreground text-xs">{item.value}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB300]/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#FFB300]" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-sm">{t("help.faq")}</h3>
              <p className="text-muted-foreground text-[10px]">FAQ</p>
            </div>
          </div>
          <div className="border-t border-border">
            {faqItems.map((faq, i) => (
              <div
                key={i}
                className={`border-b border-border last:border-b-0 ${(faq as any).highlight ? "bg-amber-500/5" : ""}`}
                data-testid={`faq-item-${i}`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
                  data-testid={`faq-toggle-${i}`}
                >
                  <div className="flex items-center gap-2 pr-3 flex-1">
                    {(faq as any).highlight && (
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className={`text-[13px] font-medium leading-snug ${(faq as any).highlight ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                      (faq as any).highlight ? "text-amber-500" : "text-muted-foreground"
                    } ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-4 pt-0">
                    <div className={`rounded-xl p-3.5 ${(faq as any).highlight ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/50"}`}>
                      <p className="text-muted-foreground text-[12px] leading-relaxed whitespace-pre-line">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
