-- ============================================================
-- 002_rpc_functions.sql
-- 四个核心 RPC 函数
-- ============================================================

-- ============================================================
-- 1. upsert_flow_graph
--    原子事务：同步节点、边、更新视口、写入版本快照
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_flow_graph(
  p_model_id   UUID,
  p_nodes      JSONB,  -- [{node_key, node_type, label, pos_x, pos_y, ...}]
  p_edges      JSONB,  -- [{edge_key, source_node_key, target_node_key, ...}]
  p_viewport   JSONB,  -- {x, y, zoom}
  p_change_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_node       JSONB;
  v_edge       JSONB;
  v_node_id    UUID;
  v_source_id  UUID;
  v_target_id  UUID;
  v_version    INTEGER;
  v_snapshot   JSONB;
  v_node_keys  TEXT[];
  v_edge_keys  TEXT[];
BEGIN
  -- 收集前端传入的 keys
  SELECT array_agg(el->>'node_key') INTO v_node_keys FROM jsonb_array_elements(p_nodes) el;
  SELECT array_agg(el->>'edge_key') INTO v_edge_keys FROM jsonb_array_elements(p_edges) el;

  -- 1. Upsert nodes
  FOR v_node IN SELECT * FROM jsonb_array_elements(p_nodes)
  LOOP
    INSERT INTO flow_nodes (flow_model_id, node_key, node_type, label, description, pos_x, pos_y, width, height, style, extra_data)
    VALUES (
      p_model_id,
      v_node->>'node_key',
      COALESCE(v_node->>'node_type', 'process'),
      COALESCE(v_node->>'label', ''),
      v_node->>'description',
      COALESCE((v_node->>'pos_x')::FLOAT, 0),
      COALESCE((v_node->>'pos_y')::FLOAT, 0),
      (v_node->>'width')::FLOAT,
      (v_node->>'height')::FLOAT,
      v_node->'style',
      v_node->'extra_data'
    )
    ON CONFLICT (flow_model_id, node_key) DO UPDATE SET
      node_type   = EXCLUDED.node_type,
      label       = EXCLUDED.label,
      description = EXCLUDED.description,
      pos_x       = EXCLUDED.pos_x,
      pos_y       = EXCLUDED.pos_y,
      width       = EXCLUDED.width,
      height      = EXCLUDED.height,
      style       = EXCLUDED.style,
      extra_data  = EXCLUDED.extra_data;
  END LOOP;

  -- 2. 删除孤儿节点（会级联删除其绑定和边）
  IF v_node_keys IS NOT NULL THEN
    DELETE FROM flow_nodes
    WHERE flow_model_id = p_model_id AND node_key <> ALL(v_node_keys);
  ELSE
    DELETE FROM flow_nodes WHERE flow_model_id = p_model_id;
  END IF;

  -- 3. Upsert edges（先解析 source/target node_key → UUID）
  FOR v_edge IN SELECT * FROM jsonb_array_elements(p_edges)
  LOOP
    SELECT id INTO v_source_id FROM flow_nodes
    WHERE flow_model_id = p_model_id AND node_key = v_edge->>'source_node_key';

    SELECT id INTO v_target_id FROM flow_nodes
    WHERE flow_model_id = p_model_id AND node_key = v_edge->>'target_node_key';

    IF v_source_id IS NOT NULL AND v_target_id IS NOT NULL THEN
      INSERT INTO flow_edges (flow_model_id, source_node_id, target_node_id, edge_key, label, edge_type, style)
      VALUES (
        p_model_id,
        v_source_id,
        v_target_id,
        v_edge->>'edge_key',
        v_edge->>'label',
        COALESCE(v_edge->>'edge_type', 'data_flow'),
        v_edge->'style'
      )
      ON CONFLICT (flow_model_id, edge_key) DO UPDATE SET
        source_node_id = EXCLUDED.source_node_id,
        target_node_id = EXCLUDED.target_node_id,
        label          = EXCLUDED.label,
        edge_type      = EXCLUDED.edge_type,
        style          = EXCLUDED.style;
    END IF;
  END LOOP;

  -- 4. 删除孤儿边
  IF v_edge_keys IS NOT NULL THEN
    DELETE FROM flow_edges
    WHERE flow_model_id = p_model_id AND edge_key <> ALL(v_edge_keys);
  ELSE
    DELETE FROM flow_edges WHERE flow_model_id = p_model_id;
  END IF;

  -- 5. 更新 flow_models viewport / updated_at
  UPDATE flow_models SET viewport = p_viewport, updated_at = now() WHERE id = p_model_id;

  -- 6. 计算下一版本号
  SELECT COALESCE(MAX(version_num), 0) + 1 INTO v_version
  FROM flow_model_versions WHERE flow_model_id = p_model_id;

  -- 7. 构建快照并写入版本表
  SELECT jsonb_build_object(
    'nodes', jsonb_agg(row_to_json(fn.*)),
    'edges', jsonb_agg(row_to_json(fe.*))
  ) INTO v_snapshot
  FROM flow_nodes fn
  LEFT JOIN flow_edges fe ON fe.flow_model_id = p_model_id
  WHERE fn.flow_model_id = p_model_id;

  INSERT INTO flow_model_versions (flow_model_id, version_num, snapshot, change_note)
  VALUES (p_model_id, v_version, COALESCE(v_snapshot, '{}'), p_change_note);

  -- 8. 仅保留最近 20 个版本
  DELETE FROM flow_model_versions
  WHERE flow_model_id = p_model_id
    AND version_num <= (
      SELECT MIN(version_num) FROM (
        SELECT version_num FROM flow_model_versions
        WHERE flow_model_id = p_model_id
        ORDER BY version_num DESC
        LIMIT 20
      ) sub
    ) - 1;
END;
$$;

-- ============================================================
-- 2. check_field_dependency_cycle
--    WITH RECURSIVE CTE 检测有向图循环依赖
--    若发现闭环 RAISE EXCEPTION，前端捕获 409
-- ============================================================
CREATE OR REPLACE FUNCTION check_field_dependency_cycle(
  p_from_field_id UUID,
  p_to_field_id   UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 检查是否会形成环：从 p_to_field_id 出发，能否到达 p_from_field_id
  IF EXISTS (
    WITH RECURSIVE reachable AS (
      SELECT to_field_id AS field_id
      FROM field_dependencies
      WHERE from_field_id = p_to_field_id
      UNION
      SELECT fd.to_field_id
      FROM field_dependencies fd
      INNER JOIN reachable r ON r.field_id = fd.from_field_id
    )
    SELECT 1 FROM reachable WHERE field_id = p_from_field_id
  ) THEN
    RAISE EXCEPTION 'circular_dependency: Adding this dependency would create a cycle'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN FALSE;
END;
$$;

-- ============================================================
-- 3. acquire_flow_lock
--    独占锁申请（含 30 分钟过期判断）
-- ============================================================
CREATE OR REPLACE FUNCTION acquire_flow_lock(
  p_model_id UUID,
  p_user_id  UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_locked_by  UUID;
  v_locked_at  TIMESTAMPTZ;
BEGIN
  SELECT locked_by, locked_at INTO v_locked_by, v_locked_at
  FROM flow_models WHERE id = p_model_id FOR UPDATE;

  -- 可加锁条件：无人持锁 / 自己持锁 / 锁已过期（>30分钟）
  IF v_locked_by IS NULL
     OR v_locked_by = p_user_id
     OR (now() - v_locked_at) > INTERVAL '30 minutes'
  THEN
    UPDATE flow_models
    SET locked_by = p_user_id, locked_at = now()
    WHERE id = p_model_id;
    RETURN jsonb_build_object('success', true, 'holder_id', p_user_id);
  ELSE
    RETURN jsonb_build_object('success', false, 'holder_id', v_locked_by);
  END IF;
END;
$$;

-- ============================================================
-- 4. release_flow_lock
--    释放锁（仅持锁者可调用）
-- ============================================================
CREATE OR REPLACE FUNCTION release_flow_lock(
  p_model_id UUID,
  p_user_id  UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE flow_models
  SET locked_by = NULL, locked_at = NULL
  WHERE id = p_model_id AND locked_by = p_user_id;
END;
$$;
