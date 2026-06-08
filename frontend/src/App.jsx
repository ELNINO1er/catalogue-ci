import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  BarChart3,
  CreditCard,
  Eye,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Minus,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "./services/api";
import { getStoredUser, login as loginRequest, logout as logoutRequest, me } from "./services/authService";
import { orderOnWhatsApp } from "./utils/whatsapp";

const fmt = (value) => Number(value || 0).toLocaleString("fr-FR");

function Button({ children, tone = "primary", className = "", ...props }) {
  const tones = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    ghost: "text-slate-600 hover:bg-slate-100",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
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

function LoginView({ onLogin }) {
  const [email, setEmail] = useState("admin@catalogueci.com");
  const [password, setPassword] = useState("Admin123@");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(await loginRequest(email, password));
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible. Verifiez l'API et les identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-600 text-white">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">CatalogueCI</h1>
            <p className="text-sm text-slate-500">Espace de gestion</p>
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <Button className="w-full" disabled={loading}>
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <LogOut size={16} />}
          Se connecter
        </Button>

        <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Comptes de test apres seed :</p>
          <p>Admin : admin@catalogueci.com / Admin123@</p>
          <p>Commercant : merchant@catalogueci.com / Merchant123@</p>
        </div>
      </form>
    </main>
  );
}

function Shell({ user, view, setView, onLogout, children }) {
  const adminLinks = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "businesses", label: "Commerces", icon: Store },
    { key: "merchants", label: "Commercants", icon: UserRound },
    { key: "payments", label: "Paiements", icon: CreditCard },
  ];
  const merchantLinks = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "products", label: "Produits", icon: Package },
  ];
  const links = user.role === "SUPER_ADMIN" ? adminLinks : merchantLinks;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 p-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white">
              <Store size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900">CatalogueCI</p>
              <p className="text-xs text-slate-500">{user.role === "SUPER_ADMIN" ? "Administrateur" : "Commercant"}</p>
            </div>
          </div>
          <Button tone="ghost" onClick={onLogout} className="lg:hidden">
            <LogOut size={16} />
          </Button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.key}
                onClick={() => setView(link.key)}
                className={`flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold lg:w-full ${
                  view === link.key ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={17} />
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-200 p-3 lg:block">
          <div className="mb-2 px-2 py-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Button tone="ghost" onClick={onLogout} className="w-full justify-start">
            <LogOut size={16} />
            Deconnexion
          </Button>
        </div>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}

function AdminDashboard({ setPublicSlug }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/stats/overview").then((res) => setData(res.data)).catch(() => setData(null));
  }, []);

  const totals = data?.totals || {};
  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Store} label="Commerces" value={fmt(totals.businesses)} tone="bg-sky-50 text-sky-700" />
        <Stat icon={Package} label="Produits" value={fmt(totals.products)} tone="bg-emerald-50 text-emerald-700" />
        <Stat icon={UserRound} label="Commercants" value={fmt(totals.merchants)} tone="bg-violet-50 text-violet-700" />
        <Stat icon={MessageCircle} label="Clics WhatsApp" value={fmt(totals.whatsapp_clicks)} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4 font-semibold text-slate-900">Derniers commerces</div>
        <div className="divide-y divide-slate-100">
          {(data?.recent_businesses || []).map((business) => (
            <div key={business.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-slate-900">{business.name}</p>
                <p className="text-sm text-slate-500">/catalogue/{business.slug}</p>
              </div>
              <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}>
                <Eye size={16} />
                Voir
              </Button>
            </div>
          ))}
          {!data?.recent_businesses?.length ? <p className="p-4 text-sm text-slate-500">Aucune donnee. Lancez le seeder.</p> : null}
        </div>
      </div>
    </div>
  );
}

function Businesses({ setPublicSlug, setQrBusiness }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/businesses").then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  const filtered = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Commerces</h1>
        <Button disabled title="CRUD creation a brancher sur un formulaire complet">
          <Plus size={16} />
          Nouveau
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher"
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.map((business) => (
          <div key={business.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0">
            <div>
              <p className="font-semibold text-slate-900">{business.name}</p>
              <p className="text-sm text-slate-500">
                /catalogue/{business.slug} - {business.products_count || 0} produits
              </p>
            </div>
            <div className="flex gap-2">
              <Button tone="secondary" onClick={() => setQrBusiness(business)}>
                <QrCode size={16} />
              </Button>
              <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}>
                <Eye size={16} />
              </Button>
            </div>
          </div>
        ))}
        {!filtered.length ? <p className="p-4 text-sm text-slate-500">Aucun commerce trouve.</p> : null}
      </div>
    </div>
  );
}

function Merchants() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/merchants").then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Commercants</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {items.map((merchant) => (
          <div key={merchant.id} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-4">
            <p className="font-semibold text-slate-900">{merchant.name}</p>
            <p className="text-sm text-slate-600">{merchant.email}</p>
            <p className="text-sm text-slate-600">{merchant.business?.name || "Non associe"}</p>
            <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${merchant.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {merchant.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
        ))}
        {!items.length ? <p className="p-4 text-sm text-slate-500">Aucun commercant trouve.</p> : null}
      </div>
    </div>
  );
}

function Payments() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/payment-methods/all").then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Moyens de paiement</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-500">{item.code}</p>
          </div>
        ))}
      </div>
      {!items.length ? <p className="text-sm text-slate-500">Aucun moyen de paiement. Lancez le seeder.</p> : null}
    </div>
  );
}

function MerchantDashboard({ user, setView, setPublicSlug, setQrBusiness }) {
  const [profile, setProfile] = useState(user);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const business = profile?.business;
  useEffect(() => {
    if (business?.id) {
      api.get(`/businesses/${business.id}/stats`).then((res) => setStats(res.data)).catch(() => setStats(null));
    }
  }, [business?.id]);

  if (!business) {
    return <p className="p-5 text-sm text-slate-500">Ce compte commercant n'est pas encore associe a un commerce.</p>;
  }

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat icon={Package} label="Produits" value={fmt(stats?.products_count)} tone="bg-sky-50 text-sky-700" />
        <Stat icon={MessageCircle} label="Clics WhatsApp" value={fmt(stats?.total_clicks)} tone="bg-emerald-50 text-emerald-700" />
        <Stat icon={BarChart3} label="30 derniers jours" value={fmt(stats?.clicks_30d)} tone="bg-amber-50 text-amber-700" />
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

function Products({ user }) {
  const [profile, setProfile] = useState(user);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "" });

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const businessId = profile?.business?.id || profile?.business_id;

  async function loadProducts() {
    if (!businessId) return;
    const { data } = await api.get(`/businesses/${businessId}/products`);
    setProducts(data);
  }

  useEffect(() => {
    loadProducts().catch(() => setProducts([]));
  }, [businessId]);

  async function addProduct(event) {
    event.preventDefault();
    if (!form.name || !form.price || !businessId) return;
    await api.post(`/businesses/${businessId}/products`, {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      is_available: true,
    });
    setForm({ name: "", price: "", description: "" });
    await loadProducts();
  }

  async function removeProduct(id) {
    await api.delete(`/products/${id}`);
    await loadProducts();
  }

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Mes produits</h1>
      <form onSubmit={addProduct} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_160px_1fr_auto]">
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Nom"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <input
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
          type="number"
          placeholder="Prix"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <input
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Description"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <Button>
          <Plus size={16} />
          Ajouter
        </Button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">{product.description}</p>
              </div>
              <Button tone="danger" onClick={() => removeProduct(product.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
            <p className="mt-3 font-bold text-emerald-700">{fmt(product.price)} FCFA</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicCatalogue({ slug, onBack, setQrBusiness }) {
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  useEffect(() => {
    api
      .get(`/public/catalogue/${slug}`)
      .then((res) => setBusiness(res.data))
      .catch((err) => setError(err.response?.data?.message || "Catalogue introuvable."));
  }, [slug]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="mb-4 text-slate-600">{error}</p>
          <Button tone="secondary" onClick={onBack}>Retour</Button>
        </div>
      </main>
    );
  }

  if (!business) return <p className="p-5 text-sm text-slate-500">Chargement...</p>;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <button onClick={onBack} className="mb-6 text-sm text-slate-300 hover:text-white">Retour</button>
          <p className="text-sm text-emerald-300">{business.category?.name || "Commerce"}</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
          <p className="mt-3 max-w-xl text-slate-300">{business.description}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-5 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <a className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-3 font-semibold text-white" href={`https://wa.me/${business.whatsapp_number}`} target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            WhatsApp
          </a>
          <a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 font-semibold text-slate-700" href={`tel:+${business.phone_number}`}>
            <Phone size={18} />
            Appeler
          </a>
          <a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 font-semibold text-slate-700" href={business.google_maps_url} target="_blank" rel="noreferrer">
            <MapPin size={18} />
            Localisation
          </a>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Catalogue</h2>
          <div className="grid gap-3">
            {business.products.map((product) => (
              <div key={product.id} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.description}</p>
                  <p className="mt-2 font-bold text-emerald-700">{fmt(product.price)} FCFA</p>
                </div>
                <Button disabled={!product.is_available} onClick={() => setCheckoutProduct(product)}>
                  <MessageCircle size={16} />
                  Commander
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Paiement</h2>
          <div className="flex flex-wrap gap-2">
            {business.paymentMethods.map((method) => (
              <span key={method.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {method.name}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">QR code</h2>
              <p className="text-sm text-slate-500">A scanner pour ouvrir ce catalogue.</p>
            </div>
            <Button tone="secondary" onClick={() => setQrBusiness(business)}>
              <QrCode size={16} />
              Agrandir
            </Button>
          </div>
        </section>
      </div>
      {checkoutProduct ? (
        <CheckoutModal
          business={business}
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
        />
      ) : null}
    </main>
  );
}

function CheckoutModal({ business, product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [fulfillment, setFulfillment] = useState("delivery");
  const [paymentCode, setPaymentCode] = useState(business.paymentMethods?.[0]?.code || "");
  const unitPrice = Number(product.price || 0);
  const total = unitPrice * quantity;
  const payment = business.paymentMethods.find((method) => method.code === paymentCode);

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function confirmOrder() {
    const enrichedProduct = {
      ...product,
      price: total,
      name: `${product.name} x${quantity}`,
    };

    const details = [
      `Produit: ${product.name}`,
      `Quantite: ${quantity}`,
      `Total: ${fmt(total)} FCFA`,
      `Paiement: ${payment?.name || "A confirmer"}`,
      `Mode: ${fulfillment === "delivery" ? "Livraison" : "Retrait sur place"}`,
      customer.name ? `Client: ${customer.name}` : null,
      customer.phone ? `Telephone: ${customer.phone}` : null,
      fulfillment === "delivery" && customer.address ? `Adresse: ${customer.address}` : null,
    ].filter(Boolean);

    await orderOnWhatsApp({
      business,
      product: {
        ...enrichedProduct,
        checkoutMessage: details.join(" | "),
      },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Paiement et commande</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{product.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{business.name}</p>
            </div>
            <Button tone="ghost" onClick={onClose}>Fermer</Button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Prix unitaire</p>
                <p className="font-bold text-slate-900">{fmt(unitPrice)} FCFA</p>
              </div>
              <div className="flex items-center gap-2">
                <Button tone="secondary" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>
                  <Minus size={16} />
                </Button>
                <span className="grid h-10 w-12 place-items-center rounded-lg border border-slate-200 font-bold">{quantity}</span>
                <Button tone="secondary" onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Mode de reception</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setFulfillment("delivery")}
                className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${fulfillment === "delivery" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"}`}
              >
                Livraison
              </button>
              <button
                onClick={() => setFulfillment("pickup")}
                className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${fulfillment === "pickup" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"}`}
              >
                Retrait sur place
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Paiement</h3>
            <div className="grid gap-2">
              {business.paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 ${paymentCode === method.code ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}
                >
                  <span className="font-semibold text-slate-800">{method.name}</span>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentCode === method.code}
                    onChange={() => setPaymentCode(method.code)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Le commercant confirme les instructions exactes de paiement dans WhatsApp.
            </p>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Vos informations</h3>
            <div className="grid gap-3">
              <input
                value={customer.name}
                onChange={(event) => updateCustomer("name", event.target.value)}
                placeholder="Nom"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              />
              <input
                value={customer.phone}
                onChange={(event) => updateCustomer("phone", event.target.value)}
                placeholder="Telephone"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              />
              {fulfillment === "delivery" ? (
                <textarea
                  value={customer.address}
                  onChange={(event) => updateCustomer("address", event.target.value)}
                  placeholder="Adresse de livraison"
                  rows={2}
                  className="resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              ) : null}
            </div>
          </section>

          <section className="rounded-lg bg-slate-100 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Sous-total</span>
              <span>{fmt(total)} FCFA</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-lg font-bold text-slate-900">
              <span>Total a payer</span>
              <span>{fmt(total)} FCFA</span>
            </div>
          </section>

          <Button className="w-full py-3" onClick={confirmOrder} disabled={!paymentCode}>
            <MessageCircle size={18} />
            Valider et envoyer sur WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ business, onClose }) {
  const url = `${window.location.origin}/catalogue/${business.slug}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-left font-bold text-slate-900">{business.name}</h2>
          <Button tone="ghost" onClick={onClose}>Fermer</Button>
        </div>
        <div className="flex justify-center">
          <QRCodeCanvas value={url} size={220} includeMargin />
        </div>
        <p className="mt-3 break-all text-xs text-slate-500">{url}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [view, setView] = useState("dashboard");
  const [publicSlug, setPublicSlug] = useState(() => {
    const match = window.location.pathname.match(/^\/catalogue\/([^/]+)/);
    return match?.[1] || null;
  });
  const [qrBusiness, setQrBusiness] = useState(null);

  useEffect(() => {
    if (publicSlug) {
      window.history.replaceState(null, "", `/catalogue/${publicSlug}`);
    } else {
      window.history.replaceState(null, "", "/");
    }
  }, [publicSlug]);

  function handleLogout() {
    logoutRequest();
    setUser(null);
    setView("dashboard");
  }

  const content = useMemo(() => {
    if (!user) return null;
    if (user.role === "SUPER_ADMIN") {
      if (view === "businesses") return <Businesses setPublicSlug={setPublicSlug} setQrBusiness={setQrBusiness} />;
      if (view === "merchants") return <Merchants />;
      if (view === "payments") return <Payments />;
      return <AdminDashboard setPublicSlug={setPublicSlug} />;
    }
    if (view === "products") return <Products user={user} />;
    return <MerchantDashboard user={user} setView={setView} setPublicSlug={setPublicSlug} setQrBusiness={setQrBusiness} />;
  }, [user, view]);

  if (publicSlug) {
    return (
      <>
        <PublicCatalogue slug={publicSlug} onBack={() => setPublicSlug(null)} setQrBusiness={setQrBusiness} />
        {qrBusiness ? <QRModal business={qrBusiness} onClose={() => setQrBusiness(null)} /> : null}
      </>
    );
  }

  if (!user) return <LoginView onLogin={setUser} />;

  return (
    <>
      <Shell user={user} view={view} setView={setView} onLogout={handleLogout}>
        {content}
      </Shell>
      {qrBusiness ? <QRModal business={qrBusiness} onClose={() => setQrBusiness(null)} /> : null}
    </>
  );
}
