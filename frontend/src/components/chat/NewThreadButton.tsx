import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewThreadButtonProps {
  onNew: () => void
  disabled?: boolean
}

export function NewThreadButton({ onNew, disabled }: NewThreadButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-2"
      onClick={onNew}
      disabled={disabled}
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  )
}
