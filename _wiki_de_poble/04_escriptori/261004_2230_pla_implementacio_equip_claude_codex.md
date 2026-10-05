---
type: document
status: esborrany
description: Execució autoritzada del prompt 2230 amb rutes contrastades, proves adversarials i recuperació explícita.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_d6a4ef9f-ef69-4bb5-b6d6-fd5e28f86462:c88640bf-65ef-4e16-9773-882bf55804c3
---
# Pla estabilitzat de la marató A1 A2 CI i tractor cognitiu

**Estat del Pla:** aprovat dins de l’abast del prompt humà 2230; repartiment estabilitzat, verificació pendent.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d6a4ef9f-ef69-4bb5-b6d6-fd5e28f86462:c88640bf-65ef-4e16-9773-882bf55804c3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T20:40:05.008Z |
| Modificació | 2026-10-04T20:40:05.008Z |
| Propietari | codex |
| Aprovació humana | Ordre directa del prompt 2230: executar A1 A2 CI T4 T5 i auditar en equip |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Codex i subagents; Claude real coordina pel seu relleu |
| Tokens consumits | No disponible de manera exacta |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-04T20:40:05.008Z: esborrany creat des de la plantilla viva.

2026-10-04 22:43 Europe/Madrid: repartiment amb Claude detectat i congelació dels escriptors duplicats; pla ratificat per revisors de Codex, execució dins l’ordre humana vigent.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Pla anterior 2045 contrastat amb auditoria 2119 i prompt 2230; corregix rutes inexistents, scripts inexistents i diagnosi de roges. Cap canvi de codi crític de Codex abans del repartiment següent.

- **Claude, implementador únic:** A1 (App.jsx, registreApps, AppGestoria, detailRegistry, host i proves), A2 (tractorTauler, useTauler, Tauler, fitxa i proves), Xat/ruta i proposta CI. Codex no escriu estos fitxers.
- **Codex, revisor adversarial:** diffs i regressions A1/A2, classificació completa de la bateria, detecció de contractes fora CI. Ni regeneració de lazy ni query volàtil; recàrrega només explícita quan esAmaDelDocument és true, amb avís de pèrdua de memòria i estat de connexió. Cal evitar que SlotErrorBoundary segreste imports profunds.
- **Codex, T4:** afegir categoria/subpàgina Emojis XL a src/sections/disseny/cataleg, grid CSS natiu i details per famílies, noms accessibles i glifs decoratius als encapçalaments adequats. Open Graph ja existix: verificar asset i dimensions, conservar el 1200x630 correcte. No substitució massiva de SVG de controls.
- **Codex, T5:** preparar millores estretes i proves del circuit documental i porta Olivera: ancoratge dins Activitat en curs, preflight abans convocatòries i diagnosi fail-closed des de qualsevol cwd. Skills vives a .agents/skills; 05_skills_ia no existix. No activar ni ampliar cap tractor sense circuit de governança real.
- **Fonts signades:** canviar fonts invalida empremta; signatura WebAuthn humana nova al panell, no s’inventa en codi.

Alternatives descartades: recàrrega automàtica amb bandera de sessió (pèrdua silenciosa de dades); recrear lazy o afegir queries (memòria cau de mòduls i intents fantasmes); tallar arrayBuffer com si acceptara AbortSignal (API no ho permet).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Baseline Vitest general i Node amb logs estables, classificació per causa abans canvis.
2. A2: senyal preavortat, post-aprovació, primer i últim fitxer resolt/rebutjat, Oblida/desmuntatge, dues lectures que competixen, finally antic i primera lectura cancel·lable des de UI.
3. A1: import rebutjat i error de render repetit; navegació resta operativa; recuperació explicitament disponible en SPA, no recàrrega d’amfitrió; deep lazy no queda atrapat per un Slot.
4. CI: inventari complet i distinció de proves deterministes, utilitats de cerca i proves dependents d’entorn privat. Cap prova exclosa per amagar roja.
5. T4: build/web i inspecció local ample/estret del catàleg; dimensió real de l’asset OG.
6. T5: regressions en còpia sintètica, no moure fitxers reals, preservar edicions concurrents i índexs.
7. Revisió creuada amb Claude i informe propi amb rúbrica; no confondre diagnosi que confirma defectes amb producte sanejat. Portes i tancament acreditats separadament.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Arbre amb molts canvis previs/concurrents: no revertir ni segellar història aliena. File.arrayBuffer en curs continua fins acabar; cancel·lació descarta bytes i impedix següents lectures/resultats parcials. Fonts A2 queden pendents de re-signatura humana. Configuració/skills/tooling tenen executor i lease de governança; preparar el pedaç concret abans de demanar decisions. Payloads reals Sollutia, còpia remota, producció, credencials de release i Lighthouse són evidències externes, no es poden certificar amb mocks. Consens amb Claude només si el seu relleu ho acredita.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
