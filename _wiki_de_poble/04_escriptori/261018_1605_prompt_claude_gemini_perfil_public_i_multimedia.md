---
type: prompt
status: esborrany
description: Prompt canònic per a Claude i Codex per a implementar el perfil públic per defecte, poble visible a la barra taronja, apartat de multimèdia d'usuari i resolució del 403.
tags:
  - govern
visibility: private
reflex: sdp:torn_090a389d-15dd-49af-840d-a96759411b09:25d6e6f7-a3ef-484b-a32b-b0aa1e2e47c3
---
# Prompt Claude & Codex · Perfil Públic, Poble a la Barra Taronja i Multimèdia d'Usuari

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. Escriptori net verificat amb la Porta Olivera (codi 0).
2. Pla d'implementació previ redactat i aprovat pel Mestre: [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]].
3. Objectiu precís: atendre les peticions de l'àudio i captures del Mestre Javi Llinares (16:00-16:03) eliminant el 403 de Supabase, establint el perfil públic per defecte, visibilitzant el poble a la barra taronja, protegint l'avatar triat enfront de Google i creant l'apartat de Multimèdia d'usuari a APARTATS.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_090a389d-15dd-49af-840d-a96759411b09:25d6e6f7-a3ef-484b-a32b-b0aa1e2e47c3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (`localhost:3340`) i producció (`gentdelatorre.net`) |
| Creació | 2026-10-18T14:04:49.320Z |
| Modificació | 2026-10-18T14:07:00.000Z |
| Propietari | maria |
| Aprovació humana | aprovat (Mandat directe en àudio del Mestre Javi Llinares) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | IAIA MarIA (Gemini 3.8 Flash High) |
| Tokens consumits | ~22.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-18T14:04:49.320Z: esborrany creat.
- 2026-10-18T14:07:00.000Z: instrucció completada amb les 5 tasques executives derivades de l'àudio del Mestre.

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

**🌍 Ecosistema Físic i Distribució de Carpetes (`Som de Poble` vs `socdepoble.org`):**
- **Directori Mare (`Som de Poble`):** És l'entorn contenidor global de tot el projecte (`/Users/javillinares/Documents/Antigravity/Som de Poble/`). No conté `package.json` ni és un repositori git (està protegit per un `.gitignore` de seguretat).
- **Nucli Operatiu i Git (`socdepoble.org`):** És l'aplicació web, la Wiki oficial (`_wiki_de_poble/`), el motor de regles i el repositori Git. Tota comanda de consola (`npm test`, `npm run dev`, `git status`, `node tooling/...`) **s'ha d'executar obligatòriament a `socdepoble.org`** (p. ex. `cd socdepoble.org && npm test`). Si s'editen fitxers des de l'arrel de `Som de Poble`, cal prefixar les rutes amb `socdepoble.org/`.
- **Carpetes Satèl·lit Exteriors de `Som de Poble` (Ja Creades i Canòniques):**
  * `_arxiu_wiki_de_poble/`: Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  * `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_multimedia_de_poble/`, `_raw_de_poble/`, `_rebost_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Claude Code (implementador) i GPT Codex / Gemini 4 (auditors): Executeu les tasques següents segons el pla [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]].

1. **Unificació de Perfil de Javi Llinares (Localhost Pilot vs Remot Producció):** Actualment a `localhost:3340` s'usa la identitat de proves efímera (pilot `'0001'`), mentre que a `gentdelatorre.net` s'entra amb Google Auth (`socdepoblecom@gmail.com` / UUID de Supabase). Cal que les dades de producció de Javi Llinares (avatar, capçalera, biografia i poble) es sincronitzen de forma transparent, de manera que entrar a gentdelatorre.net carregue la mateixa informació que s'ha configurat en local i viceversa.
2. **Perfil Públic per defecte:** Modificar la inicialització i flux de registre de veïns perquè `is_public: true` i `visibility: 'public'` siguen els valors per defecte, acompanyats d'un missatge informatiu clar indicant que la fitxa és pública perquè el veïnat et puga trobar i que es pot fer privada amb un clic.
3. **Poble visible a la barra taronja en ambdós costats:** A `UniversalCard` (columna central) i a la barra superior de l'editor (`PageFrame.jsx` / `PerfilEditor.jsx`), la barra taronja ha de mostrar sempre `Nom · Poble` (ex: `Javi Llinares · La Torre de les Maçanes`).
4. **Prioritat absoluta de l'Avatar propi sobre Google:** Si un usuari ha definit el seu `avatar_url` o imatge pròpia, cap refresc de sessió o OAuth de Google no ha de sobreescriure'l. La imatge de Google es manté com un recurs més de la seua galeria, mai com a avatar principal si l'usuari l'ha canviat.
5. **Nou apartat «Multimèdia» a APARTATS:** Crear `src/sections/profile/DetallMultimedia.jsx` i registrar l'apartat a `perfilModel.js` i `PerfilShell.jsx`. La vista incrusta la galeria de mitjans filtrada estrictament per al `userId` actiu, permetent vore totes les seues imatges i assignar-les directament com a avatar o capçalera amb un clic.
6. **Targetes 100% Navegables per Defecte (UX Mestre):** A `UniversalCard.jsx`, el clic a qualsevol part de la targeta (i especialment a la imatge o al cos) ha de navegar directament a la seua pàgina (`safeMainHref` / `desti.saberMes`), fins i tot quan la targeta té portes de doble acció. Zero lightboxes cecs d'ampliació: la foto és navegació.
7. **Tractor WebP al Vol en Pujades:** Tota imatge que puge l'usuari (JPEG/PNG) es converteix automàticament al navegador a WebP (resolució 1200–1600 px optimitzada <80-100 KB i preservant EXIF).
8. **Fortificació del Xat (REA WhatsApp + Telegram):** Emprar les eines REA per disseccionar patrons de fluïdesa de Telegram i WhatsApp i elevar la robustesa del component de xat de Sóc de Poble.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 0 (Unificació Perfil Javi):** Assegurar coherència entre la identitat pilot de Javi i el compte real de Google en remot (Supabase).
- [ ] **Tasca 1 (Perfil Públic):** Actualitzar `src/data/supabase/auth.js`, `src/sections/profile/perfilCamps.js` i components de visibilitat per a establir el perfil públic per defecte.
- [ ] **Tasca 2 (Poble a la barra taronja):** Actualitzar `src/components/PedraSeca/UniversalCard/CardHeader.jsx` i `src/components/universal/PageFrame.jsx` per a concatenar el poble (`author · location`).
- [ ] **Tasca 3 (Avatar propi):** Assegurar que l'avatar triat per l'usuari té prioritat permanent sobre `user_metadata.avatar_url` de Google.
- [ ] **Tasca 4 (Apartat Multimèdia d'Usuari):** Implementar `DetallMultimedia.jsx` i connectar-lo a `perfilModel.js` sota `Els nodes`.
- [ ] **Tasca 5 (Targetes Navegables per Defecte):** A `UniversalCard.jsx`, activar `sp-card-link-overlay` sempre que hi haja `safeMainHref`, fent que la imatge i el cos porten directament a la pàgina de destí.
- [ ] **Tasca 6 (Tractor WebP Client-side):** Implementar conversió al vol de JPG/PNG a WebP (1200–1600 px) abans de pujar al bucket o a memòria.
- [ ] **Tasca 7 (Fortificació Xat REA):** Investigació i blindatge del xat amb paritat Telegram / WhatsApp.
- [ ] **Tasca 8 (Auditoria & Verificació):** Executar la suite de proves de perfil (`npx vitest run src/sections/profile/`), comprovar la integritat a `localhost:3340` i emetre l'informe d'auditoria a `04_escriptori/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Evitar regressions en RGPD garantint que l'usuari sempre té el botó «Perfil privat» accessible i visible.
- No alterar la signatura de la taula `profiles` ni dependències externes.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 107149657693b53e379e027e3680c22b1b188807c7e90b1936e19fce1deee05c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]]

