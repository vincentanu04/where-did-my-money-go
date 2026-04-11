import { CategoryCard } from "./CategoryCard"

const categories = [
  { label: "Cooking Ingredients", emoji: "🥗" },
  { label: "Groceries", emoji: "🛒" },
  { label: "Transport", emoji: "🚃" },
  { label: "Lunch", emoji: "🍱" },
  { label: "Dinner", emoji: "🍽️" },
  { label: "Snack", emoji: "🍿" },
  { label: "Entertainment", emoji: "🎮" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Exercise", emoji: "🏃" },
  { label: "Others", emoji: "💸" },
]

export function CategoryGrid({ onSelect }: { onSelect: (c: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((c) => (
        <CategoryCard key={c.label} label={c.label} emoji={c.emoji} onClick={() => onSelect(c.label)} />
      ))}
    </div>
  )
}
