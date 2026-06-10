interface SarIconProps {
  className?: string;
  size?: number;
}

export default function SarIcon({ className = "", size = 14 }: SarIconProps) {
  return (
    <span
      aria-label="ريال سعودي"
      className={`inline-block align-middle select-none font-bold ${className}`}
      style={{ fontSize: Math.max(8, size * 0.75), lineHeight: 1 }}
    >
      ر.س
    </span>
  );
}
