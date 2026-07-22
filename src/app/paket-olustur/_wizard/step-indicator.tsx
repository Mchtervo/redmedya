"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COPY } from "@/content/paketOlustur";
import { useWizard } from "./wizard-context";

export function StepIndicator() {
  const { state, goToStep } = useWizard();
  const steps = COPY.steps;

  return (
    <nav aria-label="Adımlar" className="mb-8 sm:mb-10">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((label, i) => {
          const stepNo = (i + 1) as 1 | 2 | 3;
          const active = state.step === stepNo;
          const done = state.step > stepNo;
          const reachable = stepNo <= state.step;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && goToStep(stepNo)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2 py-1 transition-colors sm:px-3",
                  reachable ? "cursor-pointer" : "cursor-not-allowed",
                  active && "bg-rm-champagne/10"
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors sm:h-7 sm:w-7 sm:text-xs",
                    done && "bg-rm-champagne text-rm-black",
                    active && "bg-rm-champagne text-rm-black ring-2 ring-rm-champagne/30",
                    !done && !active && "border border-white/15 text-rm-gray-400"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : stepNo}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium tracking-wide sm:text-xs",
                    active ? "text-rm-off-white" : "text-rm-gray-400",
                    "hidden xs:inline sm:inline"
                  )}
                >
                  {label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "h-px w-4 sm:w-10",
                    done ? "bg-rm-champagne/50" : "bg-white/10"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
