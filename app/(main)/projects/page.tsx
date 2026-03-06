"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useProjects, useCreateProject } from "@/lib/hooks/useProjects"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, FolderOpen, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const STATUS_TABS = [
  { value: "all", label: "全部" },
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "paused", label: "已暂停" },
]

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const { data: projects, isLoading } = useProjects(statusFilter === "all" ? undefined : statusFilter)
  const createMutation = useCreateProject()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<{ name: string; code: string; description: string; status: import("@/lib/types/database.types").ProjectStatus }>({ name: "", code: "", description: "", status: "active" })

  const handleCreate = async () => {
    if (!form.name || !form.code) return
    try {
      await createMutation.mutateAsync(form)
      toast.success("项目已创建")
      setDialogOpen(false)
      setForm({ name: "", code: "", description: "", status: "active" })
    } catch {
      toast.error("创建失败")
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <PageHeader
        title="项目管理"
        description="管理工程设计项目及关联字段"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            新建项目
          </Button>
        }
      />

      <div className="flex items-center gap-2 border-b px-6 py-3">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <p className="text-muted-foreground">加载中…</p>
        ) : !projects?.length ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <FolderOpen className="size-12 opacity-30" />
            <p>暂无项目</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{project.code}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description ?? "暂无描述"}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href={`/projects/${project.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                      查看详情
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
            <DialogTitle>新建项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>项目名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>项目编码 *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如 PRJ-001" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>状态</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as import("@/lib/types/database.types").ProjectStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="paused">已暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.code || createMutation.isPending}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
