---
tipus: document
estat: esborrany
description: Purga de vigència
---

# Purga de vigència

Generat per `porta-vigencia.mjs` · segell del registre `1ea5cc3eb37d`
Fitxers analitzats: 203 · patrons actius: 5

| classe | recompte |
|---|---|
| INCOHERENT | 2 |
| PROHIBIT | 1 |
| MECANIC | 1 |
| AMBIGU | 1 |
| MORT | 9 |
| HISTORIC | 0 |
| REPARAT | 0 |

### 🔴 Incoherència interna — etiqueta nova damunt de cos antic (2)

- `src/data/supabase/README.md:54` — **etiqueta Online-First damunt de comportament offline** [PARA-001]
  > - **Online-First**: El sistema prioritza dades locals (IndexedDB) quan no hi ha connexió.
- `src/sections/text/pageContent.js:109` — **etiqueta Online-First damunt de comportament offline** [PARA-001]
  > "html": "\n      <h3>Els Inicis: La Llavor del 18 de Gener</h3>\n      <p>Tot va començar a l'hivern, el 18 de gener. L'espinada original de Sóc de Po

### 🔴 Requisit derogat viu en zona que alimenta l'agent (1)

- `src/data/SELF-DESCRIBE.md:7` — **cua local de sincronitzacio (outbox)** [PARA-001]
  > - El Frontend és un "Terminal Estúpid" (Dumb Terminal). Si no hi ha xarxa o el backend rebutja l'escriptura, la UI reverteix l'estat i avisa l'usuari.

### 🟡 Token mecànic — reparable amb --aplica (1)

- `src/config/taxonomy-registry.json:64` — **taxonomia tema/offline_first** [PARA-001]
  > "tema/offline_first": {

### 🟠 Prosa — cal reescriptura que preserve el sentit (1)

- `src/utils/sanitize.js:95` — **cua local de sincronitzacio (outbox)** [PARA-001]
  > * i el dany és permanent, perquè es guarda escapat a l'Outbox i a Supabase.

### ⚫ Fitxers residuals dins l'arbre viu (9)

- `src/ARCHITECTURE.md.abans-260830:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/PedraSecaEmbed.jsx.abans-260830:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/css/index.css.abans-260830:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/css/index.css.orig:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/css/legacy-components.css.abans-260830:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/data/outbox.js.abans-260830:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/sections/disseny/DesignSection.jsx.rej:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/sections/notes/NotesSection.jsx.orig:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu
- `src/sections/notes/NotesSection.jsx.rej:0` — **fitxer residual** [—]
  > artefacte de merge/backup dins l'arbre viu

> Aquest document és **exempt** de la purga: cita termes derogats per necessitat forense.
