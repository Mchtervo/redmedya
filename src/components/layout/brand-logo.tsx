import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Koyu arka plan (hero) için açık kenarlıklı görünüm */
  variant?: "default" | "on-dark";
  className?: string;
  href?: string;
  priority?: boolean;
  /** Navbar: kompakt; footer: biraz daha geniş */
  size?: "nav" | "footer" | "intro" | "admin";
};

const SIZES = {
  nav: { w: 140, h: 44, className: "h-9 w-auto md:h-10" },
  footer: { w: 160, h: 50, className: "h-11 w-auto" },
  intro: { w: 220, h: 70, className: "h-16 w-auto md:h-20" },
  admin: { w: 130, h: 40, className: "h-9 w-auto" },
} as const;

export function BrandLogo({
  variant = "default",
  className,
  href = "/",
  priority = false,
  size = "nav",
}: BrandLogoProps) {
  const dim = SIZES[size];
  const img = (
    <Image
      src="/logo-redmedya.png"
      alt="RED MEDIA — Ankara düğün fotoğrafçısı ve video prodüksiyon"
      width={dim.w}
      height={dim.h}
      priority={priority}
      className={cn(
        dim.className,
        "object-contain",
        size === "intro" ? "mx-auto object-center" : "object-left",
        variant === "on-dark" && "brightness-110",
        className
      )}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="RED MEDIA ana sayfa">
      {img}
    </Link>
  );
}
