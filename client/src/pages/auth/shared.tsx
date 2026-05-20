import { useRef } from "react";

export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  // O'rta Osiyo
  { code: "+998", country: "UZ", flag: "🇺🇿" },
  { code: "+7",   country: "KZ", flag: "🇰🇿" },
  { code: "+996", country: "KG", flag: "🇰🇬" },
  { code: "+992", country: "TJ", flag: "🇹🇯" },
  { code: "+993", country: "TM", flag: "🇹🇲" },
  { code: "+994", country: "AZ", flag: "🇦🇿" },
  { code: "+374", country: "AM", flag: "🇦🇲" },
  { code: "+995", country: "GE", flag: "🇬🇪" },
  // Sharqiy Osiyo
  { code: "+86",  country: "CN", flag: "🇨🇳" },
  { code: "+81",  country: "JP", flag: "🇯🇵" },
  { code: "+82",  country: "KR", flag: "🇰🇷" },
  { code: "+852", country: "HK", flag: "🇭🇰" },
  { code: "+886", country: "TW", flag: "🇹🇼" },
  { code: "+976", country: "MN", flag: "🇲🇳" },
  // Janubiy Osiyo
  { code: "+91",  country: "IN", flag: "🇮🇳" },
  { code: "+92",  country: "PK", flag: "🇵🇰" },
  { code: "+880", country: "BD", flag: "🇧🇩" },
  { code: "+94",  country: "LK", flag: "🇱🇰" },
  { code: "+977", country: "NP", flag: "🇳🇵" },
  { code: "+960", country: "MV", flag: "🇲🇻" },
  { code: "+975", country: "BT", flag: "🇧🇹" },
  // Janubi-Sharqiy Osiyo
  { code: "+62",  country: "ID", flag: "🇮🇩" },
  { code: "+60",  country: "MY", flag: "🇲🇾" },
  { code: "+63",  country: "PH", flag: "🇵🇭" },
  { code: "+65",  country: "SG", flag: "🇸🇬" },
  { code: "+66",  country: "TH", flag: "🇹🇭" },
  { code: "+84",  country: "VN", flag: "🇻🇳" },
  { code: "+95",  country: "MM", flag: "🇲🇲" },
  { code: "+855", country: "KH", flag: "🇰🇭" },
  { code: "+856", country: "LA", flag: "🇱🇦" },
  { code: "+673", country: "BN", flag: "🇧🇳" },
  // G'arbiy Osiyo / Yaqin Sharq
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+90",  country: "TR", flag: "🇹🇷" },
  { code: "+98",  country: "IR", flag: "🇮🇷" },
  { code: "+964", country: "IQ", flag: "🇮🇶" },
  { code: "+962", country: "JO", flag: "🇯🇴" },
  { code: "+961", country: "LB", flag: "🇱🇧" },
  { code: "+963", country: "SY", flag: "🇸🇾" },
  { code: "+972", country: "IL", flag: "🇮🇱" },
  { code: "+968", country: "OM", flag: "🇴🇲" },
  { code: "+974", country: "QA", flag: "🇶🇦" },
  { code: "+965", country: "KW", flag: "🇰🇼" },
  { code: "+973", country: "BH", flag: "🇧🇭" },
  { code: "+967", country: "YE", flag: "🇾🇪" },
  { code: "+93",  country: "AF", flag: "🇦🇫" },
  // Yevropa
  { code: "+7",   country: "RU", flag: "🇷🇺" },
  { code: "+44",  country: "GB", flag: "🇬🇧" },
  { code: "+49",  country: "DE", flag: "🇩🇪" },
  { code: "+33",  country: "FR", flag: "🇫🇷" },
  { code: "+39",  country: "IT", flag: "🇮🇹" },
  { code: "+34",  country: "ES", flag: "🇪🇸" },
  { code: "+31",  country: "NL", flag: "🇳🇱" },
  { code: "+32",  country: "BE", flag: "🇧🇪" },
  { code: "+41",  country: "CH", flag: "🇨🇭" },
  { code: "+43",  country: "AT", flag: "🇦🇹" },
  { code: "+48",  country: "PL", flag: "🇵🇱" },
  { code: "+380", country: "UA", flag: "🇺🇦" },
  { code: "+40",  country: "RO", flag: "🇷🇴" },
  { code: "+359", country: "BG", flag: "🇧🇬" },
  { code: "+36",  country: "HU", flag: "🇭🇺" },
  { code: "+420", country: "CZ", flag: "🇨🇿" },
  { code: "+421", country: "SK", flag: "🇸🇰" },
  { code: "+386", country: "SI", flag: "🇸🇮" },
  { code: "+385", country: "HR", flag: "🇭🇷" },
  { code: "+381", country: "RS", flag: "🇷🇸" },
  { code: "+387", country: "BA", flag: "🇧🇦" },
  { code: "+389", country: "MK", flag: "🇲🇰" },
  { code: "+355", country: "AL", flag: "🇦🇱" },
  { code: "+382", country: "ME", flag: "🇲🇪" },
  { code: "+30",  country: "GR", flag: "🇬🇷" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+46",  country: "SE", flag: "🇸🇪" },
  { code: "+47",  country: "NO", flag: "🇳🇴" },
  { code: "+45",  country: "DK", flag: "🇩🇰" },
  { code: "+358", country: "FI", flag: "🇫🇮" },
  { code: "+354", country: "IS", flag: "🇮🇸" },
  { code: "+353", country: "IE", flag: "🇮🇪" },
  { code: "+370", country: "LT", flag: "🇱🇹" },
  { code: "+371", country: "LV", flag: "🇱🇻" },
  { code: "+372", country: "EE", flag: "🇪🇪" },
  { code: "+375", country: "BY", flag: "🇧🇾" },
  { code: "+373", country: "MD", flag: "🇲🇩" },
  // Amerika
  { code: "+1",   country: "US", flag: "🇺🇸" },
  { code: "+1",   country: "CA", flag: "🇨🇦" },
  { code: "+52",  country: "MX", flag: "🇲🇽" },
  { code: "+55",  country: "BR", flag: "🇧🇷" },
  { code: "+54",  country: "AR", flag: "🇦🇷" },
  { code: "+57",  country: "CO", flag: "🇨🇴" },
  { code: "+56",  country: "CL", flag: "🇨🇱" },
  { code: "+51",  country: "PE", flag: "🇵🇪" },
  { code: "+58",  country: "VE", flag: "🇻🇪" },
  { code: "+593", country: "EC", flag: "🇪🇨" },
  { code: "+591", country: "BO", flag: "🇧🇴" },
  { code: "+595", country: "PY", flag: "🇵🇾" },
  { code: "+598", country: "UY", flag: "🇺🇾" },
  { code: "+53",  country: "CU", flag: "🇨🇺" },
  { code: "+502", country: "GT", flag: "🇬🇹" },
  { code: "+503", country: "SV", flag: "🇸🇻" },
  { code: "+504", country: "HN", flag: "🇭🇳" },
  { code: "+505", country: "NI", flag: "🇳🇮" },
  { code: "+506", country: "CR", flag: "🇨🇷" },
  { code: "+507", country: "PA", flag: "🇵🇦" },
  // Afrika
  { code: "+20",  country: "EG", flag: "🇪🇬" },
  { code: "+212", country: "MA", flag: "🇲🇦" },
  { code: "+213", country: "DZ", flag: "🇩🇿" },
  { code: "+216", country: "TN", flag: "🇹🇳" },
  { code: "+218", country: "LY", flag: "🇱🇾" },
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+27",  country: "ZA", flag: "🇿🇦" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+251", country: "ET", flag: "🇪🇹" },
  { code: "+255", country: "TZ", flag: "🇹🇿" },
  { code: "+256", country: "UG", flag: "🇺🇬" },
  { code: "+233", country: "GH", flag: "🇬🇭" },
  { code: "+221", country: "SN", flag: "🇸🇳" },
  { code: "+243", country: "CD", flag: "🇨🇩" },
  { code: "+249", country: "SD", flag: "🇸🇩" },
  { code: "+237", country: "CM", flag: "🇨🇲" },
  { code: "+225", country: "CI", flag: "🇨🇮" },
  { code: "+260", country: "ZM", flag: "🇿🇲" },
  { code: "+263", country: "ZW", flag: "🇿🇼" },
  // Avstraliya & Okeaniya
  { code: "+61",  country: "AU", flag: "🇦🇺" },
  { code: "+64",  country: "NZ", flag: "🇳🇿" },
  { code: "+675", country: "PG", flag: "🇵🇬" },
  { code: "+679", country: "FJ", flag: "🇫🇯" },
];

export function PinInput({ value, onChange, error }: { value: string; onChange: (val: string) => void; error?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleDigitChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const newDigits = [...digits];
    newDigits[index] = digit.slice(-1);
    const newValue = newDigits.join("").replace(/\s/g, "");
    onChange(newValue);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      onChange(newDigits.join("").replace(/\s/g, ""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center" data-testid="input-fund-password-pins">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-11 h-[52px] text-center text-lg font-bold rounded-xl border-2 outline-none transition-all duration-200
            ${error
              ? "bg-red-500/10 border-red-400 text-red-400 shadow-md shadow-red-500/15"
              : digits[i]?.trim()
                ? "bg-primary/10 border-primary/70 text-foreground shadow-lg shadow-primary/20"
                : "bg-white/[0.07] dark:bg-white/[0.06] border-white/20 dark:border-white/15 text-foreground shadow-md shadow-black/20"}
            focus:bg-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg focus:shadow-primary/20`}
          data-testid={`input-pin-${i}`}
        />
      ))}
    </div>
  );
}
