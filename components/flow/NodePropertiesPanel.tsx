"use client"

import { useReactFlow } from "@xyflow/react"
import { X, Tag } from "lucide-react"
import { useFlowStore } from "@/lib/stores/useFlowStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AppNode } from "@/lib/types/flow.types"

const roleLabel: Record<string, string> = {
  input: "输入",
  output: "输出",
  param: "参数",
}

export function NodePropertiesPanel() {
  const { selectedNodeId, setSelectedNodeId, isReadOnly } = useFlowStore()
  const { getNode } = useReactFlow()

  if (!selectedNodeId) return null

  const node = getNode(selectedNodeId) as AppNode | undefined
  if (!node) return null

  const { label, description, boundFields, deprecatedFields } = node.data

  return (
    <aside className="w-72 border-l bg-background flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium">节点属性</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setSelectedNodeId(null)}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-4">
          {/* Basic info */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">节点名称</p>
            <p className="text-sm font-semibold">{label}</p>
          </div>
          {description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">描述</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}

          {/* Deprecated warnings */}
          {deprecatedFields?.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-700 mb-2">
                ⚠ {deprecatedFields.length} 个字段已作废，请替换
              </p>
              {deprecatedFields.map((f) => (
                <p key={f.fieldId} className="text-xs text-red-600">
                  {f.fieldCode} — {f.fieldName}
                </p>
              ))}
            </div>
          )}

          {/* Bound fields */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="size-3" />
              绑定字段 ({boundFields?.length ?? 0})
            </p>
            {boundFields?.length === 0 && (
              <p className="text-xs text-muted-foreground">暂无绑定字段</p>
            )}
            <div className="space-y-1.5">
              {boundFields?.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${
                    f.isDeprecated ? "bg-red-50 text-red-600" : "bg-muted"
                  }`}
                >
                  <span className={f.isDeprecated ? "line-through" : ""}>
                    {f.fieldCode} · {f.fieldName}
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {roleLabel[f.role] ?? f.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {!isReadOnly && (
            <p className="text-xs text-muted-foreground italic">
              保存流程时字段绑定会同步到数据库
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
