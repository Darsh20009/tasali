interface SarIconProps {
  className?: string;
  size?: number;
}

export default function SarIcon({ className = "", size = 14 }: SarIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-label="ريال سعودي"
      className={`inline-block align-middle select-none ${className}`}
      style={{ width: size, height: size }}
      fill="currentColor"
    >
      {/* Official Saudi Riyal symbol — ر.س stylised */}
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="13"
        fontFamily="'IBM Plex Sans Arabic', 'Tajawal', Arial, sans-serif"
        fontWeight="700"
      >
        ﷼
      </text>
    </svg>
  );
}
