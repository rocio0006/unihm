interface ViewToggleProps {
  view: 'list' | 'grid'
  onChange: (view: 'list' | 'grid') => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex overflow-hidden rounded-full border-2 border-ink">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`px-3.5 py-1.5 text-[13px] font-bold ${view === 'list' ? 'bg-ink text-cream' : 'text-ink'}`}
      >
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`px-3.5 py-1.5 text-[13px] font-bold ${view === 'grid' ? 'bg-ink text-cream' : 'text-ink'}`}
      >
        Grid
      </button>
    </div>
  )
}
