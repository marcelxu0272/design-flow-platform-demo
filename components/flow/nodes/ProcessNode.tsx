"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProcessNodeData } from "@/lib/types/flow.types"

function ProcessNode({ data, selected }: NodeProps) {
  const nodeData = data as ProcessNodeData
  const hasDeprecated = nodeData.deprecatedFields?.length > 0

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-sm transition-colors",
        selected ? "border-blue-500 shadow-blue-100 shadow-md" : "border-gray-300",
        hasDeprecated && "border-red-400 bg-red-50"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {hasDeprecated && (
              <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
            )}
            <p className="truncate text-sm font-medium leading-tight">{nodeData.label}</p>
          </div>
          {nodeData.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {nodeData.description}
            </p>
          )}
          {nodeData.boundFields?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {nodeData.boundFields.slice(0, 3).map((f) => (
                <span
                  key={f.id}
                  className={cn(
                    "rounded px-1 py-0.5 text-xs",
                    f.isDeprecated
                      ? "bg-red-100 text-red-600 line-through"
                      : "bg-blue-50 text-blue-600"
                  )}
                >
                  {f.fieldCode}
                </span>
              ))}
              {nodeData.boundFields.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{nodeData.boundFields.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  )
}

export default memo(ProcessNode)
