import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCw } from "lucide-react";
import api from "../api/api";

function WorkflowRuns({ workflowId, refreshTrigger }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRuns = async () => {
    if (!workflowId) return;
    try {
      setLoading(true);
      const res = await api.get(`/workflows/${workflowId}/runs`);
      setRuns(res.data.runs || []);
    } catch (err) {
      console.error("Failed to load runs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRuns(); }, [workflowId, refreshTrigger]);

  const statusConfig = {
    success: { label: "Success", class: "bg-green-500/10 text-green-400 border-green-500/20" },
    failed:  { label: "Failed",  class: "bg-red-500/10 text-red-400 border-red-500/20" },
    running: { label: "Running", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  };

  return (
    <div className="bg-[#13151f] h-full p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Run History</p>
        </div>
        <button
          onClick={fetchRuns}
          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Activity size={24} className="text-slate-700 mb-2" />
          <p className="text-slate-500 text-xs">No runs yet</p>
          <p className="text-slate-600 text-xs mt-0.5">Click Run to execute</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {runs.map((run) => {
              const cfg = statusConfig[run.status] || statusConfig.running;
              return (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.class}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-600">#{run.id}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(run.started_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {run.completed_at && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Duration: {Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)}s
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default WorkflowRuns;
