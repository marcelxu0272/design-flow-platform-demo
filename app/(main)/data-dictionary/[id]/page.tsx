"use client"

import { use, useState } from "react"
import { Header } from "@/components/layout/Header"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FieldFormSheet } from "@/components/data-dictionary/FieldFormSheet"
import { useDataField, useUpdateFieldStatus, useSoftDeleteField } from "@/lib/hooks/useDataFields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const DISCIPLINES: Record<string, string> = {
  process: "工艺", piping: "配管", instrumentation: "仪控",
  equipment: "设备", electrical: "电气", civil: "土建", general: "总图",
}

export default function FieldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: field, isLoading } = useDataField(id)
  const statusMutation = useUpdateFieldStatus()
  const deleteMutation = useSoftDeleteField()
  const [sheetOpen, setSheetOpen] = useState(false)
  const router = useRouter()

  const handlePublish = async () => {
    try {
      await statusMutation.mutateAsync({ id, status: "published" })
      toast.success("字段已发布")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  const handleDeprecate = async () => {
    if (!confirm("确认将该字段标记为已作废？")) return
    try {
      await statusMutation.mutateAsync({ id, status: "deprecated" })
      toast.success("字段已作废")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">加载中…</div>
  if (!field) return <div className="p-8 text-red-500">字段不存在</div>

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title={field.field_code} />
      <div className="p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/data-dictionary">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="size-4" /> 返回列表
            </Button>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              <Edit className="size-3.5 mr-1" /> 编辑
            </Button>
            {field.status === "draft" && (
              <Button size="sm" onClick={handlePublish}>发布</Button>
            )}
            {field.status === "published" && (
              <Button size="sm" variant="destructive" onClick={handleDeprecate}>作废</Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-mono text-lg">{field.field_code}</CardTitle>
                <p className="text-base mt-1">{field.field_name}</p>
              </div>
              <StatusBadge status={field.status as "draft" | "published" | "deprecated"} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: "数据类型", value: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{field.data_type}</code> },
                { label: "最大长度", value: field.max_length ?? "—" },
                { label: "允许为空", value: field.nullable ? "是" : "否" },
                { label: "唯一值", value: field.is_unique ? "是" : "否" },
                { label: "专业归属", value: field.engineering_discipline ? DISCIPLINES[field.engineering_discipline] : "—" },
                { label: "计量单位", value: field.unit_of_measure ?? "—" },
                { label: "标准规范", value: field.standard_ref ?? "—" },
                { label: "创建时间", value: new Date(field.created_at).toLocaleString("zh-CN") },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {field.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">描述</p>
                <p className="text-sm">{field.description}</p>
              </div>
            )}
            {field.deleted_at && (
              <div className="mt-4 pt-4 border-t">
                <Badge variant="destructive" className="text-xs">
                  已软删除于 {new Date(field.deleted_at).toLocaleString("zh-CN")}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FieldFormSheet open={sheetOpen} onOpenChange={setSheetOpen} field={field} />
    </div>
  )
}
