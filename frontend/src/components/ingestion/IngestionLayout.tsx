import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MessageSquare, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileDropzone } from "./FileDropzone"
import { FileList } from "./FileList"
import { useIngestion } from "@/hooks/useIngestion"
import { useAuth } from "@/hooks/useAuth"

export function IngestionLayout() {
  const { files, uploadFile, deleteFile } = useIngestion()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleUpload(file: File) {
    setUploadError(null)
    try {
      await uploadFile.mutateAsync(file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-border">
        <div className="flex items-center px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">Rangarok RAG</span>
        </div>
        <div className="flex-1" />
        <Separator />
        <div className="p-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/")}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
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
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents to make them available for RAG queries.
            </p>
          </div>

          <FileDropzone
            onUpload={handleUpload}
            disabled={uploadFile.isPending}
          />

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          {uploadFile.isPending && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}

          <Separator />

          <div>
            <h2 className="text-sm font-medium mb-3">Uploaded Documents</h2>
            <FileList
              files={files}
              onDelete={(id) => deleteFile.mutate(id)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
