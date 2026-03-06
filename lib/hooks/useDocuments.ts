"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AppDocument, AppDocumentVersion } from "@/lib/types/database.types"

export function useDocuments(projectId?: string) {
  return useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : ""
      const res = await fetch(`/api/documents${params}`)
      if (!res.ok) throw new Error("Failed to fetch documents")
      return res.json() as Promise<AppDocument[]>
    },
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${id}`)
      if (!res.ok) throw new Error("Failed to fetch document")
      return res.json() as Promise<AppDocument>
    },
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<AppDocument>) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create document")
      return res.json() as Promise<AppDocument>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  })
}

export function usePublishDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, changeNote }: { id: string; changeNote: string }) => {
      const res = await fetch(`/api/documents/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeNote }),
      })
      if (!res.ok) throw new Error("Failed to publish document")
      return res.json() as Promise<AppDocument>
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["documents"] })
      qc.invalidateQueries({ queryKey: ["document", id] })
    },
  })
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}/versions`)
      if (!res.ok) throw new Error("Failed to fetch versions")
      return res.json() as Promise<AppDocumentVersion[]>
    },
    enabled: !!documentId,
  })
}
