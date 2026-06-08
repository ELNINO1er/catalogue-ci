import Sidebar from "../components/common/Sidebar";

export default function MerchantLayout({ user, view, setView, onLogout, children }) {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar user={user} view={view} setView={setView} onLogout={onLogout} mode="merchant" />
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
