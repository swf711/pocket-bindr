'use client'

interface SetOption {
  id: string
  name: string
  series: string
}

interface CardFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  sets: SetOption[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
}

export function CardFilters({ query, onQueryChange, sets, selectedSetId, onSetChange }: CardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        data-testid="search-input"
        type="text"
        placeholder="搜尋卡牌名稱..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        data-testid="set-filter"
        value={selectedSetId ?? ''}
        onChange={(e) => onSetChange(e.target.value || null)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">所有系列</option>
        {sets.map(s => (
          <option key={s.id} value={s.id}>{s.series} - {s.name}</option>
        ))}
      </select>
    </div>
  )
}
