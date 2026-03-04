import { useRef } from "react";

export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  { code: "+49",  country: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+7",   country: "RU", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "+1",   country: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+998", country: "UZ", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "+44",  country: "GB", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+82",  country: "KR", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "+90",  country: "TR", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "+86",  country: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+91",  country: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+81",  country: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+971", country: "AE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+992", country: "TJ", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "+996", country: "KG", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "+993", country: "TM", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "+7",   country: "KZ", flag: "\u{1F1F0}\u{1F1FF}" },
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
