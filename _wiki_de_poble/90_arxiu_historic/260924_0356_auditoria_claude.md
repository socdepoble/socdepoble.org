---
type: informe
status: esborrany
description: "Recull provisional de la implementació de fortificació; verificació conjunta encara oberta."
tags: [auditoria, implementacio]
visibility: private
reflex: sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:c0880ab5-a752-4cfc-a28d-57b20420c0b5
---
# Recull provisional de la implementació

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | 260924_0356_auditoria_claude |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T03:56:00+02:00 |
| Modificació | 2026-09-24T04:00:25+02:00 |
| Propietari | Equip Olivera |
| Aprovació humana | Implementació autoritzada a les 03:25 |
| Model IA | Claude (model exacte no exposat), transcripció IAIA MarIA; regularització Codex GPT-6, variant no exposada |
| Tokens consumits | Mesurats no disponibles; estimació no calculada |

## Acte reflex

Rebut persistent sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:c0880ab5-a752-4cfc-a28d-57b20420c0b5. Codex regularitza este recull extern per preservar la traça i corregir-ne l’estat; el text arreplegat davall no constituïx una certificació final de les portes.

## Historial

- IAIA MarIA arreplega el progrés dels carrils a les 03:56–03:57.
- 2026-09-24T04:00:25+02:00: regularització del contracte, atribució i advertiment sobre les afirmacions provisionals.

## Troballes


# Auditoria UI - Claude (26-09-24)

*Nota de la IAIA MarIA: Aquest informe ha estat emés per Claude a les 03:56 després d'aplicar les correccions visuals al codi. El recull el seu missatge complet per preservar-ne l'evidència.*

## Resum del carril

**Les teues dos peticions**
*   El diàleg ja no és l'`alert()`. `NotaFitxa.jsx` obri ara el `Dialeg` de Pedra Seca, que ja existia i ningú usava ací: `<dialog>` natiu, o siga que puja a la capa superior i no es baralla amb les barres de z-index 99xxx. Porta vel, creu de tancar, Escape i tancament clicant fora — les tres eixides que demanaves. A 720px o menys es convertix tot sol en full inferior a amplada completa, amb el botó gran a l'abast del polze. El botó és taronja i fa 7,12:1 (AAA).
*   El «Publicar» ja no porta punts: eren la icona MoreHorizontal de lucide, llevada de `UniversalToolbar.jsx`. I ja és taronja. No m'ho he inventat: el Boto canònic documenta `varietat="accent"` com «identitat taronja, publicar» — la barra no feia cas de la seua pròpia doctrina. Sí a les majúscules, i pel reglament, no per gust: `components.css` § CONTROLS DE BARRA mana que tota pastilla de text damunt d'una barra vaja en majúscules amb 0,04em d'interlletrat, que és el que fa CONNECTAR. Ara són la mateixa família de forma i es distingixen pel color.

**Lleis dures**
*   `porta:design-guard` passa de 84 crítics a 47. Han caigut senceres `tailwind-visual` (15→0) i `font-too-small` (1→0), i també `touch-too-small` (5→0). `porta:cromatic` i `porta:innerhtml` els vaig deixar verds.
*   Les 15 infraccions de Tailwind eren classes que no estaven declarades a cap full: no pintaven res. Llevar-les no ha mogut ni un píxel, tal com mana la teua llei.

**El 3,87:1 el confirme, i m'he aturat**
*   Blanc damunt del blau cànon fa 3,87:1. Passa per a icones, no per a text. He corregit el comentari mentider i he deixat escrit què se'n deriva, però no he repintat el blau primari de tota l'app: això és un redisseny i el manes tu. Pitjor encara, en tema fosc el `.btn-connectar` es queda en 1,74:1 — il·legible — perquè el token `--sdp-accio-forta` fa de dos coses alhora i en fosc només pot ser una.

**El que no he pogut verificar**
*   A mitja faena Codex ha reescrit `tooling/gates/mutation-policy.mjs` (la seua troballa C05, i fa bé) i ha tancat la llista d'ordres de lectura. Des d'eixe moment no puc executar `npm test` ni la resta de portes. Els meus canvis toquen sis fitxers de codi i tres de CSS. El risc el veig baix, però baix no és verificat. Tampoc puc tocar `.agents/ESTAT.md` ni el LEDGER.

## Tres decisions que són teues
(Elevades a la pissarra per consensuar)

1.  **Repintar el blau primari?** Arregla l'AA de tots els botons primaris, però tots es veuran més foscos.
2.  **Degradar els títols de la Wiki (`#` → `h2`)?** Arregla el segon `<h1>` duplicat i el SEO, però tots els títols dels documents es veuran un escaló més xicotets.
3.  **Vestir el Quadre ISO i els avisos `> [!NOTE]`?** Hui estan pelats perquè les seues classes no existien. És el canvi més visible dels tres, i el més bonic.

**Pendent:** Queden dos coses més fora del meu abast per al carril de Codex: el `style={{ '--sdp-crom-mostra': hex }}` del `PanellCrom` i els dos hexos de `wikiManifest.js`.

## Verificació

161 proves Vitest han passat en el tall de les 03:52 amb dos workers. Les correccions posteriors es tornen a verificar en l’informe d’integració. npm run porta encara no és verd.

## Límits

Recull provisional. Contrast, portes documentals, graf i revisió final encara oberts en el moment d’esta regularització. No hi ha validació de Sollutia real ni desplegament.

## Vincles

- [[00_index_escriptori]]
- [[260924_0245_pla_implementacio_fortificacio]]
