import { readFile } from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";

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
  return html.replace(
    "</head>",
    "<script>window.__CORRECTION_ACTIVE__ = true;</script>\n</head>"
  );
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
  return html.replace(
    "</head>",
    `<script>window.__CONTEXTE_ELEVE__ = ${json};</script>\n</head>`
  );
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

  const bloc = `
<section id="lfi-cr-widget" style="margin:40px auto;max-width:720px;padding:20px 22px;background:#121a31;border:1px solid rgba(255,255,255,.12);border-radius:14px;color:#e9eefb;font-family:system-ui,sans-serif">
  <h3 style="margin:0 0 10px;font-size:18px">📤 Déposer ton compte-rendu</h3>
  <div id="lfi-cr-locked" hidden>
    <p style="margin:0;color:#9aa7c2;font-size:14px">🔒 Connecte-toi avec ton compte élève pour déposer ton compte-rendu.</p>
  </div>
  <div id="lfi-cr-unlocked" hidden>
    <p style="margin:0 0 12px;color:#9aa7c2;font-size:14px">Tu déposes en tant que <strong id="lfi-cr-nom" style="color:#fff"></strong>. Tes réponses saisies sur la page sont envoyées avec le dépôt.</p>
    <div id="lfi-cr-groupe" hidden style="margin:0 0 14px">
      <p style="margin:0 0 6px;color:#9aa7c2;font-size:14px">Vous avez travaillé en groupe ? Cherche tes camarades :</p>
      <div style="position:relative">
        <input type="text" id="lfi-cr-recherche" placeholder="Nom d'un camarade de la classe..." autocomplete="off" style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b1020;color:#e9eefb;font:inherit">
        <div id="lfi-cr-liste" hidden style="position:absolute;z-index:5;top:calc(100% + 4px);left:0;right:0;max-height:200px;overflow-y:auto;background:#0b1020;border:1px solid rgba(255,255,255,.12);border-radius:10px"></div>
      </div>
      <div id="lfi-cr-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>
    </div>
    <button id="lfi-cr-btn" type="button" style="padding:10px 18px;border-radius:10px;border:1px solid #8b5cf6;background:rgba(139,92,246,.15);color:#e9eefb;font:inherit;cursor:pointer">📤 Déposer mon compte-rendu</button>
    <p id="lfi-cr-msg" role="status" style="margin:12px 0 0;font-size:14px;min-height:20px"></p>
  </div>
</section>
<script>
(function(){
  var COURS_ID = ${coursIdJson};
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
      });
      chip.appendChild(texte);
      chip.appendChild(retirer);
      chips.appendChild(chip);
    });
  }

  if (groupe && recherche && liste && camarades.length) {
    groupe.hidden = false;
    recherche.addEventListener('input', function(){
      var q = sansAccents(recherche.value);
      fermerListe();
      if (!q) return;
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
          choisis.push(c);
          afficherChips();
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

  btn.addEventListener('click', function(){
    msg.textContent = '';
    msg.style.color = '';
    btn.disabled = true;
    btn.textContent = '⏳ Envoi…';
    fetch('/api/comptes-rendus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coursId: COURS_ID,
        travail: collecterTravail(),
        camaradesIds: choisis.map(function(c){ return c.id; })
      })
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

  return html.replace("</body>", `${bloc}</body>`);
}
