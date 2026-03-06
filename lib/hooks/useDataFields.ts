"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { DataField, FieldStatus, EngineeringDiscipline } from "@/lib/types/database.types"

interface FieldFilters {
  status?: FieldStatus | "all"
  discipline?: EngineeringDiscipline | "all"
  search?: string
  includeDeleted?: boolean
}

export function useDataFields(filters: FieldFilters = {}) {
  return useQuery({
    queryKey: ["data-fields", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status && filters.status !== "all") params.set("status", filters.status)
      if (filters.discipline && filters.discipline !== "all")
        params.set("discipline", filters.discipline)
      if (filters.search) params.set("search", filters.search)
      if (filters.includeDeleted) params.set("includeDeleted", "true")
      const res = await fetch(`/api/fields?${params}`)
      if (!res.ok) throw new Error("Failed to fetch fields")
      return res.json() as Promise<DataField[]>
    },
  })
}

export function useDataField(id: string) {
  return useQuery({
    queryKey: ["data-field", id],
    queryFn: async () => {
      const res = await fetch(`/api/fields/${id}`)
      if (!res.ok) throw new Error("Failed to fetch field")
      return res.json() as Promise<DataField>
    },
    enabled: !!id,
  })
}

export function useCreateDataField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<DataField>) => {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create")
      return res.json() as Promise<DataField>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data-fields"] }),
  })
}

export function useUpdateDataField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DataField> }) => {
      const res = await fetch(`/api/fields/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update")
      return res.json() as Promise<DataField>
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["data-fields"] })
      qc.invalidateQueries({ queryKey: ["data-field", id] })
    },
  })
}

export function useSoftDeleteField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fields/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data-fields"] }),
  })
}

export function useUpdateFieldStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FieldStatus }) => {
      const res = await fetch(`/api/fields/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to update status")
      }
      return res.json() as Promise<DataField>
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["data-fields"] })
      qc.invalidateQueries({ queryKey: ["data-field", id] })
    },
  })
}
