import { useCallback, useState } from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileDropzoneProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export function FileDropzone({ onUpload, disabled }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file: File | undefined) => {
    if (!file || disabled) return
    onUpload(file)
  }, [onUpload, disabled])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0])
    e.target.value = ""
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-accent"
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm font-medium mb-1">Drag and drop a file here</p>
      <p className="text-xs text-muted-foreground mb-4">
        Supports PDF, DOCX, TXT, and more
      </p>
      <label>
        <input
          type="file"
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
          accept=".pdf,.docx,.doc,.txt,.md,.html"
        />
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={disabled}
        >
          <span className="cursor-pointer">Browse files</span>
        </Button>
      </label>
    </div>
  )
}
