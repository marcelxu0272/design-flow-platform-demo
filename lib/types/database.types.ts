// ── Enums ─────────────────────────────────────────────────────────────────────
export type FieldStatus = "draft" | "published" | "deprecated"
export type FieldRole = "input" | "process" | "output"
export type BindingRole = "input" | "output" | "param"
export type DependencyType = "calculation" | "concat" | "transform" | "derive" | "lookup" | "condition"
export type NodeType = "process" | "data_source" | "output"
export type EdgeType = "data_flow" | "default"
export type FlowModelStatus = "draft" | "published"
export type ProjectStatus = "active" | "completed" | "paused"
export type DocumentStatus = "draft" | "published"
export type EngineeringDiscipline =
  | "process"
  | "piping"
  | "instrumentation"
  | "equipment"
  | "electrical"
  | "civil"
  | "general"

// ── Pure DB row types (no join fields) ───────────────────────────────────────

export interface DataFieldRow {
  id: string
  field_code: string
  field_name: string
  data_type: string
  max_length: number | null
  nullable: boolean
  is_unique: boolean
  status: FieldStatus
  engineering_discipline: EngineeringDiscipline | null
  unit_of_measure: string | null
  standard_ref: string | null
  description: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface DataSourceRow {
  id: string
  name: string
  source_type: string
  description: string | null
  created_at: string
}

export interface DataFlowRow {
  id: string
  field_id: string
  source_id: string | null
  direction: "in" | "out"
  description: string | null
  created_at: string
}

export interface FieldDependencyRow {
  id: string
  from_field_id: string
  to_field_id: string
  dep_type: DependencyType
  expression: string | null
  created_at: string
}

export interface FlowModelRow {
  id: string
  name: string
  status: FlowModelStatus
  description: string | null
  viewport: { x: number; y: number; zoom: number } | null
  locked_by: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface FlowNodeRow {
  id: string
  flow_model_id: string
  node_key: string
  node_type: NodeType
  label: string
  description: string | null
  pos_x: number
  pos_y: number
  width: number | null
  height: number | null
  style: Record<string, unknown> | null
  extra_data: Record<string, unknown> | null
}

export interface FlowEdgeRow {
  id: string
  flow_model_id: string
  source_node_id: string
  target_node_id: string
  edge_key: string
  label: string | null
  edge_type: EdgeType
  style: Record<string, unknown> | null
}

export interface NodeFieldBindingRow {
  id: string
  node_id: string
  field_id: string
  binding_role: BindingRole
  sort_order: number
}

export interface FlowModelVersionRow {
  id: string
  flow_model_id: string
  version_num: number
  snapshot: {
    nodes: FlowNodeRow[]
    edges: FlowEdgeRow[]
    viewport: FlowModelRow["viewport"]
    bindings: NodeFieldBindingRow[]
  }
  created_by: string | null
  change_note: string | null
  created_at: string
}

export interface ProjectRow {
  id: string
  name: string
  code: string
  status: ProjectStatus
  description: string | null
  flow_model_id: string | null
  created_at: string
  updated_at: string
}

export interface ProjectFieldRow {
  id: string
  project_id: string
  field_id: string
  role: FieldRole
  sort_order: number
}

export interface AppDocumentRow {
  id: string
  project_id: string
  flow_model_id: string | null
  title: string
  status: DocumentStatus
  current_version: number
  created_at: string
  updated_at: string
}

export interface AppDocumentVersionRow {
  id: string
  document_id: string
  version_num: number
  content: string | null
  created_by: string | null
  change_note: string | null
  created_at: string
}

export interface AppDocumentAuditLogRow {
  id: string
  document_id: string
  action: string
  operator: string | null
  diff: Record<string, unknown> | null
  created_at: string
}

// ── Extended types with optional join fields (for query results) ──────────────

export interface DataField extends DataFieldRow {}
export interface DataSource extends DataSourceRow {}

export interface DataFlow extends DataFlowRow {
  field?: DataField
  source?: DataSource
}

export interface FieldDependency extends FieldDependencyRow {
  from_field?: DataField
  to_field?: DataField
}

export interface FlowModel extends FlowModelRow {}
export interface FlowNode extends FlowNodeRow {}
export interface FlowEdge extends FlowEdgeRow {}

export interface NodeFieldBinding extends NodeFieldBindingRow {
  field?: DataField
  node?: FlowNode
}

export interface FlowModelVersion extends FlowModelVersionRow {}

export interface Project extends ProjectRow {
  flow_model?: FlowModel
}

export interface ProjectField extends ProjectFieldRow {
  field?: DataField
  project?: Project
}

export interface AppDocument extends AppDocumentRow {
  project?: Project
  flow_model?: FlowModel
}

export interface AppDocumentVersion extends AppDocumentVersionRow {}
export interface AppDocumentAuditLog extends AppDocumentAuditLogRow {}

// ── Database type for Supabase client (uses pure Row types) ──────────────────

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      data_fields: {
        Row: DataFieldRow
        Insert: Omit<DataFieldRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DataFieldRow, "id">>
        Relationships: []
      }
      data_sources: {
        Row: DataSourceRow
        Insert: Omit<DataSourceRow, "id" | "created_at">
        Update: Partial<Omit<DataSourceRow, "id">>
        Relationships: []
      }
      data_flows: {
        Row: DataFlowRow
        Insert: Omit<DataFlowRow, "id" | "created_at">
        Update: Partial<Omit<DataFlowRow, "id">>
        Relationships: []
      }
      field_dependencies: {
        Row: FieldDependencyRow
        Insert: Omit<FieldDependencyRow, "id" | "created_at">
        Update: Partial<Omit<FieldDependencyRow, "id">>
        Relationships: []
      }
      flow_models: {
        Row: FlowModelRow
        Insert: Omit<FlowModelRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<FlowModelRow, "id">>
        Relationships: []
      }
      flow_nodes: {
        Row: FlowNodeRow
        Insert: Omit<FlowNodeRow, "id">
        Update: Partial<Omit<FlowNodeRow, "id">>
        Relationships: []
      }
      flow_edges: {
        Row: FlowEdgeRow
        Insert: Omit<FlowEdgeRow, "id">
        Update: Partial<Omit<FlowEdgeRow, "id">>
        Relationships: []
      }
      node_field_bindings: {
        Row: NodeFieldBindingRow
        Insert: Omit<NodeFieldBindingRow, "id">
        Update: Partial<Omit<NodeFieldBindingRow, "id">>
        Relationships: []
      }
      flow_model_versions: {
        Row: FlowModelVersionRow
        Insert: Omit<FlowModelVersionRow, "id" | "created_at">
        Update: Partial<Omit<FlowModelVersionRow, "id">>
        Relationships: []
      }
      projects: {
        Row: ProjectRow
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<ProjectRow, "id">>
        Relationships: []
      }
      project_fields: {
        Row: ProjectFieldRow
        Insert: Omit<ProjectFieldRow, "id">
        Update: Partial<Omit<ProjectFieldRow, "id">>
        Relationships: []
      }
      documents: {
        Row: AppDocumentRow
        Insert: Omit<AppDocumentRow, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<AppDocumentRow, "id">>
        Relationships: []
      }
      document_versions: {
        Row: AppDocumentVersionRow
        Insert: Omit<AppDocumentVersionRow, "id" | "created_at">
        Update: Partial<Omit<AppDocumentVersionRow, "id">>
        Relationships: []
      }
      document_audit_logs: {
        Row: AppDocumentAuditLogRow
        Insert: Omit<AppDocumentAuditLogRow, "id" | "created_at">
        Update: Partial<Omit<AppDocumentAuditLogRow, "id">>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      upsert_flow_graph: {
        Args: { p_model_id: string; p_nodes: unknown; p_edges: unknown; p_viewport: unknown; p_change_note?: string }
        Returns: undefined
      }
      check_field_dependency_cycle: {
        Args: { p_from_field_id: string; p_to_field_id: string }
        Returns: boolean
      }
      acquire_flow_lock: {
        Args: { p_model_id: string; p_user_id: string }
        Returns: { success: boolean; holder_id: string | null }
      }
      release_flow_lock: {
        Args: { p_model_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
