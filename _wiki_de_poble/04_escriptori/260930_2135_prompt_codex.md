---
type: prompt
status: esborrany
description: Petorreta perquè Codex s'encarregue de l'enxufabilitat WordPress, acabat del plugin i auditories cada 5 minuts.
tags:
  - govern
visibility: private
reflex: sdp:torn_f6977ae0-803e-4cfb-8c54-80d3ebad3e6b:dfc20eab-f64d-41ea-a323-202a6fdd14c5
---
# Prompt Enxufabilitat i Auditories Adversarials per a Codex

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f6977ae0-803e-4cfb-8c54-80d3ebad3e6b:dfc20eab-f64d-41ea-a323-202a6fdd14c5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:35:50.411Z |
| Modificació | 2026-09-30T19:35:50.411Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T19:35:50.411Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

El Mestre ha ordenat iniciar la implementació completa de l'Enxufabilitat de Sóc de Poble (Sollutia/WordPress) i els acabats del Plugin de WordPress. Se t'ha emparellat amb **Claude**, que treballarà paral·lelament en la UI/UX del Clon de WhatsApp.
Com a part de la vostra dinàmica, heu de realitzar **auditories adversarials creuades cada 5 minuts**. Això vol dir que, mentre desenvolupes el codi d'enxufabilitat, Claude revisarà el que fas, i tu hauràs de revisar els canvis de Claude. No et xocques amb Claude als arxius de la UI del Xat; tu centra't en la robustesa del plugin, els components base i l'arquitectura d'incrustació (`PedraSecaEmbed.jsx`, l'empaquetat, `layout.css`, etc.).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Refinar i endurir l'enxufabilitat màxima del plugin de WordPress. Cal garantir que l'App funciona perfectament encastada (sense trencar dissenys del tema pare) i independent del servidor de Sollutia.
- **T2:** Revisar la solució afegida recentment per l'arquitecte (MarIA): per resoldre la desaparició de la barra mòbil en pantalles desktop estretades, s'ha aplicat `.is-compact` a `.sdp-root` (App.jsx) i s'han passat algunes `@media` de `layout.css` a `@container` amb `container-type: inline-size;` a `base.css`. Audita-ho i certifica'n la robustesa.
- **T3:** Realitzar una auditoria adversarial (creuada) de la feina de Claude en el clon de WhatsApp cada 5 minuts i reportar els resultats a `04_escriptori/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Conflictes amb Claude:** Claude està construint les pantalles i rutes de `/xat`. Vigila quan toques rutes mestres (`App.jsx`, `ActorRoutes`) per evitar xafar la seua feina. Usa l'escriptori per coordinar-te.
- **Compatibilitat `@container`:** Comprova que el contenidor no crea un "containing block" innecessari que destrosse elements `fixed` si el contenidor de WordPress pren una alçada diferent a la del viewport. Elabora solucions robustes si hi ha defectes tècnics derivats.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
