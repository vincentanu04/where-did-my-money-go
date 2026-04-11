import { Card } from "@/components/ui/card"

export function CategoryCard({
  label,
  emoji,
  onClick,
}: {
  label: string
  emoji: string
  onClick: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer select-none active:scale-95 transition-transform min-h-[88px] flex flex-col items-center justify-center gap-1.5 hover:bg-accent"
    >
      <span className="text-3xl leading-none">{emoji}</span>
      <span className="text-sm font-medium text-center px-2 leading-tight">{label}</span>
    </Card>
  )
}
