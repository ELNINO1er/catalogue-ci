// Application Express (routes, securite). Le demarrage (base, port) est dans server.js,
// ce qui permet aux tests de charger exactement la meme application.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const publicRoutes = require("./routes/publicRoutes");
const productRoutes = require("./routes/productRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const customFieldRoutes = require("./routes/customFieldRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const merchantPortalRoutes = require("./routes/merchantPortalRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const waveWebhookController = require("./controllers/waveWebhookController");

const app = express();
app.disable("x-powered-by");

// En-tetes de securite. La CSP autorise uniquement ce dont l'application a besoin :
// polices Google, images https (logos externes) et styles inline (graphiques).
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": process.env.FORCE_HTTPS === "true" ? [] : null,
    },
  },
  // Les images /uploads sont lues par le front (meme site en dev : ports differents).
  crossOriginResourcePolicy: { policy: "same-site" },
}));

// Redirection HTTP -> HTTPS, a activer seulement si l'hebergeur transmet X-Forwarded-Proto
// (sinon boucle de redirection).
if (process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS === "true") {
  app.use((req, res, next) => {
    if (req.secure) return next();
    return res.redirect(301, `https://${req.get("host")}${req.originalUrl}`);
  });
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  // In production, frontend is served by the same Express server — no CORS needed
  // But allow the configured CLIENT_URL just in case
  app.use(cors({
    origin: [process.env.CLIENT_URL, "https://catalogue-ci.mhtechconsulting.com"].filter(Boolean),
    credentials: true,
  }));
} else {
  // In development, allow localhost origins
  const devOrigins = new Set([
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || devOrigins.has(origin)) return callback(null, true);
      // Vite change de port (5174, 5175...) si 5173 est deja pris
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      // Allow LAN IPs for mobile testing
      if (/^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[0-1]))\.\d{1,3}\.\d{1,3}:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error(`Origin CORS non autorisee: ${origin}`));
    },
  }));
}
app.post("/api/wave/webhook", express.raw({ type: "application/json" }), waveWebhookController.handle);
app.use(express.json({ limit: "100kb" }));
// Seules les images sont servies depuis /uploads (jamais de HTML ou de script).
app.use("/uploads", (req, res, next) => {
  if (!/\.(jpe?g|png|webp|gif)$/i.test(req.path)) return res.status(404).end();
  next();
}, express.static(path.join(__dirname, "../uploads"), { dotfiles: "deny", index: false }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));


app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", productRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/payment-methods", paymentRoutes);
app.use("/api", trackingRoutes);
app.use("/api", customFieldRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentSettingsRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/merchant", merchantPortalRoutes);
app.use("/api/merchant/onboarding", onboardingRoutes);

// ─── Production: serve React frontend ───
const frontendDist = path.join(__dirname, "../public");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDist));
}

// API 404 — only for /api/* routes
app.use("/api", (req, res) => res.status(404).json({ success: false, message: "Route API introuvable." }));

// SPA fallback — serve React index.html for all other routes
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(errorHandler);

module.exports = app;
