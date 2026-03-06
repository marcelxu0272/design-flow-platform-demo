"use client"

import { use, useState } from "react"
import { Header } from "@/components/layout/Header"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useDocument, usePublishDocument, useDocumentVersions } from "@/lib/hooks/useDocuments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: doc, isLoading } = useDocument(id)
  const { data: versions } = useDocumentVersions(id)
  const publishMutation = usePublishDocument()

  const [publishOpen, setPublishOpen] = useState(false)
  const [changeNote, setChangeNote] = useState("")

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync({ id, changeNote })
      toast.success("文档已发布")
      setPublishOpen(false)
      setChangeNote("")
    } catch {
      toast.error("发布失败")
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中…</div>
  if (!doc) return <div className="p-8 text-red-500">文档不存在</div>

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title={doc.title} />
      <div className="p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <Link href="/documents">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="size-4" /> 返回列表
            </Button>
          </Link>
          {doc.status === "draft" && (
            <Button size="sm" className="ml-auto gap-1" onClick={() => setPublishOpen(true)}>
              <Send className="size-3.5" />
              发布文档
            </Button>
          )}
        </div>

        {/* Doc info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{doc.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">v{doc.current_version}</Badge>
                <StatusBadge status={doc.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">所属项目</p>
                <p>{(doc as { project?: { name: string; id: string } }).project?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">关联流程</p>
                {(doc as { flow_model?: { id: string; name: string } }).flow_model ? (
                  <Link href={`/flow-models/${doc.flow_model_id}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                    {(doc as { flow_model?: { name: string } }).flow_model?.name}
                    <ExternalLink className="size-3" />
                  </Link>
                ) : <p>—</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">创建时间</p>
                <p>{new Date(doc.created_at).toLocaleString("zh-CN")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">最后更新</p>
                <p>{new Date(doc.updated_at).toLocaleString("zh-CN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">版本历史</CardTitle>
          </CardHeader>
          <CardContent>
            {!versions?.length ? (
              <p className="text-sm text-muted-foreground">暂无版本记录</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {versions.map((v, i) => (
                    <div key={v.id} className="flex gap-4 pl-8 relative">
                      <div className="absolute left-1.5 top-1.5 size-3 rounded-full bg-background border-2 border-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">v{v.version_num}</Badge>
                          {i === 0 && <Badge className="text-xs">最新</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(v.created_at).toLocaleString("zh-CN")}
                          {v.created_by && ` · ${v.created_by}`}
                        </p>
                        {v.change_note && (
                          <p className="text-sm mt-0.5">{v.change_note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发布文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">发布后文档将升级到下一版本，状态变更为「已发布」。</p>
            <div className="space-y-1.5">
              <Label>发布说明</Label>
              <Textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="描述本次发布的变更内容"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>取消</Button>
            <Button onClick={handlePublish} disabled={publishMutation.isPending}>确认发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
