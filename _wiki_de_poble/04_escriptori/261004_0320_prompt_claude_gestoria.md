---
type: prompt
status: esborrany
description: 'Directrius per a Claude: Refactor de Notícies/Nevera a UniversalCard, i fundació de la Gestoria.'
tags:
  - govern
visibility: private
reflex: sdp:torn_8196cc8e-f53a-441c-9151-c484c7f43bd6:332e0a79-8cf7-4a29-ac69-04902f1cec69
---
# Prompt d'Execució Local per a Gestoria

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Revisió prèvia realitzada per l'orquestradora:
1. Cap incidència detectada a les portes prèvies.
2. Context arquitectònic en vigor (llegit i carregat).
3. Contracte actiu.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8196cc8e-f53a-441c-9151-c484c7f43bd6:332e0a79-8cf7-4a29-ac69-04902f1cec69 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T01:16:22.310Z |
| Modificació | 2026-10-04T01:16:22.310Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | 0 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T01:16:22.310Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude! Acabada la teua gran marató de CSS, components i empaquetat del ZIP 1.0.2, el Mestre ens ha deixat les directrius per a aquesta nit. Treballarem sobre tres fronts principals:

**1. APLICAR LA DIRECTIVA "NO INVENTAR TARGETES" A RSS I LA NEVERA**
Durant el disseny, hem detectat que les apps de Notícies (Lector RSS) i La Nevera de Casa (El Rebost) havien inventat dissenys de targetes i estructures pròpies (LlistaArticles, GraellaArticles, quadrícules estranyes amb icones grans) que trencaven l'arquitectura. 
- La teua primera tasca és llegir el fitxer `GESTORIA_REFERENCIA.txt` a l'escriptori per absorbir l'arquitectura.
- Has de refactoritzar de dalt a baix `Noticies del Poble` i `El Rebost` perquè USEN EXCLUSIVAMENT l'`UniversalCard` (per a llistes/graelles) i l'`UniversalEditor` (per al detall).
- Tots els elements (iconografia, doble capçalera) de l'UniversalEditor han d'estar per defecte, i sobre ells, decidirem què apaguem. Esborra o depreca els components residuals (LlistaArticles, GraellaArticles, l'H1 de l'RSS).

**2. ARQUITECTURA DE LA GESTORIA: MODEL ERP (HOLDED / ODOO)**
La Gestoria s'ha d'enfocar EXCLUSIVAMENT com un ERP de facturació i administració.
- La part de creació d'empresa, màrqueting i estudis de mercat (les 15 opcions del passat) **queden descartades del mòdul de Gestoria** i s'hauran d'ubicar en el futur en un mòdul d'"Empresa" o "Formació".
- La Gestoria es concep com un sistema modular pur (estil Odoo amb plugins interns: mòdul de facturació, mòdul d'impostos, mòdul de bancs).
- **Llei Antifrau 2025 (Veri*Factu):** La legislació espanyola exigeix immutabilitat a les factures per a poder enviar-les a Hisenda (AEAT). Tot el mòdul de facturació de la Gestoria de Sóc de Poble ha de nàixer amb un model de dades immutable (un log immutable a l'hora de crear i registrar factures), per complir amb aquest model.

**3. EXECUCIÓ CONTÍNUA (CRON)**
Aquesta sessió de nit requereix que no et detingues fins a tindre-ho tot operatiu. Treballarem en mode bucle si cal, preparant tot per al Mestre. A més, si s'ha de tirar mà d'algun codi ja existent, l'arquitectura base de la gestoria ja es troba dormint a `src/sections/gestoria/` (PanellGestoria, useGestoria, ContenidorGestoria).

**4. XAT OPERATIU I SUPORT MULTIMÈDIA**
El mòdul de Xat s'ha de deixar completament operatiu en aquesta sessió.
- Cal construir i activar la vista de "Contingut Multimèdia" (pestanyes de Fitxers, Enllaços i Documents) que actualment està "En construcció".
- **Trucades de Veu i Vídeo:** S'han d'intentar solucionar de la forma més barata i senzilla possible (ex: WebRTC P2P pur sense costos de servidor). Si l'esforç tècnic o de recursos ho fa inviable per ara, s'ha de deixar preparat l'espai però marcar-ho com a `PENDENT` per a una fase futura.

**5. ENLLAÇ UNIVERSAL DE LA BOINA TARONJA I EDITOR MULTI-TARGETA**
- **Boina d'Autor:** La barra/boina taronja d'autor sempre, absolutament sempre, ha d'enllaçar a la pàgina de l'autor corresponent (ex: si l'autor és "Sóc de Poble", clicant ha de portar a la pàgina del projecte; si és "Javi", a la seua pàgina). S'ha d'assegurar aquest comportament globalment a qualsevol targeta.
- **Inserir Targetes a l'Editor:** Cal implementar la funcionalitat d'inserir targetes completes (`UniversalCard` / `TargetaViva`) directament dins del cos del text en l'`UniversalEditor` (ex: posar la targeta de "Sóc de Poble" dins de la pàgina "El Projecte"). 
  - Si s'insereix 1 targeta: pot anar aliniada a l'esquerra o dreta (width fix a ~360px).
  - Si s'insereixen 2 targetes: han d'anar al centre.
  - Si s'insereixen 3 o més targetes: passen a format de graella.
  - S'ha de tractar la inserció d'una targeta com si fos incrustar una imatge o un bloc autònom.

**6. AUDITORIA VISUAL DE LA CONSOLA I RIGOR EN TARGETES**
El Mestre ha auditat visualment la Consola Termodinàmica i hi ha diverses infraccions greus de disseny que has de solucionar esta nit:
- **Inputs de Fitxer Lletjos:** Al sentinella "Enllaç del Torn" hi ha un `<input type="file">` natiu del navegador ("Ningún archivo seleccionado") completament fora de l'estil Pedra Seca. S'ha de dissenyar bé.
- **Targetes Falses a "El Mas en xifres":** Les targetes de mètriques de baix no són `UniversalCard` autèntiques, o n'estan abusant. Tenen una boina taronja amb el logo de "Sóc de Poble" i "Consola Termodinàmica", i no són clicables de dalt a baix. **Requisit:** Has de convertir-les en targetes 100% autèntiques, respectant la norma: si són de sistema no han de fingir una boina d'autor; tota la targeta ha de ser clicable per anar a la pàgina de detall (sense excepcions); i el botó del peu blau ha de complir l'estàndard (res de posar-se creatiu amb "Veure detall", l'estàndard de l'UI manava "Connectar" o accions canòniques equivalents segons Pedra Seca).
- **Anatomia Estricta (El cas del Vehicle Compartit):** El Mestre ha detectat que aplicacions com "Vehicle Compartit" col·loquen la imatge per damunt de la boina taronja de l'autor. Això és una infracció greu de l'anatomia del component. En qualsevol `UniversalCard`, la boina taronja de l'autor va **SEMPRE a dalt de tot**, seguida pel cos de la targeta (que pot contenir la imatge i els textos) i finalment el peu blau. Repassa-ho i arregla-ho a tot el sistema.
- **Imatges Fantasma (Targetes vs Pàgines):** Si una pàgina (com la de Vehicle Compartit) té una imatge `hero` (el 600), la seua `UniversalCard` associada ha de mostrar aquesta mateixa imatge per defecte. Si mostra una altra imatge (com la furgoneta "El Titi"), és perquè hi ha dades "fantasma" hardcodejades als components del Panell de Control. S'ha de purgar qualsevol hardcodeig perquè la targeta reflectisca fidelment l'heroi de la pàgina.
- **Botonaco de Publicar a la UniversalPage:** A les pàgines d'explicació de publicació (ex: "Publicar al Mur", "Publicar al Mercat"), el botó gran blau de "Publicar" (l'acció principal) està amagat al final del text. Has de posar un botó idèntic gegant a la part superior (just baix del H1, a la zona on anirien les etiquetes). No importa la redundància de tindre'l a dalt i a baix; la finalitat de la pàgina ha de quedar evident només entrar.
- **Mètriques Totals Visibles:** Assegura't que totes les mètriques i llistats de coses a arreglar (skills orfes, fantasmes, línies mal formades, etc.) apareguen explícitament i detalladament dins d'estes vistes. No s'ha d'escapar cap anomalia del "brain" sense mostrar-se a la Consola.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Llegir `GESTORIA_REFERENCIA.txt` i analitzar l'estat actual de `src/apps/lector/` i `src/apps/nevera/`.
- T2: Refactoritzar l'RSS i la Nevera per eliminar els invents de targetes i usar l'`UniversalCard` estàndard a tot arreu.
- T3: Analitzar i documentar l'arquitectura del nou mòdul modular de Gestoria i dissenyar el model de dades de facturació immutable (Veri*Factu/Llei Antifrau).
- T4: Crear un pla d'implementació per als mòduls de la Gestoria i iniciar la reconstrucció de `PanellGestoria.jsx`.
- T5: Rematar el Xat (Pestanyes multimèdia operatives i recerca de via P2P per a veu/vídeo).
- T6: Enllaçar correctament la boina taronja d'autor cap als seus perfils de forma universal.
- T7: Implementar la funcionalitat "Inserir Targeta" a l'UniversalEditor, gestionant l'alineació (1 esquerra/dreta a 360px, 2 al centre, 3+ en graella).
- T8: Corregir el disseny de l'input de fitxer al sentinella i convertir les mètriques de "El Mas en xifres" en `UniversalCard` autèntiques, clicables, amb la capçalera/peu correctes i exposant totes les anomalies orfes/fantasmes detectades.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** RSS i Nevera fan servir UniversalCard. La Gestoria s'ha separat clarament dels estudis de màrqueting i incorpora disseny immutable per a factures. S'han eliminat components `LlistaArticles` / `GraellaArticles` redundants o s'han buidat amb TODOs cap a UniversalCard. El Xat té el suport multimèdia actiu.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Trencament de l'estat en substituir LlistaArticles a Notícies del Poble (l'estat "Llegit" / "Nou" ha de mapejar-se als props de UniversalCard).
- Les comunicacions P2P de veu i vídeo del Xat poden ser inestables si s'intenta evitar l'ús d'un servidor intermedi.

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
