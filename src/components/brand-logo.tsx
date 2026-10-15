type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 40, className = "" }: BrandLogoProps) {
  return (
    <img
      src="/assets/images/logo-htnlegacy.png"
      alt="HTN Legacy"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
