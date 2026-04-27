import Sidebar from "./Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
