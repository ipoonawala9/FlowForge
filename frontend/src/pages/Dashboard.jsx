import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Workflow, Zap, Clock, Trash2, ArrowRight, Search, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get("/workflows").then((res) => setWorkflows(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const createWorkflow = async () => {
    try {
      setLoading(true);
      const res = await api.post("/workflows", { name: "Untitled Workflow" });
      navigate(`/workflow/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create workflow";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this workflow? This cannot be undone.")) return;
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch {
      alert("Failed to delete workflow");
    }
  };

  const startRename = (e, workflow) => {
    e.stopPropagation();
    setRenamingId(workflow.id);
    setRenameValue(workflow.name);
  };

  const commitRename = async (id) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    try {
      await api.patch(`/workflows/${id}`, { name: trimmed });
      setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, name: trimmed } : w));
    } catch {
      alert("Failed to rename workflow");
    } finally {
      setRenamingId(null);
    }
  };

  const cancelRename = () => setRenamingId(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.email?.split("@")[0] || "";

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              You have {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={createWorkflow}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 glow-sm text-sm"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Plus size={16} />}
            New Workflow
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Workflows", value: workflows.length, icon: Workflow, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { label: "Active", value: workflows.filter(w => w.is_active).length, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Last Created", value: workflows.length ? new Date(workflows[0]?.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—", icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-white font-semibold text-lg leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        {workflows.length > 0 && (
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows..."
              className="w-full max-w-sm bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
            />
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Workflow size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No workflows yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Create your first workflow to start automating tasks and saving time.
            </p>
            <button
              onClick={createWorkflow}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-5 py-2.5 transition-all duration-200 text-sm"
            >
              <Plus size={16} /> Create your first workflow
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((workflow, i) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => renamingId !== workflow.id && navigate(`/workflow/${workflow.id}`)}
                  className="glass rounded-xl p-5 cursor-pointer hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 bg-indigo-500/15 rounded-lg flex items-center justify-center">
                      <Zap size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                      <button
                        onClick={(e) => startRename(e, workflow)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-150"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => deleteWorkflow(e, workflow.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all duration-150"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Inline rename */}
                  {renamingId === workflow.id ? (
                    <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(workflow.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                        className="flex-1 bg-white/10 border border-indigo-500/50 rounded-lg px-2 py-1 text-white text-sm outline-none"
                      />
                      <button onClick={() => commitRename(workflow.id)} className="text-green-400 hover:text-green-300">
                        <Check size={14} />
                      </button>
                      <button onClick={cancelRename} className="text-slate-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-white font-semibold mb-1 truncate">{workflow.name}</h3>
                  )}

                  <p className="text-slate-500 text-xs mb-4">
                    {new Date(workflow.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      {workflow.trigger_type || "Webhook"}
                    </span>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-150" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
