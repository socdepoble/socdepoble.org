---
type: document
status: esborrany
description: Pla d'implementació per a l'auditoria de fortificació i connexió amb Sollutia per a Codex
tags: [implementacio, sollutia, arquitectura]
visibility: private
reflex: sdp:torn_9668985a-fe3e-47c2-871d-dfdb234b0d2a:84f07d34-7dcd-489e-a894-c4b028b589c9
---
# Pla d'Implementació — Fortificació i Sollutia (Codex)

**Estat del Pla:** fases 1–3 executades amb autorització humana expressa del torn actual; reauditoria entregada. Cadena global amb deute pendent. Fases 4–5 condicionades.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260925-1537 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25 15:37 Europe/Madrid |
| Modificació | 2026-09-25, revisió posterior a les proves de les 15:46 Europe/Madrid |
| Propietari | Agents Locals (Codex) |
| Aprovació humana | Fases 1–3 autoritzades expressament el 2026-09-25 |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats: no disponibles; estimats: no calculats |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

- **2026-09-25, Codex, execució:** F1/F2/F3 reparades; fixture, E4, tractor d’estils AST, metadades i cens reparats. Vitest 514/514; Node 304 correctes i 2 omeses; lint i builds passen. Graf operatiu 0/0, cens 22/22. Reauditoria [[260925_1621_auditoria_codex]], nota 7,5/10. Els paràgrafs següents conserven la proposta i diagnòstic previs; no revoquen l’autorització actual.

- **2026-09-25, Codex:** aportació F1–F8, proves completes i rebut documental nou; consens pendent.

- **2026-09-25:** Inici del pla de fortificació amb Codex. Després que Claude hagi avançat la UX/UI a l'Editor i Consola (però fallat per ofegament de tokens en la integració), Codex asumeix el control per consolidar el nucli de l'aplicació i estabilitzar la connexió amb Supabase (Sollutia).

## Canvis proposats

La base és [[../90_arxiu_historic/260925_Tanda_Codex_Vesprada/260925_1544_auditoria_codex]]. Dues fallades d’identitat reproduïdes, 489/490 Vitest, Node 300 verds i 2 omeses. Supabase SdP continua autoritatiu; la Frontissa real de Sollutia està desactivada. No es proposa revertir el treball visual de Claude.

### 1. Context i Troballes (Research)

S'han realitzat avanços a nivell de Frontend (`DocumentEditor.jsx`, botoneres) en el torn de Claude. Aquests avenços estan reflectits a nivell de working tree però falta consolidar la base i assegurar que els models de dades i connexions backend respecten el model d'enxufabilitat de Pedra Seca. Caldrà una fortificació d'identitat.

### 2. Preguntes Obertes (User Review Required)

- **Consens d’execució:** el prompt fixa AFK fins a l’entrega i consens. Codex entrega i proposa este pla; no atribuïx aprovació a MarIA ni a Claude.
- **Contracte real de Sollutia:** origen exacte del host i API, emissor i audiències, mecanisme de confiança a Supabase i renovació, recurs de lectura amb captura i staging. Sense estos elements, la fase 4 es manté tancada.
- **Política de pares:** proposta F3: una llista explícita substituïx els defaults; confirmar-ho en el consens. Els orígens de callback tenen una política separada.
- **Suficiència de tests:** no, els tests actuals ometen la cursa durant renovació i fallades parcials de storage. No hi ha motiu acreditat per revertir components visuals.

### 3. Canvis Proposats (Proposed Changes)

**Fase 1 · Identitat abans de qualsevol integració real (F1/F2).**

- MODIFY `src/data/supabase/auth.js` i `auth.test.js`: capturar actor desat, configuració i sessió abans del primer await a les mutacions. Fixar una guarda que diferencie renovació legítima de canvi d’entrada; passar-la per `asseguraUsuari`. Rebutjar A→B, logout i reentrada del mateix actor abans de PUT/PATCH; mantindre l’èxit de refresh d’A. Comprovar també la resolució tardana després del PUT.
- MODIFY `src/data/identitat.js`, `identitat.test.js`, `src/config/storage.js`; afegir proves específiques d’emmagatzematge: error observable en desar sessió, serialització prèvia, invalidació coherent si falla qualsevol peça, cap èxit fals encara que la neteja també falle. Actualitzar consumidors que ignoren el retorn de `desaSessio`, especialment login i registre. Mantindre les claus públiques i emmagatzematge efímer.
- Verificació: JWT bo, a punt de caducar i caducat; refresh vàlid, rebutjat i sense xarxa; canvi A→B, A→logout→A; quota en cada peça, accés denegat i serialització invàlida. Els casos d’abort han de demostrar **zero escriptures** sobre el compte substitut.

**Fase 2 · Frontisses d’origen (F3).**

- MODIFY `src/config/runtimePolicy.js`, `runtimePolicy.test.js`, `src/host.js`, `tests/host.test.js` i les proves de relé que corresponguen: orígens exactes (protocol, host i port) i funcions amb responsabilitat explícita per al pare i el callback.
- Default segur immutable; cap wildcard nou; `event.source` continua sent el pare real. Validar política explícita, port distint, subdomini alié i origen correcte amb font incorrecta.

**Fase 3 · Consolidació local sense redisseny (F5/F6/F7).**

- MODIFY exclusivament la fixture de `src/components/universal/workspace/UniversalWorkspace.test.jsx`: aportar `data.lead`, conservar l’assert del text esperat i el contracte de la targeta. No editar `DocumentEditor.jsx`, UniversalCard, NotaFitxa ni botoneres.
- MODIFY `tooling/gates/tractor-enxufe.mjs` i prova de porta: separar proves de producte en el cens E4; una assignació idèntica en producte ha de continuar bloquejada. Cap baseline nova per amagar incidències.
- **Tractor Cognitiu d'Estils (Pedra Seca):** El Mestre ha detectat que la IAIA MarIA comet errors d'estils en línia (`textAlign: 'center'`, etc) perquè incompleix la normativa de disseny. Cal crear o depurar un *tractor cognitiu* (possiblement un script de porta, ex: `tractor-estils.mjs`) que analitze els components de React (especialment `src/sections/`) i obligue a qualsevol IA a escriure segons les normes editorials de Pedra Seca, fallant si es detecten estils en línia no autoritzats. Aquesta és una tasca que Codex pot iniciar si té tokens, o quedarà agendada per a Claude.
- Regularitzar el prompt 15:37 mitjançant el circuit de documentació amb procedència real i ancorar la gràfica de consum a l’índex pertinent. Preservar investigació, documents actius i zona humana.

**Fase 4 · Acceptació d’integració real (F4), condicionada a contracte.**

- MODIFY `src/data/adaptadors/sollutia/client.js` i catàleg només amb captura/fixture/DTO del recurs confirmat; GET, límit de resposta, timeout, abort i absència de cookies.
- Validar amb staging que la sessió del host és acceptada per Supabase SdP; no confondre verificació local de claims amb confiança de servidor. Acordar renovació i logout del proveïdor real.
- Matriu RLS de dos usuaris i un anònim: notes, perfils, rols, storage i xat; denegació de lectura/escriptura creuada. Cap migració de producció implícita.
- Actualitzar l’ADR a l’arquitectura comprovada. Les captures no han d’incloure tokens ni dades personals.

**Fase 5 · Rendiment (F8), després de seguretat.** Mesurar el cost del standalone en l’amfitrió abans de decidir partició del paquet. No és prerequisit per reparar les curses ni autoritza canvis visuals.

**Alternatives descartades:** revertir la UX per adaptar-la a una fixture; afegir un backend Sollutia que substituïsca el port; relaxar RLS, claims o llistes d’orígens per simular una connexió; reescriure tota l’arquitectura sense mesures. El manteniment a sis mesos queda en guards, storage i contractes petits amb proves adversarials.

### 4. Pla de Verificació (Verification Plan)

1. Casos F1/F2 reproduïts en regressions i verds després de la correcció, sense xarxa real.
2. `npm test -- --run` complet, Node complet amb l’enumeració de l’auditoria i lint.
3. Portes enxufe, adaptadors, Frontissa, frontera auth, RLS, orfandat i documentals; després cadena global sense proclamar-la verda si falla una porta heretada.
4. Builds web/standalone i arrencada `http://localhost:3340`; comprovació que els components visuals protegits no han canviat.
5. Fase 4 amb evidència remota separada, sense comptes ni credencials inventats.

## Verificació

Auditoria local executada: 489/490 Vitest; Node 300 passen i 2 omeses; lint i els dos builds passen. F1/F2/F3 reproduïdes. La reparació encara no s’ha executat; este registre no declara aprovació ni compliment dels criteris finals.

## Riscos

- Trencament d'acoblament (Model B).
- Modificar per error components visuals validats prèviament per Claude.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/260925_Tanda_Codex_Vesprada/260925_1544_auditoria_codex]]
