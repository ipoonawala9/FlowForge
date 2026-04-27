import { Globe, Mail, Webhook, GitBranch, Clock, CalendarClock, MessageCircle } from "lucide-react";

const actions = [
  { type: "webhook",   label: "Webhook Trigger", icon: Webhook,       color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", category: "Triggers" },
  { type: "schedule",  label: "Schedule (CRON)",  icon: CalendarClock, color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20",   category: "Triggers" },
  { type: "condition", label: "Condition",        icon: GitBranch,     color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  category: "Logic" },
  { type: "delay",     label: "Delay / Wait",     icon: Clock,         color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   category: "Logic" },
  { type: "httpRequest", label: "HTTP Request",   icon: Globe,         color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   category: "Actions" },
  { type: "sendEmail", label: "Send Email",        icon: Mail,          color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  category: "Actions" },
  { type: "whatsapp",  label: "WhatsApp",          icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", category: "Actions" },
];

function ActionSidebar({ addNode }) {
  const onDragStart = (e, action) => {
    e.dataTransfer.setData("application/reactflow", action.type);
    e.dataTransfer.setData("label", action.label);
    e.dataTransfer.effectAllowed = "move";
  };

  const categories = [...new Set(actions.map((a) => a.category))];

  return (
    <div className="w-52 bg-[#13151f] border-r border-white/5 h-full p-3 overflow-y-auto">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">Nodes</p>

      {categories.map((cat) => (
        <div key={cat} className="mb-4">
          <p className="text-xs text-slate-600 px-1 mb-2">{cat}</p>
          <div className="space-y-1.5">
            {actions.filter((a) => a.category === cat).map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, action)}
                  onClick={() => addNode(action)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${action.border} ${action.bg} cursor-grab active:cursor-grabbing hover:brightness-125 transition-all duration-150 select-none`}
                >
                  <Icon size={14} className={action.color} />
                  <span className="text-xs font-medium text-slate-300">{action.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-600 px-1 mt-4">Drag onto canvas or click to add</p>
    </div>
  );
}

export default ActionSidebar;
