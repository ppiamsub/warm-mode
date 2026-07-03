// ไอคอน SVG ที่ใช้ในดีไซน์ (stroke-based, สืบทอดสีจาก currentColor)
import React from 'react';

type P = { size?: number; color?: string; strokeWidth?: number } & React.SVGProps<SVGSVGElement>;

function base(size = 22, color = 'currentColor', strokeWidth = 2) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export const IconBell = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export const IconSearch = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const IconPlus = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth ?? 2.6)} {...r}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconHome = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

export const IconPeople = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <circle cx="17.5" cy="9" r="2.4" />
  </svg>
);

export const IconChart = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <path d="M3 21h18" />
    <path d="M6 21v-6M12 21V7M18 21v-9" />
  </svg>
);

export const IconProfile = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
  </svg>
);

export const IconBack = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth ?? 2.4)} {...r}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconCheck = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth ?? 2.4)} {...r}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconChevron = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth ?? 2.4)} {...r}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconHistory = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 4v4h4" />
    <path d="M12 8v4l3 2" />
  </svg>
);

export const IconInfo = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const IconChat = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const IconLines = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const IconGear = ({ size, color, strokeWidth, ...r }: P) => (
  <svg {...base(size, color, strokeWidth)} {...r}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
