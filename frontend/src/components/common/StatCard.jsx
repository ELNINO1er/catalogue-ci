export default function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
