---
type: prompt
status: esborrany
description: Petorreta per a Claude perquè auditi i integri el tractor cognitiu interactiu.
tags:
  - govern
visibility: private
reflex: sdp:torn_149204a4-976a-41d7-adea-b6bde5563d2a:283843ce-2f2c-486c-903b-7520d9644dde
---
# Revisió i integració del Tractor Cognitiu

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: La `porta-olivera` ha donat verd.
- [x] **Pla d'Implementació**: Es sol·licita l'avaluació estratègica de Claude abans de fer el pla.
- [x] **Rebut obtingut**: Fet.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_149204a4-976a-41d7-adea-b6bde5563d2a:283843ce-2f2c-486c-903b-7520d9644dde |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T02:51:04.141Z |
| Modificació | 2026-09-30T02:51:04.141Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.1.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T02:51:04.141Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude! Mentre eres fora implementant la UI de la Consola, hem detectat que la neteja mecànica basada en llistes negres (`neteja_brossa_arrel.mjs`) no és suficient. S'estan acumulant fitxers orfes (auditories, proves `.mjs`, etc.) a l'arrel de l'espai de treball `Som de Poble/`.

He redactat un esborrany inicial d'un **Tractor Cognitiu Interactiu** a `tooling/higiene/tractor_cognitiu.mjs`. La idea inicial era preguntar al Mestre per la terminal què fer amb cada fitxer orfe.

No obstant això, el Mestre ens ha donat una directriu molt clara de **Zero Fricció** per a esta tasca:
> "No voy a abrir el terminal para lanzarlo. Esto tiene que ser cosa tuya que lo hagas de forma instintiva... como un sistema nervioso que sabe qué hay que limpiar y lo tiene claro. Cuando acabe de mirarlo Claude se implementa de la mejor forma posible y se informa como siempre en nuestra consola."

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Revisa l'enfocament:** Llig `tooling/higiene/tractor_cognitiu.mjs` i proposa com podem convertir-lo en un autèntic "acte reflex" de la IAIA MarIA. En lloc d'esperar *input* del teclat humà, hauria de ser un procés on la IA llig els orfes i decideix el destí, o directament una heurística millorada.
2. **Integració a la Consola:** El Mestre vol que l'estat d'aquesta higiene i les accions preses es reporten visualment a la Consola (`ul.sdp-consola__estats`) que estàs desenvolupant ara mateix. Dissenyem com alimentar eixa interfície amb les dades del tractor.
3. **Formalització de la Skill:** Transforma aquest concepte en una skill canònica per a MarIA (actualitzant o substituint `core-neteja-brossa`) que s'execute instintivament i ho reporte.
4. **Tractor per a Exportacions i Zips:** El sistema ara mateix embruta l'arrel deixant els compilats (`.zip`) en directoris arbitraris (com `/scratch/` ahir o a l'arrel de `socdepoble.org` hui). Dissenya i defineix l'estàndard arquitectònic i un tractor per centralitzar qualsevol paquet compilat llest per a producció (ex: plugins de WP) cap a una carpeta específica (ex: `01_produccio/plugins_compilats/`) de forma estricta.
5. **Full-Screen a Temes de Blocs (FSE):** La plantilla clàssica `pantalla-completa.php` del plugin està sent ignorada pels temes moderns de WordPress (com Twenty Twenty-Five), deixant la capçalera i el peu visibles. Implementa la solució tècnica necessària (ex: registre de *block templates* o injecció FSE) perquè el plugin oferisca una plantilla genuïnament 100% full-screen en la nova era de WordPress.

*(No cal que executis ni esborris fitxers ara, només analitza, planifica i audita el codi del nou script i la proposta de rutes. Per al punt 5, si cal codi per al plugin, proposa'l).*

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Esborrar o arxivar fitxers útils del Mestre per excés de zel heurístic sense confirmació humana interactiva.
- Desestabilització del flux si el nou reflex no s'integra bé amb els *hooks* actuals.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 74786a2ee504fa2234f0e9b79c3bc0ae140288823196482702e5f2f78a8783c9. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
