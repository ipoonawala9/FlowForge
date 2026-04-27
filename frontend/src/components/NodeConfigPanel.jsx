import { useState } from "react";
import { Copy, Check, Settings } from "lucide-react";

const inputClass = "w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-lg py-2 px-3 text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm";
const labelClass = "block text-xs font-medium text-slate-400 mb-1.5";

function NodeConfigPanel({ node, updateNodeConfig }) {
  const [copied, setCopied] = useState(false);

  if (!node) {
    return (
      <div className="h-full bg-[#13151f] p-5 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-3">
          <Settings size={18} className="text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium">No node selected</p>
        <p className="text-slate-600 text-xs mt-1">Click a node to configure it</p>
      </div>
    );
  }

  const { type, config = {} } = node.data;
  const update = (key, value) => updateNodeConfig(node.id, key, value);

  const webhookUrl = config.endpoint ? `http://localhost:3000/webhook/${config.endpoint}` : "";

  const copyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#13151f] p-5 h-full">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Configure Node</p>

      <div className="space-y-4">
        {type === "schedule" && (
          <>
            <div className="mb-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
              <p className="text-xs text-rose-400">This workflow will run automatically on the configured schedule. No webhook needed.</p>
            </div>
            <div>
              <label className={labelClass}>Presets</label>
              <div className="grid grid-cols-1 gap-1.5 mb-3">
                {[
                  { label: "Every day at 9am",     value: "0 9 * * *" },
                  { label: "Every hour",            value: "0 * * * *" },
                  { label: "Every Monday 9am",      value: "0 9 * * 1" },
                  { label: "Every 30 minutes",      value: "*/30 * * * *" },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => update("cron_expression", p.value)}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border ${
                      config.cron_expression === p.value
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="font-medium">{p.label}</span>
                    <span className="ml-2 font-mono text-slate-500">{p.value}</span>
                  </button>
                ))}
              </div>
              <label className={labelClass}>Custom CRON expression</label>
              <input
                value={config.cron_expression || ""}
                onChange={(e) => update("cron_expression", e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="0 9 * * *"
              />
              <p className="text-xs text-slate-600 mt-1">
                min hour day month weekday — <a href="https://crontab.guru" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">crontab.guru</a>
              </p>
            </div>
          </>
        )}

        {type === "delay" && (
          <>
            <div className="mb-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400">Pauses the workflow for the specified duration before continuing to the next node.</p>
            </div>
            <div>
              <label className={labelClass}>Wait duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.amount || ""}
                  onChange={(e) => update("amount", e.target.value)}
                  className={`${inputClass} w-24`}
                  placeholder="10"
                />
                <select
                  value={config.unit || "seconds"}
                  onChange={(e) => update("unit", e.target.value)}
                  className={inputClass}
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
          </>
        )}

        {type === "condition" && (
          <>
            <div className="mb-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400">Connect the <span className="font-bold">True</span> handle (left) and <span className="font-bold">False</span> handle (right) to different nodes.</p>
            </div>
            <div>
              <label className={labelClass}>Field to check</label>
              <input
                value={config.field || ""}
                onChange={(e) => update("field", e.target.value)}
                className={inputClass}
                placeholder="status  or  body.amount"
              />
              <p className="text-xs text-slate-600 mt-1">Supports dot notation: body.status</p>
            </div>
            <div>
              <label className={labelClass}>Operator</label>
              <select
                value={config.operator || "equals"}
                onChange={(e) => {
                  update("operator", e.target.value);
                }}
                onFocus={() => {
                  if (!config.operator) update("operator", "equals");
                }}
                className={inputClass}
              >
                <option value="equals">equals</option>
                <option value="not_equals">not equals</option>
                <option value="contains">contains</option>
                <option value="greater_than">greater than</option>
                <option value="less_than">less than</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Value</label>
              <input
                value={config.value || ""}
                onChange={(e) => update("value", e.target.value)}
                className={inputClass}
                placeholder="active"
              />
            </div>
          </>
        )}

        {type === "webhook" && (
          <>
            <div>
              <label className={labelClass}>Endpoint Name</label>
              <input
                value={config.endpoint || ""}
                onChange={(e) => update("endpoint", e.target.value)}
                className={inputClass}
                placeholder="order-created"
              />
            </div>

            {webhookUrl && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1.5">Webhook URL</p>
                <p className="text-xs text-slate-300 break-all font-mono leading-relaxed">{webhookUrl}</p>
                <button
                  onClick={copyWebhook}
                  className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
                </button>
              </div>
            )}
          </>
        )}

        {type === "httpRequest" && (
          <>
            <div>
              <label className={labelClass}>URL</label>
              <input value={config.url || ""} onChange={(e) => update("url", e.target.value)} className={inputClass} placeholder="https://api.example.com/data" />
            </div>
            <div>
              <label className={labelClass}>Method</label>
              <select
                value={config.method || "GET"}
                onChange={(e) => update("method", e.target.value)}
                className={inputClass}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Body (JSON)</label>
              <textarea
                value={config.body || ""}
                onChange={(e) => update("body", e.target.value)}
                className={`${inputClass} h-20 resize-none font-mono`}
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        )}

        {type === "whatsapp" && (
          <>
            <div className="mb-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400">Sends a WhatsApp message via Twilio. Requires Twilio credentials in your .env file.</p>
            </div>
            <div>
              <label className={labelClass}>To (phone with country code)</label>
              <input
                value={config.to || ""}
                onChange={(e) => update("to", e.target.value)}
                className={inputClass}
                placeholder="+919876543210"
              />
              <p className="text-xs text-slate-600 mt-1">Include country code, e.g. +91 for India</p>
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea
                value={config.message || ""}
                onChange={(e) => update("message", e.target.value)}
                className={`${inputClass} h-24 resize-none`}
                placeholder="Hello from FlowForge!"
              />
            </div>
          </>
        )}

        {type === "sendEmail" && (
          <>
            <div>
              <label className={labelClass}>To</label>
              <input value={config.to || ""} onChange={(e) => update("to", e.target.value)} className={inputClass} placeholder="recipient@example.com" />
            </div>
            <div>
              <label className={labelClass}>Subject</label>
              <input value={config.subject || ""} onChange={(e) => update("subject", e.target.value)} className={inputClass} placeholder="Hello from FlowForge" />
            </div>
            <div>
              <label className={labelClass}>Body</label>
              <textarea
                value={config.body || ""}
                onChange={(e) => update("body", e.target.value)}
                className={`${inputClass} h-24 resize-none`}
                placeholder="Email message..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NodeConfigPanel;
