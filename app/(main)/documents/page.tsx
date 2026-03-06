"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useDocuments, useCreateDocument } from "@/lib/hooks/useDocuments"
import { useProjects } from "@/lib/hooks/useProjects"
import { useFlowModels } from "@/lib/hooks/useFlowModels"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments()
  const { data: projects } = useProjects()
  const { data: flowModels } = useFlowModels()
  const createMutation = useCreateDocument()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    project_id: "",
    flow_model_id: "",
  })

  const handleCreate = async () => {
    if (!form.title || !form.project_id) return
    try {
      await createMutation.mutateAsync({
        title: form.title,
        project_id: form.project_id,
        flow_model_id: form.flow_model_id || null,
      })
      toast.success("文档已创建")
      setDialogOpen(false)
      setForm({ title: "", project_id: "", flow_model_id: "" })
    } catch {
      toast.error("创建失败")
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <PageHeader
        title="交付文档"
        description="管理工程设计交付文档与版本"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            新建文档
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>文档标题</TableHead>
              <TableHead>所属项目</TableHead>
              <TableHead>关联流程</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后更新</TableHead>
              <TableHead className="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中…</TableCell>
              </TableRow>
            ) : !documents?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无文档</TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <Link href={`/documents/${doc.id}`} className="hover:underline text-blue-600">
                      {doc.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(doc as { project?: { name: string } }).project?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(doc as { flow_model?: { name: string; id: string } }).flow_model ? (
                      <Link href={`/flow-models/${doc.flow_model_id}`} className="flex items-center gap-1 hover:underline text-blue-600">
                        {(doc as { flow_model?: { name: string } }).flow_model?.name}
                        <ExternalLink className="size-3" />
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">v{doc.current_version}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.updated_at).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <Link href={`/documents/${doc.id}`}>
                      <Button variant="ghost" size="sm">详情</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>文档标题 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>所属项目 *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择项目" /></SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>关联流程模型</Label>
              <Select value={form.flow_model_id} onValueChange={(v) => setForm({ ...form, flow_model_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择流程模型（可选）" /></SelectTrigger>
                <SelectContent>
                  {flowModels?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.project_id || createMutation.isPending}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
