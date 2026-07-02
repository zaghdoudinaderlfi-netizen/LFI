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
