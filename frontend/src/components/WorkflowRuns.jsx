import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCw, ChevronDown, CheckCircle2, XCircle, RotateCw, Loader2 } from "lucide-react";
import api from "../api/api";

const statusConfig = {
  success: { label: "Success", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  failed: { label: "Failed", class: "bg-red-500/10 text-red-400 border-red-500/20" },
  running: { label: "Running", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

const stepStatusIcon = {
  success: <CheckCircle2 size={13} className="text-green-400" />,
  failed: <XCircle size={13} className="text-red-400" />,
  retrying: <RotateCw size={13} className="text-amber-400 animate-spin" />,
  running: <Loader2 size={13} className="text-slate-400 animate-spin" />,
};

function StepRow({ step }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {stepStatusIcon[step.status] || stepStatusIcon.running}
          <span className="text-xs text-slate-300 font-medium truncate">{step.action_type}</span>
          {step.attempt > 1 && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
              attempt {step.attempt}
            </span>
          )}
        </div>
        <ChevronDown size={13} className={`text-slate-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 text-xs">
          {step.error_message && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md px-2.5 py-1.5 text-red-400">
              {step.error_message}
            </div>
          )}
          <div>
            <p className="text-slate-600 mb-1 font-medium">Input</p>
            <pre className="bg-black/30 rounded-md p-2 text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(step.input_config, null, 2)}
            </pre>
          </div>
          {step.output_result && (
            <div>
              <p className="text-slate-600 mb-1 font-medium">Output</p>
              <pre className="bg-black/30 rounded-md p-2 text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(step.output_result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunCard({ run, workflowId }) {
  const [expanded, setExpanded] = useState(false);
  const [steps, setSteps] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const cfg = statusConfig[run.status] || statusConfig.running;

  const toggleExpand = async () => {
    setExpanded((e) => !e);
    if (!steps && !loadingSteps) {
      try {
        setLoadingSteps(true);
        const res = await api.get(`/workflows/${workflowId}/runs/${run.id}/steps`);
        setSteps(res.data.steps || []);
      } catch (err) {
        console.error("Failed to load steps", err);
        setSteps([]);
      } finally {
        setLoadingSteps(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/5 border border-white/5 rounded-lg overflow-hidden"
    >
      <button onClick={toggleExpand} className="w-full text-left p-3 hover:bg-white/[0.03] transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.class}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600">#{run.id}</span>
            <ChevronDown size={12} className={`text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {new Date(run.started_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
        {run.completed_at && (
          <p className="text-xs text-slate-600 mt-0.5">
            Duration: {Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)}s
          </p>
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-white/5">
          {loadingSteps ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 size={12} className="animate-spin" /> Loading steps…
            </div>
          ) : steps?.length === 0 ? (
            <p className="text-xs text-slate-600 py-2">No step data recorded</p>
          ) : (
            steps?.map((step) => <StepRow key={step.id} step={step} />)
          )}
        </div>
      )}
    </motion.div>
  );
}

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
            {runs.map((run) => (
              <RunCard key={run.id} run={run} workflowId={workflowId} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default WorkflowRuns;
