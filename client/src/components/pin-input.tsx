import { useContext } from "react";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { OTPInputContext } from "input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  variant?: "default" | "fund" | "withdraw";
  testId?: string;
  autoFocus?: boolean;
}

const variantConfig = {
  default: {
    gradient: "from-primary/20 to-blue-500/10",
    iconColor: "text-primary",
    activeRing: "ring-primary/60",
    filledBorder: "border-primary/40",
  },
  fund: {
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-500",
    activeRing: "ring-emerald-500/60",
    filledBorder: "border-emerald-500/40",
  },
  withdraw: {
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-500",
    activeRing: "ring-amber-500/60",
    filledBorder: "border-amber-500/40",
  },
};

function PinSlot({ index, variant }: { index: number; variant: "default" | "fund" | "withdraw" }) {
  const ctx = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = ctx.slots[index];
  const config = variantConfig[variant];

  return (
    <div
      data-active={isActive}
      className={cn(
        "relative flex h-12 w-11 sm:h-14 sm:w-12 items-center justify-center rounded-lg border-2 text-sm transition-all duration-200",
        "bg-background/80 backdrop-blur-sm",
        char ? config.filledBorder : "border-border/60",
        isActive && `ring-2 ${config.activeRing} border-transparent shadow-md scale-105`,
      )}
    >
      {char ? (
        <span className="text-foreground text-2xl font-bold leading-none select-none">&#8226;</span>
      ) : null}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-0.5 animate-caret-blink bg-foreground/70 duration-1000 rounded-full" />
        </div>
      )}
    </div>
  );
}

export function PinInput({ value, onChange, label, hint, variant = "default", testId, autoFocus }: PinInputProps) {
  const config = variantConfig[variant];
  const IconComponent = variant === "fund" ? ShieldCheck : Lock;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />
          {label}
        </label>
      )}

      <div className={`relative rounded-xl bg-gradient-to-br ${config.gradient} p-3 border border-border/50`}>
        <div className="flex justify-center" data-testid={testId}>
          <InputOTP
            maxLength={6}
            value={value}
            onChange={onChange}
            pattern={REGEXP_ONLY_DIGITS}
            autoFocus={autoFocus}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <PinSlot key={i} index={i} variant={variant} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      {hint && (
        <p className="text-muted-foreground text-[11px] text-center">{hint}</p>
      )}
    </div>
  );
}
