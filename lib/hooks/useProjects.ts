"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Project, ProjectField, FieldRole } from "@/lib/types/database.types"

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ["projects", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : ""
      const res = await fetch(`/api/projects${params}`)
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json() as Promise<Project[]>
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json() as Promise<Project & { fields: ProjectField[] }>
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create project")
      return res.json() as Promise<Project>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update project")
      return res.json() as Promise<Project>
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["project", id] })
    },
  })
}

export function useAssociateProjectFields() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      fieldIds,
      role,
    }: {
      projectId: string
      fieldIds: string[]
      role: FieldRole
    }) => {
      const res = await fetch(`/api/projects/${projectId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldIds, role }),
      })
      if (!res.ok) throw new Error("Failed to associate fields")
      return res.json()
    },
    onSuccess: (_, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["project", projectId] }),
  })
}

export function useRemoveProjectField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      fieldId,
    }: {
      projectId: string
      fieldId: string
    }) => {
      const res = await fetch(`/api/projects/${projectId}/fields?fieldId=${fieldId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove field")
    },
    onSuccess: (_, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["project", projectId] }),
  })
}
