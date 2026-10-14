---
type: prompt
status: esborrany
description: 'Encàrrec per a Claude: Escàner Local automàtic de carpeta RAW, vista Cabina d''Avió, boina amb data/hora vives i jerarquia visual taronja.'
tags:
  - govern
visibility: private
reflex: sdp:torn_7029462e-87cc-472a-b96e-a87df295d54e:a3094c88-088b-499f-af17-25e989fefc20
---
# Prompt Claude · Gestoria JARVIS, Escàner de Carpeta i Cabina d'Avió

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'implementació vinculat: [[261013_1405_pla_implementacio_gestoria_jarvis]] (estat: aprovat pel Mestre).
- Reconeixement de l'usuari humà: El Mestre Javi Llinares té la sessió iniciada a l'entorn local (`socdepoblecom@gmail.com`).
- Directiva de l'Olivera: Treball conjunt MarIA (Direcció Tècnica), Claude (Enginyeria i Execució) i ChatGPT/Codex (Auditoria Adversarial i Investigació d'Avantguarda).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7029462e-87cc-472a-b96e-a87df295d54e:a3094c88-088b-499f-af17-25e989fefc20 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T12:04:23.274Z |
| Modificació | 2026-10-13T12:08:00.000Z |
| Propietari | agent-local (IAIA MarIA) |
| Aprovació humana | aprovat de paraula pel Mestre |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Gemini 3.8 Flash (Orquestradora IAIA MarIA) |
| Tokens consumits | ~0.15M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-13T12:04:23.274Z: esborrany creat.
2026-10-13T12:08:00.000Z: encàrrec redactat amb les directives del Mestre per a la Gestoria JARVIS i l'Escàner de Carpeta.
2026-10-13T12:28:00.000Z: actualitzat a plantilla v3.7.0 incorporant la clàusula 5 de desconvocatòria i tall tèrmic de crons («Cadascuna a sa casa»).

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Claude, el Mestre ha estat provant en viu el sistema a localhost i ha definit una visió revolucionària per a la Gestoria: **«Suferiment ZERO per a l'autònom» en Mode JARVIS**.

L'autònom no ha d'anar triant fitxers un a un ni barallar-se amb formularis feixucs. Té una carpeta física sencera a l'ordinador (com la nostra carpeta germana `_gestoria_de_poble/`, que conté `01_Identitat_Legal`, `02_Facturacio/2026_Bancs/` amb extractes com `cajamar_2026.csv`, i els trimestres amb factures). La Gestoria ha de ser capaç d'agafar la carpeta completa, analitzar-la de dalt a baix, detectar comptes, duplicats, buits i omplir la realitat de l'empresa d'un sol colp d'ull.

A més, cal polir la identitat activa (avatar a la barra negra, boina taronja amb data/hora vives a tota la gestoria), afegir la vista «Cabina d'Avió» d'alta densitat d'instruments, i atendre les millores visuals de la Consola Termodinàmica (imatges rurals, índex i diagnòstic en text continu al final).

> **REPETICIONAL I LLEI DE LA CAUSA ARREL (Mestre Javi):** Si trobes un obstacle o fallada, **prohibit demanar disculpes o fer pedaços buits**. Analitza què ha fallat, quina és la causa arrel exacta, quines opcions tenim sense desmuntar el sistema i presenta una solució resilient que deixe les proves en verd.

Executa el pla [[261013_1405_pla_implementacio_gestoria_jarvis]] amb la màxima solidesa i sense trencar cap prova existent.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1: Avatar a la Barra Negra Superior (`IdentitatContext`)
- Modifica `src/app/contexts/IdentitatContext.jsx` perquè, en sessió activa, hidrate el perfil (`avatar_url`, `full_name`) des de la taula `public.profiles`.
- Assegura que `BotoIdentitatActiva.jsx` pinte la imatge de l'avatar de Javi Llinares a la barra negra en lloc de recaure en la lletra «S».

### Tasca 2: Boina Taronja Viva a TOTA la Gestoria (Avatar, Nom i Rellotge Permanent)
- A `src/sections/gestoria/tauler/ShellGestoria.jsx`, `Tauler.jsx`, `Facturacio.jsx`, `PanellEscaner.jsx`, `Historic.jsx` i a totes les vistes/cards de la gestoria:
  * **Identitat:** Si hi ha un usuari autenticat (Javi Llinares / `socdepoblecom@gmail.com`), la barra/caputxa taronja de TOTES les pàgines ha de mostrar automàticament el seu avatar i el seu nom («Javi Llinares · La Torre de les Maçanes»). Mai ha de recaure en «Titular sense configurar» si hi ha sessió, ni pintar «Sóc de Poble» amb el logo corporatiu a la Facturació.
  * **Data i Hora Permanent (Innegociable):** A l'extrem dret de la barra taronja, la **data i l'hora actual han d'estar SEMPRE visibles** com a recurs del sistema en temps real (rellotge viu/actualitzat). Mai s'ha d'eliminar ni ocultar la data i l'hora de la barra o caputxa taronja sota cap concepte.

### Tasca 3: Jerarquia Visual de Menú Lateral en Taronja
- A `src/css/layout.css`, `src/css/modules.css` i la BarraApp:
  * Els títols de grup, capçaleres de categoria i elements desplegables que no siguen enllaços directes (com `Sistema` al menú principal, o `Operacions`, `Diners i impostos`, `Arxiu i eines` a la Gestoria) s'han d'estilitzar amb `color: var(--sdp-primary)` (taronja de Pedra Seca) i tipografia seminegre (`font-weight: 600`), perquè es diferencien d'un colp d'ull dels enllaços blancs navegables.

### Tasca 4: Escàner Local JARVIS & Ingesta Automàtica RAW (`/app/gestoria/escaner`)
- A `src/sections/gestoria/escaner/PanellEscaner.jsx` i `useGestoria.js`:
  * Implementa el selector de carpeta (`showDirectoryPicker()` amb fallback a `input[webkitdirectory]`/fitxers múltiples).
  * En rebre la carpeta (com `_gestoria_de_poble/`), recorre automàticament les subcarpetes:
    - Extreu els extractes de `02_Facturacio/2026_Bancs/` (`cajamar_2026.csv`, Norma 43).
    - Classifica les factures dels trimestres (`2026_1T`, `2026_2T`, `2026_3T`, `2026_4T`).
    - Detecta duplicats o incongruències de dates.
    - Connecta aquestes dades directament amb el Tauler i amb el model de `gestoriaBancs.js` i `targetesTauler.js`.

### Tasca 5: Vista «Cabina d'Avió / Cockpit» al Tauler Central
- A `src/sections/gestoria/tauler/Tauler.jsx`:
  * Afig al commutador de vistes: `Targetes | Cabina d'Avió | Vista comprimida`.
  * La vista «Cabina d'Avió» és un panell d'alta densitat d'instruments estil Odoo/Holded per a decisió executiva:
    - Ràtios de liquiditat i dies de cobertura de caixa.
    - Estimació viva del model 303 (IVA) i 130 (IRPF).
    - Gràfics densos de barres de flux mensual.
    - Alertes de venciment tributari.
  * La vista «Targetes» manté les Universal Cards amb les il·lustracions rurals intactes.

### Tasca 6: Consola Termodinàmica Neta, Imatges Rurals, Índex i Diagnòstic en Text Pla
- A `src/sections/consola/ConsolaTermodinamica.jsx` i `.agents/`:
  * **Imatges rurals a les Cards:** Connecta les il·lustracions artístiques de Pedra Seca (de `_wiki_de_poble/assets/`) a les capçaleres de les targetes de la Consola Termodinàmica.
  * **Índex i Diagnòstic en Text al peu:** Afig al final de la Consola un índex d'accés ràpid a les seccions i un bloc de text continu (`<pre>` estilitzat amb Pedra Seca) que mostre el resum complet de salut en text pla d'un sol colp d'ull.
  * **Cens de Skills:** Registra `core-direccio-autonoma` i `core-informes-pdf` a `.agents/skills_index.json` i crea els seus enllaços a `.claude/skills/`.

### Tasca 7: Destil·lació del Laboratori d'Investigació IA (`02_investigacio_ia/`) i Llei de l'Oblit Saludable
- Revisa el contingut real de les quasi 60 carpetes i fitxers a `_wiki_de_poble/04_escriptori/02_investigacio_ia/`:
  * **La IA és intel·ligent perquè destil·la, no perquè acumule:** No volem 58 carpetes ocupant espai si no s'utilitzen.
  * Fes un estudi crític del material: extrau els enllaços d'or de GitHub, biblioteques i skills d'avantguarda que realment servisquen a la visió rural i descentralitzada de Sóc de Poble.
  * Condensa aquest valor en un document de referència canònic o skill a la Wiki (`_wiki_de_poble/`).
  * Mou el material obsolet, zips o proves superades a `_wiki_de_poble/90_arxiu_historic/`, deixant `02_investigacio_ia/` net i destil·lat.

### Tasca 8: Fitxa d'Identitat Privada Sobirana & Auto-ompliment a la Finestreta Única
- Consulta la carpeta `../_gestoria_de_poble/01_Identitat_Legal/` per extraure les dades administratives reals de Javier Llinares García (DNI/NIF, NAF Seguretat Social, domicili fiscal La Torre de les Maçanes, dades RETA, referències SUMA/cadastre):
  * **Estructuració a la Fitxa Privada:** Dissenya i hidrata aquests camps a la fitxa privada de l'usuari (`public.profiles` / magatzem local privat del Universal Workspace).
  * **Preparació per a la Finestreta:** Deixa el model a punt perquè quan l'usuari vulga omplir un tràmit administratiu de la Generalitat o municipal, el sistema puga auto-completar el formulari a l'acte per ser signat digitalment.
  * **Regla estètica:** No toques ni reemplaces les imatges de portada ni l'avatar de perfil (això ho farà el Mestre personalment); centra't en l'estructura de camps i la precisió de les dades legals.

### Tasca 9: Xarxa Social Multiactor Operativa (Javi Llinares · Sóc de Poble · El Rentonar · IAIA MarIA)
- **📢 DIRECTIVA EN VIU DEL MESTRE JAVI (17:35h):** El Mestre s'ha tornat a autenticar al navegador (`http://localhost:3340/`) amb `socdepoblecom@gmail.com` i està creant les organitzacions **Sóc de Poble** i **El Rentonar**.
- **Objectiu:** Claude ha d'assegurar que el sistema reconega i gestione perfectament els rols de Javi:
  1. **Com a Usuari Normal (Persona física):** Perfil de Javi Llinares amb avatar de la samarreta verda, capçalera de festa guardada, publicacions pròpies al Mur, l'ordinador en venda al Mercat, i boina activa a Notes Personals (mai «Foraster»).
  2. **Com a Administrador / Superadmin:** Capacitat de gestionar la plataforma, moderar i supervisar sense perdre la identitat personal.
  3. **Com a Organitzacions Multiactor:** Commutació fluida entre Javi Llinares, Sóc de Poble (`socdepoble`) i El Rentonar (`rentonar`), de manera que quan publique o entre a Gestoria/Mur en nom d'una organització, el context i la marca siguen els de l'entitat.
  4. **Resolució de Propietat:** Si la BD local ja contenia `socdepoble`, reconèixer a `socdepoblecom@gmail.com` com a propietari legítim perquè no aparega l'error de registre.
### Tasca 10: Llei de Correspondència Card ↔ Pàgina (Hero Image) sense Excepcions (Ordre del Mestre, 17:55h)
- **📢 DIRECTIVA VISUAL DEL MESTRE JAVI:** «Una pàgina i una card són el mateix, la card és una miniatura de la pàgina. Amb la qual cosa, eixes imatges que has posat a les cards han de ser equivalents a la seua pàgina... cada pàgina ha de tindre la seua pròpia imatge perquè la card la té. Treballem sense excepcions».
- **Objectiu:** A `ConsolaSection.jsx` i a les subpàgines de la Consola (`/consola`, `/consola/pols`, `/consola/explorador`, etc.):
  * Passar a `UniversalPage` la prop `heroImage` i `heroAlt` corresponent (`imatgeDePagina(id).imatge` i `imatgeDePagina(id).imatgeAlt`).
  * Evitar que la pàgina de detall caiga en el logotip negre genèric de sistema quan la seua card ja té una il·lustració artística triada a `imatgesConsola.js`.
  * Garantir la correspondència 1:1 estricta entre la miniatura de la targeta i la capçalera de la pàgina universal.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Zero Fuita de Dades:** Tot el procés de l'Escàner de Carpeta és 100% local a la memòria del navegador. Cap byte financer ix de l'ordinador ni es transmet a cap xarxa externa.
- **Resiliència de la File System API:** Mantenir el selector clàssic de fitxers si el navegador no té suport per a `showDirectoryPicker`.
- **Integració de Proves:** Les 8.158 proves existents de la suite han de continuar en verd. Crea proves per als nous components i la reconciliació de la carpeta.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 c7f9cebc8d206eb7bda0ce5e74b7f2f69489818cb35b733024a8181eb6645b11. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
