import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThreadList } from "./ThreadList"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import { useThreads } from "@/hooks/useThreads"
import { useMessages } from "@/hooks/useMessages"
import { useChat } from "@/hooks/useChat"
import { useAuth } from "@/hooks/useAuth"

export function ChatLayout() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const { threads, isLoading, createThread, updateThread, deleteThread } = useThreads()
  const { messages, invalidate } = useMessages(selectedThreadId)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleDone = useCallback(() => {
    invalidate()
  }, [invalidate])

  const { streamingContent, isStreaming, error, sendMessage } = useChat({
    threadId: selectedThreadId ?? "",
    onDone: handleDone,
  })

  async function handleNewThread() {
    const thread = await createThread.mutateAsync("New Chat")
    setSelectedThreadId(thread.id)
  }

  async function handleSend(message: string) {
    if (!selectedThreadId) return

    // Auto-set thread title on first message
    const thread = threads.find((t) => t.id === selectedThreadId)
    if (thread && thread.title === "New Chat" && messages.length === 0) {
      const title = message.slice(0, 60)
      updateThread.mutate({ id: selectedThreadId, title })
    }

    await sendMessage(message)
  }

  async function handleDeleteThread(id: string) {
    await deleteThread.mutateAsync(id)
    if (selectedThreadId === id) setSelectedThreadId(null)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">Rangarok RAG</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <ThreadList
            threads={threads}
            selectedId={selectedThreadId}
            onSelect={setSelectedThreadId}
            onNew={handleNewThread}
            onDelete={handleDeleteThread}
            isCreating={createThread.isPending || isLoading}
          />
        </div>

        <Separator />
        <div className="p-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/ingest")}
          >
            <Upload className="h-4 w-4" />
            Documents
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {selectedThreadId ? (
          <>
            <MessageList messages={messages} streamingContent={streamingContent} isStreaming={isStreaming} />
            {error && (
              <p className="text-sm text-destructive text-center py-2 px-4">{error}</p>
            )}
            <ChatInput onSend={handleSend} disabled={isStreaming || !selectedThreadId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Welcome to Rangarok RAG</p>
              <p className="text-sm text-muted-foreground">
                Select a conversation or start a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
