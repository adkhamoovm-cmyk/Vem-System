import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";
import en from "./locales/en.json";

export type Locale = "uz" | "ru" | "en";

const localeLabels: Record<Locale, string> = {
  uz: "O'zbek",
  ru: "Русский",
  en: "English",
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateServerMessage: (message: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "uz",
  setLocale: () => {},
  t: (key) => key,
  translateServerMessage: (msg) => msg,
});

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

const translations: Record<Locale, any> = { uz, ru, en };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("vem-locale") as Locale) || "ru";
    }
    return "ru";
  });

  useEffect(() => {
    localStorage.setItem("vem-locale", locale);
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let val = getNestedValue(translations[locale], key) || getNestedValue(translations.uz, key) || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  const translateServerMessage = (msg: string): string => {
    if (!msg) return msg;
    const key = serverMessageMap[msg];
    if (key) return t(key);
    for (const [pattern, k] of serverMessagePatterns) {
      const match = msg.match(pattern);
      if (match) {
        let translated = t(k);
        if (match[1]) translated = translated.replace("{value}", match[1]);
        if (match[2]) translated = translated.replace("{value2}", match[2]);
        if (match[3]) translated = translated.replace("{value3}", match[3]);
        return translated;
      }
    }
    return msg;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translateServerMessage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { localeLabels };

const serverMessageMap: Record<string, string> = {
  "Barcha maydonlarni to'ldiring": "server.fillAllFields",
  "Captchani tasdiqlang": "server.confirmCaptcha",
  "Bu telefon raqami allaqachon ro'yxatdan o'tgan": "server.phoneAlreadyRegistered",
  "Telefon va parolni kiriting": "server.enterPhoneAndPassword",
  "Telefon raqami yoki parol noto'g'ri": "server.wrongPhoneOrPassword",
  "Sizning hisobingiz bloklangan. Texnik yordamga murojaat qiling.": "server.accountBlocked",
  "Foydalanuvchi topilmadi": "server.userNotFound",
  "Avtorizatsiya talab qilinadi": "server.authRequired",
  "Admin huquqi talab qilinadi": "server.adminRequired",
  "Yakshanba kuni dam olish kuni. Vazifalar Dushanba-Shanba kunlari bajariladi.": "server.sundayRestTasks",
  "Kunlik limit tugadi": "server.dailyLimitReached",
  "Video ID kerak": "server.videoIdRequired",
  "Video topilmadi": "server.videoNotFound",
  "Avval VIP paket sotib oling": "server.buyVipFirst",
  "VIP paketingiz muddati tugagan. Yangi paket sotib oling.": "server.vipExpired",
  "VIP paket sotib oling": "server.buyVipPackage",
  "Vazifa bajarildi!": "server.taskCompleted",
  "Paket topilmadi": "server.packageNotFound",
  "Bu daraja hozircha yopiq. Admin bilan bog'laning.": "server.levelLocked",
  "Stajyor paketini admin orqali so'rang": "server.requestStajyorViaAdmin",
  "Pastroq darajaga tushish mumkin emas": "server.cannotDowngrade",
  "Balans yetarli emas": "server.insufficientBalance",
  "Balansingiz yetarli emas": "server.insufficientBalance",
  "Joriy va yangi parol kiritilishi shart": "server.enterCurrentAndNewPassword",
  "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak": "server.passwordMinLength",
  "Yangi parol joriy paroldan farqli bo'lishi kerak": "server.passwordMustBeDifferent",
  "Joriy parol noto'g'ri": "server.currentPasswordWrong",
  "Parol muvaffaqiyatli o'zgartirildi": "server.passwordChanged",
  "Parol sozlanmagan": "server.passwordNotSet",
  "Joriy va yangi moliya parolini kiritilishi shart": "server.enterCurrentAndNewFundPassword",
  "Yangi moliya paroli 6 xonali raqam bo'lishi kerak": "server.fundPasswordFormat",
  "Joriy moliya paroli noto'g'ri": "server.currentFundPasswordWrong",
  "Moliya paroli muvaffaqiyatli o'zgartirildi": "server.fundPasswordChanged",
  "Moliya paroli sozlanmagan": "server.fundPasswordNotSet",
  "Moliya paroli noto'g'ri": "server.fundPasswordWrong",
  "Telefon raqami topilmadi": "server.phoneNotFound",
  "Telefon raqami yoki moliya paroli noto'g'ri": "server.resetInvalidCredentials",
  "Noto'g'ri ma'lumot": "server.invalidData",
  "Tasdiqlash ma'lumoti noto'g'ri": "server.verificationFailed",
  "Parol muvaffaqiyatli tiklandi! Endi yangi parol bilan kiring.": "server.passwordResetSuccess",
  "Rasm yuklanmadi": "server.imageNotUploaded",
  "Tarif topilmadi": "server.planNotFound",
  "Noto'g'ri summa": "server.invalidAmount",
  "Investitsiya muvaffaqiyatli amalga oshirildi!": "server.investmentSuccess",
  "To'lov usuli saqlandi!": "server.paymentMethodSaved",
  "To'lov usuli topilmadi": "server.paymentMethodNotFound",
  "To'lov usuli o'chirildi": "server.paymentMethodDeleted",
  "So'rov yuborildi! Moliya bo'limi tekshirgandan so'ng balansingizga qo'shiladi.": "server.depositRequestSent",
  "Miqdor noto'g'ri": "server.invalidAmount",
  "Pul yechish faqat 11:00 dan 17:00 gacha mumkin": "server.withdrawalTimeRestriction",
  "Yakshanba kuni dam olish kuni. Pul yechish faqat Dushanba-Shanba kunlari mumkin.": "server.sundayRestWithdrawal",
  "Minimal yechish miqdori: 2 USDT": "server.minWithdrawalAmount",
  "Kripto uchun minimal yechish miqdori: 3 USDT": "server.cryptoMinWithdrawalAmount",
  "Sizning pul yechish huquqingiz cheklangan. Texnik yordamga murojaat qiling.": "server.withdrawalBanned",
  "Pul yechish uchun VIP paket sotib oling yoki Fondga pul qo'ying. Stajyor paketda yechish mumkin emas!": "server.needVipForWithdrawal",
  "Kuniga faqat 1 marta pul yechish mumkin. Ertaga qayta urinib ko'ring.": "server.dailyWithdrawalLimit",
  "Yechish so'rovi yuborildi! Tekshirgandan so'ng amalga oshiriladi.": "server.withdrawalRequestSent",
  "Sizda allaqachon VIP daraja mavjud": "server.alreadyHaveVip",
  "Stajyor faqat bir marta faollashtiriladi. VIP paket sotib oling.": "server.stajyorOnlyOnce",
  "Stajyor allaqachon faollashtirilgan. VIP paket sotib oling.": "server.stajyorAlreadyActive",
  "Sizning so'rovingiz allaqachon yuborilgan. Iltimos javobini kuting.": "server.requestAlreadySent",
  "So'rov yuborildi! Tekshirgandan so'ng Stajyor lavozimi faollashtiriladi.": "server.stajyorRequestSent",
  "Stajyor lavozimi faollashtirildi! (3 kun)": "server.stajyorActivated",
  "So'rov topilmadi": "server.requestNotFound",
  "Bu so'rov allaqachon ko'rib chiqilgan": "server.requestAlreadyReviewed",
  "So'rov rad etildi": "server.requestRejected",
  "Promokod kiriting": "server.enterPromoCode",
  "Bunday promokod topilmadi": "server.promoNotFound",
  "Bu promokod faol emas": "server.promoInactive",
  "Bu promokod allaqachon ishlatilgan": "server.promoAlreadyUsed",
  "Bu promokod limiti tugagan": "server.promoLimitReached",
  "Siz bu promokodni allaqachon ishlatgansiz": "server.promoAlreadyUsedByYou",
  "Kod va miqdorni kiriting": "server.enterCodeAndAmount",
  "Miqdor 0 dan katta bo'lishi kerak": "server.amountMustBePositive",
  "Bu kod allaqachon mavjud": "server.codeAlreadyExists",
  "Promokod o'chirildi": "server.promoDeleted",
  "Depozit topilmadi": "server.depositNotFound",
  "Depozit allaqachon tasdiqlangan": "server.depositAlreadyApproved",
  "Depozit tasdiqlandi va balansga qo'shildi": "server.depositApproved",
  "Depozit rad etildi": "server.depositRejected",
  "Faqat kutilayotgan depozitlar rad etilishi mumkin": "server.onlyPendingCanReject",
  "Yechish tasdiqlandi": "server.withdrawalApproved",
  "Yechish rad etildi": "server.withdrawalRejected",
  "Balans yangilandi": "server.balanceUpdated",
  "Foydalanuvchi o'chirildi": "server.userDeleted",
  "VIP daraja yangilandi": "server.vipLevelUpdated",
  "Parol yangilandi": "server.passwordUpdated",
  "Rekvizit saqlandi": "server.requisiteSaved",
  "Rekvizit o'chirildi": "server.requisiteDeleted",
  "Chiqish muvaffaqiyatli": "server.logoutSuccess",
};

const serverMessagePatterns: [RegExp, string][] = [
  [/^(\w+) paketi (uzaytirildi|faollashtirildi)!.* Oldingi VIP dan ([\d.]+) USDT qaytarildi\.$/, "server.vipActivatedWithRefund"],
  [/^(\w+) paketi (uzaytirildi|faollashtirildi)/, "server.vipActivated"],
  [/^(\d+(?:\.\d+)?) USDT hisobingizga qo'shildi/, "server.promoAmountAdded"],
  [/^Minimal depozit: \$(.+)$/, "server.minDeposit"],
];
