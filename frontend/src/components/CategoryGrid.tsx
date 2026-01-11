import { CategoryCard } from "./CategoryCard"

const categories = [
  "Cooking Ingredients",
  "Groceries",
  "Transport",
  "Lunch",
  "Dinner",
  "Snack",
  "Entertainment",
  "Shopping",
  "Exercise",
  "Others",
]

export function CategoryGrid({ onSelect }: { onSelect: (c: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((c) => (
        <CategoryCard key={c} label={c} onClick={() => onSelect(c)} />
      ))}
    </div>
  )
}
