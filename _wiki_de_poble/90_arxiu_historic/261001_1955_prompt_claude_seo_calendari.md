---
type: prompt
status: esborrany
description: 'Petorreta per a Claude: Implementar redirecció SEO per a rutes SPA (calendari) a WordPress.'
tags:
  - govern
visibility: private
reflex: sdp:torn_129a46a2-62a3-4d35-8df9-30622ab76687:444e15f4-0f00-4424-b1d6-55120d01e238
---
# Petorreta per a Claude: Redirecció SEO per al calendari i rutes de l'SPA a WordPress

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_129a46a2-62a3-4d35-8df9-30622ab76687:444e15f4-0f00-4424-b1d6-55120d01e238 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T17:55:28.885Z |
| Modificació | 2026-10-01T17:55:28.885Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T17:55:28.885Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude. L'aplicació SPA s'ha integrat correctament com a plugin de WordPress (enxufe). El paquet funciona, però el Mestre ha detectat un defecte crític pel que fa al SEO i l'enrutament un cop la SPA està dins de WordPress.

Actualment, quan l'usuari navega pel portal i entra al "Calendari", la URL no reflecteix la ruta ideal (com ara `gentdelatorre.net/calendari`). El Mestre ens demana que establim la "redirecció bona" per a aconseguir un SEO perfecte.

La teua missió és dissenyar i implementar el mecanisme d'enrutament perquè les seccions de la SPA (com `/calendari`) actualitzen de forma elegant la URL del navegador sense trencar el WordPress, i viceversa: si algú entra directament a `gentdelatorre.net/calendari`, el plugin de WordPress ha de saber servir la SPA en eixe punt, evitant un 404 del backend de WordPress.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Analitzar com el mecanisme d'enrutament de la nostra SPA interactua actualment amb la URL quan està embegut al WordPress.
- T2: Implementar la lògica necessària al plugin de WordPress (`socdepoble-enxufe.php` o similar) per a registrar regles de reescriptura (Rewrite Rules) que intercepten les rutes de l'SPA (ex: `/calendari`) i servisquen la pàgina del portal sense donar error 404.
- T3: Adaptar l'SPA perquè en navegar internament (history API) reflectisca les rutes netes a la barra d'adreces de WordPress.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** 
  - Clicar "Calendari" a la SPA canvia la URL a `URL_DEL_LLOC/calendari`.
  - Recarregar la pàgina `URL_DEL_LLOC/calendari` carrega la SPA directament amb la vista del calendari oberta i funciona fluidament.
  - El SEO i les meta-etiquetes d'eixa URL són aprofitables per a indexació.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Conflicte amb els Permalinks nadius de WordPress. S'ha de garantir que la nostra reescriptura de rutes no trenque l'accés a pàgines, entrades, o al propi tauler d'administració de WP.

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
