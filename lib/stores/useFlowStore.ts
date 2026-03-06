"use client"

import { create } from "zustand"
import { temporal } from "zundo"
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react"
import type { OnNodesChange, OnEdgesChange, OnConnect } from "@xyflow/react"
import type { AppNode, AppEdge } from "@/lib/types/flow.types"
import { isEqual } from "@/lib/utils/deep-equal"

interface FlowState {
  // ── 图元状态（zundo 追踪这两项）──────────────────────────
  nodes: AppNode[]
  edges: AppEdge[]

  // ── 辅助状态（zundo 通过 partialize 排除）────────────────
  selectedNodeId: string | null
  isDirty: boolean
  isSaving: boolean
  isReadOnly: boolean
  lockHolder: string | null
  currentModelId: string | null

  // ── ReactFlow 受控模式回调────────────────────────────────
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  // ── 动作 ─────────────────────────────────────────────────
  initGraph: (nodes: AppNode[], edges: AppEdge[]) => void
  setSelectedNodeId: (id: string | null) => void
  setIsDirty: (dirty: boolean) => void
  setIsReadOnly: (readOnly: boolean) => void
  setLockHolder: (holder: string | null) => void
  setCurrentModelId: (id: string | null) => void
  setSaving: (saving: boolean) => void
}

export const useFlowStore = create<FlowState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      isSaving: false,
      isReadOnly: false,
      lockHolder: null,
      currentModelId: null,

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[], isDirty: true })
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges), isDirty: true })
      },
      onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges), isDirty: true })
      },

      initGraph: (nodes, edges) => {
        set({ nodes, edges, isDirty: false })
      },
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      setIsReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
      setLockHolder: (holder) => set({ lockHolder: holder }),
      setCurrentModelId: (id) => set({ currentModelId: id }),
      setSaving: (saving) => set({ isSaving: saving }),
    }),
    {
      // Only track nodes and edges in the undo history
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
      limit: 50,
      equality: (a, b) => isEqual(a, b),
    }
  )
)

export { useFlowStore as default }
