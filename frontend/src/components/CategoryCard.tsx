import { Card } from "@/components/ui/card"

export function CategoryCard({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-6 text-center hover:bg-accent transition"
    >
      <span className="font-medium">{label}</span>
    </Card>
  )
}
