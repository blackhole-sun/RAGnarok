import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { API_BASE_URL } from "@/lib/api"

interface UseChatOptions {
  threadId: string
  onDone: () => void
}

export function useChat({ threadId, onDone }: UseChatOptions) {
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    setError(null)
    setIsStreaming(true)
    setStreamingContent("")

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError("Not authenticated")
      setIsStreaming(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ thread_id: threadId, message }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(err.detail ?? "Chat request failed")
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split("\n\n")
        buffer = chunks.pop() ?? ""

        for (const chunk of chunks) {
          const eventMatch = chunk.match(/^event: (\w+)\ndata: (.+)$/s)
          if (!eventMatch) continue
          const [, eventType, dataStr] = eventMatch

          const data = JSON.parse(dataStr) as Record<string, string>

          if (eventType === "delta") {
            setStreamingContent((prev) => prev + data.content)
          } else if (eventType === "done") {
            setStreamingContent("")
            setIsStreaming(false)
            onDone()
          } else if (eventType === "error") {
            throw new Error(data.detail ?? "Stream error")
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setIsStreaming(false)
      setStreamingContent("")
    }
  }, [threadId, onDone])

  return { streamingContent, isStreaming, error, sendMessage }
}
