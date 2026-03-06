"use client"

import { useEffect } from "react"
import { useFlowStore } from "@/lib/stores/useFlowStore"
import { useStore } from "zustand"

export function useFlowKeyboardShortcuts() {
  const { undo, redo } = useStore(useFlowStore.temporal)
  const isReadOnly = useFlowStore((s) => s.isReadOnly)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isReadOnly) return
      const isCtrl = e.ctrlKey || e.metaKey
      if (!isCtrl) return

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, isReadOnly])
}
