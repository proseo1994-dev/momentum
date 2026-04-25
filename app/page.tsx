"use client";

// ─────────────────────────────────────────────────────────────────
// Momentum — app/page.tsx  v3 "Clarté au lever du jour"
// Thème clair ivoire · Fraunces display · DM Sans corps
// Scroll vertical · Hero safe-to-spend dominant
// Palette vert forêt / ambre brun / bordeaux
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');`;

// ── Design tokens — modifier ici change tout le produit ──────────
const T = {
  bg:          "#FAF8F5",
  surface:     "#FFFFFF",
  border:      "#E8E4DF",
  text1:       "#1C1917",
  text2:       "#6B6560",
  text3:       "#A09890",
  accent:      "#2D6A4F",
  accentLight: "#EAF3EE",
  warn:        "#B45309",
  warnLight:   "#FEF3C7",
  danger:      "#9B1C1C",
  dangerLight: "#FEF2F2",
  idle:        "#A09890",
};

type AffordResult = "ok" | "tight" | "no" | null;
type BudgetStatus = "idle" | "healthy" | "tight" | "deficit";

type Suggestion = {
  titre: string;
  detail: string;
  niveau: "info" | "warn" | "action";
  icone: "clock" | "scissors" | "arrow" | "check";
};

function formatEur(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) || n < 0 ? 0 : n;
}

// ── Logique d'arbitrage — fonction pure, arbre de décision ───────
function getArbitrages(p: {
  affordResult: AffordResult; reste: number; montant: number;
  nbMois: number; effortMensuel: number; margeApresEffort: number; vari: number;
}): Suggestion[] {
  const { affordResult, reste, montant, nbMois, effortMensuel, margeApresEffort, vari } = p;
  if (affordResult === null) return [];

  if (affordResult === "ok") return [{
    icone: "check",
    titre: "Ton budget absorbe cet achat sereinement.",
    detail: `Après effort d'épargne, il te restera ${formatEur(margeApresEffort)}/mois. Rien à ajuster.`,
    niveau: "info",
  }];

  if (affordResult === "tight") {
    const s: Suggestion[] = [];
    const moisSupp = nbMois + 2;
    const effortReduit = Math.round(montant / moisSupp);
    s.push({ icone: "clock", niveau: "warn",
      titre: `Décaler de 2 mois`,
      detail: `Sur ${moisSupp} mois, l'effort passe à ${formatEur(effortReduit)}/mois. Ta marge remonte à ${formatEur(reste - effortReduit)}.`,
    });
    if (vari > 0) {
      const cut = Math.round(vari * 0.15);
      s.push({ icone: "scissors", niveau: "action",
        titre: `Réduire le variable de 15 %`,
        detail: `${formatEur(cut)}/mois économisés suffisent (marge finale : ${formatEur(margeApresEffort + cut)}).`,
      });
    }
    return s;
  }

  const s: Suggestion[] = [];
  const moisNec = reste > 0 ? Math.ceil(montant / reste) : null;
  if (moisNec && moisNec <= 36) s.push({ icone: "clock", niveau: "action",
    titre: `Allonger à ${moisNec} mois`,
    detail: `L'effort mensuel descend à ${formatEur(Math.round(montant / moisNec))} — exactement ton disponible actuel.`,
  });
  const montantMax = reste * nbMois;
  if (montantMax > 0) s.push({ icone: "arrow", niveau: "warn",
    titre: `Viser ${formatEur(montantMax)}`,
    detail: `Maximum atteignable en ${nbMois} mois avec ${formatEur(reste)}/mois disponible.`,
  });
  if (vari > 0) {
    const cut = Math.min(effortMensuel - reste, vari);
    const pct = Math.round((cut / vari) * 100);
    s.push({ icone: "scissors", niveau: "action",
      titre: `Réduire le variable de ${pct} %`,
      detail: `Couper ${formatEur(cut)}/mois sur tes dépenses variables comblerait exactement le manque.`,
    });
  }
  return s;
}

function Icone({ nom, color }: { nom: Suggestion["icone"]; color: string }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (nom === "clock")    return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (nom === "scissors") return <svg {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>;
  if (nom === "arrow")    return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
  return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
}

export default function Page() {
  const [revenu,       setRevenu]       = useState("");
  const [charges,      setCharges]      = useState("");
  const [variable,     setVariable]     = useState("");
  const [achatMontant, setAchatMontant] = useState("");
  const [achatMois,    setAchatMois]    = useState("3");

  const rev  = parseNum(revenu);
  const chg  = parseNum(charges);
  const vari = parseNum(variable);

  const reste            = rev - chg - vari;
  const tauxDepense      = rev > 0 ? Math.min(((chg + vari) / rev) * 100, 100) : 0;
  const montant          = parseNum(achatMontant);
  const nbMois           = parseInt(achatMois) || 1;
  const effortMensuel    = nbMois > 0 ? Math.round(montant / nbMois) : montant;
  const margeApresEffort = reste - effortMensuel;

  function getBudgetStatus(): BudgetStatus {
    if (rev === 0)          return "idle";
    if (reste >= rev * 0.2) return "healthy";
    if (reste >= 0)         return "tight";
    return "deficit";
  }
  const budgetStatus = getBudgetStatus();

  function getAffordResult(): AffordResult {
    if (montant <= 0 || rev === 0) return null;
    if (margeApresEffort >= 0)     return "ok";
    if (Math.abs(margeApresEffort) < reste * 0.3) return "tight";
    return "no";
  }
  const affordResult = getAffordResult();
  const arbitrages   = getArbitrages({ affordResult, reste, montant, nbMois, effortMensuel, margeApresEffort, vari });

  // Tokens visuels par statut budget
  const statusTokens: Record<BudgetStatus, { color: string; bg: string; label: string; bar: string }> = {
    idle:    { color: T.idle,   bg: T.surface,     label: "Remplis tes revenus ci-dessus.",          bar: T.border },
    healthy: { color: T.accent, bg: T.accentLight, label: "Ta marge est confortable.",               bar: T.accent },
    tight:   { color: T.warn,   bg: T.warnLight,   label: "Budget serré — surveille tes variables.", bar: T.warn   },
    deficit: { color: T.danger, bg: T.dangerLight, label: "Dépenses supérieures au revenu.",         bar: T.danger },
  };
  const tok = statusTokens[budgetStatus];

  // Tokens visuels par verdict simulateur
  const affordTokens = {
    ok:    { color: T.accent, bg: T.accentLight, border: "#86EFAC",
             verdict: "Oui, c'est faisable.",
             detail:  `En épargnant ${formatEur(effortMensuel)}/mois pendant ${nbMois} mois, il te restera ${formatEur(margeApresEffort)} disponible.` },
    tight: { color: T.warn,  bg: T.warnLight,   border: "#FCD34D",
             verdict: "C'est serré, mais possible.",
             detail:  `L'effort requis est ${formatEur(effortMensuel)}/mois. Ta marge serait réduite à ${formatEur(margeApresEffort)}.` },
    no:    { color: T.danger, bg: T.dangerLight, border: "#FCA5A5",
             verdict: "Pas dans ces conditions.",
             detail:  `Il te faudrait ${formatEur(effortMensuel)}/mois, mais ton disponible est ${formatEur(reste)}.` },
  };

  return (
    <>
      <style>{FONT_IMPORT}{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: T.text1 }}>

        {/* ── En-tête ──────────────────────────────────────────── */}
        <header style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 19V3l8 8 8-8v16" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: T.text1, letterSpacing: "-0.3px" }}>
              Momentum
            </span>
            <span style={{ fontSize: 12, color: T.text3, fontWeight: 300, marginLeft: 2 }}>plan with clarity</span>
          </div>
        </header>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 24px 64px" }}>

          {/* ── SECTION 1 — BUDGET MENSUEL ────────────────────── */}
          <SectionLabel>Budget mensuel</SectionLabel>

          <Card>
            <InputRow label="Revenu mensuel"  hint="net après impôts"      value={revenu}   onChange={setRevenu}   placeholder="2 500" />
            <Divider />
            <InputRow label="Charges fixes"   hint="loyer, assurances…"    value={charges}  onChange={setCharges}  placeholder="900" />
            <Divider />
            <InputRow label="Budget variable" hint="courses, restaurants…" value={variable} onChange={setVariable} placeholder="400" />
          </Card>

          {/* Hero — Reste à dépenser */}
          <div style={{ background: tok.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: "28px 24px 22px", marginTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: T.text3, marginBottom: 8 }}>
              Reste à dépenser
            </p>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 52, fontWeight: 600, lineHeight: 1, color: rev > 0 ? tok.color : T.text3, letterSpacing: "-1px", marginBottom: 8 }}>
              {rev > 0 ? formatEur(reste) : "—"}
            </p>
            <p style={{ fontSize: 13, color: T.text2, fontWeight: 300, marginBottom: rev > 0 ? 20 : 0 }}>{tok.label}</p>
            {rev > 0 && (
              <div>
                <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${tauxDepense}%`, background: tok.bar, borderRadius: 2, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: T.text3 }}>0 €</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>{Math.round(tauxDepense)} % utilisé</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>{formatEur(rev)}</span>
                </div>
              </div>
            )}
          </div>

          {rev > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <SmallTile label="Charges fixes"   value={formatEur(chg)}  />
              <SmallTile label="Budget variable" value={formatEur(vari)} />
            </div>
          )}

          {/* ── SECTION 2 — PUIS-JE ME LE PERMETTRE ? ─────────── */}
          <SectionLabel style={{ marginTop: 40 }}>Puis-je me le permettre ?</SectionLabel>

          <Card>
            {rev === 0 && (
              <p style={{ fontSize: 13, color: T.text3, fontWeight: 300, padding: "14px 20px 6px" }}>
                Remplis d'abord ton budget mensuel pour activer le simulateur.
              </p>
            )}
            <InputRow label="Montant du projet" hint="achat, voyage, équipement…" value={achatMontant} onChange={setAchatMontant} placeholder="1 200" disabled={rev === 0} />
            <Divider />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
              <div>
                <p style={{ fontSize: 14, color: T.text1 }}>Durée pour économiser</p>
                <p style={{ fontSize: 11, color: T.text3, marginTop: 2, fontWeight: 300 }}>en mois</p>
              </div>
              <select value={achatMois} onChange={e => setAchatMois(e.target.value)} disabled={rev === 0}
                style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 14, color: T.text1, fontFamily: "'DM Sans', sans-serif", opacity: rev === 0 ? 0.4 : 1, outline: "none", cursor: rev === 0 ? "not-allowed" : "pointer" }}>
                {[1, 2, 3, 6, 12, 24].map(m => <option key={m} value={m}>{m} mois</option>)}
              </select>
            </div>
            {montant > 0 && rev > 0 && (
              <div style={{ margin: "0 20px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.text3 }}>Effort mensuel requis</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: T.text1 }}>
                  {formatEur(effortMensuel)}<span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: T.text2 }}> /mois</span>
                </span>
              </div>
            )}
          </Card>

          {affordResult && (() => {
            const cfg = affordTokens[affordResult];
            return (
              <div style={{ marginTop: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 16, padding: 20 }}>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: cfg.color, marginBottom: 6 }}>{cfg.verdict}</p>
                <p style={{ fontSize: 13, color: T.text2, fontWeight: 300, lineHeight: 1.6 }}>{cfg.detail}</p>
              </div>
            );
          })()}

          {/* ── SECTION 3 — ARBITRAGES POSSIBLES ─────────────── */}
          {arbitrages.length > 0 && (
            <>
              <SectionLabel style={{ marginTop: 40 }}>Arbitrages possibles</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {arbitrages.map((s, i) => {
                  const iconeColor = s.niveau === "warn" ? T.warn : T.accent;
                  const iconeBg    = s.niveau === "warn" ? T.warnLight : T.accentLight;
                  return (
                    <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: iconeBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Icone nom={s.icone} color={iconeColor} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: T.text1, marginBottom: 3 }}>{s.titre}</p>
                        <p style={{ fontSize: 12, color: T.text2, fontWeight: 300, lineHeight: 1.6 }}>{s.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, padding: "13px 16px", background: T.accentLight, borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <Icone nom="check" color={T.accent} />
                <p style={{ fontSize: 12, color: T.accent, fontWeight: 400, lineHeight: 1.5 }}>
                  Ces pistes sont basées sur ton budget réel. Tu as la clarté pour décider.
                </p>
              </div>
            </>
          )}

          <footer style={{ marginTop: 48, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: T.text3, fontWeight: 300 }}>
              Momentum · Données locales uniquement · Aucune banque connectée
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

// ── Composants UI ─────────────────────────────────────────────────

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text3, marginBottom: 12, ...style }}>
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.border}`, borderRadius: 20, display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.border, margin: "0 20px" }} />;
}

type InputRowProps = {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
};

function InputRow({ label, hint, value, onChange, placeholder, disabled }: InputRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", gap: 16, opacity: disabled ? 0.4 : 1 }}>
      <div>
        <p style={{ fontSize: 14, color: T.text1 }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: T.text3, marginTop: 2, fontWeight: 300 }}>{hint}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input type="number" min="0" value={value} placeholder={placeholder} disabled={disabled}
          onChange={e => onChange(e.target.value)}
          onFocus={e => (e.target.style.borderColor = T.accent)}
          onBlur={e  => (e.target.style.borderColor = T.border)}
          style={{ width: 100, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", fontSize: 15, fontFamily: "'Fraunces', serif", color: T.text1, textAlign: "right", outline: "none", transition: "border-color 0.15s" }}
        />
        <span style={{ fontSize: 13, color: T.text3 }}>€</span>
      </div>
    </div>
  );
}

function SmallTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 16px" }}>
      <p style={{ fontSize: 11, color: T.text3, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontFamily: "'Fraunces', serif", fontWeight: 600, color: T.text1 }}>{value}</p>
    </div>
  );
}
