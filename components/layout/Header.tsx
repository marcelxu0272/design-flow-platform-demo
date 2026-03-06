"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const routeLabels: Record<string, string> = {
  "data-dictionary": "数据字典",
  "data-sources": "数据源",
  "data-flows": "数据流向",
  "flow-models": "流程建模",
  projects: "项目管理",
  documents: "交付文档",
}

export function Header({ title }: { title?: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = routeLabels[seg] ?? decodeURIComponent(seg)
    return { href, label }
  })

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 gap-2">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-1">
        <Link href="/" className="hover:text-foreground transition-colors">
          首页
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="size-3" />
            <Link
              href={crumb.href}
              className={cn(
                "hover:text-foreground transition-colors",
                i === crumbs.length - 1 && "text-foreground font-medium"
              )}
            >
              {crumb.label}
            </Link>
          </span>
        ))}
        {title && crumbs.length > 0 && (
          <span className="flex items-center gap-1">
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">{title}</span>
          </span>
        )}
      </nav>
    </header>
  )
}
