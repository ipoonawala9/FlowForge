import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const inputClass = "w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus({ type: "error", message: "All fields are required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }

    try {
      setSaving(true);
      await api.put("/auth/password", { currentPassword, newPassword });
      setStatus({ type: "success", message: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update password" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your account</p>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <User size={16} className="text-indigo-400" />
              </div>
              <h2 className="font-semibold text-white">Account</h2>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-slate-400 text-sm">
                {user?.email || "Loading..."}
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Member since {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </motion.div>

          {/* Change Password */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Lock size={16} className="text-purple-400" />
              </div>
              <h2 className="font-semibold text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              {status && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                  status.type === "success"
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {status.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 text-sm"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Lock size={14} />}
                Update Password
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
