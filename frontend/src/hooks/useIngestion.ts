import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { API_BASE_URL, apiFetch } from "@/lib/api"
import type { UploadedFile } from "@/types"

export function useIngestion() {
  const queryClient = useQueryClient()

  const filesQuery = useQuery({
    queryKey: ["uploaded-files"],
    queryFn: () => apiFetch<UploadedFile[]>("/api/ingestion/files"),
    refetchInterval: 3000, // Poll every 3s for status updates
  })

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/api/ingestion/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(err.detail ?? "Upload failed")
      }

      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uploaded-files"] }),
  })

  const deleteFile = useMutation({
    mutationFn: (fileId: string) =>
      apiFetch<void>(`/api/ingestion/files/${fileId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uploaded-files"] }),
  })

  return {
    files: filesQuery.data ?? [],
    isLoading: filesQuery.isLoading,
    uploadFile,
    deleteFile,
  }
}
