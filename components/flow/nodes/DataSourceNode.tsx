"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Database } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DataSourceNodeData } from "@/lib/types/flow.types"

function DataSourceNode({ data, selected }: NodeProps) {
  const nodeData = data as DataSourceNodeData

  return (
    <div
      className={cn(
        "min-w-[160px] rounded-full border-2 bg-emerald-50 px-4 py-3 shadow-sm",
        selected ? "border-emerald-500 shadow-md" : "border-emerald-300"
      )}
    >
      <div className="flex items-center gap-2">
        <Database className="size-4 shrink-0 text-emerald-600" />
        <p className="truncate text-sm font-medium text-emerald-800">{nodeData.label}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  )
}

export default memo(DataSourceNode)
