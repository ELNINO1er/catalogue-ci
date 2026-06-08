import { useEffect, useState } from "react";
import { BarChart3, Eye, MessageCircle, Package, QrCode } from "lucide-react";
import Button from "../../components/ui/Button";
import StatCard from "../../components/common/StatCard";
import { me } from "../../services/authService";
import { getBusinessStats } from "../../services/businessService";
import { fmt } from "../../utils/formatters";

export default function MerchantDashboardPage({ user, setView, setPublicSlug, setQrBusiness }) {
  const [profile, setProfile] = useState(user);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const business = profile?.business;

  useEffect(() => {
    if (business?.id) {
      getBusinessStats(business.id).then(setStats).catch(() => setStats(null));
    }
  }, [business?.id]);

  if (!business) {
    return <p className="p-5 text-sm text-slate-500">Ce compte commercant n'est pas encore associe a un commerce.</p>;
  }

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Package} label="Produits" value={fmt(stats?.products_count)} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(stats?.total_clicks)} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={BarChart3} label="30 derniers jours" value={fmt(stats?.clicks_30d)} tone="bg-amber-50 text-amber-700" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setView("products")}>
          <Package size={16} />
          Gerer les produits
        </Button>
        <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}>
          <Eye size={16} />
          Page publique
        </Button>
        <Button tone="secondary" onClick={() => setQrBusiness(business)}>
          <QrCode size={16} />
          QR code
        </Button>
      </div>
    </div>
  );
}
