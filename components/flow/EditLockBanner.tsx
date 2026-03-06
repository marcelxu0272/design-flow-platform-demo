"use client"

import { Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditLockBannerProps {
  holderName: string
  onRequestEdit?: () => void
  canRequestEdit?: boolean
}

export function EditLockBanner({ holderName, onRequestEdit, canRequestEdit }: EditLockBannerProps) {
  return (
    <div className="flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <Lock className="size-4 shrink-0 text-amber-600" />
      <span className="flex-1">
        <strong>{holderName}</strong> 正在编辑，您处于只读模式
      </span>
      {canRequestEdit && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-300 hover:bg-amber-100"
          onClick={onRequestEdit}
        >
          <AlertCircle className="size-3 mr-1" />
          锁已过期，请求编辑权
        </Button>
      )}
    </div>
  )
}
