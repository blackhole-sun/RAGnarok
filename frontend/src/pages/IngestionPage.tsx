import { AuthGuard } from "@/components/auth/AuthGuard"
import { IngestionLayout } from "@/components/ingestion/IngestionLayout"

export function IngestionPage() {
  return (
    <AuthGuard>
      <IngestionLayout />
    </AuthGuard>
  )
}
