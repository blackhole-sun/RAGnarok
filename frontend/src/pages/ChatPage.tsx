import { AuthGuard } from "@/components/auth/AuthGuard"
import { ChatLayout } from "@/components/chat/ChatLayout"

export function ChatPage() {
  return (
    <AuthGuard>
      <ChatLayout />
    </AuthGuard>
  )
}
