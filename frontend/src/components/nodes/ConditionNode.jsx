import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

function ConditionNode({ data, selected }) {
  return (
    <div
      className={`bg-[#1a1d2e] border rounded-xl px-4 py-3 min-w-[200px] shadow-xl transition-all duration-150 ${
        selected ? "border-amber-500/40 shadow-amber-500/10" : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* single input at top */}
      <Handle type="target" position={Position.Top} id="input" />

      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <GitBranch size={13} className="text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-400 leading-none mb-0.5">condition</p>
          <p className="text-white text-sm font-medium truncate">{data.label}</p>
        </div>
      </div>

      {/* branch labels */}
      <div className="flex justify-between text-xs px-1">
        <span className="text-green-400 font-medium">✓ True</span>
        <span className="text-red-400 font-medium">✗ False</span>
      </div>

      {/* two output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "30%" }}
        className="!bg-green-500 !border-green-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "70%" }}
        className="!bg-red-500 !border-red-400"
      />
    </div>
  );
}

export default ConditionNode;
