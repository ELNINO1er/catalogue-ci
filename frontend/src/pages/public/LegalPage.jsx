import { Fragment } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import cguText from "../../content/legal/cgu.md?raw";
import privacyText from "../../content/legal/confidentialite.md?raw";
import { navigate } from "../../utils/navigation";

const DOCUMENTS = { cgu: cguText, privacy: privacyText };

// Mise en forme du texte en ligne : **gras**, *italique*, [lien](/chemin).
function inline(text, keyPrefix) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) parts.push(<strong key={key} className="font-semibold text-ink-900">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("[")) {
      const [, label, href] = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      parts.push(
        <a key={key} href={href} onClick={(e) => { if (href.startsWith("/")) { e.preventDefault(); navigate(href); window.scrollTo(0, 0); } }} className="font-semibold text-brand-600 underline">
          {label}
        </a>
      );
    } else parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// Sous-ensemble de Markdown suffisant pour les textes juridiques (titres, listes,
// tableaux, citations). Produit des elements React : aucun HTML brut injecte.
function renderMarkdown(source) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    if (!line.trim()) { i++; continue; }

    if (line.startsWith("# ")) {
      blocks.push(<h1 key={key} className="font-display text-3xl font-bold text-ink-900">{line.slice(2)}</h1>);
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push(<h2 key={key} className="mt-4 font-display text-xl font-bold text-ink-900">{line.slice(3)}</h2>);
      i++;
    } else if (line.startsWith("> ")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith("> ")) quote.push(lines[i++].slice(2));
      blocks.push(<p key={key} className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">{inline(quote.join(" "), key)}</p>);
    } else if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
      const cells = (row) => row.split("|").slice(1, -1).map((c) => c.trim());
      const [head, , ...body] = rows;
      blocks.push(
        <div key={key} className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-ink-900"><tr>{cells(head).map((c, j) => <th key={j} className="px-4 py-2.5 font-semibold">{inline(c, `${key}h${j}`)}</th>)}</tr></thead>
            <tbody className="divide-y divide-surface-border">
              {body.map((row, r) => <tr key={r}>{cells(row).map((c, j) => <td key={j} className="px-4 py-2.5 text-ink-600">{inline(c, `${key}r${r}${j}`)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      );
    } else if (/^\s*(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line.trim());
      const items = [];
      while (i < lines.length && /^\s*(- |\d+\. )/.test(lines[i])) {
        const nested = /^\s{2,}/.test(lines[i]);
        items.push({ nested, text: lines[i].trim().replace(/^(- |\d+\. )/, "") });
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={key} className={`space-y-1.5 pl-5 text-ink-600 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((item, j) => <li key={j} className={item.nested ? "ml-5 list-[circle]" : ""}>{inline(item.text, `${key}l${j}`)}</li>)}
        </List>
      );
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#|>|\||\s*- |\s*\d+\. )/.test(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={key} className="leading-relaxed text-ink-600">{inline(para.join(" "), key)}</p>);
    }
  }
  return blocks;
}

export default function LegalPage({ doc, onBack }) {
  const content = DOCUMENTS[doc] || cguText;
  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink-700 shadow-card hover:text-ink-900">
            <ArrowLeft size={15} /> Retour
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white"><ShoppingBag size={16} /></div>
            <span className="font-display font-bold text-ink-900">CatalogueCI</span>
          </div>
        </div>
        <article className="card space-y-4 p-6 sm:p-10">
          {renderMarkdown(content).map((block, i) => <Fragment key={i}>{block}</Fragment>)}
        </article>
        <p className="mt-6 text-center text-xs text-ink-400">
          <a href="/cgu" onClick={(e) => { e.preventDefault(); navigate("/cgu"); }} className="hover:text-ink-700">Conditions d'utilisation</a>
          {" · "}
          <a href="/confidentialite" onClick={(e) => { e.preventDefault(); navigate("/confidentialite"); }} className="hover:text-ink-700">Confidentialite</a>
        </p>
      </div>
    </main>
  );
}
