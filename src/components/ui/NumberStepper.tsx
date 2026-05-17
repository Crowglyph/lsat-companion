interface Props {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit?: string
}

export function NumberStepper({ value, onChange, min, max, step, unit }: Props) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="w-12 h-12 rounded-full bg-wood text-paper text-2xl disabled:opacity-30 active:scale-95 transition"
      >
        −
      </button>
      <div className="flex-1 text-center text-3xl font-semibold text-paper tabular-nums">
        {value}
        {unit && <span className="text-base ml-1 text-paper/60">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="w-12 h-12 rounded-full bg-wood text-paper text-2xl disabled:opacity-30 active:scale-95 transition"
      >
        +
      </button>
    </div>
  )
}
