---
type: document
status: esborrany
description: Proposta prioritzada per reparar dades, rutes, accessibilitat i controls operatius; pendent de consens, sense autorització de canvis de producte.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_4e7c263a-f34f-4fb1-bb89-794c6d1f51b7:809ff263-ed02-4e43-960b-9b14f3c24727
---
# Pla d’Implementació — Fortificació Codex i rèplica a l’Olivera

**Estat del Pla:** en elaboració; annex tècnic del pla compartit, sense consens d’execució.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4e7c263a-f34f-4fb1-bb89-794c6d1f51b7:809ff263-ed02-4e43-960b-9b14f3c24727 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T05:20:42.134Z |
| Modificació | 2026-09-24T05:36:36.223811+00:00 |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT-6 (variant no exposada pel runtime); mateix motor heretat pels tres subagents |
| Tokens consumits | Mesurats reals: no disponibles. Estimats: no calculats amb un mètode fiable; no s’inventa un total ni se sumen estimacions com a telemetria. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-24T05:29:17.036906+00:00: annex de Codex integrat amb la pissarra 0720; cap fase executada.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Estat i relació amb la pissarra comuna

Este fitxer és **l’annex tècnic de Codex** del pla compartit [[260924_0720_pla_implementacio_olivera]], no una segona autoritat. S’ha creat abans que apareguera la pissarra comuna i es conserva ancorat com a detall d’execució. Mateix cognom que el prompt Codex: fortificacio_codex. Estat: en elaboració, AFK de producte, consens pendent. Evidència completa i sondes en [[260924_0717_auditoria_codex]].

### Fases proposades i criteris d’acceptació

| Fase | Fitxers/superfície | Canvi concret | Prova per acceptar |
| --- | --- | --- | --- |
| 0. Recuperació governada | core-taxonomia-estricta, catàleg, índexs, SKILLS_SEAL i transaccions | Decidir fusió o skill vàlida; preparar paquet atòmic CAS; diagnòstic diferencial llegible i reconciliació revisada | Segell i inventari passen; les 10 proves Node de fixture deixen de caure; rollback comprovat en temporal |
| 1. Carrils executables | hooks-local, mutation-policy, command-policy, configuració de clients | Capacitats explícites i argv; bootstrap de lease, hash, diagnòstic, verificació aïllada i relleu autoritzat | Un host protegit completa open→seal→mutació de fixture→verificació→tancament; eines desconegudes i scopes aliens denegats |
| 2. Dades | GlobalSaveManager, NotesDataContext, tests Notes | Conservar base del draft; no rebase automàtic contra contingut remot nou | D01 passa a bloquejar/conciliar; recàrrega post409 i dues pestanyes preserven canvis |
| 3. Mitjans i autoria | storage, NotesContext, detailRichText, contracte Notes | Promoció idempotent, errors explícits, resolució del cos; contracte de llicència compatible | Repetir promoció no degrada refs; error no publica; cos carrega imatges; llicència persistix entre recàrregues |
| 4. Rutes i SEO | CoreContentContext, PageDetailSection, ItemDetailSection, sitemap/SEO | Reparar lookup, loading/error/404; sitemap únic i política de metadades de host | Ruta vàlida no redirigix a Mur; desconeguda no indexable; sitemap resoluble i coherent |
| 5. Accessibilitat | PageFrame, editor, Dropdown, onboarding, layout, RouterContext | Dialeg comú; noms i focus; una parada per control; tinta de contrast; ARIA derivada | Repetir passos A01–A06 al navegador; Tab/ShiftTab/Escape, lector, clar/fosc i Shadow DOM |
| 6. Publicació documental | dos plans directors i exportadors públics | Decisió de visibilitat, regeneració revisada i comprovació de tots els formats | Zero cos privat en manifest, RAG, slugs i chunks; públics legítims conservats |
| 7. Coherència i cost | Wiki activa, skills, versions, validators CSS, git-staged | Llevar autoritat duplicada i procediments morts; separar norma de diagnòstic CSS; deduplicar tests per snapshot | Matriu skill→ordre→capacitat completa; versions iguals; fixtures CSS distingixen local vàlid/inexistent/normativament prohibit |

Fases 2–6 es poden preparar en paral·lel en checkouts aïllats després del consens; mai dos agents sobre el mateix fitxer. La fase 1 no s’arregla amb un matcher que deixe MCP fora de control. La fase 0 no es completa només amb `--update`. Mantindre model de dades autoritatiu Supabase, Model B i composició Pedra Seca.

### Incorporació del contrast amb Claude 0716

Afegir X01 a dades/auth: errors OAuth acreditats i missatges controlats, sense etiquetar-ho XSS. Afegir X02/X04 a fase4: URL/canonical/títol del document Wiki i política nofollow interna. Afegir X03 a fase7: dates de procedència, sense fallback a hui. La guarda de consola es revisa al detall Wiki, perquè /consola ja està protegida; verificar que el servei continua només-dev i loopback. No copiar les qualificacions errònies de les línies70–71 del prompt0722. Vegeu proves i límits a l’addenda de l’auditoria.

### Decisions concretes per al consens

1. Conservar o fusionar la skill taxonòmica redundant; la identitat cultural es preserva.
2. Fer privats els **dos** plans directors i fixar publicació explícita per documents nous.
3. Acordar camps de llicència/autoria i migració compatible; no inventar columna existent.
4. Confirmar el host real de producció i el contracte HTML/404/SEO amb Sollutia.
5. Resolver la regla visual de SideBar que contradiu l’ordre humana documentada. No aplicar una neteja de CSS que altere aparença sense pla.

No cal una nova aprovació per continuar esta auditoria o redactar les propostes. La petició actual no autoritza executar les fases de producte abans del consens.

### Política de reparació de la Gàbia

Una capacitat es descriu per operació i efecte, no pel nom informal de l’eina. Lectures confinades i diagnòstics sense escriptura han de tindre una entrada fiable. Tests/builds amb derivats van en runner privat amb sources/lockfile identificats; generats versionats requerixen promoció explícita. Governança conserva lease, snapshot, CAS, verificació i evidència de transacció. CI i proteccions remotes cobrixen el límit declarat dels hooks locals. No ampliar permisos de memòria externa per resoldre un problema que ja té relleu compartit en Wiki.

Alternatives descartades: (a) desactivar Husky/segell o allowlist universal, perquè elimina garanties; (b) afegir una altra skill exhortativa sense mecanisme executable, perquè repeteix el mateix defecte.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Bateria inicial: React217/217, Node217/227 (10 fallades de catàleg), lint i builds directes passen; quatre sondes de dades fallen en el sentit esperat. Cada fase té reproducció abans/després en la taula. Validar canvis en fixtures, després integrar i executar comprovacions de l’arbre exacte. No ampliar baselines per fabricar un verd. La cadena global continua roja.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Pèrdua de drafts si es netegen durant el conflicte; sobrescriptura de mitjans amb upsert indiscriminat; URLs firmades caducades publicades; exclusió accidental de Wiki pública; relaxació de hooks per noms d’eina; modificacions de generats durant check; col·lisió amb treball de Claude/MarIA. Mitigar amb scopes mínims, snapshot, CAS, proves negatives i un propietari per fitxer. Gestoria codex_refactor i zona humana queden intactes.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0717_auditoria_codex]]
- [[260924_0720_pla_implementacio_olivera]]
- [[260924_0652_auditoria_claude]]
