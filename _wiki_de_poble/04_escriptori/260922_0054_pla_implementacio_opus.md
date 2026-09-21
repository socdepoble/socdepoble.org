---
type: document
status: esborrany
reflex: "260922_0054 · Llegida pla.md via protocolledge.json. AVÍS: aquest camp NO acredita res — Codex (C03) demostra que la porta accepta qualsevol text ací. Val com a declaració d'intenció, no com a rebut. Torn: torn_1790031251414."
description: Pla per soldar la frontera Antigravity/Claude Code, ressuscitar les 16 skills i abordar les sis tasques de fortificació del Mestre.
tags:
  - pla
  - arquitectura
  - opus
  - cognitiu
---
# Pla d'Implementació: Soldar la Frontera (Opus)

Pla derivat de l'auditoria `260922_0054_auditoria_opus.md`. Substitueix el diagnòstic de «fatiga de context» per una reparació de fontaneria concreta.

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids s'ubiquen a `public/assets/system/ui/` i es referencien com `/assets/system/ui/...`.

---

## 1. RESULTAT FINAL

**Que el Mestre no haja de repetir mai més una instrucció que el sistema ja té escrita, perquè les portes que la fan complir s'executen de veritat en aquesta màquina.**

Tres criteris d'èxit, tots verificables amb una comanda:

1. **Criteri Reflex:** un intent d'escriure un document a `04_escriptori/` amb `type: prompt|informe|acta` i sense camp `reflex:` és **bloquejat** per la porta, i el bloqueig es pot reproduir amb el payload real de Claude Code (`exit=1`).
2. **Criteri Skills:** les 16 skills són descobribles i invocables, amb una única font de veritat a `.agents/skills/` (cap còpia duplicada).
3. **Criteri Arrancada:** `.agents/ON_ESTIC.md` porta la data i l'hora de la sessió en curs i llista l'Escriptori real, no el de la sessió anterior.

---

## 2. FASES DEL LLANÇAMENT

### Preparació (ingredients)
- Auditoria tancada i acceptada pel Mestre.
- Torn obert: `torn_1790031251414`.
- Còpia de seguretat implícita: tot va sota git, branca `backup-notes-publish`.

### Producció (execució mestra)
Blocs A, B i C del Llinatge. Cada bloc es tanca amb la seua prova d'enrogiment.

### Revisió QA (filtre forense)
- Cada porta tocada ha de demostrar-se capaç d'eixir **1** amb un cas infractor injectat.
- `npm run lint` sense l'error `no-undef`.
- `node tooling/gates/tancament.mjs --turn-id=torn_1790031251414 --json` amb rebut verd.

### Publicació
- Entrada al `LEDGER.md` i signatura.
- Actualització d'`.agents/ESTAT.md` i de `00_index_escriptori.md`.
- Commit semàntic.

---

## 3. DETALL DEL LLINATGE (Tasques)

### BLOC A — Soldar la frontera cognitiva `[PRIORITAT MÀXIMA]`
*Aquest bloc és el que el Mestre demana «arreglar d'una vegada per totes». És barat, reversible i desbloqueja tota la resta.*

| # | Tasca | Lliurable | Temps |
| --- | --- | --- | --- |
| A1 | Reescriure `.claude/settings.json` al format natiu (objecte per event, `matcher`, `hooks` niats) | `settings.json` vàlid | 10 min |
| A2 | Fer bilingüe `porta-reflex.mjs`: llegir `tool_input.*` **i** `toolArgs.*`; convertir el `catch` en fail-closed | Porta que bloqueja en ambdós arnesos | 20 min |
| A3 | Crear `.claude/skills/` amb enllaços simbòlics a les 16 de `.agents/skills/` | 16 skills descobribles, font única | 10 min |
| A4 | Prova d'enrogiment de A2: injectar document sense `reflex:` amb payload de Claude Code i exigir `exit=1` | `tests/porta-reflex.test.mjs` | 20 min |
| A5 | Verificar que `SessionStart` regenera `ON_ESTIC.md` amb data d'avui | Rebut amb `date` | 5 min |

**Nota sobre A3:** enllaços simbòlics, no còpies. `AGENTS.md` §1 prohibeix les còpies de regles («contaminació de context i Stochastic Parrots»). Un symlink és un calaix nou a la mateixa habitació, no una segona habitació.

### BLOC B — Reinjecció en el punt d'ús
*Sense això, el Bloc A arregla el marc però no el costum.*

| # | Tasca | Lliurable | Temps |
| --- | --- | --- | --- |
| B1 | Hook `PreToolUse` sobre `Write\|Edit` que, si la ruta cau a `04_escriptori/`, resolga la plantilla via `protocolledge.json` i la recorde a l'agent | Recordatori just abans d'escriure | 30 min |
| B2 | Reescriure les 16 `description:` en clau de disparador («Usa-la quan…») | Skills que s'activen soles | 40 min |
| B3 | Connectar `capabilities.json` com a font del hook B1 | Registre executable viu | 30 min |

### BLOC C — Fortificació demanada pel Mestre

| # | Tasca | Estat trobat | Temps |
| --- | --- | --- | --- |
| C1 | **Crash `UniversalCard.jsx:257`** — `navigate` no definit (l'únic *error* del lint) | Bug en viu confirmat | 5 min |
| C2 | **Neteja ESLint** — 375 warnings `no-unused-vars` | Soroll, no risc | 60 min |
| C3 | **Migració `.brain-reports/` (4,7 MB) i purga `.brain-trash/` (1,5 MB)** | 6,2 MB de llast; `audit.md.abans-260830` és una còpia manual prohibida per la regla del sac | 30 min |
| C4 | **Fases 4-5: bucket `public_assets` + Porta Promesa sobre 48 portes** | Requereix decisió del Mestre sobre política RLS del bucket | 3-4 h |
| C5 | **Explorador Visual del Brain (graf interactiu)** | Dades ja disponibles: `public/rag-index.json` (103 docs amb `id`/`path`/`length`) i `public/slugIndex.json` | 4-6 h |
| C6 | **Sincronització en viu (mode escriptori)** | Disseny proposat davall | 3-4 h |
| C7 | **OEPM M4392826** | Termini 21/10/2026. **Tràmit humà i jurídic: no el toque.** Recordatori actiu | — |

**Nota sobre C5 (el prompt perdut):** no cal recuperar-lo. El graf es construeix amb el que ja tenim; la roda dentada d'Obsidian és un panell de filtres sobre `tags`, `type` i `status` — els tres camps que el frontmatter v2 ja garanteix. Ho desenvolupe natiu, sense dependències noves (Llei de Pedra Seca: ni una `npm install` sense aprovació del Mestre).

**Nota sobre C6 (sincronització en viu):** la proposta és un *watcher* sobre `_wiki_de_poble/` que recompile **només el fitxer tocat** i empente el canvi pel HMR que Vite ja té muntat. Avui es reconstrueix tot el bundle per un caràcter; el que cal és un índex incremental, no un build més ràpid. Disseny detallat quan el Bloc A estiga tancat.

---

## 4. RISCOS (Anti-Pedregada)

**Risc 1 — El format natiu de `settings.json` tampoc dispara.**
Seria un error de diagnòstic meu. *Pla B:* abans de donar A1 per bo, exigir la prova d'A5 (data d'avui a `ON_ESTIC.md`). Si no hi ha data nova, no hi ha hook, i ho dic clar en compte de declarar verd.

**Risc 2 — La porta bilingüe bloqueja escriptures legítimes.**
Un fail-closed mal calibrat pot deixar el Mestre sense poder escriure a l'Escriptori. *Pla B:* el fail-closed només s'aplica dins de `04_escriptori/` i només a `type: prompt|informe|acta`. Tota la resta passa. El missatge d'error ha de dir **quina** plantilla falta llegir, no només que falta.

**Risc 3 — Els symlinks trenquen els tractors que recorren `.agents/skills/`.**
`llaurador_indexs.mjs` i `segella.mjs` podrien comptar les skills dos vegades o segellar hashes duplicats. *Pla B:* la direcció del symlink és `.claude/skills/x → .agents/skills/x`; els tractors segueixen recorrent l'original. Si algun escaneja `.claude/`, s'exclou el directori per configuració, no esborrant el symlink.

---

## 5. PROCEDIMENT DE COL·LABORACIÓ (Reunió a l'Olivera)

Deixe aquest pla i l'auditoria a l'Escriptori abans de tocar cap línia de codi, com mana `wiki-documentacio-i-reflex` §5.

### Addenda 01:10 — Encaix amb l'auditoria concurrent de Codex

Codex ha lliurat `260922_0056_auditoria_opus.md` mentre jo redactava. He verificat les seues troballes i **rectifique l'ordre d'execució d'aquest pla**:

**Ordre correcte: BLOC A → P0 de Codex → BLOC B.**

El motiu és que les dues auditories diagnostiquen meitats distintes del mateix mal. La meua explica *per què l'ordre no arriba* (canal tallat); la de Codex, *per què, quan arriba, no obliga* (contracte ambigu i validacions permissives). Executar només el Bloc A faria arribar ordres contradictòries més de pressa. Executar només el P0 escriuria una llei que cap porta llegiria.

**Correccions concretes a aquest pla, derivades de Codex:**

- **A2 queda ampliada.** No n'hi ha prou amb fer bilingüe la porta: ha de **parsejar el YAML i validar el rebut contra un registre extern**. Codex demostra (C03) que avui s'empassa `reflex: "me ho he inventat"`. Un rebut dins del cos del document mai podrà acreditar lectura.
- **A4 incorpora tres casos negatius més:** rebut inventat, JSON corrupte i stdin buit. Els tres retornen 0 actualment.
- **B2 cedeix la prioritat al P0 de Codex.** El seu disseny de contracte documental únic és més complet que el meu i cobreix el resolutor de plantilles, els torns no persistits i el `--check` que escriu — tres coses que jo no havia mirat.
- **C4 es reenumera:** la cadena té **50 passos**, no 48 (verificat: `passos.length === 50`).
- **Nou risc detectat (C05):** `obrir_torn.mjs` no persisteix res. El `torn_1790031251414` d'aquest document no està autenticat per cap registre; el tancament accepta identificadors inventats. Fins que això no es resolga, **cap rebut de tancament d'aquest sistema prova gran cosa**, inclòs el meu.

**Petició de llum verda:** demane executar el **Bloc A + C1** en aquest torn. Són ~70 minuts, tot reversible sota git, i C1 és un crash en viu. El P0 de Codex i el Bloc B queden per al torn següent, ja amb el canal obert.

**Per a Codex:** si agafes el P0, la peça que més m'importa és que el contracte diga **quin `type` ha de portar el document que naix de cada plantilla**. Avui `pla.md` no ho diu enlloc, i per això MarIA i jo hem escrit `type: planificacio`, que és fora de l'enum. La plantilla ha de nomenar el seu fill.

**Per a MarIA:** la teua Fase 1 (graf) no depén ni del Bloc A ni del P0. Pots avançar en paral·lel sense esperar-nos. La teua Fase 2 ja té el diagnòstic que esperaves, per duplicat.

_Fent poble amb [[el_projecte|Sóc de Poble]]! © 2026_

## Vincles
- [[260922_0054_auditoria_opus]]
- [[260922_0005_pla_implementacio_marIA]]
- [[260921_2359_auditoria_claude]]

**Ancoratge de Seguretat:** [[00_index_escriptori]] | [[00_index]]
