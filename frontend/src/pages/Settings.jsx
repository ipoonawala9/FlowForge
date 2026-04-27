import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Mail, Key, User, Save } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";

function Settings() {
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your account and integrations</p>
        </div>

        <div className="space-y-6">
          {/* Account */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <User size={16} className="text-indigo-400" />
              </div>
              <h2 className="font-semibold text-white">Account</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input disabled placeholder="your@email.com" className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <input type="password" placeholder="••••••••" className={inputClass} />
              </div>
            </div>
          </motion.div>

          {/* SMTP */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-purple-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Email / SMTP</h2>
                <p className="text-slate-500 text-xs">Used for the Send Email action</p>
              </div>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SMTP Host</label>
                  <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Port</label>
                  <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="you@gmail.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password / App Password</label>
                <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••" className={inputClass} />
              </div>
              <p className="text-slate-500 text-xs">
                For Gmail, generate an App Password at{" "}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                  myaccount.google.com/apppasswords
                </a>
              </p>
              <button
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 text-sm"
              >
                {saved ? "Saved!" : <><Save size={14} /> Save Settings</>}
              </button>
            </form>
          </motion.div>

          {/* API Key */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Key size={16} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">API Access</h2>
                <p className="text-slate-500 text-xs">Use your API key to trigger workflows programmatically</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm font-mono">ff_••••••••••••••••••••••••</span>
              <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Reveal</button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
