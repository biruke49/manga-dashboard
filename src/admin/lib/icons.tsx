import type { SVGProps } from "react";

function baseIcon(props: SVGProps<SVGSVGElement>) {
  return {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    ...props,
  };
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M4 13h7V4H4z" />
      <path d="M13 20h7v-9h-7z" />
      <path d="M13 11h7V4h-7z" />
      <path d="M4 20h7v-5H4z" />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  );
}

export function BlogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4 4Z" />
      <path d="M5 4v16a4 4 0 0 1 4-4h10" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function TestimonialIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M9 11h6" />
      <path d="M9 15h3" />
      <path d="M5 19l-1 3 4-2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 1 2Z" />
    </svg>
  );
}

export function RequestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M4 6a2 2 0 0 1 2-2h12l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M14 4v4h4" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function AreasIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function FleetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M5 17h14" />
      <path d="M6 17l1.3-6.5A3 3 0 0 1 10.2 8h3.6a3 3 0 0 1 2.9 2.5L18 17" />
      <path d="M8 13h8" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
      <path d="M10 8V5h4v3" />
    </svg>
  );
}

export function BusinessIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M4 10h16" />
      <path d="M5 10l1-5h12l1 5" />
      <path d="M6 10v10h12V10" />
      <path d="M9 20v-5h6v5" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
    </svg>
  );
}

export function ServicesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M14.5 5.5 18.5 9.5" />
      <path d="M11 9 7 5a2 2 0 0 0-2.8 2.8l4 4" />
      <path d="m13 11 6.5 6.5a2.1 2.1 0 1 1-3 3L10 14" />
      <path d="m8 12-4.5 4.5a2.1 2.1 0 1 0 3 3L11 15" />
    </svg>
  );
}

export function GalleryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5L8 19" />
    </svg>
  );
}

export function PlansIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
      <path d="m18 16 2 2-2 2" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="m4.9 4.9 2.1 2.1" />
      <path d="m17 17 2.1 2.1" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m4.9 19.1 2.1-2.1" />
      <path d="m17 7 2.1-2.1" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function ActivityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M22 12h-4l-3 7-6-14-3 7H2" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16.7A4 4 0 0 1 18 24H6a4 4 0 0 1-2-7.3" />
    </svg>
  );
}

export function PublishIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 16V5" />
      <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function DraftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 8v11" />
      <path d="m16.5 14.5-4.5 4.5-4.5-4.5" />
      <path d="M5 5h14" />
    </svg>
  );
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function DotsVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <circle cx="12" cy="5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </svg>
  );
}

export function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 3 2.8 19h18.4z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function PowerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 3v8" />
      <path d="M7.8 5.8a8 8 0 1 0 8.4 0" />
    </svg>
  );
}

export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 15h10" />
      <path d="M18 15v-3" />
      <path d="M21 15v-2" />
    </svg>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseIcon(props)}>
      <path d="M12 3 5 6v6c0 5 3.4 8.7 7 10 3.6-1.3 7-5 7-10V6z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  );
}
