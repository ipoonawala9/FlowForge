import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  BackgroundVariant
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Play, ArrowLeft, CheckCircle, XCircle, Loader } from "lucide-react";
import "@xyflow/react/dist/style.css";

import DashboardLayout from "../layout/DashboardLayout";
import ActionSidebar from "../components/ActionSidebar";
import ActionNode from "../components/nodes/ActionNode";
import ConditionNode from "../components/nodes/ConditionNode";
import NodeConfigPanel from "../components/NodeConfigPanel";
import WorkflowRuns from "../components/WorkflowRuns";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";

const nodeTypes = { action: ActionNode, condition: ConditionNode };

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium pointer-events-auto ${
              t.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : t.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}
          >
            {t.type === "success" ? <CheckCircle size={16} /> : t.type === "error" ? <XCircle size={16} /> : <Loader size={16} className="animate-spin" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [runRefresh, setRunRefresh] = useState(0);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const addToast = (message, type = "success") => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 3500);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );

  const addNode = (action) => {
    const isTrigger = action.type === "webhook" || action.type === "schedule";
    if (isTrigger && nodes.find((n) => n.data.type === "webhook" || n.data.type === "schedule")) {
      addToast("Only one trigger is allowed per workflow", "error");
      return;
    }
    const nodeType = action.type === "condition" ? "condition" : "action";
    setNodes((nds) => [
      ...nds,
      {
        id: `node_${Date.now()}`,
        type: nodeType,
        position: { x: 250, y: nds.length * 150 + 50 },
        data: { label: action.label, type: action.type, config: {} }
      }
    ]);
  };

  const onConnect = useCallback(
    (params) => {
      const targetNode = nodes.find((n) => n.id === params.target);
      if (targetNode?.data.type === "webhook") {
        addToast("Trigger cannot have incoming connections", "error");
        return;
      }

      // derive branch label from the source handle id ("true" | "false" | "default")
      const branch = params.sourceHandle === "true" ? "true"
                   : params.sourceHandle === "false" ? "false"
                   : "default";

      const edgeLabel = branch === "true" ? "✓ True" : branch === "false" ? "✗ False" : undefined;
      const edgeColor = branch === "true" ? "#22c55e" : branch === "false" ? "#ef4444" : "#6366f1";

      setEdges((eds) =>
        addEdge({
          ...params,
          animated: true,
          label: edgeLabel,
          labelStyle: { fill: edgeColor, fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: "#1a1d2e", fillOpacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
          style: { stroke: edgeColor },
          data: { branch }
        }, eds)
      );
    },
    [nodes]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow");
    const label = e.dataTransfer.getData("label");
    if (!type) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const nodeType = type === "condition" ? "condition" : "action";
    setNodes((nds) => [
      ...nds,
      {
        id: `node_${Date.now()}`,
        type: nodeType,
        position: { x: e.clientX - bounds.left, y: e.clientY - bounds.top },
        data: { label, type, config: {} }
      }
    ]);
  };

  const updateNodeConfig = (nodeId, key, value) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id !== nodeId ? n : { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } }
      )
    );
  };

  const saveWorkflow = async () => {
    try {
      setSaving(true);

      const actions = nodes.map((node, index) => {
        let config = node.data.config || {};
        if (node.data.type === "condition" && !config.operator) {
          config = { ...config, operator: "equals" };
        }
        return {
          node_id: node.id,
          action_type: node.data.type,
          action_config: config,
          sequence_order: index + 1
        };
      });

      const edgesPayload = edges.map((e) => ({
        source_node_id: e.source,
        target_node_id: e.target,
        branch: e.data?.branch || "default"
      }));

      await api.post(`/workflows/${id}/actions/bulk`, { actions, edges: edgesPayload });

      // handle schedule registration separately — never let it fail the whole save
      const scheduleNode = nodes.find((n) => n.data.type === "schedule");
      try {
        if (scheduleNode?.data.config?.cron_expression) {
          await api.post(`/workflows/${id}/schedule`, {
            cron_expression: scheduleNode.data.config.cron_expression
          });
        } else {
          await api.delete(`/workflows/${id}/schedule`);
        }
      } catch {
        // schedule save failed but workflow nodes/edges are saved — non-fatal
        console.warn("Schedule registration failed — workflow saved without schedule");
      }

      addToast("Workflow saved", "success");
    } catch {
      addToast("Failed to save workflow", "error");
    } finally {
      setSaving(false);
    }
  };

  const executeWorkflow = async () => {
    try {
      setExecuting(true);
      addToast("Executing workflow...", "info");
      await api.post(`/workflows/${id}/execute`);
      addToast("Workflow executed successfully!", "success");
      setRunRefresh((r) => r + 1);
    } catch (err) {
      addToast(err.response?.data?.message || "Execution failed", "error");
    } finally {
      setExecuting(false);
    }
  };

  // load workflow — restore nodes and edges from DB
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/workflows/${id}/actions`);
        const actions = res.data.actions || [];
        const dbEdges = res.data.edges || [];

        const loadedNodes = actions.map((action) => {
          const config = typeof action.action_config === "string"
            ? JSON.parse(action.action_config)
            : action.action_config || {};
          const nodeType = action.action_type === "condition" ? "condition" : "action";
          return {
            id: action.node_id || `node_${action.id}`,
            type: nodeType,
            position: config.position || { x: 250, y: (action.sequence_order - 1) * 150 + 50 },
            data: { label: action.action_type, type: action.action_type, config }
          };
        });

        const loadedEdges = dbEdges.map((e, i) => {
          const branch = e.branch || "default";
          const edgeColor = branch === "true" ? "#22c55e" : branch === "false" ? "#ef4444" : "#6366f1";
          const edgeLabel = branch === "true" ? "✓ True" : branch === "false" ? "✗ False" : undefined;
          return {
            id: `e_${i}`,
            source: e.source_node_id,
            target: e.target_node_id,
            sourceHandle: branch !== "default" ? branch : null,
            animated: true,
            label: edgeLabel,
            labelStyle: { fill: edgeColor, fontWeight: 600, fontSize: 11 },
            labelBgStyle: { fill: "#1a1d2e", fillOpacity: 0.9 },
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
            style: { stroke: edgeColor },
            data: { branch }
          };
        });

        setNodes(loadedNodes);
        setEdges(loadedEdges);
      } catch (err) {
        console.error("Failed to load workflow:", err);
      }
    };
    load();
  }, [id]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#13151f] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-sm font-medium text-white">Workflow Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveWorkflow}
              disabled={saving}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl px-4 py-2 transition-all duration-200 text-sm disabled:opacity-50"
            >
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
              Save
            </button>
            <button
              onClick={executeWorkflow}
              disabled={executing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-4 py-2 transition-all duration-200 text-sm disabled:opacity-50 glow-sm"
            >
              {executing ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={14} />}
              Run
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-shrink-0">
            <ActionSidebar addNode={addNode} />
          </div>

          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              onDragOver={onDragOver}
              onDrop={onDrop}
              fitView
              snapToGrid
              snapGrid={[20, 20]}
              style={{ width: "100%", height: "100%" }}
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2d3148" />
            </ReactFlow>
          </div>

          <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-white/5">
            <NodeConfigPanel node={selectedNode} updateNodeConfig={updateNodeConfig} />
          </div>

          <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-white/5">
            <WorkflowRuns workflowId={id} refreshTrigger={runRefresh} />
          </div>
        </div>
      </div>
      <Toast toasts={toasts} />
    </DashboardLayout>
  );
}

export default WorkflowBuilder;
