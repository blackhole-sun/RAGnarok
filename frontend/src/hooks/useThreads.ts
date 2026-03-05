import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Thread } from "@/types"

export function useThreads() {
  const queryClient = useQueryClient()

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: () => apiFetch<Thread[]>("/api/threads"),
  })

  const createThread = useMutation({
    mutationFn: (title: string) =>
      apiFetch<Thread>("/api/threads", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["threads"] }),
  })

  const updateThread = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiFetch<Thread>(`/api/threads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["threads"] }),
  })

  const deleteThread = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/threads/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["threads"] }),
  })

  return {
    threads: threadsQuery.data ?? [],
    isLoading: threadsQuery.isLoading,
    createThread,
    updateThread,
    deleteThread,
  }
}
