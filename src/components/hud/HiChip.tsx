interface Props {
  onSayHi: () => void
  disabled: boolean
  petName: string
}

export function HiChip({ onSayHi, disabled, petName }: Props) {
  return (
    <button
      type="button"
      onClick={onSayHi}
      disabled={disabled}
      className={`px-4 py-2 rounded-full bg-ink-soft/85 backdrop-blur text-paper text-sm shadow-lg
                  active:scale-95 transition disabled:opacity-40 disabled:active:scale-100`}
    >
      {disabled ? `Said hi to ${petName} ✓` : `Hi, ${petName}`}
    </button>
  )
}
