import Sidebar from "../components/common/Sidebar";

export default function AdminLayout({ user, view, setView, onLogout, children }) {
  return (
    <div className="min-h-screen bg-slate-100 lg:pl-72">
      <Sidebar user={user} view={view} setView={setView} onLogout={onLogout} mode="admin" />
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
