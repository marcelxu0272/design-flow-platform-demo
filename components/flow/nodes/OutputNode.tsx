"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { PackageCheck, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OutputNodeData } from "@/lib/types/flow.types"

function OutputNode({ data, selected }: NodeProps) {
  const nodeData = data as OutputNodeData
  const hasDeprecated = nodeData.deprecatedFields?.length > 0

  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border-2 bg-purple-50 px-4 py-3 shadow-sm",
        selected
          ? "border-purple-500 shadow-md"
          : hasDeprecated
          ? "border-red-400"
          : "border-purple-300"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-purple-500" />
      <div className="flex items-center gap-2">
        {hasDeprecated ? (
          <AlertTriangle className="size-4 shrink-0 text-red-500" />
        ) : (
          <PackageCheck className="size-4 shrink-0 text-purple-600" />
        )}
        <p className="truncate text-sm font-medium text-purple-800">{nodeData.label}</p>
      </div>
    </div>
  )
}

export default memo(OutputNode)
