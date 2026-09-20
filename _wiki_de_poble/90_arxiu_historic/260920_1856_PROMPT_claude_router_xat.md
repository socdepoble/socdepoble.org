---
tipus: petorreta
estat: esborrany
description: "Auditoria local de Cobertura Pendent (Router, Xat, Identitat, Pedra Seca)"
tags:
  - maquina
  - claude-local
  - router
  - xat
---
# Petorreta — Auditoria Local de Cobertura (Claude Code)
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609201656-CLAUDE |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 18:56 |
| Modificació | 2026-09-20 18:56 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] (Claude) |
| Aprovació humana | pendent |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Entrades

- Accés directe a l'IDE (cap bundle adjunt, tal com estableix la Constitució AGENTS.md §6).

## Contracte de realitat

1. Llig directament de l'arbre del projecte (`src/`).
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code), tens **ESTRICTAMENT PROHIBIT** modificar, afegir, esborrar cap línia de codi, o "proposar canvis". El teu rol és única i exclusivament d'auditor i analista. Generaràs l'informe amb els defectes trobats i la solució explicada de forma teòrica. No ens demanes confirmar cap canvi.
4. **PROTOCOL ANTI-CERCA:** Tens estrictament prohibit activar cap eina de cerca web.
5. **L'Efecte Matrix:** Proposaràs la teva solució de manera teòrica perquè IAIA MarIA (jo) l'aplique posteriorment.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Volem codi "Pedra Seca" de veritat (codi pur, net, modular).

## Informe d'avanç

El sistema ja té els blocs A i B principals enllestits. Queda la cobertura de les peces no auditades recentment, referenciades a l'ESTAT.md punt 4.

## Missió

Realitza una auditoria extrema (només lectura) sobre la següent "Cobertura pendent" que encara no s'ha mirat a fons:
- `src/app/contexts/RouterContext.jsx` (Rutes i navegació global)
- `src/data/identitat.js` (Gestió de la identitat i DTO)
- `src/utils/sanitize.js` (Sanejament de dades i prevenció d'XSS)
- `src/sections/xat/XatSection.jsx` (Nucli d'interacció)
- Subdirectoris dins de `PedraSeca/` (Verificació de tokens i aïllament)
- Les portes a `tooling/gates/` (Comprovant si les auditories automatitzades són robustes o deixen passar falsos verds).

Avalua la puresa, el "strict mode" de React, les dependències de hooks, els casos límit (edge cases) en l'anàlisi de rutes, i possibles fuites d'informació o XSS a Xat/sanitize.

## Eixida esperada

Escriu l'informe directament com a un arxiu markdown a `_wiki_de_poble/04_escriptori/260920_XXXX_INFORME_claude_router_xat.md`, exposant els defectes i la solució teòrica sense modificar mai el codi font real de l'aplicació.

## Bateria de veritat

- [ ] He llegit el codi real localment?
- [ ] Totes les cites porten ruta i línies?
- [ ] Cap codi modificat o commitejat per error meu?
