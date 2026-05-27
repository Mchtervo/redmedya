import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-sm border border-white/10 bg-white/5 px-4 py-2 text-sm text-rm-off-white placeholder:text-rm-gray-400 transition-colors focus:border-rm-champagne/50 focus:outline-none focus:ring-1 focus:ring-rm-champagne/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
