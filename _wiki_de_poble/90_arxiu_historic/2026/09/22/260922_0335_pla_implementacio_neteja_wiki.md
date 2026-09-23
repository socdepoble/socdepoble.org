---
type: document
status: esborrany
description: "Pla per a netejar el deute documental de la Wiki i assolir el tancament verd"
tags:
  - implementacio
reflex: sdp:torn_acdcaf49-29b8-4895-9f0e-6925836e9f48:6e31ea19-de66-4b22-89ed-5c6da8b63bee
---
# Pla d'Implementació — Neteja de la Wiki

**Estat del Pla:** en elaboració

## Vincles
- [[00_index_actuar]]

## 1. Context i Troballes (Research)
Després de fortificar el codi i moure els estils en línia a `modules.css`, el `tancament.mjs` dóna `exit 0` en React. No obstant, falla estrepitosament la part documental: falten rebuts `reflex` als frontmatters dels documents recents, hi ha enllaços trencats a `ESTAT`, `LEDGER` i `GENOMA`, i documents orfes a l'escriptori. A més, hem d'incorporar el context de `socdepoble.net` i `rentonner.blogspot.com`. L'escriptori ha sigut netejat de fitxers antics per facilitar l'auditoria a les IAs locals.

## 2. Preguntes Obertes (User Review Required)
Cap. Aquest document serveix perquè les AIs auditores (Opus i Codex) puguen llegir el meu pla a l'Ombra de l'Olivera.

## Canvis proposats
- Netejar els frontmatters afegint els camps necessaris (ex. `reflex:`).
- Esborrar o arreglar els enllaços trencats als arxius MD.
- Ancorar qualsevol document orfe a `00_INDEX_ESCRIPTORI.md`.

## Verificació
- Executar `npm run tancar`.
- L'objectiu és aconseguir `exit 0` en la fase documental i global.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-NETEJA-260922 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T03:35:00+02:00 |
| Modificació | 2026-09-22 |
| Propietari | MarIA; reparació documental Codex |
| Aprovació humana | Execució de la neteja sol·licitada en el prompt local |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Rebut persistent emés amb document.mjs context per a la ruta pla.implementacio. Plantilla llegida durant la reparació; el rebut no acredita una lectura retroactiva de l'autor original.

## Historial

2026-09-22: Codex conserva el pla de MarIA i completa el contracte documental. Els vincles vigents es corregeixen; les cites històriques es conserven com a referències textuals. Es regenera GENOMA des de les fonts i se segellen les skills.

## Riscos

Evitar confondre arxiu amb document esborrat, generar rebuts manuals o substituir modificacions d'altres agents. No s'alteren les portes per a obtindre verd. Alternatives descartades: reintroduir l'arxiu al manifest actiu o relaxar la comprovació d'enllaços.
