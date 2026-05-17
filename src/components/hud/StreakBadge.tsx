interface Props {
  days: number
  graceHold: boolean
}

export function StreakBadge({ days, graceHold }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-soft/85 backdrop-blur text-paper text-sm shadow-lg">
      <span className="text-streak text-base">★</span>
      <span className="font-semibold tabular-nums">
        {days === 0 ? 'Day 0' : `Day ${days}`}
      </span>
      {graceHold && (
        <span className="text-xs text-paper/60" title="Grace day held — log something today to keep going">
          (grace)
        </span>
      )}
    </div>
  )
}
