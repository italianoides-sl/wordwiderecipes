interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

export default function AdUnit({ slot: _slot, format: _format = 'auto', style: _style }: AdUnitProps) {
  return null;
}
