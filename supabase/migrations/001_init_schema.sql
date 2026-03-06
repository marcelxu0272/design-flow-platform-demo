-- ============================================================
-- 001_init_schema.sql
-- 设计流程再造平台 — 初始数据库表结构
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 数据字典区
-- ============================================================

CREATE TABLE IF NOT EXISTS data_fields (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_code            TEXT NOT NULL UNIQUE,
  field_name            TEXT NOT NULL,
  data_type             TEXT NOT NULL DEFAULT 'string',
  max_length            INTEGER,
  nullable              BOOLEAN NOT NULL DEFAULT true,
  is_unique             BOOLEAN NOT NULL DEFAULT false,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
  -- 工程领域元数据
  engineering_discipline TEXT CHECK (engineering_discipline IN ('process','piping','instrumentation','equipment','electrical','civil','general')),
  unit_of_measure       TEXT,
  standard_ref          TEXT,
  description           TEXT,
  -- 软删除
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'system',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_flows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id    UUID NOT NULL REFERENCES data_fields(id) ON DELETE CASCADE,
  source_id   UUID REFERENCES data_sources(id) ON DELETE SET NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS field_dependencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_field_id   UUID NOT NULL REFERENCES data_fields(id) ON DELETE CASCADE,
  to_field_id     UUID NOT NULL REFERENCES data_fields(id) ON DELETE CASCADE,
  dep_type        TEXT NOT NULL CHECK (dep_type IN ('calculation','concat','transform','derive','lookup','condition')),
  expression      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_field_id, to_field_id)
);

-- ============================================================
-- 流程编排区
-- ============================================================

CREATE TABLE IF NOT EXISTS flow_models (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  description TEXT,
  viewport    JSONB,
  locked_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  locked_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flow_nodes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_model_id UUID NOT NULL REFERENCES flow_models(id) ON DELETE CASCADE,
  node_key      TEXT NOT NULL,
  node_type     TEXT NOT NULL DEFAULT 'process' CHECK (node_type IN ('process','data_source','output')),
  label         TEXT NOT NULL,
  description   TEXT,
  pos_x         FLOAT NOT NULL DEFAULT 0,
  pos_y         FLOAT NOT NULL DEFAULT 0,
  width         FLOAT,
  height        FLOAT,
  style         JSONB,
  extra_data    JSONB,
  UNIQUE (flow_model_id, node_key)
);

CREATE TABLE IF NOT EXISTS flow_edges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_model_id  UUID NOT NULL REFERENCES flow_models(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  edge_key       TEXT NOT NULL,
  label          TEXT,
  edge_type      TEXT NOT NULL DEFAULT 'data_flow',
  style          JSONB,
  UNIQUE (flow_model_id, edge_key)
);

CREATE TABLE IF NOT EXISTS node_field_bindings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id      UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  field_id     UUID NOT NULL REFERENCES data_fields(id),
  binding_role TEXT NOT NULL DEFAULT 'input' CHECK (binding_role IN ('input','output','param')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (node_id, field_id, binding_role)
);

CREATE TABLE IF NOT EXISTS flow_model_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_model_id  UUID NOT NULL REFERENCES flow_models(id) ON DELETE CASCADE,
  version_num    INTEGER NOT NULL,
  snapshot       JSONB NOT NULL,
  created_by     TEXT,
  change_note    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flow_model_id, version_num)
);

-- ============================================================
-- 项目区
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  description   TEXT,
  flow_model_id UUID REFERENCES flow_models(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_fields (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field_id   UUID NOT NULL REFERENCES data_fields(id),
  role       TEXT NOT NULL CHECK (role IN ('input','process','output')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (project_id, field_id, role)
);

-- ============================================================
-- 文档区
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  flow_model_id   UUID REFERENCES flow_models(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  current_version INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_num INTEGER NOT NULL,
  content     TEXT,
  created_by  TEXT,
  change_note TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_num)
);

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  operator    TEXT,
  diff        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_data_fields_status ON data_fields(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_fields_discipline ON data_fields(engineering_discipline) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_fields_deleted ON data_fields(deleted_at);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_model ON flow_nodes(flow_model_id);
CREATE INDEX IF NOT EXISTS idx_flow_edges_model ON flow_edges(flow_model_id);
CREATE INDEX IF NOT EXISTS idx_node_field_bindings_node ON node_field_bindings(node_id);
CREATE INDEX IF NOT EXISTS idx_node_field_bindings_field ON node_field_bindings(field_id);
CREATE INDEX IF NOT EXISTS idx_flow_model_versions_model ON flow_model_versions(flow_model_id, version_num DESC);
CREATE INDEX IF NOT EXISTS idx_project_fields_project ON project_fields(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_id, version_num DESC);

-- ============================================================
-- updated_at 自动触发器
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_data_fields_updated_at BEFORE UPDATE ON data_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_flow_models_updated_at BEFORE UPDATE ON flow_models FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security（开发阶段允许已登录用户全量访问）
-- ============================================================

ALTER TABLE data_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_field_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;

-- 允许已认证用户读写（生产环境应按角色收紧）
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'data_fields','data_sources','data_flows','field_dependencies',
    'flow_models','flow_nodes','flow_edges','node_field_bindings','flow_model_versions',
    'projects','project_fields','documents','document_versions','document_audit_logs'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "authenticated_all" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END;
$$;
