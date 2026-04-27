import { Handle, Position } from "@xyflow/react";
import { Globe, Mail, Webhook, Clock, CalendarClock, MessageCircle } from "lucide-react";

const typeConfig = {
  webhook:     { icon: Webhook,       color: "text-purple-400",  bg: "bg-purple-500/15",  border: "border-purple-500/30" },
  schedule:    { icon: CalendarClock, color: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-rose-500/30" },
  httpRequest: { icon: Globe,         color: "text-cyan-400",    bg: "bg-cyan-500/15",    border: "border-cyan-500/30" },
  sendEmail:   { icon: Mail,          color: "text-green-400",   bg: "bg-green-500/15",   border: "border-green-500/30" },
  delay:       { icon: Clock,         color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30" },
  whatsapp:    { icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
};

function ActionNode({ data, selected }) {
  const cfg = typeConfig[data.type] || typeConfig.httpRequest;
  const Icon = cfg.icon;

  return (
    <div
      className={`bg-[#1a1d2e] border rounded-xl px-4 py-3 min-w-[180px] shadow-xl transition-all duration-150 ${
        selected ? `${cfg.border} shadow-indigo-500/10` : "border-white/10 hover:border-white/20"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={13} className={cfg.color} />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${cfg.color} leading-none mb-0.5`}>{data.type}</p>
          <p className="text-white text-sm font-medium truncate">{data.label}</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default ActionNode;
