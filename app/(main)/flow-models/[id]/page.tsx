"use client"

import { use, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { FlowEditor } from "@/components/flow/FlowEditor"
import { FlowToolbar } from "@/components/flow/FlowToolbar"
import { EditLockBanner } from "@/components/flow/EditLockBanner"
import { useFlowStore } from "@/lib/stores/useFlowStore"
import { useFlowModel, useSaveFlowModel, useFlowModelVersions, useRevertFlowModel } from "@/lib/hooks/useFlowModels"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { serializeGraph } from "@/lib/utils/flow-serializer"

export default function FlowModelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data, isLoading } = useFlowModel(id)
  const saveMutation = useSaveFlowModel(id)
  const { data: versions } = useFlowModelVersions(id)
  const revertMutation = useRevertFlowModel(id)

  const {
    initGraph,
    setCurrentModelId,
    isReadOnly,
    lockHolder,
    setIsReadOnly,
    setLockHolder,
  } = useFlowStore()

  const [versionsOpen, setVersionsOpen] = useState(false)
  const supabase = createClient()

  // Initialize graph from DB
  useEffect(() => {
    if (data) {
      initGraph(data.nodes, data.edges)
      setCurrentModelId(id)
    }
  }, [data, id, initGraph, setCurrentModelId])

  // Acquire edit lock
  useEffect(() => {
    let heartbeat: ReturnType<typeof setInterval>

    const acquire = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result } = await (supabase as any).rpc("acquire_flow_lock", {
        p_model_id: id,
        p_user_id: user.id,
      })

      if (result?.success) {
        setIsReadOnly(false)
        heartbeat = setInterval(async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc("acquire_flow_lock", { p_model_id: id, p_user_id: user.id })
        }, 25000)
      } else {
        setIsReadOnly(true)
        setLockHolder(result?.holder_id ?? "其他用户")
      }
    }

    acquire()

    // Subscribe to lock changes
    const channel = supabase
      .channel(`flow_lock_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "flow_models", filter: `id=eq.${id}` }, (payload) => {
        const newRecord = payload.new as { locked_by: string | null }
        if (!newRecord.locked_by) {
          toast.info("编辑权已释放，点击进入编辑模式")
          setIsReadOnly(false)
          setLockHolder(null)
        }
      })
      .subscribe()

    return () => {
      clearInterval(heartbeat)
      supabase.channel(`flow_lock_${id}`).unsubscribe()
      // Release lock on unmount
      supabase.auth.getUser().then(({ data: { user } }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (user) (supabase as any).rpc("release_flow_lock", { p_model_id: id, p_user_id: user.id })
      })
    }
  }, [id, supabase, setIsReadOnly, setLockHolder])

  const handleSave = useCallback(async (payload: ReturnType<typeof serializeGraph>) => {
    await saveMutation.mutateAsync(payload)
  }, [saveMutation])

  const handleRevert = async (versionNum: number) => {
    try {
      const result = await revertMutation.mutateAsync(versionNum)
      toast.success(`已回滚到版本 ${versionNum}`)
      if ((result as { deprecatedWarnings?: unknown[] }).deprecatedWarnings?.length) {
        toast.warning(`${(result as { deprecatedWarnings: unknown[] }).deprecatedWarnings.length} 个字段绑定已作废，请人工替换`)
      }
      setVersionsOpen(false)
      // Re-fetch
      router.refresh()
    } catch {
      toast.error("回滚失败")
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground">加载中…</div>
  )

  const modelName = data?.model?.name ?? "流程模型"

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <div className="flex items-center gap-2 border-b px-3 py-1.5 bg-background">
        <Link href="/flow-models">
          <Button variant="ghost" size="sm" className="gap-1 h-7">
            <ArrowLeft className="size-3.5" /> 返回列表
          </Button>
        </Link>
      </div>

      {/* Lock banner */}
      {isReadOnly && lockHolder && (
        <EditLockBanner holderName={lockHolder} />
      )}

      {/* Toolbar (needs ReactFlowProvider context) */}
      <ReactFlowProvider>
        <FlowToolbar
          modelId={id}
          modelName={modelName}
          onSave={handleSave}
          onVersionHistory={() => setVersionsOpen(true)}
        />

        {/* Editor: flex container + full-height wrapper so ReactFlow gets width/height */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 w-full flex flex-col">
            <FlowEditor />
          </div>
        </div>
      </ReactFlowProvider>

      {/* Version history sheet */}
      <Sheet open={versionsOpen} onOpenChange={setVersionsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>版本历史</SheetTitle>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
            <div className="space-y-2 pr-4">
              {!versions?.length && (
                <p className="text-sm text-muted-foreground">暂无版本记录</p>
              )}
              {versions?.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">版本 {v.version_num}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString("zh-CN")}
                    </p>
                    {v.change_note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{v.change_note}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleRevert(v.version_num)}
                    disabled={revertMutation.isPending}
                  >
                    <RotateCcw className="size-3" />
                    回滚
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
