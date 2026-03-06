"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useFlowModels, useCreateFlowModel } from "@/lib/hooks/useFlowModels"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, GitBranch, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function FlowModelsPage() {
  const { data: models, isLoading } = useFlowModels()
  const createMutation = useCreateFlowModel()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      const model = await createMutation.mutateAsync({ name: name.trim(), description })
      toast.success("流程模型已创建")
      setDialogOpen(false)
      setName("")
      setDescription("")
    } catch {
      toast.error("创建失败")
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <PageHeader
        title="流程建模"
        description="可视化管理工程设计流程"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            新建模型
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <p className="text-muted-foreground">加载中…</p>
        ) : !models?.length ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <GitBranch className="size-12 opacity-30" />
            <p>暂无流程模型</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>新建模型</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {models.map((model) => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{model.name}</CardTitle>
                    <StatusBadge status={model.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {model.description ?? "暂无描述"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    更新于 {new Date(model.updated_at).toLocaleDateString("zh-CN")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href={`/flow-models/${model.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                      打开编辑器
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建流程模型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>模型名称 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如 原油蒸馏流程" />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createMutation.isPending}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
