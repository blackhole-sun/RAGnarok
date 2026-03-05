import { Trash2, FileText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { UploadedFile } from "@/types"

interface FileListProps {
  files: UploadedFile[]
  onDelete: (id: string) => void
}

function StatusBadge({ status }: { status: UploadedFile["status"] }) {
  const variants = {
    pending: { icon: Clock, label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    processing: { icon: Loader2, label: "Processing", className: "bg-blue-100 text-blue-800 border-blue-200" },
    completed: { icon: CheckCircle, label: "Ready", className: "bg-green-100 text-green-800 border-green-200" },
    failed: { icon: XCircle, label: "Failed", className: "bg-red-100 text-red-800 border-red-200" },
  }

  const { icon: Icon, label, className } = variants[status]

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", className)}>
      <Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />
      {label}
    </Badge>
  )
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileList({ files, onDelete }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
        >
          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.file_size_bytes)}
              {file.error_message && (
                <span className="text-destructive ml-1">— {file.error_message}</span>
              )}
            </p>
          </div>
          <StatusBadge status={file.status} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(file.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}
