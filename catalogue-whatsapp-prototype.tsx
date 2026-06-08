import { useState, useMemo } from "react";
import {
  Store, LayoutDashboard, Package, Users, LogOut, Plus, Search,
  Edit2, Trash2, QrCode, Phone, MapPin, Clock, Wallet, MessageCircle,
  Eye, Link2, ShoppingBag, TrendingUp, X, Check, ExternalLink, Menu
} from "lucide-react";

/* ----------------------------- Données fictives ---------------------------- */

const CATEGORIES = [
  { id: 1, name: "Restaurant", slug: "restaurant" },
  { id: 2, name: "Boutique", slug: "boutique" },
  { id: 3, name: "Salon", slug: "salon" },
  { id: 4, name: "Service", slug: "service" },
  { id: 5, name: "Autre", slug: "autre" },
];

const PAYMENTS = [
  { id: 1, name: "Wave", color: "bg-sky-500" },
  { id: 2, name: "Orange Money", color: "bg-orange-500" },
  { id: 3, name: "MTN Money", color: "bg-yellow-500" },
  { id: 4, name: "Moov Money", color: "bg-blue-600" },
  { id: 5, name: "Paiement à la livraison", color: "bg-gray-500" },
];

const USERS = [
  { email: "admin@catalogueci.com", password: "Admin123@", role: "SUPER_ADMIN", name: "Super Admin" },
  { email: "merchant@catalogueci.com", password: "Merchant123@", role: "MERCHANT", name: "Awa Koné", businessSlug: "chez-awa-food" },
];

const INITIAL_BUSINESSES = [
  {
    id: 1, slug: "chez-awa-food", name: "Chez Awa Food",
    logo: "🍲", category: 1, whatsapp: "2250700000000", phone: "2250700000000",
    address: "Cocody, Abidjan", maps: "https://maps.google.com/?q=Cocody+Abidjan",
    hours: "Lun–Dim · 09h00 – 22h00", desc: "Spécialités ivoiriennes maison, fraîches et généreuses.",
    payments: [1, 2, 5], clicks: 142,
    products: [
      { id: 1, name: "Garba complet", price: 1500, desc: "Attiéké + thon frit + piment", img: "🥘", available: true },
      { id: 2, name: "Poulet braisé", price: 3500, desc: "Demi-poulet braisé + alloco", img: "🍗", available: true },
      { id: 3, name: "Alloco poisson", price: 2500, desc: "Alloco + poisson frit + sauce", img: "🐟", available: true },
      { id: 4, name: "Jus de bissap", price: 500, desc: "Maison, bien frais", img: "🥤", available: false },
    ],
  },
  {
    id: 2, slug: "beaute-by-fatou", name: "Beauté by Fatou",
    logo: "💇🏾‍♀️", category: 3, whatsapp: "2250709999999", phone: "2250709999999",
    address: "Yopougon, Abidjan", maps: "https://maps.google.com/?q=Yopougon+Abidjan",
    hours: "Mar–Sam · 08h30 – 19h00", desc: "Coiffure, tresses et soins capillaires.",
    payments: [1, 3], clicks: 67,
    products: [
      { id: 1, name: "Tresses collées", price: 5000, desc: "Pose complète", img: "💈", available: true },
      { id: 2, name: "Défrisage", price: 4000, desc: "Produits inclus", img: "✨", available: true },
    ],
  },
  {
    id: 3, slug: "tech-store-ci", name: "Tech Store CI",
    logo: "📱", category: 2, whatsapp: "2250501234567", phone: "2250501234567",
    address: "Marcory, Abidjan", maps: "https://maps.google.com/?q=Marcory+Abidjan",
    hours: "Lun–Sam · 09h00 – 18h30", desc: "Accessoires et smartphones à petits prix.",
    payments: [1, 2, 4], clicks: 38,
    products: [
      { id: 1, name: "Écouteurs sans fil", price: 8000, desc: "Bluetooth 5.0", img: "🎧", available: true },
    ],
  },
];

/* ------------------------------- Utilitaires ------------------------------- */

function generateWhatsAppLink(number, productName, price, businessName) {
  const message = `Bonjour, je veux commander : ${productName} à ${price} FCFA chez ${businessName}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const fmt = (n) => n.toLocaleString("fr-FR");

/* ------------------------- Faux QR Code (visuel démo) ----------------------- */

function FakeQR({ value, size = 140 }) {
  // grille déterministe à partir d'un hash simple — visuel uniquement
  const cells = 21;
  const grid = useMemo(() => {
    let h = 0;
    for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
    const g = [];
    for (let y = 0; y < cells; y++) {
      const row = [];
      for (let x = 0; x < cells; x++) {
        h = (h * 1103515245 + 12345) & 0x7fffffff;
        row.push((h >> 8) % 2 === 0);
      }
      g.push(row);
    }
    return g;
  }, [value]);

  const s = size / cells;
  const finder = (cx, cy) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx * s} y={cy * s} width={s * 7} height={s * 7} fill="#111827" />
      <rect x={(cx + 1) * s} y={(cy + 1) * s} width={s * 5} height={s * 5} fill="#fff" />
      <rect x={(cx + 2) * s} y={(cy + 2) * s} width={s * 3} height={s * 3} fill="#111827" />
    </g>
  );
  const inFinder = (x, y) =>
    (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);

  return (
    <svg width={size} height={size} className="rounded-lg bg-white">
      {grid.map((row, y) =>
        row.map((on, x) =>
          on && !inFinder(x, y) ? (
            <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill="#111827" />
          ) : null
        )
      )}
      {finder(0, 0)}
      {finder(cells - 7, 0)}
      {finder(0, cells - 7)}
    </svg>
  );
}

/* --------------------------------- Login ----------------------------------- */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const u = USERS.find((x) => x.email === email.trim() && x.password === password);
    if (!u) { setError("Email ou mot de passe incorrect."); return; }
    setError("");
    onLogin(u);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">
            <Store size={22} />
          </div>
          <span className="text-xl font-bold text-gray-800">Catalogue<span className="text-green-600">CI</span></span>
        </div>
        <p className="text-center text-gray-500 text-sm mb-6">Espace de gestion</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
          placeholder="vous@exemple.com"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
          placeholder="••••••••"
        />
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
        <button onClick={submit} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition">
          Se connecter
        </button>

        <div className="mt-6 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="font-semibold text-gray-600">Comptes de démonstration :</p>
          <p>👑 Admin — admin@catalogueci.com / Admin123@</p>
          <p>🏪 Commerçant — merchant@catalogueci.com / Merchant123@</p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Layout ---------------------------------- */

function Sidebar({ role, current, onNav, onLogout, user }) {
  const adminLinks = [
    { key: "admin-dash", label: "Tableau de bord", icon: LayoutDashboard },
    { key: "admin-biz", label: "Commerces", icon: Store },
    { key: "admin-merchants", label: "Commerçants", icon: Users },
  ];
  const merchantLinks = [
    { key: "merch-dash", label: "Tableau de bord", icon: LayoutDashboard },
    { key: "merch-products", label: "Mes produits", icon: Package },
  ];
  const links = role === "SUPER_ADMIN" ? adminLinks : merchantLinks;

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-white">
          <Store size={20} />
        </div>
        <span className="font-bold text-gray-800">Catalogue<span className="text-green-600">CI</span></span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = current === l.key;
          return (
            <button key={l.key} onClick={() => onNav(l.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
              }`}>
              <Icon size={18} /> {l.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
          <p className="text-xs text-gray-400">{role === "SUPER_ADMIN" ? "Administrateur" : "Commerçant"}</p>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Admin dashboard ----------------------------- */

function AdminDashboard({ businesses, onView }) {
  const totalProducts = businesses.reduce((s, b) => s + b.products.length, 0);
  const totalClicks = businesses.reduce((s, b) => s + b.clicks, 0);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store} label="Commerces" value={businesses.length} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Package} label="Produits" value={totalProducts} tone="bg-green-50 text-green-600" />
        <StatCard icon={Users} label="Commerçants" value={2} tone="bg-purple-50 text-purple-600" />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(totalClicks)} tone="bg-emerald-50 text-emerald-600" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 font-semibold text-gray-800">Derniers commerces créés</div>
        <div className="divide-y divide-gray-50">
          {businesses.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">{b.logo}</div>
                <div>
                  <p className="font-medium text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-400">{CATEGORIES.find((c) => c.id === b.category)?.name} · {b.address}</p>
                </div>
              </div>
              <button onClick={() => onView(b.slug)} className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                <Eye size={16} /> Page publique
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Admin: commerces --------------------------- */

function AdminBusinesses({ businesses, onView, onQR }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(0);
  const filtered = businesses.filter(
    (b) => b.name.toLowerCase().includes(q.toLowerCase()) && (cat === 0 || b.category === cat)
  );
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Commerces</h1>
        <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Nouveau commerce
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <select value={cat} onChange={(e) => setCat(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400">
          <option value={0}>Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Commerce</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Catégorie</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Produits</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{b.logo}</div>
                    <div>
                      <p className="font-medium text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400">/catalogue/{b.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{CATEGORIES.find((c) => c.id === b.category)?.name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">{b.products.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onQR(b)} title="QR code" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><QrCode size={17} /></button>
                    <button onClick={() => onView(b.slug)} title="Voir" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Eye size={17} /></button>
                    <button title="Modifier" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={17} /></button>
                    <button title="Supprimer" className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Aucun commerce trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Admin: merchants --------------------------- */

function AdminMerchants() {
  const merchants = [
    { name: "Awa Koné", email: "merchant@catalogueci.com", biz: "Chez Awa Food", active: true },
    { name: "Fatou Diabaté", email: "fatou@catalogueci.com", biz: "Beauté by Fatou", active: true },
    { name: "Yao Konan", email: "yao@catalogueci.com", biz: "Tech Store CI", active: false },
  ];
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Commerçants</h1>
        <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Nouveau commerçant
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Commerce</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {merchants.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{m.email}</td>
                <td className="px-4 py-3 text-gray-600">{m.biz}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {m.active ? "Actif" : "Désactivé"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------- Merchant dashboard --------------------------- */

function MerchantDashboard({ business, onView, onProducts, onQR }) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bonjour 👋</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">{business.logo}</div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{business.name}</h2>
              <p className="text-sm text-gray-400">{CATEGORIES.find((c) => c.id === business.category)?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 mb-4">
            <Link2 size={16} className="text-green-500 shrink-0" />
            <span className="truncate">catalogueci.com/catalogue/{business.slug}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Package} label="Produits" value={business.products.length} tone="bg-blue-50 text-blue-600" />
            <StatCard icon={MessageCircle} label="Clics WhatsApp" value={business.clicks} tone="bg-green-50 text-green-600" />
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <button onClick={onProducts} className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
              <Package size={17} /> Gérer mes produits
            </button>
            <button onClick={() => onView(business.slug)} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
              <Eye size={17} /> Voir ma page
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-gray-600 mb-3">Mon QR code</p>
          <FakeQR value={business.slug} />
          <button onClick={() => onQR(business)} className="mt-4 text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
            <QrCode size={16} /> Agrandir / Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Merchant products ---------------------------- */

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(
    product || { name: "", price: "", desc: "", img: "🍽️", available: true }
  );
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">{product ? "Modifier le produit" : "Nouveau produit"}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA)</label>
              <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
              <input value={form.img} onChange={(e) => set("img", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400 text-center" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.desc} onChange={(e) => set("desc", e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)}
              className="w-4 h-4 accent-green-500" />
            Disponible
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => form.name && form.price && onSave({ ...form, price: Number(form.price) })}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function MerchantProducts({ business, onUpdateProducts }) {
  const [modal, setModal] = useState(null); // null | {product?}
  const products = business.products;

  const save = (p) => {
    if (p.id) {
      onUpdateProducts(products.map((x) => (x.id === p.id ? p : x)));
    } else {
      onUpdateProducts([...products, { ...p, id: Date.now() }]);
    }
    setModal(null);
  };
  const remove = (id) => onUpdateProducts(products.filter((x) => x.id !== id));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Mes produits</h1>
        <button onClick={() => setModal({})} className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucun produit pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">{p.img}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.available ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {p.available ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mt-3">{p.name}</h3>
              <p className="text-sm text-gray-400 line-clamp-2">{p.desc}</p>
              <p className="text-green-600 font-bold mt-2">{fmt(p.price)} FCFA</p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => setModal({ product: p })} className="flex-1 text-sm text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg flex items-center justify-center gap-1">
                  <Edit2 size={15} /> Modifier
                </button>
                <button onClick={() => remove(p.id)} className="flex-1 text-sm text-red-500 hover:bg-red-50 py-1.5 rounded-lg flex items-center justify-center gap-1">
                  <Trash2 size={15} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ProductModal product={modal.product} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ------------------------------ Page publique ------------------------------ */

function PublicCatalogue({ business, onQR, embedded }) {
  const cat = CATEGORIES.find((c) => c.id === business.category)?.name;
  const order = (p) => {
    window.open(generateWhatsAppLink(business.whatsapp, p.name, p.price, business.name), "_blank");
    // Ici on appellerait POST /api/tracking/whatsapp-click
  };

  return (
    <div className={embedded ? "" : "min-h-screen"} style={{ background: "#f3f4f6" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
        <div className="max-w-2xl mx-auto px-5 pt-10 pb-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg">
            {business.logo}
          </div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <span className="inline-block mt-1 text-xs bg-white/20 px-3 py-1 rounded-full">{cat}</span>
          <p className="text-green-50 text-sm mt-3 max-w-md mx-auto">{business.desc}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-5 pb-12">
        {/* Actions rapides */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 flex flex-col items-center gap-1 shadow-sm transition">
            <MessageCircle size={20} /><span className="text-xs font-medium">WhatsApp</span>
          </a>
          <a href={`tel:+${business.phone}`}
            className="bg-white hover:bg-gray-50 text-gray-700 rounded-xl py-3 flex flex-col items-center gap-1 shadow-sm border border-gray-100 transition">
            <Phone size={20} className="text-blue-500" /><span className="text-xs font-medium">Appeler</span>
          </a>
          <a href={business.maps} target="_blank" rel="noreferrer"
            className="bg-white hover:bg-gray-50 text-gray-700 rounded-xl py-3 flex flex-col items-center gap-1 shadow-sm border border-gray-100 transition">
            <MapPin size={20} className="text-red-500" /><span className="text-xs font-medium">Localisation</span>
          </a>
        </div>

        {/* Infos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400 shrink-0" />{business.hours}</div>
          <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400 shrink-0" />{business.address}</div>
        </div>

        {/* Produits */}
        <h2 className="font-bold text-gray-800 mb-3">Notre menu</h2>
        <div className="space-y-3">
          {business.products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-3xl shrink-0">{p.img}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                  {!p.available && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full shrink-0">Épuisé</span>}
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{p.desc}</p>
                <p className="text-green-600 font-bold text-sm mt-0.5">{fmt(p.price)} FCFA</p>
              </div>
              <button
                disabled={!p.available}
                onClick={() => order(p)}
                className={`shrink-0 text-sm font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  p.available ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}>
                <MessageCircle size={16} /> Commander
              </button>
            </div>
          ))}
        </div>

        {/* Paiement */}
        <h2 className="font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2"><Wallet size={18} /> Moyens de paiement</h2>
        <div className="flex flex-wrap gap-2">
          {business.payments.map((pid) => {
            const pm = PAYMENTS.find((x) => x.id === pid);
            return (
              <span key={pid} className={`${pm.color} text-white text-xs font-medium px-3 py-1.5 rounded-full`}>{pm.name}</span>
            );
          })}
        </div>

        {/* QR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-6 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600 mb-3">Partagez cette page</p>
          <FakeQR value={business.slug} size={120} />
          <button onClick={() => onQR(business)} className="mt-3 text-xs text-green-600 hover:text-green-700">Agrandir le QR code</button>
        </div>

        <footer className="text-center text-xs text-gray-400 mt-8">
          Propulsé par <span className="font-semibold text-gray-500">CatalogueCI</span> · Catalogue digital pour commerces
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------- QR Modal ---------------------------------- */

function QRModal({ business, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">QR code · {business.name}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="flex justify-center"><FakeQR value={business.slug} size={220} /></div>
        <p className="text-xs text-gray-400 mt-3">/catalogue/{business.slug}</p>
        <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg">
          Télécharger (PNG)
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- App ------------------------------------- */

export default function App() {
  const [businesses, setBusinesses] = useState(INITIAL_BUSINESSES);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // login | admin-* | merch-* | public
  const [publicSlug, setPublicSlug] = useState(null);
  const [qrBiz, setQrBiz] = useState(null);
  const [demoOpen, setDemoOpen] = useState(true);

  const merchantBiz = businesses.find((b) => b.slug === user?.businessSlug) || businesses[0];

  const login = (u) => {
    setUser(u);
    setView(u.role === "SUPER_ADMIN" ? "admin-dash" : "merch-dash");
  };
  const logout = () => { setUser(null); setView("login"); };
  const openPublic = (slug) => { setPublicSlug(slug); setView("public"); };

  const updateMerchantProducts = (products) =>
    setBusinesses(businesses.map((b) => (b.id === merchantBiz.id ? { ...b, products } : b)));

  /* Barre de contrôle démo */
  const DemoBar = () => (
    <div className="bg-gray-900 text-white text-xs">
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-green-400 flex items-center gap-1"><Eye size={14} /> Mode démo</span>
        <span className="text-gray-500 hidden sm:inline">— explorez les vues :</span>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => { setUser(null); setView("login"); }} className="px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600">Connexion</button>
          <button onClick={() => { setUser(USERS[0]); setView("admin-dash"); }} className="px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600">👑 Admin</button>
          <button onClick={() => { setUser(USERS[1]); setView("merch-dash"); }} className="px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600">🏪 Commerçant</button>
          <button onClick={() => openPublic("chez-awa-food")} className="px-2.5 py-1 rounded bg-green-700 hover:bg-green-600">📱 Page publique</button>
        </div>
      </div>
    </div>
  );

  let content;
  if (view === "login") {
    content = <Login onLogin={login} />;
  } else if (view === "public") {
    const biz = businesses.find((b) => b.slug === publicSlug) || businesses[0];
    content = (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1 truncate"><ExternalLink size={14} /> catalogueci.com/catalogue/{biz.slug}</span>
          {user && (
            <button onClick={() => setView(user.role === "SUPER_ADMIN" ? "admin-dash" : "merch-dash")}
              className="text-green-600 font-medium shrink-0">← Retour</button>
          )}
        </div>
        <PublicCatalogue business={biz} onQR={setQrBiz} />
      </div>
    );
  } else {
    // Vues authentifiées avec sidebar
    let inner = null;
    if (view === "admin-dash") inner = <AdminDashboard businesses={businesses} onView={openPublic} />;
    else if (view === "admin-biz") inner = <AdminBusinesses businesses={businesses} onView={openPublic} onQR={setQrBiz} />;
    else if (view === "admin-merchants") inner = <AdminMerchants />;
    else if (view === "merch-dash") inner = <MerchantDashboard business={merchantBiz} onView={openPublic} onProducts={() => setView("merch-products")} onQR={setQrBiz} />;
    else if (view === "merch-products") inner = <MerchantProducts business={merchantBiz} onUpdateProducts={updateMerchantProducts} />;

    content = (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar role={user.role} current={view} onNav={setView} onLogout={logout} user={user} />
        <main className="flex-1 overflow-auto">{inner}</main>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900">
      {demoOpen && <DemoBar />}
      {content}
      {qrBiz && <QRModal business={qrBiz} onClose={() => setQrBiz(null)} />}
    </div>
  );
}
