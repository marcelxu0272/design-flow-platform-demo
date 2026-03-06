"use client"

import { use, useState } from "react"
import { Header } from "@/components/layout/Header"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useProject, useAssociateProjectFields, useRemoveProjectField } from "@/lib/hooks/useProjects"
import { useDataFields } from "@/lib/hooks/useDataFields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { FieldRole } from "@/lib/types/database.types"
import { ScrollArea } from "@/components/ui/scroll-area"

const ROLE_TABS: { value: FieldRole; label: string; description: string }[] = [
  { value: "input", label: "输入字段", description: "项目接收的外部数据字段" },
  { value: "process", label: "处理字段", description: "项目内部计算/转换字段" },
  { value: "output", label: "输出字段", description: "项目交付的结果字段" },
]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project, isLoading } = useProject(id)
  const associateMutation = useAssociateProjectFields()
  const removeMutation = useRemoveProjectField()
  const { data: allFields } = useDataFields({ status: "published" })

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addRole, setAddRole] = useState<FieldRole>("input")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fieldsByRole = (role: FieldRole) =>
    project?.fields.filter((f) => f.role === role) ?? []

  const associatedFieldIds = new Set(project?.fields.map((f) => f.field_id) ?? [])

  const handleAdd = async () => {
    try {
      await associateMutation.mutateAsync({
        projectId: id,
        fieldIds: [...selectedIds],
        role: addRole,
      })
      toast.success("字段已关联")
      setAddDialogOpen(false)
      setSelectedIds(new Set())
    } catch {
      toast.error("关联失败")
    }
  }

  const handleRemove = async (fieldId: string) => {
    try {
      await removeMutation.mutateAsync({ projectId: id, fieldId })
      toast.success("已解除关联")
    } catch {
      toast.error("操作失败")
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中…</div>
  if (!project) return <div className="p-8 text-red-500">项目不存在</div>

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title={project.name} />
      <div className="p-6 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="size-4" /> 返回列表
            </Button>
          </Link>
        </div>

        {/* Project info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{project.name}</CardTitle>
                <code className="text-xs text-muted-foreground mt-0.5 block">{project.code}</code>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </CardHeader>
          <CardContent>
            {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
            {project.flow_model && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline">关联流程模型</Badge>
                <Link href={`/flow-models/${project.flow_model_id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  {project.flow_model.name}
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Field association */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">关联字段</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="input">
              <TabsList>
                {ROLE_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label} ({fieldsByRole(tab.value).length})
                  </TabsTrigger>
                ))}
              </TabsList>
              {ROLE_TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">{tab.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => { setAddRole(tab.value); setAddDialogOpen(true) }}
                    >
                      <Plus className="size-3.5" />
                      关联字段
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {fieldsByRole(tab.value).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">暂无关联字段</p>
                    ) : (
                      fieldsByRole(tab.value).map((pf) => (
                        <div key={pf.id} className="flex items-center justify-between rounded border px-3 py-2">
                          <div>
                            <span className="font-mono text-xs text-blue-600">{pf.field?.field_code}</span>
                            <span className="text-sm ml-2">{pf.field?.field_name}</span>
                            {pf.field?.deleted_at && (
                              <Badge variant="destructive" className="ml-2 text-xs">已作废</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-red-500"
                            onClick={() => handleRemove(pf.field_id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add field dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>关联字段 — {ROLE_TABS.find(t => t.value === addRole)?.label}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-72 border rounded-md p-3">
            <div className="space-y-2">
              {allFields
                ?.filter((f) => !associatedFieldIds.has(f.id))
                .map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Checkbox
                      id={f.id}
                      checked={selectedIds.has(f.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedIds)
                        checked ? next.add(f.id) : next.delete(f.id)
                        setSelectedIds(next)
                      }}
                    />
                    <label htmlFor={f.id} className="text-sm cursor-pointer">
                      <span className="font-mono text-xs text-blue-600">{f.field_code}</span>
                      <span className="ml-2">{f.field_name}</span>
                    </label>
                  </div>
                ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={selectedIds.size === 0 || associateMutation.isPending}>
              关联 ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
