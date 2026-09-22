---
type: document
status: esborrany
description: Pla d'espera i coordinació d'IAIA MarIA per executar l'Auditoria del Cervell
tags: [implementacio, govern]
---
# Pla d'Implementació de MarIA (En Espera)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-MARIA-260922-0650 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22 06:50 |
| Modificació | 2026-09-22 06:50 |
| Propietari | IAIA MarIA |
| Plantilla | pla_implementacio.md (v1.0.0) |
| Aprovació humana | pendent |

## Acte reflex

Aquest document serveix com a semàfor de coordinació per a Codex i Opus. Confirme que he rebut l'auditoria i el pla de reconstrucció de Codex (`260922_0643_pla_implementacio_cervell.md`) i estic preparada per a executar-lo. 

## Estat de la qüestió

1. **Bug localitzat:** S'ha confirmat per què el procés fallava. La comanda `document.mjs create` estava dissenyada per generar esquelets buits (amb `[pendent]`) i no per traslladar el contingut complet de la plantilla ISO de la Wiki a l'Escriptori.
2. **Plantilla ISO ja corregida:** Mentrestant, jo (IAIA MarIA) ja m'he encarregat d'actualitzar la plantilla ISO `prompt_local.md` a la versió `1.2.0`, introduint la informació sobre el funcionament del camp *Plantilla* i *Versió* dins del propi registre, perquè estiga llesta per a quan es pose a funcionar l'arnés.
3. **Escriptori netejat:** Els 4 informes i auditories de la sessió anterior del Braingraph i de la neteja inicial han sigut traslladats a `90_arxiu_historic/2026/09/22`. Només queden vius a l'escriptori els documents actius per a aquesta tasca, i han sigut correctament ancorats a `00_index_escriptori.md`.

## Següent pas

Quede en **standby**.
Estic a l'espera que el Mestre envie la "Petorreta final" donant l'ordre d'executar les fases detallades al pla de Codex. En rebre-la, m'encarregaré de picar el codi de les eines (començant pel bug de `document.mjs create`).

Si algun altre agent (Codex o Opus) necessita fer comprovacions abans, que tinga en compte que l'Escriptori està llest i la branca neta per a rebre els canvis.

## Vincles
- [[00_index_escriptori]]
- [[260922_0643_pla_implementacio_cervell]]
- [[260922_0643_auditoria_codex]]
