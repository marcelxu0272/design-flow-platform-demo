import type { FlowNode, FlowEdge, FlowModel, NodeFieldBinding } from "@/lib/types/database.types"
import type { AppNode, AppEdge, BoundField, FlowGraphPayload } from "@/lib/types/flow.types"

/**
 * Convert DB rows into ReactFlow graph format.
 * Detects deprecated (soft-deleted) field bindings and injects warnings.
 */
export function deserializeGraph(
  dbNodes: FlowNode[],
  dbEdges: FlowEdge[],
  bindings: NodeFieldBinding[],
  viewport: FlowModel["viewport"]
): FlowGraphPayload {
  const bindingsByNodeId = new Map<string, NodeFieldBinding[]>()
  for (const b of bindings) {
    const list = bindingsByNodeId.get(b.node_id) ?? []
    list.push(b)
    bindingsByNodeId.set(b.node_id, list)
  }

  const nodeIdToKey = new Map(dbNodes.map((n) => [n.id, n.node_key]))

  const nodes: AppNode[] = dbNodes.map((n) => {
    const nodeBindings = bindingsByNodeId.get(n.id) ?? []
    const boundFields: BoundField[] = nodeBindings
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => ({
        id: b.id,
        fieldId: b.field_id,
        fieldCode: b.field?.field_code ?? "",
        fieldName: b.field?.field_name ?? "",
        role: b.binding_role,
        sortOrder: b.sort_order,
        isDeprecated: b.field?.deleted_at != null || b.field?.status === "deprecated",
        field: b.field,
      }))

    const deprecatedFields = boundFields
      .filter((f) => f.isDeprecated)
      .map((f) => ({
        fieldId: f.fieldId,
        fieldCode: f.fieldCode,
        fieldName: f.fieldName,
        bindingRole: f.role,
      }))

    return {
      id: n.node_key,
      type: n.node_type,
      position: { x: n.pos_x, y: n.pos_y },
      width: n.width ?? undefined,
      height: n.height ?? undefined,
      data: {
        label: n.label,
        description: n.description ?? undefined,
        nodeType: n.node_type,
        boundFields,
        deprecatedFields,
      },
      style: (n.style as React.CSSProperties) ?? undefined,
    }
  })

  const edges: AppEdge[] = dbEdges.map((e) => ({
    id: e.edge_key,
    source: nodeIdToKey.get(e.source_node_id) ?? e.source_node_id,
    target: nodeIdToKey.get(e.target_node_id) ?? e.target_node_id,
    label: e.label ?? undefined,
    type: e.edge_type,
    style: (e.style as React.CSSProperties) ?? undefined,
  }))

  return {
    nodes,
    edges,
    viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
  }
}

/**
 * Serialize ReactFlow nodes/edges into the payload for upsert_flow_graph RPC.
 */
export function serializeGraph(payload: FlowGraphPayload) {
  const nodesJson = payload.nodes.map((n) => ({
    node_key: n.id,
    node_type: n.type ?? "process",
    label: n.data.label,
    description: n.data.description ?? null,
    pos_x: n.position.x,
    pos_y: n.position.y,
    width: n.width ?? null,
    height: n.height ?? null,
    style: n.style ?? null,
    extra_data: null,
  }))

  const edgesJson = payload.edges.map((e) => ({
    edge_key: e.id,
    source_node_key: e.source,
    target_node_key: e.target,
    label: e.label ?? null,
    edge_type: e.type ?? "data_flow",
    style: e.style ?? null,
  }))

  return {
    nodes: nodesJson,
    edges: edgesJson,
    viewport: payload.viewport,
  }
}

// React import needed for CSSProperties type
import type React from "react"
