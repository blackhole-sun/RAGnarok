import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Thread } from "@/types"

interface ThreadItemProps {
  thread: Thread
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ThreadItem({ thread, isSelected, onSelect, onDelete }: ThreadItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent",
        isSelected && "bg-accent"
      )}
      onClick={() => onSelect(thread.id)}
    >
      <span className="truncate flex-1 text-sm">{thread.title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(thread.id)
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
