import { Header } from "@/components/layout/Header"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, GitBranch, FolderOpen, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getStats() {
  const supabase = await createClient()
  const [fieldsRes, modelsRes, projectsRes, docsRes] = await Promise.all([
    supabase.from("data_fields").select("id", { count: "exact" }).eq("status", "published").is("deleted_at", null),
    supabase.from("flow_models").select("id", { count: "exact" }),
    supabase.from("projects").select("id", { count: "exact" }),
    supabase.from("documents").select("id", { count: "exact" }),
  ])
  return {
    fields: fieldsRes.count ?? 0,
    models: modelsRes.count ?? 0,
    projects: projectsRes.count ?? 0,
    docs: docsRes.count ?? 0,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const statCards = [
    { title: "已发布字段", value: stats.fields, icon: BookOpen, href: "/data-dictionary", color: "text-blue-600" },
    { title: "流程模型", value: stats.models, icon: GitBranch, href: "/flow-models", color: "text-purple-600" },
    { title: "项目", value: stats.projects, icon: FolderOpen, href: "/projects", color: "text-amber-600" },
    { title: "交付文档", value: stats.docs, icon: FileText, href: "/documents", color: "text-green-600" },
  ]

  const quickLinks = [
    { label: "新建字段", href: "/data-dictionary", color: "border-blue-200 hover:bg-blue-50" },
    { label: "新建流程模型", href: "/flow-models", color: "border-purple-200 hover:bg-purple-50" },
    { label: "新建项目", href: "/projects", color: "border-amber-200 hover:bg-amber-50" },
    { label: "新建文档", href: "/documents", color: "border-green-200 hover:bg-green-50" },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground mt-1">设计流程再造平台概览</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map(({ title, value, icon: Icon, href, color }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <Icon className={`size-5 ${color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{value}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">快捷入口</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {quickLinks.map(({ label, href, color }) => (
              <Link key={href} href={href}>
                <Button variant="outline" className={`gap-2 ${color}`}>
                  {label}
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Platform description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">平台介绍</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>本平台面向 EPC 工程设计行业，提供设计数据标准化与流程可视化管理能力。</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>数据字典</strong>：统一管理工程设计字段标准，支持专业归属、计量单位、标准规范等工程元数据</li>
              <li><strong>流程建模</strong>：拖拽式流程图编辑器，节点与数据字典字段深度绑定，支持版本管理与协同锁</li>
              <li><strong>项目管理</strong>：关联项目与数据字段，按输入/处理/输出角色分类，追踪数据血缘</li>
              <li><strong>交付文档</strong>：结构化管理设计交付文件，支持版本快照与审计记录</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
