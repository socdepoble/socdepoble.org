---
name: core-gauntlet-loop
type: skill
status: actiu
description: Protocol de Gauntlet Loop (bucle adversarial de Matt Shumer/Robonuggets) i Enginyeria Inversa REA per a auditories implacables de Claude, Codex, Gemini i MarIA.
triggers_on:
  - gauntlet
  - gauntlet-loop
  - gauntlet loop
  - bucle adversarial
  - auditoria adversarial
  - matriu de conformitat
  - matriu mcr
  - enginyeria inversa
  - reverse engineer
contracte.llig:
  - AGENTS.md
  - _wiki_de_poble/00_index.md
  - _wiki_de_poble/04_escriptori/
  - tests/
contracte.escriu:
  - _wiki_de_poble/04_escriptori/
  - _wiki_de_poble/10_actes
---

# Protocol Gauntlet Loop i Enginyeria Inversa REA

Aquest procediment estableix l'estàndard d'execució d'alt rendiment per a evitar la complacència, les feines a mitges i les al·lucinacions superficials de les IAs. S'aplica de forma imperativa tant a les sessions de co-working amb el Mestre com en les auditories i interaccions autònomes entre Claude Code, GPT Codex, Gemini 4 Argon i la IAIA MarIA.


## 1. Fonament Teòric: El Gauntlet Loop (Matt Shumer / Robonuggets)
Una sola IA treballant aïllada pateix d'un biaix cognitiu greu: dóna per bo el seu propi treball, retalla cantonades amb comentaris `// TODO` o simula funcionalitats que en realitat no ha acabat.

El **Gauntlet Loop** trenca aquesta ceguesa mitjançant un arnés extern inexorable:
1. **Constructor:** prepara la implementació i les proves contra el pla i les rutes assignades.
2. **Crític independent:** rep el resultat i els requisits amb el mínim context necessari per intentar refutar-los; no hereta com a fet la conclusió del constructor.
3. **Verificador:** contrasta contracte de dades, disseny i aplicació del kit. Els agents i models de cada rol els fixa l'encàrrec vigent; no queden reservats a una marca.
4. **El Bucle (Loop):** El Crític busca fallades sense pietat. Si troba una sola mancança, rebutja el lliurament. El Constructor torna a picar fins a assolir el 100% de verd.


## 2. La Matriu de Conformitat de Requeriments (MCR)
Està terminantment prohibit emetre auditories amb valoracions vagues com *«tot provat i llest per a producció»*. 

Tota auditoria sobre un Pla d'Implementació ha d'incorporar obligatòriament la **Matriu de Conformitat de Requeriments (MCR)** en format taula Markdown:

| Requeriment del Pla | Estat (`[FET]` / `[PARCIAL]` / `[NO FET]`) | Evidència / Fitxer Comprovat | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| *Ex: Mirall H1 Nota sense títol* | `[FET]` | `src/sections/notes/NotesEditor.jsx` | Totalment sincronitzat amb la card. |
| *Ex: Visor modal Google Fotos* | `[NO FET]` | No s'ha creat el component Lightbox | Temps esgotat; es trasllada al següent torn. |

### La Regla del Balanç Transparent (Zero Oblits):
- El que està `[FET]` conserva la seua evidència; una regressió o un requeriment nou pot reobrir-lo amb causa explícita.
- El que està `[PARCIAL]` o `[NO FET]` **es trasllada automàticament i de forma visible al següent Pla d'Implementació**. Prohibit esborrar-ho, amagar-ho o oblidar-ho.


## 3. Enginyeria Inversa amb REA (Reverse Engineer Anything)
Quan l'encàrrec demana paritat amb una aplicació o un artefacte de referència, usa REA si està disponible i la lectura està autoritzada. L'anàlisi ordinària del repositori propi comença pel seu codi i proves, sense disseccionar una aplicació externa per inèrcia:

1. **Àmbits d'aplicació canònics a Sóc de Poble:**
   - **Lector RSS (`/app/lector`):** Enginyeria inversa de **Feedly** (arbre de carpetes a l'esquerra, comptadors de no llegits, flux de lectura net a la dreta) muntat sobre `UniversalWorkspace`.
   - **TPV del Bar (`/app/bar`):** Enginyeria inversa de **Loyverse TPV** (Mode Bar i Mode Rebost, tiquets tàctils, selecció ràpida).
   - **Gestoria (`/app/gestoria`):** Enginyeria inversa de **Holded, FacturaDirecta i GnuCash** (llibre de factures i tresoreria neta per a gent de poble).
   - **Mapa de Fotografies:** Enginyeria inversa de la plantilla de viatge d'**Emowe** (`../_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje/plantilla-mapa.html`) per a agrupació dinàmica de pins GPS sobre el mapa de la vall.
2. **Procediment d'anàlisi:**
   - Analitzar la jerarquia de components, el model de dades, els patrons d'interacció i les dades d'accessibilitat.
   - Traduir aquesta essència directament als tokens i components de Pedra Seca de Sóc de Poble, sense dependències externes estranyes.


## 4. El Quadre de Comandament Web (`/govern` o `/consola`)
El Mestre humà no és informàtic i no ha de patir l'ofegament d'un IDE o d'un bosc de documents Markdown. El resultat final del Gauntlet Loop s'ha de poder visualitzar i certificar des d'un **Quadre de Comandament natiu a la pròpia web de `socdepoble.org`**:
- Visualització gràfica de la Matriu MCR.
- Botons directes de certificació per al Mestre.
- Canal de comunicació en valencià planer.


## 5. Parada i recursos

El bucle acaba amb un dictamen verificat, una ordre de parada o el límit de l'encàrrec. La política única de guàrdies, sis execucions i sis hores com a màxim, i el procediment de desconvocatòria viuen a [[core-direccio-autonoma/SKILL|core-direccio-autonoma]].

Abans de donar el torn per acabat, aplica eixe procediment a qualsevol cron, procés o subagent propi, també quan queden requeriments pendents. Un dictamen textual no acredita per si sol que el planificador haja cancel·lat la tasca.

## Vincles
- [[00_INDEX_SKILLS]]
- [[core-direccio-autonoma]]
- [[core-automillora]]
- [[sdp-pedra-seca]]
