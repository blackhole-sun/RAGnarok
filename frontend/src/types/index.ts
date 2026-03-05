export interface Thread {
  id: string
  user_id: string
  title: string
  last_response_id: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  thread_id: string
  user_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface UploadedFile {
  id: string
  user_id: string
  filename: string
  file_size_bytes: number | null
  mime_type: string | null
  openai_file_id: string | null
  vector_store_id: string | null
  status: "pending" | "processing" | "completed" | "failed"
  error_message: string | null
  created_at: string
  updated_at: string
}
