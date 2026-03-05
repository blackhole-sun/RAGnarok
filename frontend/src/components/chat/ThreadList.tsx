import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { NewThreadButton } from "./NewThreadButton"
import { ThreadItem } from "./ThreadItem"
import type { Thread } from "@/types"

interface ThreadListProps {
  threads: Thread[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  isCreating: boolean
}

export function ThreadList({
  threads,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  isCreating,
}: ThreadListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <NewThreadButton onNew={onNew} disabled={isCreating} />
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-2">
        {threads.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4 px-2">
            No conversations yet. Start a new chat!
          </p>
        )}
        <div className="space-y-0.5">
          {threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isSelected={thread.id === selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
