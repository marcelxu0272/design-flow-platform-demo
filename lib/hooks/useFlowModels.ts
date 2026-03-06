"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { FlowModel, FlowModelVersion } from "@/lib/types/database.types"
import type { FlowGraphPayload } from "@/lib/types/flow.types"
import { serializeGraph } from "@/lib/utils/flow-serializer"

export function useFlowModels() {
  return useQuery({
    queryKey: ["flow-models"],
    queryFn: async () => {
      const res = await fetch("/api/flow-models")
      if (!res.ok) throw new Error("Failed to fetch flow models")
      return res.json() as Promise<FlowModel[]>
    },
  })
}

export function useFlowModel(id: string) {
  return useQuery({
    queryKey: ["flow-model", id],
    queryFn: async () => {
      const res = await fetch(`/api/flow-models/${id}`)
      if (!res.ok) throw new Error("Failed to fetch flow model")
      return res.json() as Promise<{ model: FlowModel } & FlowGraphPayload>
    },
    enabled: !!id,
  })
}

export function useCreateFlowModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/flow-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create")
      return res.json() as Promise<FlowModel>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flow-models"] }),
  })
}

export function useSaveFlowModel(modelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ReturnType<typeof serializeGraph> & { changeNote?: string }) => {
      const res = await fetch(`/api/flow-models/${modelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flow-model", modelId] }),
  })
}

export function useFlowModelVersions(modelId: string) {
  return useQuery({
    queryKey: ["flow-model-versions", modelId],
    queryFn: async () => {
      const res = await fetch(`/api/flow-models/${modelId}/versions`)
      if (!res.ok) throw new Error("Failed to fetch versions")
      return res.json() as Promise<FlowModelVersion[]>
    },
    enabled: !!modelId,
  })
}

export function useRevertFlowModel(modelId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (versionNum: number) => {
      const res = await fetch(`/api/flow-models/${modelId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNum }),
      })
      if (!res.ok) throw new Error("Failed to revert")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-model", modelId] })
      qc.invalidateQueries({ queryKey: ["flow-model-versions", modelId] })
    },
  })
}
