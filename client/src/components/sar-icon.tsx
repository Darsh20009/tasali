interface SarIconProps {
  className?: string;
  size?: number;
}

export default function SarIcon({ className = "", size = 14 }: SarIconProps) {
  return (
    <img
      src="/sar-icon.png"
      alt="ريال"
      aria-label="ريال سعودي"
      className={`sar-icon inline-block align-middle select-none shrink-0 ${className}`}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
