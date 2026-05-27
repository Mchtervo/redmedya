import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-luxury inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rm-champagne/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-rm-champagne text-rm-black hover:bg-rm-champagne-light shadow-[0_0_30px_rgba(201,169,98,0.25)]",
        outline:
          "border border-rm-champagne/40 bg-transparent text-rm-off-white hover:border-rm-champagne hover:bg-rm-champagne/10",
        ghost:
          "bg-transparent text-rm-off-white hover:bg-white/5",
        glass:
          "glass-gold text-rm-off-white hover:border-rm-champagne/40",
        whatsapp:
          "bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg",
      },
      size: {
        default: "h-12 px-8 text-sm tracking-wide uppercase",
        sm: "h-10 px-5 text-xs tracking-wide uppercase",
        lg: "h-14 px-10 text-sm tracking-widest uppercase",
        icon: "h-11 w-11",
      },
      rounded: {
        default: "rounded-sm",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
