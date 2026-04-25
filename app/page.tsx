"use client";

// ─────────────────────────────────────────────────────────────────
// Momentum — app/page.tsx
// Budget mensuel + simulateur "Puis-je me le permettre ?"
//
// Stack : Next.js 14 App Router · React · Tailwind CSS
// Pas de backend, pas d'auth, pas de sync bancaire.
// Tout l'état vit dans useState — simple et lisible.
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────

// Représente l'état du simulateur d'achat
type AffordResult = "ok" | "tight" | "no" | null;

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Formate un nombre en euros (style français).
 * Ex : 1500 → "1 500 €"
 */
function formatEur(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

/**
 * Parse une chaîne en nombre, retourne 0 si invalide.
 * Sécurise les inputs utilisateur avant tout calcul.
 */
function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) || n < 0 ? 0 : n;
}

// ── Composant principal ──────────────────────────────────────────

export default function Page() {

  // ── État — Budget mensuel ──────────────────────────────────────
  // Chaque champ est stocké en string (valeur brute du <input>)
  // pour permettre la frappe libre, puis parsé au moment du calcul.

  const [revenu, setRevenu] = useState("");
  const [charges, setCharges] = useState("");
  const [variable, setVariable] = useState("");

  // ── État — Simulateur d'achat ──────────────────────────────────

  const [achatMontant, setAchatMontant] = useState("");
  const [achatMois, setAchatMois] = useState("3");

  // ── Calculs dérivés ───────────────────────────────────────────
  // Ces valeurs sont recalculées à chaque rendu — pas besoin de les
  // stocker dans useState (elles dépendent déjà d'un état existant).

  const rev = parseNum(revenu);
  const chg = parseNum(charges);
  const vari = parseNum(variable);

  // Reste à dépenser = revenu - charges fixes - budget variable
  const reste = rev - chg - vari;

  // Taux d'utilisation du revenu (pour la barre de progression)
  const tauxDepense = rev > 0 ? Math.min(((chg + vari) / rev) * 100, 100) : 0;

  // ── Logique budget : quelle couleur/message afficher ? ─────────
  // On distingue 3 états : pas encore rempli / sain / serré / déficit.

  type BudgetStatus = "idle" | "healthy" | "tight" | "deficit";

  function getBudgetStatus(): BudgetStatus {
    if (rev === 0) return "idle";
    if (reste >= rev * 0.2) return "healthy";  // > 20 % de marge → sain
    if (reste >= 0) return "tight";             // marge positive mais faible
    return "deficit";                           // dépenses > revenu
  }

  const budgetStatus = getBudgetStatus();

  // Couleur de la valeur "Reste à dépenser" selon l'état
  const resteColor: Record<BudgetStatus, string> = {
    idle: "text-zinc-400",
    healthy: "text-emerald-400",
    tight: "text-amber-400",
    deficit: "text-red-400",
  };

  // Message contextuel sous le montant restant
  const resteMessage: Record<BudgetStatus, string> = {
    idle: "Remplis tes revenus et dépenses ci-dessus.",
    healthy: "Ta marge est confortable. Bien joué.",
    tight: "Budget serré — surveille tes dépenses variables.",
    deficit: "Tes dépenses dépassent tes revenus ce mois-ci.",
  };

  // Couleur de la barre de progression
  const barColor: Record<BudgetStatus, string> = {
    idle: "bg-zinc-600",
    healthy: "bg-emerald-500",
    tight: "bg-amber-400",
    deficit: "bg-red-500",
  };

  // ── Logique simulateur d'achat ────────────────────────────────

  const montant = parseNum(achatMontant);
  const nbMois = parseInt(achatMois) || 1;

  // Effort mensuel nécessaire pour atteindre l'objectif
  const effortMensuel = nbMois > 0 ? Math.round(montant / nbMois) : montant;

  // Marge restante après l'effort d'épargne
  const margeApresEffort = reste - effortMensuel;

  function getAffordResult(): AffordResult {
    if (montant <= 0 || rev === 0) return null;
    if (margeApresEffort >= 0) return "ok";
    if (Math.abs(margeApresEffort) < reste * 0.3) return "tight";
    return "no";
  }

  const affordResult = getAffordResult();

  // Textes du simulateur selon le résultat
  const affordConfig = {
    ok: {
      label: "Oui, c'est faisable.",
      detail: `En mettant de côté ${formatEur(effortMensuel)}/mois pendant ${nbMois} mois, il te restera ${formatEur(margeApresEffort)} disponible chaque mois.`,
      border: "border-emerald-800",
      bg: "bg-emerald-950",
      titleColor: "text-emerald-400",
      textColor: "text-emerald-300",
    },
    tight: {
      label: "C'est serré, mais possible.",
      detail: `Il te faudrait économiser ${formatEur(effortMensuel)}/mois. Ta marge serait réduite à ${formatEur(margeApresEffort)}. Envisage de réduire quelques postes variables.`,
      border: "border-amber-800",
      bg: "bg-amber-950",
      titleColor: "text-amber-400",
      textColor: "text-amber-300",
    },
    no: {
      label: "Pas dans ces conditions.",
      detail: `Il te faudrait ${formatEur(effortMensuel)}/mois, mais ton disponible actuel est de ${formatEur(reste)}. Allonge la durée ou ajuste le montant.`,
      border: "border-red-900",
      bg: "bg-red-950",
      titleColor: "text-red-400",
      textColor: "text-red-300",
    },
  };

  // ── Rendu ─────────────────────────────────────────────────────

  return (
    // Fond sombre — toute la page
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-12">

      {/* Conteneur centré — largeur max pour la lisibilité */}
      <div className="max-w-md mx-auto space-y-6">

        {/* ── En-tête ─────────────────────────────────────────── */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Momentum
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-light">
            Planification budgétaire · MVP
          </p>
        </header>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 1 — BUDGET MENSUEL                            */}
        {/* ══════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-4">
            Budget mensuel
          </h2>

          {/* Carte principale — 3 champs de saisie */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">

            {/* Champ : Revenu mensuel */}
            <InputField
              label="Revenu mensuel"
              value={revenu}
              onChange={setRevenu}
              placeholder="ex. 2 500"
              hint="net après impôts"
            />

            {/* Séparateur visuel */}
            <div className="border-t border-zinc-800" />

            {/* Champ : Charges fixes */}
            <InputField
              label="Charges fixes"
              value={charges}
              onChange={setCharges}
              placeholder="ex. 900"
              hint="loyer, assurances, abonnements"
            />

            {/* Champ : Budget variable */}
            <InputField
              label="Budget variable"
              value={variable}
              onChange={setVariable}
              placeholder="ex. 400"
              hint="courses, restaurants, loisirs"
            />
          </div>

          {/* ── Résultat : Reste à dépenser ───────────────────── */}
          {/* Toujours visible, change de couleur selon le statut  */}
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

            {/* Label discret */}
            <p className="text-xs text-zinc-500 mb-1 font-light">
              Reste à dépenser
            </p>

            {/* Montant — grande typo, couleur conditionnelle */}
            <p className={`text-4xl font-semibold tabular-nums ${resteColor[budgetStatus]}`}>
              {rev > 0 ? formatEur(reste) : "—"}
            </p>

            {/* Message contextuel */}
            <p className="text-xs text-zinc-500 mt-2 font-light">
              {resteMessage[budgetStatus]}
            </p>

            {/* Barre de progression — taux d'utilisation du revenu */}
            {rev > 0 && (
              <div className="mt-4">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor[budgetStatus]}`}
                    style={{ width: `${tauxDepense}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1 text-right">
                  {Math.round(tauxDepense)} % du revenu utilisé
                </p>
              </div>
            )}
          </div>

          {/* Résumé rapide — 2 métriques côte à côte */}
          {rev > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MetricTile label="Charges fixes" value={formatEur(chg)} />
              <MetricTile label="Budget variable" value={formatEur(vari)} />
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 2 — PUIS-JE ME LE PERMETTRE ?                */}
        {/* ══════════════════════════════════════════════════════ */}
        <section className="pt-2">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-4">
            Puis-je me le permettre ?
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">

            {/* Avertissement si le budget n'est pas encore rempli */}
            {rev === 0 && (
              <p className="text-xs text-zinc-500 font-light">
                Remplis d'abord ton budget mensuel pour activer le simulateur.
              </p>
            )}

            {/* Champ : montant de l'achat */}
            <InputField
              label="Montant du projet"
              value={achatMontant}
              onChange={setAchatMontant}
              placeholder="ex. 1 200"
              hint="achat, voyage, équipement…"
              disabled={rev === 0}
            />

            {/* Sélecteur : durée d'épargne */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Durée pour économiser</p>
                <p className="text-xs text-zinc-600 mt-0.5">en mois</p>
              </div>
              <select
                value={achatMois}
                onChange={(e) => setAchatMois(e.target.value)}
                disabled={rev === 0}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-zinc-500 disabled:opacity-30"
              >
                {[1, 2, 3, 6, 12, 24].map((m) => (
                  <option key={m} value={m}>
                    {m} mois
                  </option>
                ))}
              </select>
            </div>

            {/* Effort mensuel calculé — affiché si montant rempli */}
            {montant > 0 && rev > 0 && (
              <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-zinc-400">Effort mensuel requis</p>
                <p className="text-sm font-medium text-zinc-200 tabular-nums">
                  {formatEur(effortMensuel)} / mois
                </p>
              </div>
            )}
          </div>

          {/* ── Verdict ─────────────────────────────────────────── */}
          {/* S'affiche uniquement quand le calcul peut se faire    */}
          {affordResult && (() => {
            const cfg = affordConfig[affordResult];
            return (
              <div className={`mt-3 border ${cfg.border} ${cfg.bg} rounded-2xl p-5`}>
                <p className={`text-lg font-semibold ${cfg.titleColor}`}>
                  {cfg.label}
                </p>
                <p className={`text-sm font-light mt-1 leading-relaxed ${cfg.textColor}`}>
                  {cfg.detail}
                </p>
              </div>
            );
          })()}
        </section>

        {/* Footer discret */}
        <footer className="pt-4 text-center">
          <p className="text-xs text-zinc-700">Momentum · MVP · Données locales uniquement</p>
        </footer>

      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANT : InputField
// Champ de saisie réutilisable avec label, hint et suffix "€".
// Séparé en composant pour éviter la répétition et rester lisible.
// ─────────────────────────────────────────────────────────────────

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
};

function InputField({ label, value, onChange, placeholder, hint, disabled }: InputFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">

      {/* Partie gauche : label + hint */}
      <div className="min-w-0">
        <p className="text-sm text-zinc-300">{label}</p>
        {hint && <p className="text-xs text-zinc-600 mt-0.5 font-light">{hint}</p>}
      </div>

      {/* Partie droite : input + symbole € */}
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="
            w-28 bg-zinc-800 border border-zinc-700 rounded-lg
            px-3 py-2 text-right text-sm text-zinc-100
            tabular-nums outline-none
            focus:border-zinc-500
            placeholder:text-zinc-600
            disabled:opacity-30
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
          "
        />
        <span className="text-zinc-500 text-sm">€</span>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANT : MetricTile
// Petite tuile de résumé pour afficher une valeur labellisée.
// Utilisée pour le résumé "charges fixes / budget variable".
// ─────────────────────────────────────────────────────────────────

type MetricTileProps = {
  label: string;
  value: string;
};

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-base font-medium text-zinc-200 tabular-nums">{value}</p>
    </div>
  );
}

