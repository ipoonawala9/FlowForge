import { useNavigate } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-indigo-400" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-3">404</h1>
        <p className="text-slate-400 mb-8">This page doesn't exist.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-5 py-2.5 transition-all duration-200 text-sm mx-auto"
        >
          <Home size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default NotFound;
