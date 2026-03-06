"use client"

import { useReactFlow } from "@xyflow/react"
import { Save, Undo2, Redo2, LayoutDashboard, Lock, Unlock, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useFlowStore } from "@/lib/stores/useFlowStore"
import { applyDagreLayout } from "@/lib/utils/flow-layout"
import { serializeGraph } from "@/lib/utils/flow-serializer"
import { toast } from "sonner"
import { useStore } from "zustand"

interface FlowToolbarProps {
  modelId: string
  modelName: string
  onSave: (payload: ReturnType<typeof serializeGraph>) => Promise<void>
  onVersionHistory: () => void
}

export function FlowToolbar({ modelId, modelName, onSave, onVersionHistory }: FlowToolbarProps) {
  const { nodes, edges, isDirty, isSaving, isReadOnly, lockHolder, setSaving, setIsDirty } =
    useFlowStore()
  const { setNodes, getViewport } = useReactFlow()
  const { undo, redo, pastStates, futureStates } = useStore(useFlowStore.temporal)

  const handleSave = async () => {
    if (isReadOnly || isSaving) return
    setSaving(true)
    try {
      const viewport = getViewport()
      await onSave(serializeGraph({ nodes, edges, viewport }))
      setIsDirty(false)
      toast.success("流程已保存")
    } catch {
      toast.error("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  const handleAutoLayout = () => {
    const laid = applyDagreLayout(nodes, edges, "LR")
    setNodes(laid)
    setIsDirty(true)
  }

  return (
    <div className="flex items-center gap-1 border-b bg-background px-3 py-2">
      {/* Model name */}
      <span className="mr-2 text-sm font-semibold truncate max-w-[200px]">{modelName}</span>

      {/* Lock status */}
      {isReadOnly ? (
        <Badge variant="outline" className="mr-2 gap-1 text-xs text-amber-600 border-amber-300">
          <Lock className="size-3" />
          只读
        </Badge>
      ) : (
        <Badge variant="outline" className="mr-2 gap-1 text-xs text-green-600 border-green-300">
          <Unlock className="size-3" />
          编辑中
        </Badge>
      )}

      <div className="flex items-center gap-1 flex-1">
        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => undo()}
              disabled={pastStates.length === 0 || isReadOnly}
            >
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>撤销 (Ctrl+Z)</TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => redo()}
              disabled={futureStates.length === 0 || isReadOnly}
            >
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>重做 (Ctrl+Y)</TooltipContent>
        </Tooltip>

        {/* Auto layout */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleAutoLayout}
              disabled={isReadOnly}
            >
              <LayoutDashboard className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>自动布局</TooltipContent>
        </Tooltip>

        {/* Version history */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={onVersionHistory}>
              <History className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>版本历史</TooltipContent>
        </Tooltip>
      </div>

      {/* Save */}
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!isDirty || isSaving || isReadOnly}
        className="gap-1.5"
      >
        <Save className="size-3.5" />
        {isSaving ? "保存中…" : isDirty ? "保存*" : "已保存"}
      </Button>
    </div>
  )
}
