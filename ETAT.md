# ÉTAT DES LIEUX — Nadtech (23 juin 2026)

---

## 1. Erreur admin "Can't resolve 'fs'"

**Statut : ✅ CORRIGÉ**

La page `/prof/admin` est maintenant proprement découpée :
- `admin-client.tsx` — composant client (`"use client"`)
- `admin/page.tsx` — Server Component (prisma côté serveur)
- `admin/actions.ts` — Server Actions (`"use server"`)

Aucun `import fs` ne traîne dans l'arborescence `app/` ou `lib/`. Le bug est
résolu depuis le commit `0fd6309`.

---

## 2. Mots de passe oubliés + interface admin + profil éditable

### 2a. Mot de passe oublié (flow email)
**Statut : ✅ FAIT — avec une limite en dev**

- Page `/mot-de-passe-oublie` → formulaire email → génération token → envoi email
- Page `/mot-de-passe-oublie/reinitialiser/[token]` → saisie nouveau mdp
- Email envoyé via Resend (`lib/email.ts`). Anti-énumération : réponse identique
  qu'il y ait un compte ou non.

**Limite connue :** sans `RESEND_API_KEY` en prod, le lien est **uniquement
affiché dans les logs serveur** (pas envoyé par email). En Codespace de dev,
c'est normal ; en production il faut configurer Resend.

### 2b. Interface admin — réinitialisation par le prof
**Statut : ✅ FAIT**

- `/prof/admin` liste tous les élèves, groupés par classe, avec filtre/recherche.
- Bouton "Réinitialiser mdp" → confirmation → génère un mdp temporaire
  (`XXXX-XXXX-XXXX`) → modal one-shot avec bouton "Copier".
- Le flag `doitChangerMdp: true` est posé sur l'élève.
- L'admin peut aussi modifier nom, prénom, email, classe de chaque élève.

### 2c. Bannière "doit changer son mot de passe"
**Statut : ⚠️ PARTIEL — le changement est suggéré, pas forcé**

L'élève voit un bandeau orange dans `eleve/layout.tsx` avec un lien vers
`/eleve/profil#securite`. Mais il peut ignorer le bandeau et continuer à
utiliser l'application normalement. Il n'y a **pas de redirection obligatoire**
vers la page de changement de mot de passe.

**Ce qui reste à faire (si voulu) :** dans `middleware.ts`, détecter
`doitChangerMdp` (via la session ou un cookie) et rediriger toutes les routes
`/eleve/*` (sauf `/eleve/profil`) vers `/eleve/profil#securite` jusqu'à ce que
le mdp soit changé.

### 2d. Profil éditable (élève)
**Statut : ✅ FAIT**

`/eleve/profil` propose quatre sections :
- Carte identité (avatar, nom, classe)
- Constructeur d'avatar
- Formulaire prénom / nom
- Formulaire adresse email
- Formulaire changement de mot de passe (ancien mdp requis)

Le profil prof (`/prof/profil`) est aussi éditable.

---

## 3. PWA (manifest, service worker, installable)

**Statut : ✅ FAIT — mais non testable en dev Codespace**

Tous les fichiers sont en place :
- `public/manifest.webmanifest` — name, icons (192, 512, 512-maskable),
  display standalone, theme_color, etc.
- `public/sw.js` + `public/workbox-4a6e5f9b.js` — générés par
  `@ducanh2912/next-pwa`
- `app/layout.tsx` — balise `manifest` + métadonnées Apple Web App
- `components/pwa-install-prompt.tsx` — bandeau "Installer" (bottom bar) qui
  intercepte `beforeinstallprompt`
- `PWAInstallPrompt` monté dans `app/eleve/layout.tsx`

**Limites :**
1. Le service worker est **désactivé en mode `development`**
   (`disable: process.env.NODE_ENV === "development"` dans `next.config.ts`).
   Pour tester l'installation réelle, il faut un build de production (`npm run
   build && npm start`).
2. Le prompt d'installation n'est monté que dans le layout **élève** — les
   profs ne le voient pas.
3. Chrome ne déclenche `beforeinstallprompt` que si l'appli est servi en HTTPS
   avec un SW valide ; en dev HTTP local, le bandeau n'apparaîtra jamais.

---

## 4. Police / typographie plus ludique

**Statut : ✅ FAIT**

- **Nunito** (arrondie, dynamique) → police de corps `font-body` / `font-sans`
- **Space Grotesk** (géométrique, moderne) → police de titres `font-heading`

Les deux polices sont chargées via `next/font/google` dans `app/layout.tsx` et
exposées comme variables CSS (`--font-heading`, `--font-body`). Les classes
utilitaires `page-title`, `section-title`, `eyebrow` utilisent `font-heading`.
Toutes les pages appliquent `font-sans` (Nunito) par défaut sur le `body`.

---

## 5. Suppression d'un cours (avec confirmation)

**Statut : ✅ FAIT**

- Composant `SupprimerCoursButton` (client) dans
  `app/prof/cours/[id]/supprimer-cours-button.tsx`
- Confirmation via `window.confirm()` avant toute action
- Server Action `supprimerCoursAction` → appelle `supprimerCours(id)` dans
  `lib/cours.ts`
- `supprimerCours` supprime dans l'ordre : fichiers soumissions (Supabase),
  sujets devoirs, fichiers blocs, pièces jointes, puis le cours en base (cascade
  Prisma)
- Redirige vers `/prof/cours` après suppression

---

## 6. Affichage des cours amélioré

**Statut : ✅ FAIT**

### Côté élève (`/eleve/cours`)
- Grille 2 colonnes (`sm:grid-cols-2`) avec cards interactives
- Affichage de la matière (icône BookOpen + label) et du titre

### Côté prof (`/prof/cours`)
- Liste avec badge Publié / Brouillon (couleur différente), bouton Modifier
- Page d'édition d'un cours : sections séparées (contenu, blocs, pièces jointes,
  devoirs, exercices code), avec états vides gérés

### Page cours élève (`/eleve/cours/[slug]`)
- Contenu texte ou PDF, blocs, pièces jointes, devoirs, exercices de code
- Barre de progression de lecture (`ReadingProgress`)

---

## 7. Téléchargement des travaux élèves nommés "Nom_Prenom"

**Statut : ✅ FAIT — format légèrement différent de l'énoncé**

La route `GET /api/rendus/[id]` (fichier `app/api/rendus/[id]/route.ts`)
construit le nom de fichier via `construireNomFichier` :

```
{nom}_{prenom}_{membres...}_{titre-cours-court}.{ext}
```

Les caractères sont slugifiés (accents retirés, minuscules, tirets) pour
garantir la compatibilité cross-OS. Exemple :
`dupont_marie_introduction-au-python.pdf`

En mode travail de groupe, les noms des coéquipiers sont concaténés.

**Nuance :** les noms sont en **minuscules avec tirets** (slugifiés), pas en
`Nom_Prenom` avec majuscule comme la demande initiale l'indiquait. Si le format
exact `NOM_PRENOM` est requis, il faut modifier `slugifier()` ou la logique de
`construireNomFichier` dans la route.

---

## Récapitulatif

| # | Chantier | Statut |
|---|----------|--------|
| 1 | Erreur admin `fs` | ✅ Corrigé |
| 2a | Mot de passe oublié (email) | ✅ Fait (Resend requis en prod) |
| 2b | Interface admin — réinit mdp | ✅ Fait |
| 2c | Forçage changement mdp post-réinit | ⚠️ Partiel (bannière seulement, pas de redirect forcé) |
| 2d | Profil élève éditable | ✅ Fait |
| 3 | PWA installable | ✅ Fait (non testable en dev) |
| 4 | Typographie Nunito + Space Grotesk | ✅ Fait |
| 5 | Suppression cours avec confirmation | ✅ Fait |
| 6 | Affichage cours amélioré | ✅ Fait |
| 7 | Nommage PDF `nom_prenom` | ✅ Fait (slugifié minuscule) |

---

# ÉTAT DES LIEUX — Nadtech (1 juillet 2026)

## Pages de cours interactives NSI (Skulpt, turtle, thème, indices, niveaux)

### Contexte

`public/cours/nadtech-nsi-ch1-exercices.html` était en conflit `UU` suite à un
`git stash pop` (marqueurs `Updated upstream` / `Stashed changes`, pas un
merge classique — pas de `MERGE_HEAD`). Le commit `b00cbff` ("Add files via
upload", envoyé depuis l'interface web GitHub) avait réintroduit une ancienne
implémentation du rendu turtle (SVG `getBBox`) par-dessus le stash qui
contenait la version canvas plus aboutie.

### Résolution du conflit

**Statut : ✅ FAIT**

Les 4 blocs de conflit ont été résolus en gardant systématiquement le côté
`Stashed changes`, confirmé par comparaison avec les fichiers frères
(`nadtech-nsi-ch1-arithmetique-variables.html`, `-ch2-boucle-for.html`,
`-ch2-exercices.html`, `-ch3-exercices.html`) qui utilisaient déjà tous ce
même pattern (autofit par scan de pixels sur `<canvas>`, cible
`#turtleModalArea`, `600×560`, `animate:true/delay:20`). Le côté `Updated
upstream` (SVG, `480×440`, sans animation) était la version obsolète.

- Fichier résolu, sans marqueur restant, indexé (`git add`)
- Stash `stash@{0}` (celui à l'origine du conflit) supprimé — son contenu est
  désormais entièrement intégré dans l'arbre de travail
- Le second stash (`stash@{1}`, sans rapport — WIP "chapitre visible aux
  élèves" : `app/prof/cours/visibilite-toggle.tsx`,
  `prisma/migrations/20260628121404_add_chapitre_visible_eleves/`, etc.)
  **laissé intact**, non touché

### Vérification des 5 chantiers demandés

**Statut : ✅ FAIT — cohérent sur les 5 pages, mais pas encore commité**

Vérifié (avant de recommencer quoi que ce soit) sur les 5 fichiers
`nadtech-nsi-ch1-arithmetique-variables.html`, `-ch1-exercices.html`,
`-ch2-boucle-for.html`, `-ch2-exercices.html`, `-ch3-exercices.html` :

| Chantier | Statut | Détail |
|---|---|---|
| Sécurité Skulpt | ✅ Fait | `Sk.execLimit = 7000` + message convivial en cas de dépassement + sortie via `textContent` (pas d'injection HTML). Code identique octet pour octet dans les 5 fichiers. |
| Fenêtre turtle | ✅ Fait | Modal dédiée `#turtleModal` avec zoom/recentrage automatique (scan de pixels sur canvas). Identique dans les 5 fichiers. |
| Thème jour/nuit | ✅ Fait | Bouton `#themeToggle`, persistance `localStorage`, classe `body.light`. Identique dans les 5 fichiers. |
| Indices | ✅ Fait (pages d'exercices) | Système complet sur les 3 pages d'exercices (ch1/ch2/ch3). Sur les 2 pages de cours, seul un mini-hint de narration existe (widget pas-à-pas des variables) — normal, ce n'est pas une page d'exercices. |
| Niveaux | ✅ Fait (pages d'exercices) | Filtre facile/inter/avancé avec badges (`data-niveau`, `#nivEmpty`) sur les 3 pages d'exercices. Absent des 2 pages de cours — cohérent, pas de série d'exercices à filtrer là-bas. |

Contrôles effectués : aucun marqueur de conflit résiduel dans
`public/cours/*.html`, JS syntaxiquement valide sur les 5 fichiers
(`node --check`), les 5 pages répondent en `200` sur le serveur de dev.

**Ce qui reste à faire :** committer. À ce jour, `ch1-arithmetique-variables.html`,
`ch2-boucle-for.html`, `ch2-exercices.html` sont modifiés mais non indexés ;
`ch3-exercices.html` n'est pas encore suivi par git ; `ch1-exercices.html` est
indexé (conflit résolu). La suppression de `nsi-ch1.html` (ancien fichier
remplacé par les pages `nadtech-nsi-ch1-*`) est également en attente, hors
périmètre de ces 5 chantiers.

---

# ÉTAT DES LIEUX — Nadtech (2 juillet 2026, ~21h18) — diagnostic serveur dev / preview 404

Toutes les commandes ci-dessous ont été réellement exécutées dans cette session ; les sorties sont copiées telles quelles, rien n'est inventé.

## 1. Serveur & ports

### `lsof -i :3000` / `lsof -i :3001`

```
$ lsof -i :3000
(aucune sortie)
$ lsof -i :3001
(aucune sortie)
```

`lsof` ne renvoie rien pour ces ports dans cet environnement (sandbox/namespace du conteneur — il n'a probablement pas les droits pour lire les sockets d'autres process). Bascule sur `ss -ltnp`, qui lui fonctionne :

```
$ ss -ltnp | grep -E ":3000|:3001"
LISTEN 0 511 *:3000 *:*  users:(("next-server (v1",pid=50516,fd=22))
LISTEN 0 511 *:3001 *:*  users:(("next-server (v1",pid=54452,fd=24))
```

**→ Deux serveurs Next.js tournaient en parallèle**, un sur 3000, un sur 3001.

### `ps aux | grep -E "node|next"` (process node/next uniquement, bruit VS Code retiré)

```
codespa+ 50464  sh -c next dev            (démarré 21:13, pas de tty — lancé par Claude en tâche de fond)
codespa+ 50465  node .../next dev
codespa+ 50516  next-server (v15.5.19)     → écoute sur :3000
codespa+ 54424  sh -c next dev            (démarré 21:16, tty pts/2)
codespa+ 54425  node .../next dev
codespa+ 54452  next-server (v15.5.19)     → écoute sur :3001
```

**Cause racine identifiée en remontant l'arbre des process** (`ps -o pid,ppid,cmd`) : le serveur sur le port 3001 (pid 54452) remonte à un `npm run dev` (pid 54407) lancé depuis **un terminal intégré VS Code** (`pts/2`, sous le shell bash de l'IDE, pid 43989) — donc lancé manuellement dans un terminal de l'éditeur, pas par Claude. Au même moment, le `npm run dev` lancé par Claude en tâche de fond (sans tty, pid 50451→50516) tenait déjà le port 3000. Le second process a donc vu le port pris et basculé tout seul sur 3001.

**Il y avait bien deux `npm run dev` actifs en simultané : un en tâche de fond (port 3000) et un dans un terminal VS Code (port 3001).** Selon lequel des deux le port-forwarding de Codespaces expose à un instant donné (et selon lequel est en train de recompiler), la preview peut pointer sur le mauvais port ou tomber en 404 pendant un redémarrage.

### Le serveur dev tourne-t-il ? Sur quel port ? Sortie de démarrage (20 premières lignes)

Oui — celui lancé en tâche de fond (pid 50451) tourne sur le **port 3000**, sans avertissement "port in use" :

```
> lfi@1.0.0 predev
> rm -rf .next


> lfi@1.0.0 dev
> next dev

   ▲ Next.js 15.5.19
   - Local:        http://localhost:3000
   - Network:      http://10.0.1.84:3000
   - Environments: .env
   - Experiments (use with caution):
     · serverActions

 ✓ Starting...
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry
```

## 2. Erreurs éventuelles

- **Aucune erreur de compilation** dans les logs du serveur pid 50451 (`✓ Ready in 4.1s`, rien d'autre après).
- `curl -I http://localhost:3000/` : premier essai juste après redémarrage → **404** (probablement capté pendant la compilation à la volée de la page `/`, ou pendant que l'autre serveur du terminal VS Code démarrait en même temps). En relançant 3 fois juste après : **200 / 200 / 200**, stable. Le contenu HTML renvoyé est bien la landing page (`<title>Nadtech — Plateforme pédagogique</title>`).
- `curl -I http://localhost:3001/` : **200 OK** (l'autre serveur, sur le port de repli, répond aussi correctement en local une fois stabilisé).
- `curl -I http://localhost:3000/connexion` : **200 OK**.
- `curl -I http://localhost:3001/connexion` : **200 OK**.

**Conclusion :** en local (`localhost`), les deux serveurs répondent correctement une fois stabilisés. Le 404 côté navigateur vient donc très probablement du **port-forwarding Codespaces / de l'URL de preview qui ne correspond pas au bon port**, pas d'une erreur de compilation Next.js.

## 3. Git

### `git status`

```
Sur la branche main
Votre branche est à jour avec 'origin/main'.

Modifications qui ne seront pas validées :
	modified:   app/eleve/notifications/page.tsx
	modified:   app/eleve/quiz/page.tsx
	modified:   app/prof/notifications/page.tsx
	modified:   app/prof/quiz/page.tsx
	modified:   components/nav/notifications-liste.tsx
	modified:   lib/cours.ts
	modified:   lib/devoirs.ts
	modified:   lib/exercices-code.ts
	modified:   lib/notifications.ts
	modified:   lib/soumissions.ts
	modified:   prisma/schema.prisma
	modified:   public/sw.js

Fichiers non suivis :
	app/eleve/quiz/[id]/
	app/prof/quiz/[id]/
	app/prof/quiz/actions.ts
	app/prof/quiz/nouveau/
	app/prof/quiz/quiz-form.tsx
	app/prof/quiz/visibilite-toggle.tsx
	lib/quiz.ts
	prisma/migrations/20260702003125_add_matiere_notifications/
	prisma/migrations/20260702004402_quiz_solo_ludique/
	prisma/migrations/20260702010000_reponse_tentative_unique/
```

Note : `public/sw.js` est apparu modifié suite à un `next build` exécuté pendant cette session (fichier généré par next-pwa) — pas une modif manuelle.

### `git log --oneline -5`

```
717922a Regroupe les cours par chapitre et ajoute la visibilite eleves par cours
a38a84a Cours interactifs NSI : securite Skulpt, fenetre turtle, theme jour/nuit, indices progressifs, niveaux de difficulte
b00cbff Add files via upload
56bdd7f Refactorise la landing page et améliore les pages d'authentification
1722cd4 Ajoute interrupteur corrections visibles sur les pages interactives
```

### `git stash list`

```
stash@{0}: WIP on main: 56bdd7f Refactorise la landing page et améliore les pages d'authentification
```

Un stash en attente, non touché dans le cadre de ce diagnostic.

## 4. Chantiers en cours

### QUIZ (étapes 1-4)

Vérifié directement sur le système de fichiers :

- **Étapes 1-2 — création quiz + questions (prof)** : ✅ fait — `app/prof/quiz/page.tsx` (liste), `app/prof/quiz/nouveau/` (création), `app/prof/quiz/quiz-form.tsx`, `app/prof/quiz/[id]/page.tsx` (édition + questions), `question-form.tsx`, `import-questions-form.tsx` (import CSV), `questions-actions.ts`, `visibilite-toggle.tsx`. `lib/quiz.ts` a `creerQuiz`, `modifierQuiz`, `ajouterQuestion`, `parserQuestionsCSV`, `importerQuestions`.
- **Étape 3 — côté élève, mode solo type Kahoot** : ✅ fait — `app/eleve/quiz/page.tsx` (liste), `app/eleve/quiz/[id]/page.tsx` + `quiz-jeu.tsx` (14 Ko, jeu complet) + `actions.ts`. `lib/quiz.ts` a `demarrerTentative`, `repondre` (anti-triche : `bonneReponse` n'est jamais envoyée au client avant réponse, vérifiée côté serveur), `classementQuiz`.
- **Étape 4 — résultats côté prof** : ✅ fait dans cette session — `app/prof/quiz/[id]/resultats/page.tsx` (tableau par élève : meilleur score + nb de parties ; par question : taux de réussite avec barre colorée). `lib/quiz.ts` a `resultatsQuizParEleve` (ligne 444) et `statsQuestionsQuiz` (ligne 478). Liens ajoutés depuis `/prof/quiz` et `/prof/quiz/[id]`.

**Aucune de ces étapes n'est commitée** — tout est encore dans les fichiers modifiés/non suivis listés en section 3.

### Cours / notifications par matière

D'après le diff de session (`git diff --stat`) :

```
app/eleve/notifications/page.tsx       | 36 +++++++++++++++++++++++++++-------
app/prof/notifications/page.tsx        | 36 +++++++++++++++++++++++++++-------
components/nav/notifications-liste.tsx | 20 +++++++++++++++----
lib/cours.ts                           |  6 ++++--
lib/notifications.ts                   | 13 +++++++-----
```

Ce chantier touche le filtrage/regroupement des notifications par matière, en lien probable avec la migration `20260702003125_add_matiere_notifications`. Le diff est en cours (non commité) — pas relu en détail dans le cadre de ce diagnostic, seule la présence de modifications est confirmée ici.

### Migrations Prisma

```
$ npx prisma migrate status
Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-eu-central-1.pooler.supabase.com:5432"

23 migrations found in prisma/migrations

Database schema is up to date!
```

**Aucune migration en attente** — les 3 dossiers de migration non suivis par git (`add_matiere_notifications`, `quiz_solo_ludique`, `reponse_tentative_unique`) sont déjà appliqués en base.

## 5. Config critique

### `next.config.ts` — section `serverActions`

```ts
experimental: {
  serverActions: {
    allowedOrigins: [
      "localhost:3000",
      "*.app.github.dev",
      "*.preview.app.github.dev",
      "*.githubpreview.dev",
      ...originesCodespace(),
    ],
    bodySizeLimit: "10mb",
  },
},
```

Note : `localhost:3000` est en dur, `localhost:3001` n'y figure pas. Si le serveur qui répond réellement à la preview est celui sur le port 3001, les Server Actions échoueraient côté navigateur même si la page se charge — cohérent avec le symptôme "port occupé → bascule 3001".

### `.env` — `AUTH_TRUST_HOST`

```
$ grep "^AUTH_TRUST_HOST" .env
AUTH_TRUST_HOST=true
```

Présent, valeur `true`.

## Résumé / recommandation

Le "processus fantôme" n'est pas un zombie orphelin : **c'est un second `npm run dev` lancé dans un terminal intégré VS Code (pts/2)**, en plus de celui lancé en tâche de fond par Claude. Les deux tournent simultanément, l'un sur 3000, l'autre sur 3001. Tant que les deux coexistent, celui qui démarre en second retombera toujours sur 3001, et la preview Codespaces (qui cible le port 3000) peut se retrouver à taper sur le mauvais serveur pendant les phases de redémarrage → 404.

**Action recommandée avant de relancer :** fermer ce terminal VS Code (`Ctrl+C` dedans), pour qu'il ne reste qu'un seul serveur actif sur le port 3000. Non fait automatiquement dans ce diagnostic pour ne pas couper un terminal potentiellement utilisé activement — à confirmer.
