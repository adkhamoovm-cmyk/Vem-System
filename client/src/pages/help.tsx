import { useState } from "react";
import { MessageCircle, Users, Headphones, ExternalLink, HelpCircle, ChevronDown } from "lucide-react";
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
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1d4ed8] rounded-2xl p-5 text-foreground shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{t("help.title")}</h2>
              <p className="text-foreground/70 text-xs">{t("help.subtitle")}</p>
            </div>
          </div>
          <p className="text-foreground/60 text-[11px] leading-relaxed">
            {t("help.description")}
          </p>
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
              <div key={i} className="border-b border-border last:border-b-0" data-testid={`faq-item-${i}`}>
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-foreground text-[13px] font-medium pr-3 leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-4 pt-0">
                    <div className="bg-muted/50 rounded-xl p-3.5">
                      <p className="text-muted-foreground text-[12px] leading-relaxed">{faq.a}</p>
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
