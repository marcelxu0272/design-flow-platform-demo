"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  GitBranch,
  FolderOpen,
  FileText,
  LayoutDashboard,
  Database,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/stores/useAppStore"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "仪表盘" },
  { href: "/data-dictionary", icon: BookOpen, label: "数据字典" },
  { href: "/data-sources", icon: Database, label: "数据源" },
  { href: "/data-flows", icon: ArrowRightLeft, label: "数据流向" },
  { href: "/flow-models", icon: GitBranch, label: "流程建模" },
  { href: "/projects", icon: FolderOpen, label: "项目管理" },
  { href: "/documents", icon: FileText, label: "交付文档" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r bg-background transition-all duration-300",
        sidebarOpen ? "w-56" : "w-14"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
            设计
          </div>
          {sidebarOpen && (
            <span className="truncate text-sm font-semibold">流程再造平台</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Tooltip key={href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </Link>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
