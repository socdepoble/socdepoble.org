---
type: prompt
status: esborrany
description: Injecció de les targetes dels plugins i amagar portada a les UniversalPage
tags:
  - govern
visibility: private
reflex: sdp:torn_a30329e9-cd8b-45b9-a78c-411c66d537d9:a9e52264-2890-43ad-b930-70f2ba6fcf7f
---
# Prompt Passada 7

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[x] **Escriptori net i indexat**
[x] **Pla d'Implementació** generat (261004_0014_pla_implementacio_maria.md)
[x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a30329e9-cd8b-45b9-a78c-411c66d537d9:a9e52264-2890-43ad-b930-70f2ba6fcf7f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T22:15:55.929Z |
| Modificació | 2026-10-03T22:15:55.929Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | claude-3-5-sonnet |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T22:15:55.929Z: esborrany creat; contingut i verificació pendents.
2026-10-04T00:15: Es llança la Passada 6 perquè Claude reprenga el control després del tancament de la sessió de la Passada 5.
2026-10-04T00:40: Es llança la Passada 7. La Passada 6 (regressió UniversalCard) ha finalitzat. S'ha comprimit i corregit els noms de les imatges.

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

La teua sessió anterior (Passada 6) ha finalitzat correctament l'actualització d'arquitectura de la UniversalCard. Aquesta és la Passada 7. Llum verda absoluta! 

1. **Ajust de Disseny (Escala Pedra):** El Mestre ha revisat el resultat visual del requadre de les dates (`squareBadge`). Ha vist que el botó/fons és "massa negre" (segurament està usant `--sdp-pedra-900`) i crida massa l'atenció de forma bèstia a totes les targetes. Afluixa'l. Canvia el color de fons del badge a "negre grafit". Prova amb `--sdp-pedra-700` (Grafit) o com a molt `--sdp-pedra-800` (Carbó).
2. **Ajust de Disseny (H2 a UniversalPage i Jerarquia):** L'encapçalament secundari (H2) que es mostra a l'interior de la `UniversalPage` (per exemple, "Comparteix pensaments, notícies...") és absolutament gegant. S'ha passat de grandària i és molt més gran que l'H1 de la TopBar. Redueix el `font-size` de l'H2. A partir d'ara, actua com un Director de Disseny aplicant els criteris d'**Impeccable i Emil Kowalski**: volem jerarquies tipogràfiques perfectes, espaiats coherents (sense errors d'escala a mòbils) i eliminació total de solucions genèriques (AI slop). Revisa l'escala tipogràfica al corregir l'H2.
3. **Confirmacions prèvies:** MarIA ja ha netejat i comprimit els noms de les 11 il·lustracions exactament com demanaves (format `*_vinyeta.jpg`, d'uns 160KB cadascuna). Confirmem que la "doble presència" és correctíssima i intencionada: a dalt com a dreceres d'acció, i a baix a la graella com a plugins per dret propi.

4. **Injecció de les 11 Utilitats/Plugins:** Has d'injectar les `UniversalCard` per a totes elles dins de `ControlSection.jsx` i preparar les rutes (o el toggle per obrir les UniversalPages). Les utilitats són:
   - Mapa (`mapa_vinyeta.jpg`)
   - Vehicle Compartit (`vehicle_vinyeta.jpg`)
   - Animalets (`animalets_vinyeta.jpg`)
   - Gestoria (`gestoria_vinyeta.jpg`)
   - Rebost Domèstic (`rebost_vinyeta.jpg`)
   - Salut / El Mas (`salut_vinyeta.jpg`)
   - Consola Termodinàmica (`consola_vinyeta.jpg`)
   - El Cervell (`cervell_vinyeta.jpg`)
   - Lector RSS (`rss_vinyeta.jpg`)
   - TPV / Bar Casino (`tpv_vinyeta.jpg`)
   - Bàscula de Cooperativa (`bascula_vinyeta.jpg`)

   Utilitza `/assets/ui/plugins/X_vinyeta.jpg` com a base per a les rutes de les imatges. Totes aniran dins la categoria `plugins` del ControlSection.

5. **Hero Image Toggle a les UniversalPage:** Llig l'actualització de `261003_2320_directriu_arquitectura_plugins.md`. Les `UniversalPage` d'aquestes utilitats mostraran la imatge (Hero Image) per defecte, però han d'implementar un interruptor/toggle a la pròpia pàgina o al seu context perquè l'usuari puga amagar eixa imatge gegant i guanyar espai vertical per a treballar (ex: al Gestor o a la Bàscula). L'estat de visibilitat ha de ser reactiu i mutable pel client.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Modificar el color de fons del `squareBadge` a `UniversalCard.jsx` perquè siga grafit (`--sdp-pedra-700`).
- T2: Corregir l'escala de l'H2 a l'interior de la `UniversalPage` per reduir-ne la grandària desproporcionada actual.
- T3: Injectar les 11 `UniversalCard` dels plugins a `ControlSection.jsx`.
- T3: Crear l'esquelet funcional de les `UniversalPage` o components de pàgina per a cada plugin, incloent-hi la funció per ocultar l'Hero Image.
- T4: Actualitzar l'auditoria a `_wiki_de_poble/04_escriptori/`.

### Criteris d’acceptació i reproducció
- **URL de proves locals:** `http://localhost:8340`
- **Criteris d'Acceptació:** 
  1. `UniversalCard` renderitza les dates al badge quadrat gris sense fallos visuals.
  2. Les 11 targetes de plugins són visibles al Control.
  3. Clicar en una obre la seua pàgina on es pot amagar la il·lustració superior a voluntat amb un botó o toggle de preferències.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Enrutament intern defectuós per a les noves utilitats. Trencament visual per imatges massa grans si el contenidor no respecta el full bleed (tot ha d'anar lligat a UniversalCard).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 6d988b3a752dac3f4108497058a90efbf107d50b70e5e25c3557edb20653ff0a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
