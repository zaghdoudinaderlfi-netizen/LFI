import { readFile } from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import { MAX_COEQUIPIERS } from "./groupes";
import { EXTENSIONS_DOCUMENTS } from "./fichiers";

// Les pages d'exercices vivent hors de public/ : elles passent par la route
// /cours/[fichier], qui décide côté serveur si les corrections partent dans
// la réponse. Servies statiquement, n'importe quel élève pourrait les lire
// dans le code source de la page.
const DOSSIER_PAGES = path.join(process.cwd(), "contenu", "cours");

export function estNomPageValide(fichier: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.html$/.test(fichier);
}

export async function lirePageInteractive(fichier: string): Promise<string> {
  return readFile(path.join(DOSSIER_PAGES, fichier), "utf-8");
}

/**
 * Insère `contenu` juste avant la vraie balise `</head>` ou `</body>` de la
 * page. Plusieurs fichiers (ceux qui ouvrent une popup de résultat Turtle)
 * construisent un mini-document HTML complet dans une chaîne JS, avec leurs
 * propres `</head>`/`</body>` littéraux — un `.replace()` naïf (première
 * occurrence) tombe dedans et casse le script.
 *
 * Le vrai `</head>` est forcément le premier du fichier (le mini-document
 * embarqué est plus loin, dans le corps de la page) ; le vrai `</body>` est
 * forcément le dernier (le mini-document embarqué le précède).
 */
function injecterAvantFermeture(html: string, balise: "</head>" | "</body>", contenu: string): string {
  const index = balise === "</head>" ? html.indexOf(balise) : html.lastIndexOf(balise);
  if (index === -1) return html;
  return html.slice(0, index) + contenu + html.slice(index);
}

/**
 * Vide les blocs de correction : les solutions ne sont pas envoyées au
 * navigateur tant que le professeur ne les a pas activées. L'habillage
 * (bouton, cadenas) reste en place.
 *
 * `.correction-body` (ch1/ch2/ch3) est le contenu de la solution, imbriqué
 * dans un conteneur `.correction[data-correction]` qui porte le bouton et
 * le cadenas — seul le contenu doit être vidé. `.correction` sans
 * `data-correction` (ch4) EST directement la solution : c'est lui qu'on vide.
 */
export function retirerCorrections(html: string): string {
  const $ = cheerio.load(html);
  $(".correction-body").empty();
  $(".correction:not([data-correction])").empty();
  return $.html();
}

/** Signale à la page que les corrections sont autorisées. */
export function activerCorrections(html: string): string {
  return injecterAvantFermeture(html, "</head>", "<script>window.__CORRECTION_ACTIVE__ = true;</script>\n");
}

/**
 * Dit si le fichier contient au moins un bloc de correction masquable
 * (voir retirerCorrections ci-dessus). Sert à décider si le toggle
 * "Corrigé visible/masqué" a un quelconque effet sur ce cours — certains
 * cours HTML (quiz à révélation directe via data-quiz) n'en ont aucun.
 */
export function contientBlocsCorrection(html: string): boolean {
  const $ = cheerio.load(html);
  return $(".correction").length > 0;
}

export type ContexteEleveDepot = {
  moi: { id: string; nom: string };
  camarades: { id: string; nom: string }[];
};

/**
 * Injecte l'identité de l'élève connecté et la liste de ses camarades de
 * classe : le widget de dépôt de compte-rendu peut alors se passer de
 * saisie libre (voir __CONTEXTE_ELEVE__ dans le script du widget).
 */
export function injecterContexteEleve(html: string, contexte: ContexteEleveDepot): string {
  // Échappe "<" pour qu'aucune séquence "</script>" dans un nom ne puisse
  // casser hors du tag (les noms viennent de la base, pas de l'utilisateur
  // courant, mais un autre élève a pu saisir le sien à l'inscription).
  const json = JSON.stringify(contexte).replace(/</g, "\\u003c");
  return injecterAvantFermeture(html, "</head>", `<script>window.__CONTEXTE_ELEVE__ = ${json};</script>\n`);
}

/**
 * Injecté à la place du widget de dépôt quand `dateLimiteDepot` est dépassée
 * (voir app/cours/[fichier]/route.ts) : dit clairement que le délai est
 * passé plutôt que de faire disparaître silencieusement le formulaire.
 */
export function injecterMessageDelaiDepasse(html: string): string {
  const bloc = `
<section style="margin:40px auto;max-width:720px;padding:20px 22px;background:#121a31;border:1px solid rgba(251,113,133,.3);border-radius:14px;color:#e9eefb;font-family:system-ui,sans-serif">
  <h3 style="margin:0 0 6px;font-size:18px">📤 Déposer ton compte-rendu</h3>
  <p style="margin:0;color:#fb7185;font-size:14px">⏰ Le délai de dépôt est dépassé.</p>
</section>
`;
  return injecterAvantFermeture(html, "</body>", bloc);
}

/**
 * Bloc HTML/CSS/JS générique de dépôt de compte-rendu, injecté juste avant
 * `</body>` quand `depotActive` est activé pour le cours (voir DepotToggle
 * côté dashboard prof). Remplace le copier-coller manuel qui existait dans
 * certains fichiers : un seul bloc, indépendant de la structure de la page,
 * qui lit l'identité déjà injectée par `injecterContexteEleve` — aucune
 * saisie libre, puisque l'API exige de toute façon une session élève.
 *
 * Le widget reprend les deux capacités du bloc manuel : il joint les
 * réponses saisies dans la page (tout champ marqué `data-reponse`, libellé
 * par son `data-question`) et permet de désigner les camarades du groupe
 * parmi ceux fournis par `injecterContexteEleve`.
 *
 * Si le fichier contient déjà un widget posé à la main (ancien système,
 * `id="depotCompteRendu"`), on n'injecte rien pour éviter le doublon.
 */
export function injecterWidgetDepot(html: string, coursId: string): string {
  if (html.includes('id="depotCompteRendu"')) return html;

  const coursIdJson = JSON.stringify(coursId).replace(/</g, "\\u003c");
  const maxCoequipiersJson = JSON.stringify(MAX_COEQUIPIERS);
  const acceptFichier = [...EXTENSIONS_DOCUMENTS].map((e) => `.${e}`).join(",");

  const bloc = `
<section id="lfi-cr-widget" style="margin:40px auto;max-width:720px;padding:20px 22px;background:#121a31;border:1px solid rgba(255,255,255,.12);border-radius:14px;color:#e9eefb;font-family:system-ui,sans-serif">
  <h3 style="margin:0 0 10px;font-size:18px">📤 Déposer ton compte-rendu</h3>
  <div id="lfi-cr-locked" hidden>
    <p style="margin:0;color:#9aa7c2;font-size:14px">🔒 Connecte-toi avec ton compte élève pour déposer ton compte-rendu.</p>
  </div>
  <div id="lfi-cr-unlocked" hidden>
    <p style="margin:0 0 12px;color:#9aa7c2;font-size:14px">Tu déposes en tant que <strong id="lfi-cr-nom" style="color:#fff"></strong>. Tes réponses saisies sur la page sont envoyées avec le dépôt.</p>
    <div id="lfi-cr-groupe" hidden style="margin:0 0 14px">
      <p style="margin:0 0 6px;color:#9aa7c2;font-size:14px">Vous avez travaillé en groupe ? Cherche tes camarades (${MAX_COEQUIPIERS} maximum) :</p>
      <div style="position:relative">
        <input type="text" id="lfi-cr-recherche" placeholder="Nom d'un camarade de la classe..." autocomplete="off" style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b1020;color:#e9eefb;font:inherit">
        <div id="lfi-cr-liste" hidden style="position:absolute;z-index:5;top:calc(100% + 4px);left:0;right:0;max-height:200px;overflow-y:auto;background:#0b1020;border:1px solid rgba(255,255,255,.12);border-radius:10px"></div>
      </div>
      <div id="lfi-cr-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>
    </div>
    <div style="margin:0 0 14px">
      <label for="lfi-cr-fichier" style="display:block;margin:0 0 6px;color:#9aa7c2;font-size:14px">Joindre un fichier (optionnel — document, image...) :</label>
      <input type="file" id="lfi-cr-fichier" accept="${acceptFichier}" style="width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b1020;color:#e9eefb;font:inherit">
    </div>
    <button id="lfi-cr-btn" type="button" style="padding:10px 18px;border-radius:10px;border:1px solid #8b5cf6;background:rgba(139,92,246,.15);color:#e9eefb;font:inherit;cursor:pointer">📤 Déposer mon compte-rendu</button>
    <p id="lfi-cr-msg" role="status" style="margin:12px 0 0;font-size:14px;min-height:20px"></p>
  </div>
</section>
<script>
(function(){
  var COURS_ID = ${coursIdJson};
  var MAX_COEQUIPIERS = ${maxCoequipiersJson};
  var contexte = window.__CONTEXTE_ELEVE__ || null;
  var locked = document.getElementById('lfi-cr-locked');
  var unlocked = document.getElementById('lfi-cr-unlocked');
  var nomSpan = document.getElementById('lfi-cr-nom');
  var btn = document.getElementById('lfi-cr-btn');
  var msg = document.getElementById('lfi-cr-msg');
  if (!locked || !unlocked || !btn || !msg) return;

  if (contexte && contexte.moi) {
    unlocked.hidden = false;
    if (nomSpan) nomSpan.textContent = contexte.moi.nom;
  } else {
    locked.hidden = false;
    return;
  }

  /* Réponses saisies dans la page : chaque champ marqué data-reponse est
     envoyé avec le libellé de sa question, pour que le prof relise le
     travail et pas seulement la date de dépôt. */
  function collecterTravail(){
    var travail = [];
    document.querySelectorAll('[data-reponse]').forEach(function(champ){
      travail.push({
        exercice: champ.getAttribute('data-question') || 'Réponse',
        code: champ.value
      });
    });
    return travail.length ? JSON.stringify(travail) : undefined;
  }

  /* Camarades du groupe : sélection parmi la classe, sans saisie libre. */
  var camarades = (contexte.camarades || []);
  var choisis = [];
  var groupe = document.getElementById('lfi-cr-groupe');
  var recherche = document.getElementById('lfi-cr-recherche');
  var liste = document.getElementById('lfi-cr-liste');
  var chips = document.getElementById('lfi-cr-chips');

  function sansAccents(txt){
    var s = (txt || '').toLowerCase().normalize('NFD');
    var out = '';
    for (var i = 0; i < s.length; i++){
      var code = s.charCodeAt(i);
      if (code < 0x0300 || code > 0x036f) out += s[i];
    }
    return out;
  }

  function fermerListe(){ if (liste){ liste.hidden = true; liste.innerHTML = ''; } }

  function afficherChips(){
    if (!chips) return;
    chips.innerHTML = '';
    choisis.forEach(function(c){
      var chip = document.createElement('span');
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:rgba(139,92,246,.15);border:1px solid #8b5cf6;font-size:13px';
      var texte = document.createElement('span');
      texte.textContent = c.nom;
      var retirer = document.createElement('button');
      retirer.type = 'button';
      retirer.textContent = '✕';
      retirer.setAttribute('aria-label', 'Retirer ' + c.nom);
      retirer.style.cssText = 'background:none;border:none;color:#e9eefb;cursor:pointer;font-size:14px;line-height:1;padding:0';
      retirer.addEventListener('click', function(){
        choisis = choisis.filter(function(x){ return x.id !== c.id; });
        afficherChips();
        majEtatRecherche();
      });
      chip.appendChild(texte);
      chip.appendChild(retirer);
      chips.appendChild(chip);
    });
  }

  function majEtatRecherche(){
    if (!recherche) return;
    var complet = choisis.length >= MAX_COEQUIPIERS;
    recherche.disabled = complet;
    recherche.placeholder = complet
      ? 'Maximum de ' + MAX_COEQUIPIERS + ' camarade(s) atteint'
      : "Nom d'un camarade de la classe...";
  }

  if (groupe && recherche && liste && camarades.length) {
    groupe.hidden = false;
    recherche.addEventListener('input', function(){
      var q = sansAccents(recherche.value);
      fermerListe();
      if (!q || choisis.length >= MAX_COEQUIPIERS) return;
      var pris = choisis.map(function(c){ return c.id; });
      var resultats = camarades.filter(function(c){
        return pris.indexOf(c.id) === -1 && sansAccents(c.nom).indexOf(q) !== -1;
      }).slice(0, 8);
      if (!resultats.length) return;
      resultats.forEach(function(c){
        var opt = document.createElement('button');
        opt.type = 'button';
        opt.textContent = c.nom;
        opt.style.cssText = 'display:block;width:100%;text-align:left;padding:9px 14px;background:none;border:none;color:#e9eefb;font:inherit;cursor:pointer';
        opt.addEventListener('click', function(){
          if (choisis.length >= MAX_COEQUIPIERS) return;
          choisis.push(c);
          afficherChips();
          majEtatRecherche();
          recherche.value = '';
          fermerListe();
          recherche.focus();
        });
        liste.appendChild(opt);
      });
      liste.hidden = false;
    });
    document.addEventListener('click', function(e){
      if (e.target !== recherche && liste && !liste.contains(e.target)) fermerListe();
    });
  }

  var fichierInput = document.getElementById('lfi-cr-fichier');

  btn.addEventListener('click', function(){
    msg.textContent = '';
    msg.style.color = '';
    btn.disabled = true;
    btn.textContent = '⏳ Envoi…';

    var donnees = new FormData();
    donnees.append('coursId', COURS_ID);
    var travail = collecterTravail();
    if (travail !== undefined) donnees.append('travail', travail);
    donnees.append('camaradesIds', JSON.stringify(choisis.map(function(c){ return c.id; })));
    if (fichierInput && fichierInput.files && fichierInput.files[0]) {
      donnees.append('fichier', fichierInput.files[0]);
    }

    fetch('/api/comptes-rendus', {
      method: 'POST',
      body: donnees
    })
    .then(function(res){ return res.json().then(function(data){ return { ok: res.ok, data: data }; }); })
    .then(function(result){
      if (result.ok) {
        msg.textContent = '✅ Compte-rendu déposé !';
        msg.style.color = '#34d399';
        btn.hidden = true;
      } else {
        msg.textContent = '❌ ' + (result.data && result.data.error ? result.data.error : 'Le dépôt a échoué.');
        msg.style.color = '#fb7185';
        btn.disabled = false;
        btn.textContent = '📤 Déposer mon compte-rendu';
      }
    })
    .catch(function(){
      msg.textContent = '❌ Impossible de contacter le serveur.';
      msg.style.color = '#fb7185';
      btn.disabled = false;
      btn.textContent = '📤 Déposer mon compte-rendu';
    });
  });
})();
</script>
`;

  return injecterAvantFermeture(html, "</body>", bloc);
}

/**
 * Désactive le collage (clavier, clic droit, glisser-déposer) dans les
 * zones de réponse Python des exercices — frein pédagogique contre le
 * copier-coller irréfléchi, pas une sécurité stricte : un élève déterminé
 * peut toujours retaper à la main depuis un autre onglet. Le copier
 * n'est volontairement pas touché (l'élève doit pouvoir sauvegarder son
 * propre code ailleurs).
 *
 * Injecté juste avant `</body>`, comme les autres widgets, pour
 * s'appliquer à toutes les pages sans modification manuelle des fichiers.
 * L'événement `paste` du navigateur se déclenche de la même façon que le
 * collage vienne du raccourci clavier ou du menu contextuel (clic droit) :
 * un seul écouteur suffit à couvrir les deux, sans avoir à désactiver le
 * menu contextuel entier (ce qui aurait aussi bloqué le "copier").
 */
export function injecterBlocageCollage(html: string): string {
  const script = `
<script>
(function(){
  function afficherMessage(champ){
    var existant = champ.parentElement && champ.parentElement.querySelector('.lfi-paste-bloque-msg');
    if (existant) existant.remove();
    var msg = document.createElement('div');
    msg.className = 'lfi-paste-bloque-msg';
    msg.textContent = "Le copier-coller est désactivé ici — tape ton code toi-même 🙂";
    msg.style.cssText = 'margin:6px 0 0;padding:6px 10px;border-radius:8px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);color:#fbbf24;font:12px system-ui,sans-serif;transition:opacity .3s ease';
    champ.insertAdjacentElement('afterend', msg);
    setTimeout(function(){
      msg.style.opacity = '0';
      setTimeout(function(){ msg.remove(); }, 300);
    }, 2500);
  }

  document.querySelectorAll('textarea.code').forEach(function(champ){
    champ.addEventListener('paste', function(e){
      e.preventDefault();
      afficherMessage(champ);
    });
    champ.addEventListener('drop', function(e){
      e.preventDefault();
      afficherMessage(champ);
    });
  });
})();
</script>
`;
  return injecterAvantFermeture(html, "</body>", script);
}

/**
 * Sauvegarde/restauration automatique du code tapé dans les cellules
 * d'exercice (voir ProgressionExercice) : injecté juste avant `</body>`,
 * comme le widget de dépôt, pour s'appliquer à tous les fichiers
 * d'exercices sans modification manuelle.
 *
 * Cible chaque `.cell[data-cell] textarea.code` dont le plus proche ancêtre
 * identifié (`[id]`) n'est PAS un bloc `.correction` — l'id de cet ancêtre
 * sert d'`exerciceId` stable (ex: "ex1", "s1e1", convention déjà en place
 * dans contenu/cours/*.html). Les cellules de démonstration à l'intérieur
 * d'une correction ne sont jamais capturées : ce n'est pas le travail de
 * l'élève.
 */
export type ContexteFinalisationCours = {
  corrigeAutorise: boolean;
  contexteEleve: ContexteEleveDepot | null;
  depot: { delaiDepasse: boolean; coursId: string } | null;
  progression: { coursId: string; sauvegardes: Record<string, string> } | null;
};

/**
 * Applique la même chaîne de traitement que app/cours/[fichier]/route.ts
 * (corrections, contexte élève, widget de dépôt, restauration de la
 * progression, blocage du copier-coller) — factorisé pour être réutilisable
 * par la route de téléchargement hors-ligne d'un cours interactif.
 */
export function finaliserHtmlCours(html: string, ctx: ContexteFinalisationCours): string {
  let resultat = ctx.corrigeAutorise ? activerCorrections(html) : retirerCorrections(html);

  if (ctx.contexteEleve) {
    resultat = injecterContexteEleve(resultat, ctx.contexteEleve);
  }

  if (ctx.depot) {
    resultat = ctx.depot.delaiDepasse
      ? injecterMessageDelaiDepasse(resultat)
      : injecterWidgetDepot(resultat, ctx.depot.coursId);
  }

  if (ctx.progression) {
    resultat = injecterScriptProgression(resultat, ctx.progression.coursId, ctx.progression.sauvegardes);
  }

  return injecterBlocageCollage(resultat);
}

export function injecterScriptProgression(
  html: string,
  coursId: string,
  sauvegardes: Record<string, string>,
): string {
  const coursIdJson = JSON.stringify(coursId).replace(/</g, "\\u003c");
  const sauvegardesJson = JSON.stringify(sauvegardes).replace(/</g, "\\u003c");

  const script = `
<script>
(function(){
  var COURS_ID = ${coursIdJson};
  var SAUVEGARDES = ${sauvegardesJson};
  var DELAI_DEBOUNCE = 2000;

  document.querySelectorAll('.cell[data-cell] > textarea.code').forEach(function(textarea){
    var cell = textarea.closest('[data-cell]');
    if (cell.closest('.correction')) return; // démo du prof, pas le travail de l'élève

    var conteneur = cell.closest('[id]');
    if (!conteneur) return;
    var exerciceId = conteneur.id;

    if (Object.prototype.hasOwnProperty.call(SAUVEGARDES, exerciceId)) {
      textarea.value = SAUVEGARDES[exerciceId];
    }

    var indicateur = document.createElement('span');
    indicateur.className = 'lfi-progression-indicateur';
    indicateur.style.cssText = 'margin-left:10px;font-size:12px;color:#34d399;opacity:0;transition:opacity .3s';
    indicateur.textContent = 'Sauvegardé ✓';
    var head = cell.querySelector('.cell-head');
    if (head) head.appendChild(indicateur); else cell.insertBefore(indicateur, cell.firstChild);

    var minuteur = null;
    var masquageMinuteur = null;

    textarea.addEventListener('input', function(){
      if (minuteur) clearTimeout(minuteur);
      indicateur.style.opacity = '0';
      minuteur = setTimeout(function(){
        fetch('/api/progression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coursId: COURS_ID, exerciceId: exerciceId, code: textarea.value })
        })
        .then(function(res){
          if (!res.ok) return;
          indicateur.style.opacity = '1';
          if (masquageMinuteur) clearTimeout(masquageMinuteur);
          masquageMinuteur = setTimeout(function(){ indicateur.style.opacity = '0'; }, 3000);
        })
        .catch(function(){});
      }, DELAI_DEBOUNCE);
    });
  });
})();
</script>
`;

  return injecterAvantFermeture(html, "</body>", script);
}
