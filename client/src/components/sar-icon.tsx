interface SarIconProps {
  className?: string;
  size?: number;
}

export default function SarIcon({ className = "", size = 14 }: SarIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-label="ريال سعودي"
      className={`sar-icon inline-block align-middle select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Saudi Riyal symbol — two vertical strokes + two horizontal lines */}
      <rect x="18" y="8" width="14" height="62" rx="4" />
      <rect x="68" y="8" width="14" height="62" rx="4" />
      <rect x="18" y="34" width="64" height="11" rx="4" />
      <rect x="18" y="55" width="64" height="11" rx="4" />
      <path d="M18 70 Q50 100 82 70" stroke="currentColor" strokeWidth="11" fill="none" strokeLinecap="round" />
    </svg>
  );
}
