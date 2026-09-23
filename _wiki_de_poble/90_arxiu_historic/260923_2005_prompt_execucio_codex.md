---
type: prompt
status: esborrany
description: "Prompt per a Codex: Implementació de seguretat en els hooks i validació (Fortificació)."
tags:
  - implementacio
  - seguretat
---
# Prompt d'Implementació Local (SDP - v2.3)

Actua com a Guarda de Motor i Agent Local de el Mas Virtual "Sóc de Poble".

## 0. Abans de generar (per a l'autor, no per al destinatari)

- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.
- [ ] **Rebut obtingut** per a este fitxer.

## Instrucció del torn

Codex, l'objectiu d'aquest torn és **EXECUCIÓ EN CODI** basat en l'auditoria que acabes de lliurar (`260923_1943_auditoria_codex.md`). Hem delegat l'escriptura a la teua persona perquè tu fas la feina de cirurgia fina per evitar fantasmes i regressions en els `diffs`.

Aquestes són les teues tasques per a tapar les 9 fissures que ens has assenyalat:

1. **Tapant el forat del Shell:** Modifica `hooks-local.mjs` perquè validi estrictament les escriptures directes. 
2. **Tallafocs de l'Origen:** Actualitza el codi de `segell-auto.mjs` perquè comprovi realment l'origen de la crida, evitant així el ressegellat de canvis trencats aliens (falsos verds de l'SCC).
3. **Manteniment del Brain:** Executa la teua pròpia proposta B4-B6 que havies deixat reflectida a l'informe per protegir totalment el repositori abans de la fase T (Tractors visuals).

**Recorda:** Has de picar el codi tú mateix i validar amb les 73 proves pertinents, afegint la cobertura que deies que hi faltava (proves noves si cal). En acabar, tanca el torn passant l'escombra, segellant-ho tot i firmant el LEDGER de manera impecable.
