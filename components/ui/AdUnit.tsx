type AdUnitProps = {
  slot: string;
  format?: string;
  height?: number | string;
};

export default function AdUnit({ slot, format = 'auto', height = 90 }: AdUnitProps) {
  return (
    <div
      className="wwr-ad-unit"
      data-ad-slot={slot}
      data-ad-format={format}
      style={{ minHeight: height, background: 'transparent' }}
      aria-hidden="true"
    />
  );
}
