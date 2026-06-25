interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'orange' | 'white' | 'ink' | 'multicolor'
}

export function Spinner({ size = 'md', color = 'multicolor' }: SpinnerProps) {
  const sizes = {
    sm: 18,
    md: 32,
    lg: 65,
  }

  const s = sizes[size]
  const isMulticolor = color === 'multicolor' || color === 'orange';

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 66 66"
      xmlns="http://www.w3.org/2000/svg"
      className="spinner"
    >
      <circle
        className={isMulticolor ? "spinner-path" : "spinner-solid-path"}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        cx="33"
        cy="33"
        r="30"
        style={!isMulticolor ? { stroke: color === 'white' ? '#FFFFFF' : '#0D0A08' } : undefined}
      />
    </svg>
  )
}

