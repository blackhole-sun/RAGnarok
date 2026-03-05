import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Message } from "@/types"

export function useMessages(threadId: string | null) {
  const queryClient = useQueryClient()

  const messagesQuery = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => apiFetch<Message[]>(`/api/messages/${threadId}`),
    enabled: !!threadId,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["messages", threadId] })
  }

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    invalidate,
  }
}
