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
contracte.escriu:
  - _wiki_de_poble/04_escriptori/
  - _wiki_de_poble/10_actes/
---

# Protocol Gauntlet Loop i Enginyeria Inversa REA

Aquest procediment estableix l'estàndard d'execució d'alt rendiment per a evitar la complacència, les feines a mitges i les al·lucinacions superficials de les IAs. S'aplica de forma imperativa tant a les sessions de co-working amb el Mestre com en les auditories i interaccions autònomes entre Claude Code, GPT Codex, Gemini 4 Argon i la IAIA MarIA.


## 1. Fonament Teòric: El Gauntlet Loop (Matt Shumer / Robonuggets)
Una sola IA treballant aïllada pateix d'un biaix cognitiu greu: dóna per bo el seu propi treball, retalla cantonades amb comentaris `// TODO` o simula funcionalitats que en realitat no ha acabat.

El **Gauntlet Loop** trenca aquesta ceguesa mitjançant un arnés extern inexorable:
1. **El Constructor (Builder - Claude Code):** Pica el codi, crea components, refactoritza i prepara la implementació seguint el Pla.
2. **El Crític Implacable (Adversarial Critic - GPT Codex):** Amb un **context net i separat** (sense escoltar les excuses ni el xat del Constructor), avalua el resultat directament contra una **Barra de Qualitat real** i la llista de requeriments.
3. **El Garant de Coherència (Gemini 4 Argon):** Verifica la puresa del model de dades, la Llei del Quadrat d'imatges i el reglament Pedra Seca.
4. **El Bucle (Loop):** El Crític busca fallades sense pietat. Si troba una sola mancança, rebutja el lliurament. El Constructor torna a picar fins a assolir el 100% de verd.


## 2. La Matriu de Conformitat de Requeriments (MCR)
Està terminantment prohibit emetre auditories amb valoracions vagues com *«tot provat i llest per a producció»*. 

Tota auditoria sobre un Pla d'Implementació ha d'incorporar obligatòriament la **Matriu de Conformitat de Requeriments (MCR)** en format taula Markdown:

| Requeriment del Pla | Estat (`[FET]` / `[PARCIAL]` / `[NO FET]`) | Evidència / Fitxer Comprovat | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| *Ex: Mirall H1 Nota sense títol* | `[FET]` | `src/sections/notes/Editor.jsx:45` | Totalment sincronitzat amb la card. |
| *Ex: Visor modal Google Fotos* | `[NO FET]` | No s'ha creat el component Lightbox | Temps esgotat; es trasllada al següent torn. |

### La Regla del Balanç Transparent (Zero Oblits):
- El que està `[FET]` conserva la seua evidència; una regressió o un requeriment nou pot reobrir-lo amb causa explícita.
- El que està `[PARCIAL]` o `[NO FET]` **es trasllada automàticament i de forma visible al següent Pla d'Implementació**. Prohibit esborrar-ho, amagar-ho o oblidar-ho.


## 3. Enginyeria Inversa amb REA (Reverse Engineer Anything)
Abans de programar interfícies complexes o inventar rodes noves, qualsevol IA està obligada a consultar o disseccionar solucions líders ja consolidades al mercat mitjançant el patró **REA**:

1. **Àmbits d'aplicació canònics a Sóc de Poble:**
   - **Lector RSS (`/app/lector`):** Enginyeria inversa de **Feedly** (arbre de carpetes a l'esquerra, comptadors de no llegits, flux de lectura net a la dreta) muntat sobre `UniversalWorkspace`.
   - **TPV del Bar (`/app/bar`):** Enginyeria inversa de **Loyverse TPV** (Mode Bar i Mode Rebost, tiquets tàctils, selecció ràpida).
   - **Gestoria (`/app/gestoria`):** Enginyeria inversa de **Holded, FacturaDirecta i GnuCash** (llibre de factures i tresoreria neta per a gent de poble).
   - **Mapa de Fotografies:** Enginyeria inversa de la plantilla de viatge d'**Emowe** (`plantilla-mapa.html`) per a agrupació dinàmica de pins GPS sobre el mapa de la vall.
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
