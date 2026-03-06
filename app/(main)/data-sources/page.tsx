"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { DataSource } from "@/lib/types/database.types"
import { toast } from "sonner"

function useDataSources() {
  return useQuery({
    queryKey: ["data-sources"],
    queryFn: async () => {
      const res = await fetch("/api/data-sources")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json() as Promise<DataSource[]>
    },
  })
}

export default function DataSourcesPage() {
  const { data: sources, isLoading } = useDataSources()
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", source_type: "system", description: "" })

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data-sources"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/data-sources/${id}`, { method: "DELETE" })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data-sources"] }),
  })

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form)
      toast.success("数据源已创建")
      setDialogOpen(false)
      setForm({ name: "", source_type: "system", description: "" })
    } catch {
      toast.error("创建失败")
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <PageHeader
        title="数据源管理"
        description="管理数据字段的来源系统"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            新建数据源
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-16">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">加载中…</TableCell></TableRow>
            ) : !sources?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无数据源</TableCell></TableRow>
            ) : (
              sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{s.source_type}</code></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.description ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString("zh-CN")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7 hover:text-red-500" onClick={() => deleteMutation.mutate(s.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建数据源</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>名称 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>类型</Label>
              <Input value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} placeholder="如 database / api / excel" />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!form.name || createMutation.isPending}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
