import { Download, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface InstallAppModalProps {
  onClose: () => void;
}

const installText: Record<string, {
  title: string; subtitle: string; close: string;
  ios: string[]; android: string[]; desktop: string[];
}> = {
  uz: {
    title: "VEM ilovasini o'rnatish",
    subtitle: "Telefoningizga o'rnatib, tez kirish imkoniyatiga ega bo'ling",
    close: "Yopish",
    ios: [
      "Safari brauzerini oching va VEM saytiga kiring",
      "Pastki panelda «Ulashish» (Share) tugmasini bosing",
      "«Bosh ekranga qo'shish» (Add to Home Screen) ni tanlang",
      "«Qo'shish» (Add) tugmasini bosing — VEM bosh ekranda paydo bo'ladi"
    ],
    android: [
      "Chrome brauzerini oching va VEM saytiga kiring",
      "Yuqori o'ng burchakdagi \u22EE menyuni bosing",
      "«Bosh ekranga qo'shish» yoki «Ilovani o'rnatish» ni tanlang",
      "«O'rnatish» tugmasini bosing — VEM bosh ekranda paydo bo'ladi"
    ],
    desktop: [
      "Brauzer manzil satrida o'rnatish ikonkasini bosing",
      "«O'rnatish» tugmasini bosing — VEM kompyuteringizda paydo bo'ladi"
    ]
  },
  ru: {
    title: "Установить приложение VEM",
    subtitle: "Установите на телефон для быстрого доступа",
    close: "Закрыть",
    ios: [
      "Откройте браузер Safari и зайдите на сайт VEM",
      "Нажмите кнопку «Поделиться» (Share) внизу экрана",
      "Выберите «На экран Домой» (Add to Home Screen)",
      "Нажмите «Добавить» (Add) — VEM появится на главном экране"
    ],
    android: [
      "Откройте браузер Chrome и зайдите на сайт VEM",
      "Нажмите меню \u22EE в правом верхнем углу",
      "Выберите «Добавить на главный экран» или «Установить приложение»",
      "Нажмите «Установить» — VEM появится на главном экране"
    ],
    desktop: [
      "Нажмите на иконку установки в адресной строке браузера",
      "Нажмите «Установить» — VEM появится на вашем компьютере"
    ]
  },
  en: {
    title: "Install VEM App",
    subtitle: "Install on your phone for quick access",
    close: "Close",
    ios: [
      "Open Safari browser and go to the VEM website",
      "Tap the Share button at the bottom of the screen",
      "Select \"Add to Home Screen\"",
      "Tap \"Add\" — VEM will appear on your home screen"
    ],
    android: [
      "Open Chrome browser and go to the VEM website",
      "Tap the \u22EE menu in the top right corner",
      "Select \"Add to Home screen\" or \"Install app\"",
      "Tap \"Install\" — VEM will appear on your home screen"
    ],
    desktop: [
      "Click the install icon in the browser address bar",
      "Click \"Install\" — VEM will appear on your computer"
    ]
  }
};

export function InstallAppModal({ onClose }: InstallAppModalProps) {
  const { locale } = useI18n();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const txt = installText[locale] || installText.en;
  const steps = isIOS ? txt.ios : isAndroid ? txt.android : txt.desktop;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="install-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 pb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{txt.title}</h3>
              <p className="text-muted-foreground text-xs">{txt.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            data-testid="button-close-install"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 pt-2 flex-1">
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-xl p-3 border border-border/50">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">{i + 1}</div>
                <p className="text-[13px] text-foreground/80 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold h-11 rounded-xl text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            data-testid="button-close-install-bottom"
          >
            {txt.close}
          </button>
        </div>
      </div>
    </div>
  );
}
