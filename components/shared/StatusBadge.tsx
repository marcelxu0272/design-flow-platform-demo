import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "draft" | "published" | "deprecated" | "active" | "completed" | "paused"

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-100 text-gray-700 border-gray-200" },
  published: { label: "已发布", className: "bg-green-100 text-green-700 border-green-200" },
  deprecated: { label: "已作废", className: "bg-red-100 text-red-700 border-red-200" },
  active: { label: "进行中", className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "已完成", className: "bg-green-100 text-green-700 border-green-200" },
  paused: { label: "已暂停", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? { label: status, className: "" }
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
