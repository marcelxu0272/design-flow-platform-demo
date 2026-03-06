-- ============================================================
-- 003_seed_data.sql
-- 设计流程再造平台 — 模拟数据（可重复执行，存在则跳过）
-- ============================================================

-- 数据字典：工程常用字段
INSERT INTO data_fields (field_code, field_name, data_type, max_length, nullable, is_unique, status, engineering_discipline, unit_of_measure, standard_ref, description) VALUES
  ('TEMP_INLET', '入口温度', 'number', NULL, true, false, 'published', 'process', '℃', 'GB/T 151', '工艺介质入口温度'),
  ('TEMP_OUTLET', '出口温度', 'number', NULL, true, false, 'published', 'process', '℃', 'GB/T 151', '工艺介质出口温度'),
  ('PRESSURE_IN', '入口压力', 'number', NULL, true, false, 'published', 'process', 'MPa', 'GB/T 150', '设备入口压力'),
  ('PRESSURE_OUT', '出口压力', 'number', NULL, true, false, 'published', 'process', 'MPa', 'GB/T 150', '设备出口压力'),
  ('FLOW_RATE', '体积流量', 'number', NULL, true, false, 'published', 'process', 'm³/h', 'SH/T 3104', '体积流量'),
  ('MASS_FLOW', '质量流量', 'number', NULL, true, false, 'published', 'process', 'kg/h', 'SH/T 3104', '质量流量'),
  ('PIPE_DN', '管道公称直径', 'string', 20, true, false, 'published', 'piping', 'DN', 'GB/T 1047', '管道公称直径'),
  ('PIPE_PN', '管道压力等级', 'string', 20, true, false, 'published', 'piping', 'PN', 'GB/T 1048', '管道压力等级'),
  ('INSTR_TAG', '仪表位号', 'string', 30, false, true, 'published', 'instrumentation', NULL, 'HG/T 20507', '仪表位号'),
  ('EQUIP_CODE', '设备位号', 'string', 30, false, true, 'published', 'equipment', NULL, 'HG/T 20519', '设备位号'),
  ('POWER_KW', '额定功率', 'number', NULL, true, false, 'published', 'electrical', 'kW', 'GB 755', '电机额定功率'),
  ('ELEVATION', '标高', 'number', NULL, true, false, 'published', 'civil', 'm', 'GB 50026', '相对标高'),
  ('AREA_CODE', '区域编码', 'string', 20, true, false, 'published', 'general', NULL, NULL, '总图区域编码'),
  ('DENSITY', '密度', 'number', NULL, true, false, 'draft', 'process', 'kg/m³', 'SH/T 3104', '介质密度'),
  ('VISCOSITY', '粘度', 'number', NULL, true, false, 'draft', 'process', 'mPa·s', 'GB/T 265', '动力粘度')
ON CONFLICT (field_code) DO NOTHING;

-- 数据源
INSERT INTO data_sources (name, source_type, description)
SELECT v.name, v.source_type, v.description
FROM (VALUES
  ('P&ID 数据库', 'database', '工艺管道仪表流程图数据'),
  ('设备数据表', 'excel', '设备专业提供的设备清单'),
  ('仪表规格书', 'document', '仪控专业仪表规格书'),
  ('配管材料表', 'database', '配管材料统计表'),
  ('设计条件表', 'excel', '工艺专业设计条件')
) AS v(name, source_type, description)
WHERE NOT EXISTS (SELECT 1 FROM data_sources ds WHERE ds.name = v.name);

-- 数据流向（字段 ↔ 数据源，需在插入字段与数据源之后）
INSERT INTO data_flows (field_id, source_id, direction, description)
SELECT f.id, s.id, 'in', '从' || s.name || '获取'
FROM data_fields f
CROSS JOIN data_sources s
WHERE f.field_code IN ('TEMP_INLET', 'PRESSURE_IN', 'FLOW_RATE')
  AND s.name = 'P&ID 数据库'
  AND NOT EXISTS (SELECT 1 FROM data_flows df WHERE df.field_id = f.id AND df.source_id = s.id AND df.direction = 'in')
LIMIT 3;

INSERT INTO data_flows (field_id, source_id, direction, description)
SELECT f.id, s.id, 'in', '从' || s.name || '获取'
FROM data_fields f
CROSS JOIN data_sources s
WHERE f.field_code = 'EQUIP_CODE' AND s.name = '设备数据表'
  AND NOT EXISTS (SELECT 1 FROM data_flows df WHERE df.field_id = f.id AND df.source_id = s.id)
LIMIT 1;

INSERT INTO data_flows (field_id, source_id, direction, description)
SELECT f.id, s.id, 'in', '从' || s.name || '获取'
FROM data_fields f
CROSS JOIN data_sources s
WHERE f.field_code = 'INSTR_TAG' AND s.name = '仪表规格书'
  AND NOT EXISTS (SELECT 1 FROM data_flows df WHERE df.field_id = f.id AND df.source_id = s.id)
LIMIT 1;

-- 字段依赖（如：流量依赖密度与体积流量）
INSERT INTO field_dependencies (from_field_id, to_field_id, dep_type, expression)
SELECT f1.id, f2.id, 'calculation', 'MASS_FLOW = FLOW_RATE * DENSITY'
FROM data_fields f1, data_fields f2
WHERE f1.field_code = 'FLOW_RATE' AND f2.field_code = 'MASS_FLOW'
  AND NOT EXISTS (SELECT 1 FROM field_dependencies fd WHERE fd.from_field_id = f1.id AND fd.to_field_id = f2.id)
LIMIT 1;

INSERT INTO field_dependencies (from_field_id, to_field_id, dep_type, expression)
SELECT f1.id, f2.id, 'calculation', 'DENSITY 参与计算'
FROM data_fields f1, data_fields f2
WHERE f1.field_code = 'DENSITY' AND f2.field_code = 'MASS_FLOW'
  AND NOT EXISTS (SELECT 1 FROM field_dependencies fd WHERE fd.from_field_id = f1.id AND fd.to_field_id = f2.id)
LIMIT 1;

-- 流程模型
INSERT INTO flow_models (name, status, description)
SELECT v.name, v.status, v.description
FROM (VALUES
  ('原油蒸馏主流程', 'published', '常减压装置主流程数据与工艺节点'),
  ('换热网络设计', 'draft', '换热器网络与温位设计'),
  ('管道水力计算', 'draft', '管道压降与管径选型')
) AS v(name, status, description)
WHERE NOT EXISTS (SELECT 1 FROM flow_models fm WHERE fm.name = v.name);

-- 为「原油蒸馏主流程」添加节点与边（仅当该模型下尚无节点时）
DO $$
DECLARE
  v_model_id UUID;
  v_src_id   UUID;
  v_proc_id  UUID;
  v_out_id   UUID;
  v_edge_key TEXT;
BEGIN
  SELECT id INTO v_model_id FROM flow_models WHERE name = '原油蒸馏主流程' LIMIT 1;
  IF v_model_id IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM flow_nodes WHERE flow_model_id = v_model_id) THEN RETURN; END IF;

  INSERT INTO flow_nodes (flow_model_id, node_key, node_type, label, description, pos_x, pos_y)
  VALUES
    (v_model_id, 'src_crude', 'data_source', '原油进料', '原料油', 100, 200),
    (v_model_id, 'proc_heater', 'process', '加热炉', '初馏加热', 320, 200),
    (v_model_id, 'proc_tower', 'process', '常压塔', '常压蒸馏', 540, 200),
    (v_model_id, 'out_products', 'output', '产品输出', '馏分产品', 760, 200);

  SELECT id INTO v_src_id FROM flow_nodes WHERE flow_model_id = v_model_id AND node_key = 'src_crude';
  SELECT id INTO v_proc_id FROM flow_nodes WHERE flow_model_id = v_model_id AND node_key = 'proc_heater';
  INSERT INTO flow_edges (flow_model_id, source_node_id, target_node_id, edge_key, edge_type)
  VALUES (v_model_id, v_src_id, v_proc_id, 'e_src_heater', 'data_flow');

  SELECT id INTO v_proc_id FROM flow_nodes WHERE flow_model_id = v_model_id AND node_key = 'proc_heater';
  SELECT id INTO v_out_id FROM flow_nodes WHERE flow_model_id = v_model_id AND node_key = 'proc_tower';
  INSERT INTO flow_edges (flow_model_id, source_node_id, target_node_id, edge_key, edge_type)
  VALUES (v_model_id, v_proc_id, v_out_id, 'e_heater_tower', 'data_flow');

  SELECT id INTO v_proc_id FROM flow_nodes WHERE flow_model_id = v_model_id AND node_key = 'proc_tower';
  SELECT id INTO v_out_id FROM flow_nodes WHERE flow_model_id = v_model_id AND node_key = 'out_products';
  INSERT INTO flow_edges (flow_model_id, source_node_id, target_node_id, edge_key, edge_type)
  VALUES (v_model_id, v_proc_id, v_out_id, 'e_tower_out', 'data_flow');

  -- 节点-字段绑定（加热炉绑定温度、压力）
  INSERT INTO node_field_bindings (node_id, field_id, binding_role, sort_order)
  SELECT n.id, f.id, 'input', 1
  FROM flow_nodes n, data_fields f
  WHERE n.flow_model_id = v_model_id AND n.node_key = 'proc_heater' AND f.field_code = 'TEMP_INLET';
  INSERT INTO node_field_bindings (node_id, field_id, binding_role, sort_order)
  SELECT n.id, f.id, 'output', 1
  FROM flow_nodes n, data_fields f
  WHERE n.flow_model_id = v_model_id AND n.node_key = 'proc_heater' AND f.field_code = 'TEMP_OUTLET';
END $$;

-- 项目
INSERT INTO projects (name, code, status, description, flow_model_id)
SELECT '常减压装置改造', 'PRJ-CDU-2025', 'active', '常减压装置节能改造设计', fm.id
FROM flow_models fm WHERE fm.name = '原油蒸馏主流程' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO projects (name, code, status, description) VALUES
  ('新区换热网络', 'PRJ-HEN-2025', 'active', '新区换热网络设计与优化'),
  ('管廊设计', 'PRJ-PIPE-2024', 'completed', '管廊走向与应力分析')
ON CONFLICT (code) DO NOTHING;

-- 项目关联字段（输入/处理/输出）
INSERT INTO project_fields (project_id, field_id, role, sort_order)
SELECT p.id, f.id, 'input', 1
FROM projects p, data_fields f
WHERE p.code = 'PRJ-CDU-2025' AND f.field_code IN ('TEMP_INLET', 'PRESSURE_IN', 'FLOW_RATE')
ON CONFLICT (project_id, field_id, role) DO NOTHING;

INSERT INTO project_fields (project_id, field_id, role, sort_order)
SELECT p.id, f.id, 'output', 1
FROM projects p, data_fields f
WHERE p.code = 'PRJ-CDU-2025' AND f.field_code IN ('TEMP_OUTLET', 'PRESSURE_OUT', 'MASS_FLOW')
ON CONFLICT (project_id, field_id, role) DO NOTHING;

INSERT INTO project_fields (project_id, field_id, role, sort_order)
SELECT p.id, f.id, 'process', 1
FROM projects p, data_fields f
WHERE p.code = 'PRJ-CDU-2025' AND f.field_code = 'DENSITY'
ON CONFLICT (project_id, field_id, role) DO NOTHING;

-- 项目关联流程模型（仅 PRJ-CDU-2025 已关联）
UPDATE projects SET flow_model_id = (SELECT id FROM flow_models WHERE name = '原油蒸馏主流程' LIMIT 1)
WHERE code = 'PRJ-CDU-2025' AND flow_model_id IS NULL;

-- 文档
INSERT INTO documents (project_id, flow_model_id, title, status, current_version)
SELECT p.id, fm.id, '常减压工艺设计说明', 'published', 1
FROM projects p, flow_models fm
WHERE p.code = 'PRJ-CDU-2025' AND fm.name = '原油蒸馏主流程'
  AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.project_id = p.id AND d.title = '常减压工艺设计说明')
LIMIT 1;

INSERT INTO documents (project_id, title, status, current_version)
SELECT id, '设备清单', 'draft', 0 FROM projects WHERE code = 'PRJ-CDU-2025' LIMIT 1;

INSERT INTO documents (project_id, title, status, current_version)
SELECT id, '换热网络设计报告', 'draft', 0 FROM projects WHERE code = 'PRJ-HEN-2025' LIMIT 1;

-- 文档版本（为已发布文档写一条版本）
INSERT INTO document_versions (document_id, version_num, content, created_by, change_note)
SELECT d.id, 1, '初版工艺设计说明内容。', 'system', '初始发布'
FROM documents d
JOIN projects p ON d.project_id = p.id
WHERE p.code = 'PRJ-CDU-2025' AND d.title = '常减压工艺设计说明' AND d.current_version >= 1
  AND NOT EXISTS (SELECT 1 FROM document_versions dv WHERE dv.document_id = d.id AND dv.version_num = 1);

-- 审计日志示例
INSERT INTO document_audit_logs (document_id, action, operator, diff)
SELECT d.id, 'create', 'system', '{"title":"常减压工艺设计说明"}'::jsonb
FROM documents d
JOIN projects p ON d.project_id = p.id
WHERE p.code = 'PRJ-CDU-2025' AND d.title = '常减压工艺设计说明'
  AND NOT EXISTS (SELECT 1 FROM document_audit_logs al WHERE al.document_id = d.id AND al.action = 'create')
LIMIT 1;
