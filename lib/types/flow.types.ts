import type { Node, Edge } from "@xyflow/react"
import type { DataField, NodeType, BindingRole } from "./database.types"

export interface DeprecatedFieldWarning {
  fieldId: string
  fieldCode: string
  fieldName: string
  bindingRole: BindingRole
}

export interface BoundField {
  id: string
  fieldId: string
  fieldCode: string
  fieldName: string
  role: BindingRole
  sortOrder: number
  isDeprecated: boolean
  field?: DataField
}

export interface ProcessNodeData extends Record<string, unknown> {
  label: string
  description?: string
  nodeType: NodeType
  boundFields: BoundField[]
  deprecatedFields: DeprecatedFieldWarning[]
}

export interface DataSourceNodeData extends Record<string, unknown> {
  label: string
  description?: string
  nodeType: "data_source"
  boundFields: BoundField[]
  deprecatedFields: DeprecatedFieldWarning[]
}

export interface OutputNodeData extends Record<string, unknown> {
  label: string
  description?: string
  nodeType: "output"
  boundFields: BoundField[]
  deprecatedFields: DeprecatedFieldWarning[]
}

export type FlowNodeData = ProcessNodeData | DataSourceNodeData | OutputNodeData

export type AppNode = Node<FlowNodeData, NodeType>
export type AppEdge = Edge

export interface FlowGraphPayload {
  nodes: AppNode[]
  edges: AppEdge[]
  viewport: { x: number; y: number; zoom: number }
}
