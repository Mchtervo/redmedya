import type { SVGProps } from "react";
import type { AddonId, PlatoId } from "@/config/pricing";

/**
 * REDMEDYA — Paket Oluştur özel premium ikon seti.
 * Emoji yerine; currentColor stroke, 24×24, ince zarif çizgi (marka: şampanya).
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconVenue(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M3 9 12 4l9 5" />
      <path d="M4.5 9v11M9 9v11M15 9v11M19.5 9v11" />
      <path d="M3.5 9h17" />
      <path d="M2.5 20.5h19" />
    </svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M12 21s6-5.686 6-10a6 6 0 1 0-12 0c0 4.314 6 10 6 10z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  );
}

export function IconFilm(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7.5 5v14M16.5 5v14" />
      <path d="M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21" />
      <path d="M10.5 9.5 14 12l-3.5 2.5z" />
    </svg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2l1.2-1.8A1 1 0 0 1 8.5 4.8h7a1 1 0 0 1 .8.4L17.5 7h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

export function IconDrone(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <circle cx="5" cy="5" r="2.2" />
      <circle cx="19" cy="5" r="2.2" />
      <circle cx="5" cy="19" r="2.2" />
      <circle cx="19" cy="19" r="2.2" />
      <path d="m6.6 6.6 2.6 2.6M17.4 6.6l-2.6 2.6M6.6 17.4l2.6-2.6M17.4 17.4l-2.6-2.6" />
      <rect x="9" y="9" width="6" height="6" rx="1.4" />
    </svg>
  );
}

export function IconAlbum(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="4.5" y="4" width="15" height="16" rx="1.4" />
      <path d="M8 4v16" />
      <rect x="10.5" y="8" width="6.5" height="5" rx="0.6" />
    </svg>
  );
}

export function IconCanvas(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="1.4" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="m5.5 17 4-4 3 3 3.5-3.5L20 16" />
    </svg>
  );
}

export function IconShoulderCam(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="2.5" y="8" width="12.5" height="9" rx="1.4" />
      <path d="M15 11.2 21 8v9l-6-3.2z" />
      <circle cx="7" cy="12.5" r="1.6" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M12 3.5 13.6 10.4 20.5 12l-6.9 1.6L12 20.5l-1.6-6.9L3.5 12l6.9-1.6z" />
      <path d="M18.5 4.5v3M20 6h-3" />
    </svg>
  );
}

export function IconGift(props: IconProps) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3 8h18v3H3zM12 8v12" />
      <path d="M12 8S10.5 4.5 8.5 4.5a2 2 0 0 0 0 4M12 8s1.5-3.5 3.5-3.5a2 2 0 0 1 0 4" />
    </svg>
  );
}

/** Addon id → ikon */
export function AddonIcon({ id, ...props }: { id: AddonId } & IconProps) {
  switch (id) {
    case "klip-gelin-alma":
    case "klip-salon-giris":
    case "salon-full":
      return <IconFilm {...props} />;
    case "drone":
      return <IconDrone {...props} />;
    case "omuz":
      return <IconShoulderCam {...props} />;
    case "foto-ekevent":
      return <IconCamera {...props} />;
    case "buyuk-album":
    case "aile-album":
      return <IconAlbum {...props} />;
    case "canvas-5070":
    case "canvas-70100":
      return <IconCanvas {...props} />;
    default:
      return <IconSparkle {...props} />;
  }
}

/** Plato id → ikon */
export function PlatoIcon({ id, ...props }: { id: PlatoId } & IconProps) {
  return id === "own" ? <IconPin {...props} /> : <IconVenue {...props} />;
}
