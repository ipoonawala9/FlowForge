import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Phone, CheckCircle, AlertCircle, Mail, Calendar, Shield, Eye, EyeOff, Save } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function SectionCard({ icon: Icon, iconColor, title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon size={15} />
        </div>
        <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ReadonlyField({ value }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-slate-300 text-sm">
      {value}
    </div>
  );
}

function InputField({ value, onChange, placeholder, type = "text", icon: Icon }) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500/60
                   rounded-xl py-2.5 pr-4 text-white placeholder-slate-600 outline-none
                   transition-all duration-150 text-sm ${Icon ? "pl-9" : "pl-4"}`}
      />
    </div>
  );
}

function PasswordField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500/60
                   rounded-xl py-2.5 pl-9 pr-10 text-white placeholder-slate-600 outline-none
                   transition-all duration-150 text-sm"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function StatusBanner({ status }) {
  if (!status) return null;
  const ok = status.type === "success";
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm border
      ${ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
           : "bg-red-500/10 border-red-500/20 text-red-400"}`}
    >
      {ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {status.message}
    </div>
  );
}

function Avatar({ name, email }) {
  const initials = (name || email || "?").slice(0, 2).toUpperCase();
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                    flex items-center justify-center text-white font-bold text-lg select-none shadow-lg">
      {initials}
    </div>
  );
}

export default function Settings() {
  const { user, refreshUser } = useAuth();

  // profile form
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileStatus, setProfileStatus] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileStatus(null);
    if (!profileName.trim()) return setProfileStatus({ type: "error", message: "Name is required" });
    try {
      setSavingProfile(true);
      await api.put("/auth/profile", { name: profileName.trim(), phone: profilePhone.trim() || undefined });
      setProfileStatus({ type: "success", message: "Profile updated" });
      if (refreshUser) refreshUser(); // re-fetch user so sidebar name updates
    } catch (err) {
      setProfileStatus({ type: "error", message: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPasswordStatus({ type: "error", message: "All fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return setPasswordStatus({ type: "error", message: "New passwords do not match" });
    }
    if (newPassword.length < 6) {
      return setPasswordStatus({ type: "error", message: "Password must be at least 6 characters" });
    }
    try {
      setSavingPassword(true);
      await api.put("/auth/password", { currentPassword, newPassword });
      setPasswordStatus({ type: "success", message: "Password updated" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({ type: "error", message: err.response?.data?.message || "Failed to update password" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your account and security</p>
        </motion.div>

        <div className="space-y-4">
          {/* ── Profile card ── */}
          <SectionCard icon={User} iconColor="bg-indigo-500/15 text-indigo-400" title="Profile" delay={0}>
            {/* avatar + meta */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
              <Avatar name={user?.name} email={user?.email} />
              <div>
                <p className="text-white font-medium text-sm">{user?.name || user?.email?.split("@")[0]}</p>
                <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Shield size={11} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Active</span>
                  <span className="text-slate-700 text-xs mx-1">·</span>
                  <Calendar size={11} className="text-slate-500" />
                  <span className="text-xs text-slate-500">Since {memberSince}</span>
                </div>
              </div>
            </div>

            {/* editable fields */}
            <form onSubmit={handleProfileSave} className="space-y-3.5">
              <FieldRow label="Email">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-500 shrink-0" />
                  <ReadonlyField value={user?.email ?? "Loading…"} />
                </div>
              </FieldRow>
              <FieldRow label="Name">
                <InputField
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your full name"
                  icon={User}
                />
              </FieldRow>
              <FieldRow label="Phone">
                <InputField
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210 (optional)"
                  icon={Phone}
                />
              </FieldRow>

              {profileStatus && (
                <div className="sm:ml-[8.5rem]"><StatusBanner status={profileStatus} /></div>
              )}
              <div className="sm:ml-[8.5rem] pt-1">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500
                             disabled:opacity-40 text-white font-medium rounded-xl px-5 py-2.5
                             transition-all duration-150 text-sm"
                >
                  {savingProfile
                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save size={13} />}
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* ── Password card ── */}
          <SectionCard icon={Lock} iconColor="bg-purple-500/15 text-purple-400" title="Change Password" delay={0.08}>
            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <FieldRow label="Current">
                <PasswordField value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </FieldRow>
              <FieldRow label="New">
                <PasswordField value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
              </FieldRow>
              <FieldRow label="Confirm">
                <PasswordField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
              </FieldRow>

              {passwordStatus && (
                <div className="sm:ml-[8.5rem]"><StatusBanner status={passwordStatus} /></div>
              )}
              <div className="sm:ml-[8.5rem] pt-1">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500
                             disabled:opacity-40 text-white font-medium rounded-xl px-5 py-2.5
                             transition-all duration-150 text-sm"
                >
                  {savingPassword
                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Lock size={13} />}
                  {savingPassword ? "Saving…" : "Update password"}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
