"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
import { useDataFields } from "@/lib/hooks/useDataFields"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight, ArrowLeft, ArrowLeftRight } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { DataFlow } from "@/lib/types/database.types"

function useDataFlows(fieldId?: string) {
  return useQuery({
    queryKey: ["data-flows", fieldId],
    queryFn: async () => {
      const params = fieldId ? `?fieldId=${fieldId}` : ""
      const res = await fetch(`/api/data-flows${params}`)
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<DataFlow[]>
    },
  })
}

export default function DataFlowsPage() {
  const [selectedField, setSelectedField] = useState<string>("all")
  const { data: fields } = useDataFields({ status: "published" })
  const { data: flows, isLoading } = useDataFlows(selectedField === "all" ? undefined : selectedField)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <PageHeader
        title="数据流向"
        description="查看字段的数据来源与流向"
      />

      <div className="flex items-center gap-3 border-b px-6 py-3">
        <Select value={selectedField} onValueChange={setSelectedField}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="筛选字段" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部字段</SelectItem>
            {fields?.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.field_code} — {f.field_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>字段</TableHead>
              <TableHead>方向</TableHead>
              <TableHead>数据源</TableHead>
              <TableHead>描述</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">加载中…</TableCell></TableRow>
            ) : !flows?.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">暂无数据流向记录</TableCell></TableRow>
            ) : (
              flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-blue-600">{flow.field?.field_code}</span>
                    <span className="text-sm ml-2">{flow.field?.field_name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {flow.direction === "in" ? (
                        <><ArrowLeft className="size-4 text-blue-500" /><Badge variant="outline" className="text-xs">流入</Badge></>
                      ) : (
                        <><ArrowRight className="size-4 text-green-500" /><Badge variant="outline" className="text-xs">流出</Badge></>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{flow.source?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{flow.description ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
