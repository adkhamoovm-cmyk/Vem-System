import { MessageCircle, Users, Headphones, Shield, ExternalLink, Send, Phone, HelpCircle, ChevronRight } from "lucide-react";
import AppLayout from "@/components/app-layout";

const helpSections = [
  {
    title: "Menejer bilan bog'lanish",
    description: "Shaxsiy menejeringiz sizga yordam beradi",
    icon: Headphones,
    color: "hsl(var(--primary))",
    items: [
      { label: "Telegram menejer", value: "@vem_manager", link: "https://t.me/vem_manager", icon: Send },
      { label: "Telefon raqam", value: "+998 90 123 45 67", link: "tel:+998901234567", icon: Phone },
    ],
  },
  {
    title: "Telegram guruh",
    description: "Rasmiy guruhimizga qo'shiling",
    icon: Users,
    color: "#4ADE80",
    items: [
      { label: "VEM rasmiy guruh", value: "t.me/vem_official", link: "https://t.me/vem_official", icon: Users },
      { label: "VEM yangiliklar", value: "t.me/vem_news", link: "https://t.me/vem_news", icon: MessageCircle },
    ],
  },
  {
    title: "Texnik qo'llab-quvvatlash",
    description: "Muammolar bo'lsa bizga murojaat qiling",
    icon: Shield,
    color: "#3B82F6",
    items: [
      { label: "Texnik yordam", value: "@vem_support", link: "https://t.me/vem_support", icon: Headphones },
    ],
  },
];

const faqItems = [
  { q: "Qanday pul ishlash mumkin?", a: "VIP paket oling, video vazifalarni bajaring va har bir video uchun mukofot oling." },
  { q: "Pul qanday yechib olaman?", a: "Profil sahifasida 'Yechish' tugmasini bosing. Min 2 USDT, 10% komissiya, Dush-Shan 11:00-17:00." },
  { q: "Referal tizimi qanday ishlaydi?", a: "Do'stlaringizni taklif qiling: 1-daraja 9%, 2-daraja 3%, 3-daraja 1% komissiya olasiz." },
  { q: "Stajyor nima?", a: "Bepul boshlang'ich daraja. 3 kun davomida sinab ko'ring, keyin M1 ga o'ting." },
  { q: "VIP paket muddati tugasa nima bo'ladi?", a: "Vazifalar to'xtaydi. Qayta sotib oling yoki yangi paket tanlang." },
];

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1d4ed8] rounded-2xl p-5 text-foreground shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Yordam markazi</h2>
              <p className="text-foreground/70 text-xs">Savollaringizga javob topamiz</p>
            </div>
          </div>
          <p className="text-foreground/60 text-[11px] leading-relaxed">
            Quyidagi bo'limlardan o'zingizga kerakli ma'lumotni toping yoki bevosita menejer bilan bog'laning.
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
              <h3 className="text-foreground font-semibold text-sm">Ko'p so'raladigan savollar</h3>
              <p className="text-muted-foreground text-[10px]">FAQ</p>
            </div>
          </div>
          <div className="border-t border-border divide-y divide-border">
            {faqItems.map((faq, i) => (
              <div key={i} className="px-4 py-3" data-testid={`faq-item-${i}`}>
                <p className="text-foreground text-xs font-semibold mb-1">{faq.q}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
