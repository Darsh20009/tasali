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
      className={`inline-block align-middle select-none object-contain sar-icon ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
