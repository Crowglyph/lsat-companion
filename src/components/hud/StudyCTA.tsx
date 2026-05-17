interface Props {
  onClick: () => void
}

export function StudyCTA({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-5 rounded-2xl bg-lamp text-ink font-bold text-xl shadow-xl active:scale-[0.98] transition"
    >
      Study
    </button>
  )
}
