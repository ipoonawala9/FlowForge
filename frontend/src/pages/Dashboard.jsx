import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Workflow, Zap, Clock, Trash2, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import api from "../api/api";

function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/workflows").then((res) => setWorkflows(res.data)).catch(console.error);
  }, []);

  const createWorkflow = async () => {
    try {
      setLoading(true);
      const res = await api.post("/workflows", { name: "Untitled Workflow" });
      navigate(`/workflow/${res.data.id}`);
    } catch {
      alert("Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this workflow?")) return;
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch {
      alert("Failed to delete workflow");
    }
  };

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Workflows</h1>
            <p className="text-slate-400 text-sm mt-0.5">Build and manage your automations</p>
          </div>
          <button
            onClick={createWorkflow}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 glow-sm text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            New Workflow
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Workflows", value: workflows.length, icon: Workflow, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { label: "Active Triggers", value: workflows.length, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Last Created", value: workflows.length ? new Date(workflows[0]?.created_at).toLocaleDateString() : "—", icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          ].map(({ label, value, icon, color, bg }) => {
            const Icon = icon;
            return (
              <div key={label} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="text-white font-semibold text-lg leading-tight">{value}</p>
                </div>
              </div>
            );
          })}
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
                  onClick={() => navigate(`/workflow/${workflow.id}`)}
                  className="glass rounded-xl p-5 cursor-pointer hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 bg-indigo-500/15 rounded-lg flex items-center justify-center">
                      <Zap size={16} className="text-indigo-400" />
                    </div>
                    <button
                      onClick={(e) => deleteWorkflow(e, workflow.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all duration-150"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="text-white font-semibold mb-1 truncate">{workflow.name}</h3>
                  <p className="text-slate-500 text-xs mb-4">
                    {new Date(workflow.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      Webhook
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
