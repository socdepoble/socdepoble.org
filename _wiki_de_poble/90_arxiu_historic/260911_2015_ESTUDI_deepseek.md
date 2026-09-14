---
tipus: estudi
estat: actiu
description: Estudi de l'Auditoria de DeepSeek sobre la Super Petorreta
---
# 🧠 ESTUDI DE L'AUDITORIA: DEEPSEEK

**Data i Hora:** 260911_2015
**Origen:** DeepSeek (Informe Estructurat de Puntuació i Deute).

DeepSeek ha fet el que millor sap fer: buscar pèls a la sopa i analitzar els fitxers de deute (`.estucat-deute.json`, `.pedra-seca-deute.json`, etc.) per destapar exactament el volum de la brossa.

## 🎯 Aportacions Clau

### 1. El Detector de Mentides (Discrepàncies)
Ha trobat contradiccions entre el que diuen els fitxers de deute antics i el bundle actual:
- Posa en dubte l'existència de `NotesSection.css` (que sabem que no existeix, però ell ho ha detectat llegint el deute antic).
- Avisa d'una "fuga de domini" a `supabaseBackend.js` amb el `tenantId` (si Sollutia no el passa, caurà tot al tenant de proves `11111111-2222-...`).

### 2. Quantificació Exacta de la Poda
En lloc de parlar en genèric, ha llistat exactament què hem de purgar:
- 71 regles CSS mortes (ex: `.fab-button`, `.sw-pedra-75`).
- 24 usos de color cru (`#00599d`, etc.) amagats a `DesignSectionContent.jsx`.
- 115 classes JSX òrfenes i 18 tokens fantasma (com `--sdp-espai-6`).
- 23 estils inline i 12 fugues al `document.body`.

### 3. Diagnòstic de Notes i Sollutia
- Corrobora (igual que Claude i Dola) que el codi del *collapsed* a `AppGridColumn` era massa simple i feia desaparèixer la lupa i la roda dentada.
- Per a Sollutia, exigeix una carpeta pròpia d'adaptadors (`src/data/adapters/sollutia/`) i tests d'integració reals contra el mock per certificar que estem aïllats.

### 4. Puntuació i Rànquing de Prioritats (P0 a P4)
DeepSeek ha puntuat l'arquitectura:
- Contractes interns: 9/10
- Honestitat del bundle: 8,5/10
- Codi fantasma: 3/10
Ha dictat un ordre d'execució seqüencial molt estricte, però recordem que **Codex ja ens ha executat el P1 i P2** (Sahumerio i Notes).

## 🛠️ Acció Suggerida
L'aportació de DeepSeek és brutal per a la "higiene" del codi. Les dades que ha extret de la poda (com els 24 colors crus a `DesignSectionContent.jsx`) s'han d'enviar obligatòriament a **Claude Design**. 

Claude no només ha de crear els components nous (formularis, modals), sinó que li hem d'exigir que elimine tots aquests colors crus (hexadecimals) del document del catàleg i els substituïsca pels tokens oficials de Pedra Seca. Això tancarà el cercle de la perfecció visual.
