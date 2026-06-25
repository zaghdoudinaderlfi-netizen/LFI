"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, GraduationCap, Moon, Sun } from "lucide-react";

/* ── Palette arcade (toujours sombre — fenêtre terminal) ─── */
const INK = "#15103a";
const INK2 = "#1d1652";
const INK3 = "#291f6e";
const LINE = "#3a2f85";
const TXT = "#f4f1ff";
const MUTED = "#a99fe0";
const TECHNO = "#ffb13d";
const SNT = "#3dd6f5";
const NSI = "#ff5da2";
const BG = "#0d0926";

const PHRASES = ["bienvenue.py", "prof_nader@plateforme:~$", "prêt à coder ?"];

const FEATURES = [
  { icon: "▶", bg: NSI,       label: "Code en ligne",        desc: "Écris et exécute du Python dans ton navigateur. Rien à installer, jamais.",  badge: "+ Skulpt" },
  { icon: "⚡", bg: SNT,       label: "Branche tes montages",  desc: "Simule Arduino et micro:bit en direct, comme sur la vraie carte.",           badge: "+ Wokwi" },
  { icon: "◈", bg: TECHNO,    label: "Cours interactifs",     desc: "Des leçons claires avec des schémas qui bougent quand tu cliques.",          badge: "+ animations" },
  { icon: "✓", bg: "#b6f09c", label: "Exos auto-corrigés",   desc: "Tu te trompes, tu recommences, tu progresses. Feedback immédiat.",           badge: "+ correction" },
  { icon: "⚔", bg: "#c89bff", label: "Duels & quiz",          desc: "Défie tes potes en 1 contre 1 et grimpe dans le classement.",               badge: "+ 1v1" },
  { icon: "★", bg: "#ff8d6b", label: "Ta progression",        desc: "Gagne de l'XP, débloque des badges et passe au niveau supérieur.",          badge: "+ XP & badges" },
];

const CARTOUCHES = [
  { tag: "// matière_01", title: "Technologie", desc: "Montages, micro:bit et objets connectés — tu branches, tu testes, ça marche.", glyph: "⚙",   color: TECHNO, spin: true  },
  { tag: "// matière_02", title: "SNT",          desc: "Web, données, réseaux sociaux et géolocalisation expliqués pour de vrai.",    glyph: "🌐",  color: SNT,    spin: false },
  { tag: "// matière_03", title: "NSI",          desc: "Python, algorithmes et projets : du premier print() au vrai code.",           glyph: "</>", color: NSI,    spin: false },
];

/* Code Python avec coloration — HTML statique, pas de saisie utilisateur */
const CODE_HTML =
  `<span style="color:${SNT}">from</span> turtle <span style="color:${SNT}">import</span> *\n` +
  `<span style="color:#6f63b0"># rosace : un classique de la NSI</span>\n` +
  `color = [<span style="color:#ff9ec9">"#ff5da2"</span>, <span style="color:#ff9ec9">"#3dd6f5"</span>, <span style="color:#ff9ec9">"#ffb13d"</span>]\n` +
  `<span style="color:${SNT}">for</span> i <span style="color:${SNT}">in</span> <span style="color:${TECHNO}">range</span>(<span style="color:#b6f09c">36</span>):\n` +
  `    <span style="color:${TECHNO}">pencolor</span>(color[i % <span style="color:#b6f09c">3</span>])\n` +
  `    <span style="color:${TECHNO}">square</span>(<span style="color:#b6f09c">120</span>)\n` +
  `    <span style="color:${TECHNO}">left</span>(<span style="color:#b6f09c">10</span>)`;

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono), monospace" };

export function LandingPage() {
  const [sombre, setSombre] = useState(true);
  const typedRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setSombre(document.documentElement.classList.contains("dark"));
  }, []);

  function basculeTheme() {
    const next = !sombre;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setSombre(next);
  }

  /* Effet machine à écrire */
  useEffect(() => {
    const el = typedRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = PHRASES[0];
      return;
    }
    let pi = 0, ci = 0, dir = 1;
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const p = PHRASES[pi];
      el!.textContent = p.slice(0, ci);
      ci += dir;
      if (ci > p.length) { dir = -1; ci = p.length; timer = setTimeout(tick, 1400); return; }
      if (ci < 0) { dir = 1; ci = 0; pi = (pi + 1) % PHRASES.length; }
      timer = setTimeout(tick, dir > 0 ? 70 : 38);
    }
    tick();
    return () => clearTimeout(timer);
  }, []);

  /* Rosace turtle SVG */
  function dessineRosace() {
    const svg = svgRef.current;
    const status = statusRef.current;
    if (!svg || !status) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const ns = "http://www.w3.org/2000/svg";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cols = [NSI, SNT, TECHNO];
    const cx = 200, cy = 200, side = 78;
    status.textContent = "exécution…";

    for (let i = 0; i < 36; i++) {
      const a = (i * 10 * Math.PI) / 180;
      const pts: [number, number][] = [];
      let px = cx, py = cy, angle = a;
      for (let s = 0; s < 4; s++) {
        const nx = px + Math.cos(angle) * side;
        const ny = py + Math.sin(angle) * side;
        pts.push([px, py], [nx, ny]);
        px = nx; py = ny; angle += Math.PI / 2;
      }
      let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let k = 1; k < pts.length; k++) d += ` L ${pts[k][0].toFixed(1)} ${pts[k][1].toFixed(1)}`;
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", cols[i % 3]);
      path.setAttribute("stroke-width", "1.4");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("opacity", "0.92");
      svg.appendChild(path);
      if (!reduce) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.style.transition = "stroke-dashoffset .5s ease-out";
        setTimeout(() => { path.style.strokeDashoffset = "0"; }, 40 * i);
      }
    }
    const done = reduce ? 200 : 40 * 36 + 500;
    setTimeout(() => {
      if (!svgRef.current || !statusRef.current) return;
      statusRef.current.textContent = "✓ terminé — 36 formes tracées";
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(cx)); dot.setAttribute("cy", String(cy));
      dot.setAttribute("r", "3.5"); dot.setAttribute("fill", TXT);
      svgRef.current.appendChild(dot);
    }, done);
  }

  useEffect(() => { dessineRosace(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen">

      {/* ═══════════════════════════════════════════
          Fenêtre arcade (hero + cartouches)
          ══════════════════════════════════════════ */}
      <div
        className="mx-auto mt-5 max-w-[1180px] overflow-hidden rounded-[20px] border-2"
        style={{
          borderColor: LINE,
          background: `linear-gradient(180deg, ${INK2}, ${INK})`,
          boxShadow: `6px 6px 0 ${BG}`,
        }}
      >
        {/* Topbar / chrome */}
        <div
          className="flex items-center gap-3.5 border-b-2 px-4 py-3"
          style={{ borderColor: LINE, background: INK3 }}
        >
          {/* Boutons trafic */}
          <div className="flex gap-[7px]">
            {[NSI, TECHNO, SNT].map((c, i) => (
              <span key={i} className="block h-[13px] w-[13px] rounded-full" style={{ background: c }} />
            ))}
          </div>
          {/* Nom de fenêtre */}
          <span className="hidden truncate text-[13px] sm:block" style={{ ...MONO, color: MUTED }}>
            prof-nader://plateforme — techno · snt · nsi
          </span>
          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={basculeTheme}
              aria-label={sombre ? "Passer au thème clair" : "Passer au thème sombre"}
              className="topbar-link flex items-center justify-center rounded-[9px] border-2 p-[7px]"
              style={{ borderColor: LINE, color: TXT }}
            >
              {sombre ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/connexion"
              className="topbar-link rounded-[9px] border-2 px-3.5 py-[7px] text-[13px]"
              style={{ ...MONO, borderColor: LINE, color: TXT }}
            >
              ▸ Se connecter
            </Link>
          </div>
        </div>

        {/* Héros */}
        <section className="grid grid-cols-1 items-center gap-9 px-6 pb-10 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-9 lg:px-10">
          {/* Gauche : texte + CTA */}
          <div>
            <span
              className="mb-5 inline-flex items-center gap-[9px] rounded-full border-2 px-3.5 py-[6px]"
              style={{ borderColor: LINE, background: INK3 }}
            >
              <span className="inline-block h-4 w-[9px] animate-blink" style={{ background: SNT }} />
              <span ref={typedRef} className="text-[14px]" style={{ ...MONO, color: SNT }}>
                démarrage…
              </span>
            </span>

            <h1
              className="mb-4 font-heading text-[clamp(42px,6.4vw,76px)] font-bold leading-[.98] tracking-[-0.02em]"
              style={{ color: TXT }}
            >
              <span style={{ color: NSI }}>Code.</span>{" "}
              <span style={{ color: TECHNO }}>Construis.</span>{" "}
              <span style={{ color: SNT }}>Explore.</span>
            </h1>

            <p className="mb-7 max-w-[42ch] text-[18px] leading-relaxed" style={{ color: MUTED }}>
              Plateforme pédagogique de{" "}
              <strong style={{ color: TXT }}>Technologie</strong>,{" "}
              <strong style={{ color: TXT }}>SNT</strong> &amp;{" "}
              <strong style={{ color: TXT }}>NSI</strong>{" "}
              : cours, exercices interactifs et codage en ligne —{" "}
              <strong style={{ color: TXT }}>directement dans ton navigateur</strong>.
            </p>

            <div className="flex flex-wrap gap-3.5">
              <button
                type="button"
                className="btn-arcade cursor-pointer rounded-[13px] border-2 px-[22px] py-3.5 font-heading text-[16px] font-bold"
                style={{ background: NSI, color: "#1a0a14", borderColor: BG }}
                onClick={() => {
                  dessineRosace();
                  svgRef.current?.parentElement?.scrollIntoView({ block: "center" });
                }}
              >
                ▶ Lancer un cours
              </button>
              <a
                href="#fonctionnalites"
                className="btn-arcade rounded-[13px] border-2 px-[22px] py-3.5 font-heading text-[16px] font-bold"
                style={{ background: INK3, color: TXT, borderColor: LINE }}
              >
                Découvrir
              </a>
            </div>
          </div>

          {/* Droite : éditeur + canvas */}
          <div>
            {/* Éditeur de code */}
            <div
              className="overflow-hidden rounded-[14px] border-2"
              style={{ borderColor: LINE, background: "#120d33", boxShadow: `6px 6px 0 ${BG}` }}
            >
              {/* Onglets */}
              <div className="flex border-b-2 text-[12px]" style={{ ...MONO, borderColor: LINE }}>
                <span
                  className="border-b-2 bg-[#190f3f] px-3.5 py-2"
                  style={{ color: NSI, borderBottomColor: NSI, marginBottom: "-2px" }}
                >
                  dessin.py
                </span>
                <span className="px-3.5 py-2" style={{ color: MUTED }}>cours.md</span>
                <span className="px-3.5 py-2" style={{ color: MUTED }}>quiz.py</span>
              </div>
              {/* Code */}
              <pre
                className="overflow-x-auto px-4 pb-2 pt-4 text-[13.5px] leading-[1.7]"
                style={{ ...MONO, color: "#cdc6f5" }}
                dangerouslySetInnerHTML={{ __html: CODE_HTML }}
              />
              {/* Runbar */}
              <div className="flex items-center gap-2.5 px-4 pb-3.5 pt-2.5">
                <button
                  type="button"
                  onClick={dessineRosace}
                  className="btn-editor cursor-pointer rounded-[9px] border-2 px-4 py-2 text-[13px] font-bold"
                  style={{ ...MONO, background: NSI, color: "#1a0a14", borderColor: BG }}
                >
                  ▶ Exécuter
                </button>
                <span ref={statusRef} className="text-[12px]" style={{ ...MONO, color: MUTED }}>
                  prêt.
                </span>
              </div>
            </div>

            {/* Canvas SVG rosace */}
            <div
              className="relative mt-3.5 aspect-square overflow-hidden rounded-[14px] border-2"
              style={{ borderColor: LINE, background: "#0e0a2a", boxShadow: `6px 6px 0 ${BG}` }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)" }}
              />
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="block h-full w-full"
                aria-label="Sortie du programme : rosace"
              />
              <span
                className="absolute bottom-3 left-3.5 text-[11px]"
                style={{ ...MONO, color: MUTED }}
              >
                › sortie de dessin.py
              </span>
            </div>
          </div>
        </section>

        {/* Cartouches Techno / SNT / NSI */}
        <div className="grid grid-cols-1 gap-[18px] px-6 pb-11 pt-1.5 sm:grid-cols-3 lg:px-10">
          {CARTOUCHES.map((c) => (
            <div
              key={c.title}
              className="cart-arcade relative cursor-default overflow-hidden rounded-[16px] border-2 border-t-[5px] p-[22px]"
              style={{ borderColor: LINE, borderTopColor: c.color, background: INK2 }}
            >
              <span
                className={`cart-glyph not-italic absolute -right-2.5 -top-3 text-[78px] leading-none opacity-[.14] ${c.spin ? "animate-spin [animation-duration:6s]" : ""}`}
              >
                {c.glyph}
              </span>
              <div className="text-[12px] tracking-[.04em]" style={{ ...MONO, color: c.color }}>
                {c.tag}
              </div>
              <h3 className="my-[6px] font-heading text-[24px] font-bold" style={{ color: c.color }}>
                {c.title}
              </h3>
              <p className="text-[14px]" style={{ color: MUTED }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Fonctionnalités
          ══════════════════════════════════════════ */}
      <section id="fonctionnalites" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-8">
            <span className="eyebrow">// fonctionnalités</span>
            <h2 className="page-title mt-3">
              Tout pour apprendre la Technologie,{" "}
              <span className="block sm:inline">la SNT &amp; la <em className="not-italic text-neon-cyan">NSI</em>.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="card-interactive flex flex-col gap-3 p-6">
                <div
                  className="flex h-[50px] w-[50px] items-center justify-center rounded-[12px] border-2 text-[22px]"
                  style={{ background: f.bg, borderColor: BG, boxShadow: `3px 3px 0 ${BG}` }}
                >
                  {f.icon}
                </div>
                <h4 className="section-title">{f.label}</h4>
                <p className="text-sm text-ink-secondary">{f.desc}</p>
                <span className="mt-2 inline-block self-start rounded-[7px] border border-dashed border-space-border px-2.5 py-1 text-[11px] text-ink-muted" style={MONO}>
                  {f.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          À propos
          ══════════════════════════════════════════ */}
      <section id="a-propos" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="card grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[280px_1fr] lg:items-start">
            <div className="mx-auto flex aspect-square w-48 shrink-0 items-center justify-center rounded-2xl border border-space-border bg-gradient-to-br from-space-surface2 to-space-deep shadow-glow-soft sm:w-56 lg:mx-0 lg:w-full">
              <GraduationCap className="h-16 w-16 text-neon-cyan/70" />
            </div>
            <div>
              <p className="eyebrow">À propos</p>
              <h2 className="page-title mt-2">Nader Zaghdoudi</h2>
              <p className="mt-1 text-sm font-medium text-ink-secondary">
                Professeur de Technologie, SNT &amp; NSI · Ingénieur en Génie Électrique
              </p>
              <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ink-secondary sm:text-base">
                <p>
                  Enseignant du réseau AEFE depuis plus de 10 ans, je conçois une pédagogie active où les élèves
                  apprennent en créant : robotique, programmation, intelligence artificielle et développement durable.
                  Spécialisé en NSI et SNT, j&apos;ai accompagné des projets élèves primés à l&apos;international — du
                  1er Prix Projet X pour un lombricomposteur connecté à un robot aquatique de dépollution marine, en
                  passant par les Trophées NSI et la First Lego League.
                </p>
                <p>
                  Ingénieur en génie électrique et doctorant en IoT et villes intelligentes, je relie en permanence le
                  terrain de la classe et la technologie de pointe. J&apos;ai créé Nadtech pour rassembler en un seul
                  espace mes cours, des activités interactives et des outils de code en ligne, et donner à chaque élève
                  les moyens de progresser à son rythme.
                </p>
              </div>
              <a
                href="https://cutt.ly/0hddRq1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-6 inline-flex items-center gap-2"
              >
                Mon profil LinkedIn
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-space-border">
        <div className="mx-auto max-w-[1180px] px-6 py-8 text-center text-[13px] text-ink-muted" style={MONO}>
          © Plateforme pédagogique — Technologie · SNT · NSI · fait avec ♥ et beaucoup de print()
        </div>
      </footer>
    </div>
  );
}
