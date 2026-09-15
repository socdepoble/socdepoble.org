# 🛡️ Sistema Anti-Psicopatia - Sóc de Poble (Proposta de Vibe)

> **Versió:** 1.0.0
> **Data:** 2026-09-15
> **Estat:** Proposta d'implementació
> **Autor:** Consell de la Petorreta (via Vibe / IAIA MarIA)

## Resum

Vibe ha proposat un sistema molt complet basat en **ADR (Architecture Decision Records)** per a gestionar el coneixement i auditar la psicopatia. Aquest sistema està format per:

1. **`purge-psicopatia.js`**: Escaneja tot el projecte (codi + wiki) per trobar termes obsolets segons les decisions ADR actives.
2. **`adr-manager.js`**: Gestor de Decisions Arquitectòniques (ADR) amb comandes per crear, acceptar, rebutjar i suprimir decisions.
3. **`validate-bundle.js`**: Valida la integritat d'un bundle segons el manifest i verifica la sentinella `<<<FI_DEL_BUNDLE>>>`.

---

L'aproximació d'usar ADRs (com `.adr/decisions/0001-abandon-ipad-a10.md`) amb `deprecated_terms` i `new_terms` és absolutament brillant per a documentar canvis estructurals i donar-li una font de veritat als tractors.

Mentre esperem la resposta de **Codex** (que està adaptant la solució específicament per a integrar-la dins de `tooling/gates/tractor-psicopatia.mjs` i el `package.json`), guardem aquesta proposta de Vibe com a referència fundacional. Les idees de Vibe per a l'`adr-manager.js` es podrien implementar perfectament com un nou component de la nostra maquinària.
