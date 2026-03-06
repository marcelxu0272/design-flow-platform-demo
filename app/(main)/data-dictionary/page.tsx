"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FieldFormSheet } from "@/components/data-dictionary/FieldFormSheet"
import { useDataFields, useSoftDeleteField, useUpdateFieldStatus } from "@/lib/hooks/useDataFields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MoreHorizontal, ExternalLink, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import type { DataField, FieldStatus, EngineeringDiscipline } from "@/lib/types/database.types"
import { toast } from "sonner"

const DISCIPLINES = [
  { value: "all", label: "全部专业" },
  { value: "process", label: "工艺" },
  { value: "piping", label: "配管" },
  { value: "instrumentation", label: "仪控" },
  { value: "equipment", label: "设备" },
  { value: "electrical", label: "电气" },
  { value: "civil", label: "土建" },
  { value: "general", label: "总图" },
]

const STATUS_TABS = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "deprecated", label: "已作废" },
]

export default function DataDictionaryPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [discipline, setDiscipline] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editField, setEditField] = useState<DataField | null>(null)

  const { data: fields, isLoading } = useDataFields({
    status: status as FieldStatus | "all",
    discipline: discipline as EngineeringDiscipline | "all",
    search,
  })
  const deleteMutation = useSoftDeleteField()
  const statusMutation = useUpdateFieldStatus()

  const handleDelete = async (id: string) => {
    if (!confirm("确认作废该字段？操作不可撤销。")) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success("字段已作废")
    } catch {
      toast.error("操作失败")
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await statusMutation.mutateAsync({ id, status: "published" })
      toast.success("字段已发布")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <PageHeader
        title="数据字典"
        description="管理工程设计数据字段标准"
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { setEditField(null); setSheetOpen(true) }}
          >
            <Plus className="size-4" />
            新建字段
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 border-b px-6 py-3 bg-background">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索字段编码或名称…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={status === tab.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Select value={discipline} onValueChange={setDiscipline}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISCIPLINES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>字段编码</TableHead>
              <TableHead>字段名称</TableHead>
              <TableHead>专业</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>数据类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>标准规范</TableHead>
              <TableHead className="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  加载中…
                </TableCell>
              </TableRow>
            ) : !fields?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无字段数据
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field) => (
                <TableRow key={field.id} className={field.deleted_at ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs font-medium">
                    <Link href={`/data-dictionary/${field.id}`} className="hover:underline text-blue-600">
                      {field.field_code}
                    </Link>
                  </TableCell>
                  <TableCell>{field.field_name}</TableCell>
                  <TableCell>
                    {field.engineering_discipline && (
                      <Badge variant="outline" className="text-xs">
                        {DISCIPLINES.find(d => d.value === field.engineering_discipline)?.label ?? field.engineering_discipline}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{field.unit_of_measure ?? "—"}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{field.data_type}</code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={field.status as "draft" | "published" | "deprecated"} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{field.standard_ref ?? "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/data-dictionary/${field.id}`} className="flex items-center gap-2">
                            <ExternalLink className="size-3.5" />
                            查看详情
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setEditField(field); setSheetOpen(true) }}
                        >
                          编辑
                        </DropdownMenuItem>
                        {field.status === "draft" && (
                          <DropdownMenuItem onClick={() => handlePublish(field.id)}>
                            <ChevronUp className="size-3.5 mr-1" />
                            发布
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(field.id)}
                          disabled={!!field.deleted_at}
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          作废字段
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FieldFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        field={editField}
      />
    </div>
  )
}
