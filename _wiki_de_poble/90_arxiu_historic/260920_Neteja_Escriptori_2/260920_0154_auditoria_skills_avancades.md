---
type: informe
status: esborrany
description: Auditoria de les 16 skills actives, càrrega de context, governança, consoles UI i evolució verificable de la IAIA MarIA.
tags:
  - skills
  - arquitectura
---

# Auditoria de skills avançades de Sóc de Poble

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUD-260920-SKILLS-CODEX |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 01:54 +02:00, Europe/Madrid |
| Agent redactor | Codex, auditor local del Consell |
| Propietari | Consell de la Petorreta |
| Aprovació humana de les propostes | pendent |
| Revisió pendent | sí |
| Encàrrec | SDP-PROMPT-260920-01, segona versió rebuda en esta sessió |
| Tall Git de referència | b398115fceead16e7ebd97684e6473b8ea0c38bf + canvis locals preexistents |
| Primer control mecànic | 2026-09-20 01:36:22 +02:00, Europe/Madrid |
| Autorització d'escriptura | Exclusivament este informe; cap altre fitxer |
| Tipus de resultat | Diagnòstic amb proves locals i proposta teòrica; no implementació |

## Vincles i lectura

- [[00_index_escriptori]]
- [[260920_0122_PROMPT_evolucio_skills]]
- [[00_TARGET_SKILLS]]

Les cites de fitxers indiquen ruta i línies del contingut local inspeccionat. Els enllaços absoluts permeten obrir-lo en este entorn; les rutes dels textos de les cites conserven la identificació portable respecte de l'arrel del repositori.

La petorreta també cita `universal_maquetation` i `design_system_specs`. La cerca per nom en la Wiki activa no ha trobat documents amb estos noms. No s'han substituït silenciosament per documents semblants ni s'han tractat com a fonts disponibles.

## 1. Dictamen executiu

**La base és recuperable, però encara no constitueix un sistema de skills coherent ni una arrancada portable certificable.** Hi ha procediments valuosos, components reutilitzables i portes reals. El problema dominant és la divergència entre autoritats, registres, carregadors i productors de documents. Afegir més skills sense reconciliar estos mecanismes multiplicaria el problema.

**Tall final de fonts: 2026-09-20 01:56:08 +02:00.** Durant la redacció han canviat cinc fonts per una activitat concurrent aliena a esta auditoria. S'han rellegit i s'han actualitzat les conclusions: el manifest ja reflectix el disc, la identitat ja declara `core: true` i el fallback documental ja apunta a una plantilla existent. L'índex continua divergent i la càrrega efectiva del context continua sense certificar. Les comprovacions inicials es conserven com a línia base en §14, diferenciades del tall final.

Resultats comprovats:

- **16 skills actives**, llegides íntegrament: **1.191 línies i 86.387 bytes** en el tall final. Set declaren `core: true`; cap de les setze declara `version` al frontmatter. El recompte és de fitxers presents, no de les entrades del manifest.
- **Manifest reconciliat amb les 16 skills del disc; índex encara divergent.** La porta final retorna codi 1 amb sis M4: l'índex conserva quatre IDs retirats i omet les dues fusions. En el tall inicial el manifest també era antic. Evidència vigent: [.agents/manifest.yaml:15–31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/manifest.yaml:15>), [.agents/skills/00_INDEX_SKILLS.md:20–27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/00_INDEX_SKILLS.md:20>), [tooling/gates/tractor-manifest.mjs:204–208](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-manifest.mjs:204>).
- **Segell de skills divergent.** La comprovació retorna codi 1; el segell conservat és del 17 de setembre i declara 20 fitxers. Açò demostra diferència de contingut, no manipulació maliciosa. Evidència: [.agents/SKILLS_SEAL.json:1–5](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/SKILLS_SEAL.json:1>), [tooling/gates/segella.mjs:23–43](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/segella.mjs:23>).
- **Frontmatter estricte global roig:** 219 documents en la comprovació posterior a la creació de l'informe, 0 exempcions; F1=17, F2=89, F3=15, F4=8, F5=1, F6=0, F7=14, F8=0. Són emissions de diagnòstic, no documents diferents ni defectes independents: un tag invàlid pot comptar en F3 i F4. Evidència del criteri: [tooling/wiki/tractor-frontmatter.mjs:357–377](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:357>).
- **L'índex nou de referències de la Wiki sí coincideix amb el generador Python**, però el tancament executa un altre generador que recrea les còpies anteriors. Evidència: [tooling/brain/sync_agent_mirror.py:61–109](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/sync_agent_mirror.py:61>), [tooling/gates/tancament.mjs:18–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>), [tooling/wiki/sincronitzar_skills.mjs:4–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:4>).
- **Matrix no equival a context injectat al model.** Llig les fonts i emet hashes, però la seua eixida no conté el cos de les skills. L'altre hook sí injecta una plantilla, amb un rebut incompatible amb el que exigix la porta d'escriptura. Evidència: [tooling/brain/matrix.mjs:184–245](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:184>), [tooling/brain/reflex_plantilles.mjs:72–89](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/reflex_plantilles.mjs:72>), [.agents/hooks/verify.mjs:70–78](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:70>).
- **No hi ha prova local d'una rutina matinal d'investigació IA implementada.** La skill exploradora descriu un procés manual; la programació local trobada és de diagnòstic immunitari cada 3.600 segons. Evidència: [.agents/skills/skill-busca-skills/SKILL.md:20–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-busca-skills/SKILL.md:20>), [scripts/immunitari/org.socdepoble.plaquetes.plist:7–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/scripts/immunitari/org.socdepoble.plaquetes.plist:7>).

**Decisió recomanada:** consolidar primer una única cadena «contracte → registre → context → acció → verificació → memòria». Després activar un radar que propose millores en una zona de candidats, i una consola que mostre proves i accions autoritzades. Una skill descoberta no ha d'adquirir autoritat executiva pel fet d'haver estat resumida.

## 2. Abast, mètode i límits

### 2.1 Què s'ha llegit

S'han llegit íntegrament les setze `SKILL.md` de `.agents/skills/`, l'índex, el manifest, els documents centrals de governança, el registre de plantilles i les tres plantilles de creació de skills. També els tres informes d'investigació indicats, `00_TARGET_SKILLS.md` i l'informe adjacent sobre amnèsia cognitiva.

S'han contrastat els circuits amb Matrix, el classificador, els hooks, el tractor de frontmatter, el de manifest, el segell, els dos sincronitzadors, el compilador de context, l'indexador RAG, Somiador, la configuració de programació local i peces reals de Pedra Seca. Les cites següents delimiten quines parts del codi s'han inspeccionat; **no es declara una auditoria funcional completa de tota l'aplicació**.

El corpus executable és el directori actiu. Les skills de `_arxiu_wiki_de_poble`, papereres i còpies antigues s'han identificat en l'inventari de noms, però no s'han carregat com a instruccions. La constitució situa l'autoritat en les skills actives i prohibix usar còpies com a cervells alternatius: [.agents/AGENTS.md:17–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:17>).

### 2.2 Categories d'afirmació

- **[FET]**: contingut visible al disc o resultat d'una comprovació local.
- **[INFERÈNCIA]**: conseqüència raonada d'eixos fets; es dona el mecanisme i el límit.
- **[PROPOSTA]**: arquitectura pendent de construir i aprovar.
- **[SUPÒSIT]**: condició de disseny o pressupost encara no mesurat.
- **[OBSERVACIÓ DE SESSIÓ]**: capacitat exposada per l'entorn d'este assistent, sense atribuir-la al repositori.

Les seccions d'arquitectura, esquemes, exemples i proves futures són íntegrament **[PROPOSTA]**, llevat de les frases que identifiquen codi existent amb cita. Cap nom nou dins d'un exemple s'ha de confondre amb una funció o fitxer existent.

### 2.3 Restriccions respectades

No s'han fet cerques web, peticions externes ni ús de navegador. Les referències als orígens del projecte es tracten com a context aportat, sense visitar-les. «Pedra Seca» significa exclusivament el Design System/UI Kit.

Només s'autoritza escriure este document. No s'executen `despertar`, Matrix, Reflex de creació, Somiador, el tancament ni la cadena completa de portes: alguns d'estos circuits escriuen registres, còpies o artefactes. Exemples directes: [tooling/brain/despertar.mjs:45–54](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/despertar.mjs:45>), [tooling/brain/matrix.mjs:229–240](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:229>), [tooling/gates/tancament.mjs:18–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>).

L'excepció expressa de la segona petorreta preval sobre les rutines locals que demanen modificar ESTAT, índexs o crear bootstrap. No s'amplia l'autorització per satisfer-les. El vincle entrant des de l'índex a este informe queda pendent de l'agent central; els vincles eixints d'este document no acrediten per si sols l'ancoratge bidireccional que descriu [.agents/skills/skill-cicle-de-vida/SKILL.md:53–62](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:53>).

### 2.4 Coneixement nadiu i actualitat

Este informe explica patrons observables i decisions d'enginyeria transferibles. No és una exportació de pesos, memòria privada ni instruccions internes del proveïdor. Tampoc certifica quines biblioteques, models, tarifes o productes són «els millors hui»: amb la prohibició de xarxa no es pot verificar eixa actualitat.

La guia local OpenAI Docs s'ha consultat per orientar la part d'autoconeixement; no s'ha seguit la seua ruta de cerca externa perquè l'encàrrec la prohibix. Les conclusions sobre el projecte provenen dels fitxers locals, i els patrons de plataforma s'etiqueten com a observacions o propostes.

## 3. Inventari crític de totes les skills actives

La columna «destí recomanat» és conceptual: no implica moure ni reanomenar res ara.

| Skill i lectura completa | Què aporta | Què falla o sobra | Destí recomanat |
| --- | --- | --- | --- |
| `app-grid-shell`, [.agents/skills/app-grid-shell/SKILL.md:1–41](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/app-grid-shell/SKILL.md:1>) | Geometria, col·lapse, navegació i contenció de l'editor. | Barreja especificació visual amb receptes CSS; prohibix `style` i suggerix tags `style` sense contracte d'encapsulació. Trigger únic poc expressiu. | Skill de composició de workspace amb referència al contracte i proves de variants. |
| `core-context-panic`, [.agents/skills/core-context-panic/SKILL.md:1–51](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/core-context-panic/SKILL.md:1>) | Límits a reintents cecs i detecció de divergència del codi. | Diagnostica «degradació mental» sense telemetria i imposa canviar de xat; no té represa ni classificació d'errors. Descripció massa llarga. | Recuperació operativa: causa, relectura, checkpoint i política de reintents. |
| `core-restauracio-segellada`, [.agents/skills/core-restauracio-segellada/SKILL.md:1–178](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/core-restauracio-segellada/SKILL.md:1>) | Procediment més complet: abast, inspecció, risc, còpia, CAS, verificació i retorn. | `eines_obligatories` és llista i l'esquema espera text; és `core` fins i tot en tasques sense restauració. Falta versió de contracte. | Preservar el procediment; carregar els detalls només en restauracions i provar el suport dels scripts. |
| `pedra-seca`, [.agents/skills/pedra-seca/SKILL.md:1–82](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:1>) | Tokens semàntics, ritme, límits visuals, tacte i catàleg abans de producció. | Absoluts sense excepcions tipificades; recomana primitives per a sidebar i després les prohibix. Divergix de UniversalPage. | Contracte general breu + tokens + receptes i casos de prova. |
| `skill-busca-skills`, [.agents/skills/skill-busca-skills/SKILL.md:1–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-busca-skills/SKILL.md:1>) | Explorar, filtrar i atribuir idees externes. | Salta de descobriment a crear skill canònica; falta llicència, hash de procedència, quarantena, proves, estat i cadència. | Separar investigació de promoció executiva. |
| `skill-casos-us-essencials`, [.agents/skills/skill-casos-us-essencials/SKILL.md:1–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-casos-us-essencials/SKILL.md:1>) | Necessitats socials concretes que orienten el producte. | És sobretot coneixement de domini i cartera de producte; no un procediment executable. Descripció molt llarga. | Coneixement/PRD amb una skill que l'exigisca quan es treballa en el domini. |
| `skill-cicle-de-vida`, [.agents/skills/skill-cicle-de-vida/SKILL.md:1–147](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:1>) | Continuïtat, lliurables, ancoratge i tancament. | Fusió per concatenació; workflow duplicat; esborrat i arxiu incompatibles; atribucions exagerades a tractors; 150 artefactes com a proxy de context. | Un únic workflow i una política separada de retenció. |
| `skill-consell-i-colmena`, [.agents/skills/skill-consell-i-colmena/SKILL.md:1–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-consell-i-colmena/SKILL.md:1>) | Rols, auditoria independent i protecció del tall compartit. | Perfils de marques i capacitats en MB sense prova; nomenclatura local divergent; tags fora de vocabulari. | Rols estables + adaptadors de capacitats mesurades per sessió. |
| `skill-documentacio-i-reflex`, [.agents/skills/skill-documentacio-i-reflex/SKILL.md:1–55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-documentacio-i-reflex/SKILL.md:1>) | Lectura prèvia, resolució de plantilla i disciplina documental. | Repetix governança, admet prefixes locals que la plantilla restringix i prescriu neteja prèvia massa ampla; tags invàlids. | Orquestrador documental basat en un contracte estructurat d'entrada i eixida. |
| `skill-estudi-mercat`, [.agents/skills/skill-estudi-mercat/SKILL.md:1–55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-estudi-mercat/SKILL.md:1>) | Estructura útil d'anàlisi de producte i competència. | Intenta deduir stack intern amb fonts que poden no demostrar-lo; ordena desar en zona humana de Producció; trigger nominal. | Skill d'investigació amb fonts, incògnites i destí de treball ordinari. |
| `skill-guardia-frontmatter`, [.agents/skills/skill-guardia-frontmatter/SKILL.md:1–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-guardia-frontmatter/SKILL.md:1>) | Intenció correcta de validar abans d'escriure. | Declara supremacia sobre instruccions de l'usuari i obliga noms catalans mentre les plantilles usen anglesos. No aporta validació executable pròpia. | Guia curta d'ús del validador; la jerarquia la governa el contracte del host. |
| `skill-iaia-identitat`, [.agents/skills/skill-iaia-identitat/SKILL.md:1–134](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md:1>) | Missió rural, veu, honestedat, rols i límits. | Ja és `core` en el tall final; entrega efectiva pendent de provar. Autoritat invertida, destins contradictoris, llista rígida de marques, autopuntuació de context i rituals excessius. | Perfil d'identitat estable, sempre carregat; procediments fora del perfil. |
| `skill-memoria-historica`, [.agents/skills/skill-memoria-historica/SKILL.md:1–101](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-memoria-historica/SKILL.md:1>) | Lliçons, continuïtat i motivació de decisions. | Anuncia set lliçons i en conté huit; incorpora normes UI que deriven; ordena automodificar regles i exportar a una ruta personal. | Memòria amb decisions i procedència; destil·lació com a proposta avaluada. |
| `skill-propagar-veritat`, [.agents/skills/skill-propagar-veritat/SKILL.md:1–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-propagar-veritat/SKILL.md:1>) | Intenta reduir contradiccions després d'una decisió. | Reemplaçament global sense classificar arxiu, cites ni negacions; exemple de substitució idèntica; falta pla, diff semàntic i CAS. | Migració de referències governada per IDs, inventari d'impacte i verificació. |
| `socdepoble-workflow`, [.agents/skills/socdepoble-workflow/SKILL.md:1–39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/socdepoble-workflow/SKILL.md:1>) | PRD, composició modular i comprovacions. | Obliga recerca externa sense perfil de xarxa; apunta a target arxivat; es duplica dins de cicle-de-vida; confon SemVer amb format de commits. | Únic workflow general amb ramificacions per risc i capacitats. |
| `universal-page`, [.agents/skills/universal-page/SKILL.md:1–113](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/universal-page/SKILL.md:1>) | Anatomia de pàgina, accions, classificació i editor. | Conté blanc fix, 32px i ombra literal en conflicte amb Pedra Seca; font «exclusiva» massa estreta per al catàleg modular actual. | Recepta de pàgina amb variants declarades i referència a implementació/especímen reals. |

**[INFERÈNCIA] No falta una col·lecció immensa de skills.** Falta que les existents siguen seleccionables, coherents i verificables. La majoria dels buits són de contracte, procedència, activació, comprovació i retirada. Una part del contingut actual pertany al saber, una altra a les regles del host i una altra a les especificacions UI.

## 4. Troballes prioritzades

P1 significa risc alt de carregar regles incorrectes, produir efectes no governats o perdre la continuïtat del sistema. P2 significa defecte de coherència, mantenibilitat o prova que cal resoldre abans d'escalar. No s'ha demostrat cap explotació ni incident de producció en esta auditoria.

### F01 · P1 · Registre no reconciliat després de la fusió

**[FET, actualitzat al tall final]** El manifest ja inclou les 16 skills del disc, amb `skill-consell-i-colmena` i `skill-documentacio-i-reflex`. L'índex encara manté `equip-ia`, `ment-colmena-integral`, `skill-acte-reflex` i `skill-consell-bundle` i omet les dues fusions. La porta continua retornant codi 1, ara amb sis M4. La divergència inicial M2×4/M3×2 s'ha corregit parcialment durant l'auditoria; no és una correcció feta per este auditor. Fonts vigents: [.agents/manifest.yaml:15–31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/manifest.yaml:15>), [.agents/skills/00_INDEX_SKILLS.md:20–27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/00_INDEX_SKILLS.md:20>), [tooling/gates/tractor-manifest.mjs:204–208](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-manifest.mjs:204>).

**Impacte:** un consumidor de l'índex i un altre del disc/manifest encara seleccionen conjunts diferents. L'ordre de fusió no és encara una release consistent.

**[PROPOSTA]** Registrar substitucions amb IDs antics, successor i motiu; generar manifest i índex des del mateix conjunt validat; publicar-los amb les skills i el segell en una única transició. No recuperar les quatre carpetes només per fer verd el manifest.

### F02 · P1 · El tancament recrea el mecanisme d'espills retirat

**[FET]** La Wiki actual conté un índex de rutes, sense còpies de cossos. El generador Python produeix eixe únic fitxer. Però `tancament.mjs` crida incondicionalment `sincronitzar_skills.mjs`, que crea `02_saber/skills_mirror` i escriu còpies completes de skills i índex. Fonts: [_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR/00_INDEX_MIRROR.md:7–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR/00_INDEX_MIRROR.md:7>), [tooling/brain/sync_agent_mirror.py:71–87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/sync_agent_mirror.py:71>), [tooling/gates/tancament.mjs:18–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>), [tooling/wiki/sincronitzar_skills.mjs:24–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:24>).

**Impacte:** la neteja manual no elimina el productor que reintroduïx les còpies. Esta és una causa concreta de «residus fantasmals».

**[PROPOSTA]** Un sol generador de projeccions, mai dos escriptors per al mateix concepte. El mode de comprovació ha de ser de lectura. Les projeccions han de portar source ID/hash i no exercir autoritat pròpia. Retirar el cridador antic forma part de la migració, no d'una neteja posterior.

### F03 · P1 · Rebut de lectura, injecció i autorització estan desconnectats

**[FET]** Matrix calcula hashes i registra `matrix.rebut`; no retorna el text de les fonts en el seu informe. El hook preflight executa `reflex_plantilles`, no Matrix. Este injecta una plantilla i registra `estat: plantilla_carregada`, `ts`, `sha256`; el verificador busca `tipus: matrix.rebut`, `t`, `peticio_sha256` i `fonts`. Fonts: [tooling/brain/matrix.mjs:186–218](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:186>), [tooling/brain/matrix.mjs:229–255](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:229>), [.agents/hooks/preflight_matrix_wrapper.mjs:45–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/preflight_matrix_wrapper.mjs:45>), [tooling/brain/reflex_plantilles.mjs:72–89](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/reflex_plantilles.mjs:72>), [.agents/hooks/verify.mjs:70–78](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:70>).

**[INFERÈNCIA]** El camí del hook pot haver injectat la plantilla correctament i, tanmateix, no satisfer la porta posterior. El camí Matrix pot acreditar lectura pel procés Node sense acreditar entrega del cos al model.

**[PROPOSTA]** Separar quatre estats: font disponible, font llegida pel carregador, contingut entregat al host, resultat verificat. Un únic rebut versionat ha de relacionar tasca, sessió, fonts i fragment exacte entregat. Cap hash prova comprensió.

### F04 · P1 · La porta no vincula el rebut a la tasca o als bytes vigents

**[FET]** El verificador agafa l'últim rebut amb forma mínima i comprova una antiguitat de 30 minuts. No recalcula els hashes de `fonts`, no compara la petició actual amb `peticio_sha256` ni vincula eixe rebut a un ID de sessió del payload. Fonts: [.agents/hooks/verify.mjs:65–78](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:65>), [.agents/hooks/verify.mjs:247–259](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:247>).

**Impacte:** [INFERÈNCIA] una lectura recent d'una altra tasca pot satisfer esta comprovació documental; una font canviada després del rebut pot continuar aparentant vigència. No s'ha forjat ni escrit cap rebut per provar-ho.

**[PROPOSTA]** Vincular rebut a task ID, session ID, policy hash, release de skills, scopes i hashes vigents. Data invàlida o futura, font divergent i sessió diferent han de produir error explícit. El control real de permisos ha de quedar fora dels fitxers que l'agent pot reescriure.

### F05 · P1 · Permís per forma del comandament, abans de comprovar l'efecte

**[FET]** Per a `run_command`, la porta permet qualsevol ordre que comence per `node tooling/(gates|wiki|brain)/`, si no conté determinats caràcters, i retorna abans de les comprovacions documentals. Alguns scripts d'eixes carpetes creen còpies o mouen documents. Fonts: [.agents/hooks/verify.mjs:109–116](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:109>), [tooling/wiki/sincronitzar_skills.mjs:7–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:7>), [tooling/wiki/sincronitzar_skills.mjs:41–57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:41>), [tooling/brain/somiador.mjs:40–61](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/somiador.mjs:40>).

**Impacte:** la llista blanca valida el prefix, no l'operació, el destí o el mode. La mateixa ordre pot ser lectura o mutació segons arguments i estat.

**[PROPOSTA]** Exposar operacions tipades amb arguments validats i permisos per efecte. Els scripts han de separar comprovació i aplicació; no n'hi ha prou amb filtrar símbols de shell. Açò és una revisió del límit de confiança, no una invitació a usar dreceres.

### F06 · P1 · Dos encaminadors interpreten un mateix registre de manera diferent

**[FET]** `protocolledge.json` declara `onUnknown`, `default`, condicions `quan` i `lectures`. Matrix només trasllada `claus`, `id` i `plantilla`, selecciona totes les coincidències i usa fallback si no hi ha cap. El classificador retorna una sola plantilla segons suma de longituds de substrings; si no pot llegir el registre, retorna taula buida. Fonts: [.agents/protocolledge.json:1–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json:1>), [tooling/brain/matrix.mjs:136–179](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:136>), [tooling/brain/classificador_tasques.mjs:9–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/classificador_tasques.mjs:9>).

En el tall inicial, la ruta per defecte a `PLANTILLA_ISO_SDP.md` no existia. En el tall final s'ha canviat a `00_PLANTILLA_PROMPT_CONSELL.md` i s'ha comprovat que el fitxer existix; esta incidència concreta del fallback queda corregida. Font vigent: [.agents/protocolledge.json:3–4](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json:3>). La divergència dels dos algoritmes continua vigent. La comprovació pura del classificador retorna `null` per «bon dia», «revisa la identitat» i «resum matinal de novetats IA»; el seu significat és «sense plantilla obligatòria». Fonts del comportament: [tooling/brain/classificador_tasques.mjs:25–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/classificador_tasques.mjs:25>), [tooling/brain/reflex_plantilles.mjs:43–55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/reflex_plantilles.mjs:43>).

**[PROPOSTA]** Una única funció de resolució amb entrada estructurada. Les paraules poden suggerir intenció, però no reemplaçar el discriminant explícit `intencio/destinatari`. «Sense plantilla necessària», «intenció desconeguda» i «registre il·legible» han de ser resultats diferents.

### F07 · P1 · Identitat declarada core, però entrega i compatibilitat no certificades

**[FET, actualitzat al tall final]** `skill-iaia-identitat` ja declara `core: true`, afegit durant la redacció. El selector de Matrix la inclouria entre les set skills core; s'ha corregit la causa inicial d'exclusió per falta de trigger. Açò és una conseqüència del selector inspeccionat, no una execució de Matrix ni una prova d'entrega al model. GLOBALS continua sense PROFILE i la desconnexió descrita en F03 continua oberta. Fonts vigents: [.agents/skills/skill-iaia-identitat/SKILL.md:1–11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md:1>), [tooling/brain/matrix.mjs:83–87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:83>), [tooling/brain/matrix.mjs:127–132](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:127>), [tooling/brain/matrix.mjs:186–187](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:186>).

El hook pressuposa `invocationNum === 1`, un transcript amb entrades `USER_INPUT` i un payload concret; la porta reconeix noms d'eines d'un arnés específic. No hi ha prova en esta auditoria que tots els hosts consumisquen eixa configuració. Fonts: [.agents/hooks/preflight_matrix_wrapper.mjs:13–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/preflight_matrix_wrapper.mjs:13>), [.agents/hooks/verify.mjs:12–16](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:12>), [.agents/hooks.json:10–20](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks.json:10>).

**[PROPOSTA]** Nucli d'identitat mínim carregat explícitament i adaptadors de host amb una prova de salut. Si un host no pot interceptar eines, ha de declarar-ho i treballar amb capacitats més limitades. La frase «es carrega SEMPRE» en un Markdown no implementa la càrrega: [.agents/AGENTS.md:8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:8>).

### F08 · P1 · Autoritat, destins i retenció entren en conflicte directe

**[FET]** Identitat posa la pròpia skill per damunt d'AGENTS i només permet lliurar a arxiu o safata d'entrada; AGENTS fixa Escriptori i prohibix bolcar generacions en la safata. Cicle-de-vida ordena eliminar informes destil·lats sense arxivar-los, mentre AGENTS prohibix eixe esborrat sense preguntar i documentacio-i-reflex ordena moure'ls a històric. Fonts: [.agents/skills/skill-iaia-identitat/SKILL.md:64–68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md:64>), [.agents/skills/skill-iaia-identitat/SKILL.md:95–100](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md:95>), [.agents/AGENTS.md:23–30](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:23>), [.agents/AGENTS.md:55–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:55>), [.agents/skills/skill-cicle-de-vida/SKILL.md:70–76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:70>), [.agents/skills/skill-documentacio-i-reflex/SKILL.md:41–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-documentacio-i-reflex/SKILL.md:41>).

**Impacte:** complir una ordre pot violar una altra. L'agent acaba decidint per recència, força retòrica o ordre de càrrega.

**[PROPOSTA]** Un únic contracte de precedència i retenció, amb operació, scope i excepcions explícites. Les skills no poden autoatribuir-se prioritat sobre el host o sobre l'encàrrec autoritzat. `requires_human_decision: true` per ratificar polítiques generals de retenció i promoció; no per repetir permisos que ja estan concedits en una tasca concreta.

### F09 · P2 · L'esquema, les plantilles i la validació no són el mateix contracte

**[FET]** La plantilla creadora admet descripcions de 220 caràcters; l'esquema fixa 140. La skill de guàrdia exigix `tipus/estat`; la plantilla genera `type/status`. L'esquema només posa `description` en required, però el tractor imposa manualment una de cada parella type/tipus i status/estat. Fonts: [_wiki_de_poble/03_actuar/plantilles/plantilla_creador_skills.md:30–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_creador_skills.md:30>), [tooling/wiki/schema.json:9–11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:9>), [tooling/wiki/schema.json:73–76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:73>), [.agents/skills/skill-guardia-frontmatter/SKILL.md:15–22](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-guardia-frontmatter/SKILL.md:15>), [tooling/wiki/tractor-frontmatter.mjs:319–336](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:319>).

Hi ha sis descripcions de skills massa llargues, una llista `eines_obligatories` incompatible amb el tipus string declarat i quatre tags fora del vocabulari. Fonts: [.agents/skills/core-restauracio-segellada/SKILL.md:28–29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/core-restauracio-segellada/SKILL.md:28>), [tooling/wiki/schema.json:134–135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:134>), [.agents/skills/skill-consell-i-colmena/SKILL.md:5–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-consell-i-colmena/SKILL.md:5>), [.agents/skills/skill-documentacio-i-reflex/SKILL.md:5–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-documentacio-i-reflex/SKILL.md:5>).

**[PROPOSTA]** Separar esquema documental d'esquema executable de skill. El validador canònic ha de ser el mateix per a generació, editor, CI i consum. Si es manté el parser limitat actual, declarar el subconjunt suportat; no afegir `oneOf` o objectes complexos sense ampliar-lo: [tooling/wiki/tractor-frontmatter.mjs:117–135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:117>).

### F10 · P2 · La porta F5 penalitza un indicador operatiu legítim

**[FET]** La comprovació global marca `core=true` com a entropia zero perquè és un únic valor present i no és required: sis usos en el tall inicial, set després de l'actualització d'identitat. Matrix, en canvi, usa `core` per carregar skills sempre. Fonts: [tooling/wiki/tractor-frontmatter.mjs:372–377](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:372>), [tooling/brain/matrix.mjs:85–86](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:85>), [tooling/brain/matrix.mjs:127–131](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:127>).

**[INFERÈNCIA]** Eliminar `core` per abaixar deute canviaria el comportament. L'absència d'un camp i el valor true formen una distribució binària que F5 no representa quan només compta valors presents.

**[PROPOSTA]** F5 com a recomanació editorial amb exempcions semàntiques, no com a criteri automàtic d'eliminació de control. No inventar valors false inútils només per satisfer la mètrica.

### F11 · P2 · Estat, versió i dependències no governen el consum

**[FET]** Matrix descobreix qualsevol subdirectori amb SKILL.md i conserva nom, core, triggers i prioritat; no filtra `status`, no resol versions, dependències ni `eines_obligatories`. Fonts: [tooling/brain/matrix.mjs:54–88](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:54>). El catàleg actiu no declara versions. La plantilla sí les proposa: [_wiki_de_poble/03_actuar/plantilles/plantilla_creador_skills.md:33–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_creador_skills.md:33>).

**Impacte:** [INFERÈNCIA] afegir una skill experimental a eixe directori la fa descobrible encara que el text diga «esborrany». No hi ha frontera mecànica de promoció.

**[PROPOSTA]** Candidats fora del conjunt executable; releases amb resolució tancada de dependències i compatibilitat. El selector només consumeix versions publicades i autoritzades.

### F12 · P2 · Les normes de disseny no formen una especificació única

**[FET]** Pedra Seca exigix tokens semàntics i radis de l'escala, i limita ombres; UniversalPage prescriu blanc fix, radi literal 32px i ombra literal. Fonts: [.agents/skills/pedra-seca/SKILL.md:31–43](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:31>), [.agents/skills/pedra-seca/SKILL.md:60–67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:60>), [.agents/skills/universal-page/SKILL.md:63–71](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/universal-page/SKILL.md:63>).

Els tokens presents establixen radis 8/12/16/28px, tacte de 44px i mode còmode de 48px. La porta anomenada 58px busca patrons concrets de CSS; no mesura la caixa clicable real. Fonts: [src/css/tokens.css:140–173](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:140>), [tooling/gates/01_porta_pedra_seca_58px.mjs:23–49](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/01_porta_pedra_seca_58px.mjs:23>).

**[PROPOSTA]** Distingir mínim tàctil, densitat còmoda i altura de barra; no considerar-los contradicció per ser números diferents. Sí corregir les prescripcions incompatibles i donar a cada variant una regla executable i una prova visual/funcional.

### F13 · P2 · Les plantilles reintrodueixen arquitectura antiga

**[FET]** La plantilla trellat conserva exemples Offline/PWA, variables `--sp-*`, Tailwind per a layout i radi 28px com a dogma. La plantilla d'agent suggerix «Configurar Tailwind». Fonts: [_wiki_de_poble/03_actuar/plantilles/plantilla_skill_trellat.md:9–29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_skill_trellat.md:9>), [_wiki_de_poble/03_actuar/plantilles/plantilla_skill_agent.md:13–16](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_skill_agent.md:13>).

**Impacte:** fins i tot un agent obedient que copie una plantilla pot generar nova doctrina antiga.

**[PROPOSTA]** Provar les instàncies generades per les plantilles. Una plantilla correcta ha de produir una skill vàlida i compatible, no sols passar la validació del seu propi frontmatter.

### F14 · P2 · La Wiki no pot substituir l'accés a les fonts executives

**[FET]** El nou índex només conté rutes en text pla. L'indexador RAG exclou explícitament `.agents` en el seu recorregut per defecte; accepta, però, una llista `options.files` si el cridador l'aporta. Fonts: [_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR/00_INDEX_MIRROR.md:9–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR/00_INDEX_MIRROR.md:9>), [tooling/wiki/core/build_rag_index.mjs:13–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/build_rag_index.mjs:13>), [tooling/wiki/core/build_rag_index.mjs:50–56](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/build_rag_index.mjs:50>).

**Impacte:** [INFERÈNCIA] una IA que només veja la Wiki/RAG no obté els cossos executius d'eixos punters per si sola. Un punter és un mecanisme de descoberta, no una càrrega transitiva.

**[PROPOSTA]** Mantenir una font canònica i proveir un resolutor local amb autoritat/classificació explícites. Si cal lliurament extern, generar un paquet de context per a la tasca amb hashes i omissions declarades; no convertir l'espill en segona constitució.

### F15 · P2 · El compilador de «còrtex global» mescla capes i exigix un fitxer absent

**[FET]** El compilador agrega skills, ser, saber i actuar; elimina el frontmatter, concatena el cos i recomana injectar-ho com a System Prompt. Exigix també AGENTS.md a l'arrel, absent en el tall inspeccionat. Fonts: [tooling/wiki/compile-wiki-to-system-prompt.mjs:9–16](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/compile-wiki-to-system-prompt.mjs:9>), [tooling/wiki/compile-wiki-to-system-prompt.mjs:38–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/compile-wiki-to-system-prompt.mjs:38>).

**Impacte:** [INFERÈNCIA] en este tall, la comprovació d'existència impediria generar GENOMA. Si es reparara només el punter, continuarien barrejant-se normes i coneixement amb menys metadades per distingir-los. El recompte duplicat de saber es deduplica per Set: no s'afirma que duplique finalment eixos fitxers.

**[PROPOSTA]** Compilació per capes, conservant identitat, estat i procedència; entrega al rol corresponent del host. No injectar documents recuperats com a instruccions superiors.

### F16 · P2 · Somiador fa higiene de fitxers, no aprenentatge verificat

**[FET]** Somiador selecciona documents i carpetes d'Escriptori, els mou, executa llaurador i segella baseline. No compara candidats amb un conjunt d'avaluació ni promociona coneixement segons resultats. Fonts: [tooling/brain/somiador.mjs:17–66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/somiador.mjs:17>).

La subcarpeta d'investigació no està en les dues exclusions de directoris; [INFERÈNCIA] una execució la pot moure sencera a històric. Fonts: [tooling/brain/somiador.mjs:24–37](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/somiador.mjs:24>).

**[PROPOSTA]** Separar manteniment mecànic, resum de sessió i aprenentatge. Cadascun ha de tindre resultats i permisos propis. No marcar «ha madurat» com a resultat d'una operació de rename.

### F17 · P2 · L'autodiagnòstic confon metàfores amb magnituds observades

**[FET]** El termòmetre compta fitxers Markdown d'una carpeta derivada del transcript i elements pujats; davant error retorna zero. No mesura tokens de context, RAM del host ni qualitat d'inferència. Fonts: [tooling/brain/termometre_context.mjs:4–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/termometre_context.mjs:4>).

La skill d'identitat demana una «Nota de Context» subjectiva; l'informe d'amnèsia atribuïx una fallada concreta a RLHF i a mecanismes interns sense aportar una prova causal local. Fonts: [.agents/skills/skill-iaia-identitat/SKILL.md:37–44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md:37>), [_wiki_de_poble/04_escriptori/02_investigacio_ia/260917_0013_INFORME_amnesia_cognitiva.md:9–15](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/260917_0013_INFORME_amnesia_cognitiva.md:9>).

**[PROPOSTA]** Mesurar només magnituds disponibles. Error de lectura = desconegut, no zero. Etiquetar proxies com a proxies. Canviar una explicació psicològica per un postmortem: entrada, regla esperada, font entregada, eina usada i resultat.

### F18 · P2 · Els informes d'avantguarda no tenen traçabilitat suficient

**[FET]** Els informes referixen vídeos, repositoris i moviments, però no donen una cadena verificable de URL/revisió/data/fragments per a les afirmacions. L'informe Apple proposa 17 principis i arriba a prometre interfícies perfectes a la primera; el de biblioteques usa «cervells pre-entrenats» per parlar de manuals. Fonts: [_wiki_de_poble/04_escriptori/02_investigacio_ia/260916_0745_INFORME_apple_design_skill.md:9–34](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/260916_0745_INFORME_apple_design_skill.md:9>), [_wiki_de_poble/04_escriptori/02_investigacio_ia/260916_0751_INFORME_biblioteques_skills.md:9–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/260916_0751_INFORME_biblioteques_skills.md:9>).

El tercer informe, **SaaS Factory**, també formula regles fortes sense identificar repositoris o revisions: llindar de 300 línies, PRD que «elimina» al·lucinacions, supressió d'una funcionalitat esborrant-ne la carpeta i un Markdown temporal abans de cada pas. També proposa separar documentació de disseny i funcionalitats completes. Font: [_wiki_de_poble/04_escriptori/02_investigacio_ia/260916_0745_INFORME_saas_factory.md:12–49](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/260916_0745_INFORME_saas_factory.md:12>).

**[PROPOSTA]** Retindre la càrrega documental selectiva, els requisits verificables i els límits modulars. Rebutjar el límit universal de 300 línies: el pressupost depén del contingut, la tasca i el host, i s'ha de mesurar. Un PRD acota l'abast però no substituïx proves; esborrar una carpeta no resol migracions, dades o consumidors externs. Una feature de producte i una skill d'agent són unitats distintes. En Pedra Seca, la justificació visual complementa tokens i contractes, no els substituïx. El pla durable es crea quan aporta continuïtat; imposar un document temporal a cada pas recrearia el soroll que es vol reduir.

**[PROPOSTA]** Conservar-los com a hipòtesis de treball. Un SKILL.md és context/procediment, no evidència d'un model reentrenat. No importar nombres de principis ni promeses de perfecció sense necessitat local i prova.

### F19 · P2 · El catàleg UI és una base útil, però la porta comprova menys del que anuncia

**[FET]** Ja hi ha façana pública, catàleg i espècimens modulars. DesignSection delega en manifest i detail loaders, de manera que la regla de consultar exclusivament eixe fitxer no dona tot el codi dels components. Fonts: [src/components/PedraSeca/index.js:1–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/index.js:1>), [src/sections/disseny/DesignSection.jsx:4–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/DesignSection.jsx:4>), [.agents/skills/universal-page/SKILL.md:19–21](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/universal-page/SKILL.md:19>).

La porta de catàleg extrau noms amb regex i comprova presència d'imports, no la representació efectiva ni totes les variants; tampoc valida que el camp `fitxer` coincidisca amb la implementació que ha trobat per nom. Fonts: [tooling/gates/tractor-cataleg.mjs:20–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-cataleg.mjs:20>). El registre encara conté moltes rutes `ui/`: [src/sections/disseny/cataleg/registre.js:22–61](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/cataleg/registre.js:22>).

**[PROPOSTA]** Registre únic de component amb export real, props, variants, tokens i casos d'accessibilitat; comprovació de resolució del mòdul i render de cada estat essencial. Una importació és evidència d'ús potencial, no de UI provada.

### F20 · P2 · Segell i portes disponibles no equivalen a release protegida

**[FET]** La cadena agregada inclou manifest, frontmatter i catàleg, però no inclou els scripts `porta:segella` o `porta:matrix` com a passos. Fonts: [tooling/gates/run-portes.mjs:29–79](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/run-portes.mjs:29>), [package.json:20](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/package.json:20>), [package.json:55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/package.json:55>).

El segell és un hash local regenerable. La pròpia norma reconeix que ni un hook local ni una clau accessible al mateix agent són una frontera absoluta contra accions adversàries. Fonts: [tooling/gates/segella.mjs:35–52](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/segella.mjs:35>), [.agents/PROTOCOL_PETORRETA.md:58–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/PROTOCOL_PETORRETA.md:58>).

**[PROPOSTA]** Certificar una release amb contractes, hashes, proves i CI requerida. Distingir integritat, autoria, autorització i qualitat: quatre garanties diferents. La configuració efectiva de protecció de branca remota no s'ha consultat.


## 5. Resposta a les sis incògnites

| Incògnita | Resposta fonamentada |
| --- | --- |
| Tot el «brain» està plasmat en la Wiki? | **No en forma de contingut accessible només des de la Wiki.** Hi ha fonts executives a .agents i un índex que només les assenyala; el recorregut RAG per defecte exclou .agents. Açò pot ser una separació correcta si el resolutor sap seguir els punters. Hui no és una prova d'autosuficiència del RAG. Vegeu F14. Les capacitats que aporta el host de Codex són externes al repositori i tampoc es poden donar per sincronitzades. |
| Cada xat desperta amb els fitxers necessaris? | **No es pot garantir amb el contracte actual.** Hi ha diverses seqüències documentades i adaptació a un payload concret; Matrix no entrega els cossos; la identitat ja és core en el tall final, però això no acredita que arribe al model. Vegeu F03, F06 i F07. En esta auditoria les fonts s'han obert explícitament. |
| Es distingix saber d'actuar? | **Es distingix conceptualment, però no de manera consistent en totes les rutes.** L'índex ho declara; el compilador global ho mescla, i les skills de memòria/coneixement inclouen ordres executives. Fonts: [.agents/skills/00_INDEX_SKILLS.md:13–15](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/00_INDEX_SKILLS.md:13>), [tooling/wiki/compile-wiki-to-system-prompt.mjs:50–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/compile-wiki-to-system-prompt.mjs:50>), [.agents/skills/skill-memoria-historica/SKILL.md:88–95](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-memoria-historica/SKILL.md:88>). |
| Falta el «ser» de la IAIA? | **La missió i la veu estan prou expressades; falta carregar-les i delimitar-les millor.** PROFILE ja diferencia fonts, evidència, memòria durable i RAG no executiu. Convé conservar això i retirar rutes, marques i rituals de la identitat estable. Font: [.agents/PROFILE.md:9–48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/PROFILE.md:9>). No cal atribuir sentiments interns per a definir un rol coherent. |
| Com evitar dependències tancades en consoles? | Amb un protocol de dades i accions propi, components coneguts i adaptadors substituïbles. El model pot proposar una vista; el host valida, pinta i autoritza. No cal reproduir la interfície interna d'un proveïdor. Vegeu §8. |
| Quins patrons actuals són millors? | No es pot fer un rànquing actual verificat sense xarxa. Sí es poden recomanar i provar localment contractes versionats, càrrega progressiva, permisos tipats, registres generats, avaluacions repetibles i promoció reversible. El valor s'ha de demostrar contra el vostre corpus i dispositius. |

## 6. Patrons nadius transferibles al sistema lliure

### 6.1 Una skill, una eina, un host i una memòria fan treballs diferents

**[OBSERVACIÓ DE SESSIÓ]** L'entorn exposa un catàleg de skills amb nom, descripció i localització; el contingut complet es llig quan és pertinent. També exposa eines amb operacions i arguments definits. La disponibilitat d'una eina és una propietat del host i de la sessió, no una conseqüència de llegir una frase en un Markdown.

**[PROPOSTA]** Adoptar esta separació:

| Peça | Responsabilitat | Què no ha de prometre |
| --- | --- | --- |
| Model | Interpretar la petició, proposar un pla o una resposta. | Memòria persistent automàtica, accés implícit al disc o compliment perfecte. |
| Skill | Procediment reutilitzable: quan, amb què, com i amb quin resultat. | Concedir permisos o instal·lar capacitats escrivint instruccions. |
| Eina | Operació concreta amb entrada, eixida i efectes coneguts. | Ser segura només perquè el nom conté «auditoria» o «check». |
| Host/orquestrador | Carregar context, donar eines, validar arguments, aplicar límits i executar. | Delegar la política de permisos al text recuperat. |
| Memòria durable | Decisions, fonts, resultats i continuïtat entre sessions. | Reemplaçar el tall actual del codi amb records antics. |
| Renderer | Presentar dades i controls aprovats. | Executar JavaScript arbitrari enviat pel model com a contingut. |
| Planificador | Despertar una execució a una hora o davant un esdeveniment. | Que el model continue treballant quan no hi ha procés actiu. |

Una skill pot usar scripts, referències, plantilles i exemples. Eixos recursos han d'estar inclosos en el paquet, resolts amb rutes relatives segures i sotmesos al mateix control de versions. Un Markdown que diu «usa el lector RSS» no implementa un lector RSS.

### 6.2 Càrrega progressiva sense perdre fonts obligatòries

No cal triar entre bolcar tot el repositori o improvisar amb tres línies. El contracte pot fer-ho així:

1. **Arrancada:** identitat, límits del rol, tasca vigent, permisos i índex de capacitats.
2. **Descoberta:** descripcions breus del catàleg per identificar procediments candidats.
3. **Selecció:** skills necessàries i dependències explícites.
4. **Càrrega:** cossos complets d'eixes skills i fragments de referència requerits.
5. **Evidència de tasca:** codi, dades i proves recuperats segons preguntes concretes.
6. **Revalidació:** rellegir una font si ha canviat o si el resultat contradiu el context.
7. **Continuïtat:** checkpoint amb fets, pendents i fonts; reobrir fonts vives en reprendre.

El pressupost de context no autoritza a truncar una font obligatòria en silenci. Si no cap, el resultat ha de dir què falta i quina descomposició permet continuar. El paquet de context pot contindre totes les fonts d'una auditoria sense imposar-ne la injecció simultània en una única inferència.

No fixaria «sempre tres skills» ni «150 artefactes» com a regla universal. Els límits s'han de relacionar amb capacitat del host, volum real i proves de qualitat. La regla de tres skills està documentada en [.agents/PROFILE.md:13–17](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/PROFILE.md:13>); el límit per recompte de fitxers és el de F17.

### 6.3 Persistència i autoinformació

**[OBSERVACIÓ DE SESSIÓ]** Una aplicació d'agents pot oferir gestió de tasques, artefactes i execucions programades. Estes funcions són serveis de l'aplicació, no habilitats que el model mantinga actives per voluntat pròpia.

**[PROPOSTA]** Per a Sóc de Poble, usar formats exportables i un runner substituïble. Markdown per a lectura humana, JSON per a contractes i esdeveniments, i una projecció opcional en base de dades per a consulta i UI. Una absència de telemetria de tokens o costos s'ha de mostrar com «no disponible», mai inferir-la a partir del nombre de paraules.

L'autoinforme ha de contindre: quina tasca s'ha executat, quines versions s'han carregat, quines fonts s'han consultat, quines operacions s'han intentat, quin resultat han retornat, quins criteris han passat i quina incògnita queda. No cal publicar raonament privat intern; una justificació breu basada en fonts i resultats és auditable.

### 6.4 Portabilitat real

«Qualsevol IA actuarà igual» no és una garantia realista de text o decisions idèntiques. El contracte portable ha de garantir:

- les mateixes fonts obligatòries i la mateixa versió de política;
- els mateixos límits d'acció;
- la mateixa semàntica d'entrada, eixida i errors;
- els mateixos criteris d'acceptació;
- un registre de capacitats i limitacions del host;
- prova de conformitat per a cada adaptador.

Un model amb pitjor recuperació o menor finestra pot requerir més passos. El que no pot fer és baixar silenciosament els criteris de prova o inventar una lectura que no s'ha produït.

## 7. Arquitectura proposada del cervell de skills

### 7.1 Principi rector: estricte en els contractes, evolutiu en les implementacions

L'objectiu inspirat en «Apple Design System» s'interpreta com a **vocabulari estable, composició previsible, estats coberts i control de qualitat**. No com a certificació d'Apple, clon visual o arquitectura immutable per sempre.

La base local ja té fronteres aprofitables: façana pública de components, registre de capacitats de backend i consulta `teCapacitat`. Fonts: [src/components/PedraSeca/index.js:1–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/index.js:1>), [src/data/contracte.js:37–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/contracte.js:37>), [src/data/backendPort.js:44–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:44>).

**[PROPOSTA]** Aplicar eixe patró al cervell: especificar una API de skill i una API de runner. Canviar model o implementació no ha de canviar la identitat del projecte ni els permisos.

### 7.2 Cinc capes amb autoritat separada

| Capa | Contingut | Autoritat |
| --- | --- | --- |
| Ser | Missió, valencià, accessibilitat, honestedat i rol assumit. | Orienta conducta; no concedix accés. |
| Governar | Precedència, permisos, retenció, promoció i límits. | Contracte executat pel host dins de la seua autoritat. |
| Saber | ADR, especificacions, fets, fonts i lliçons. | Evidència; cada peça té estat i procedència. |
| Actuar | Skills, eines i workflows. | Procediments sota governança; depenen del saber explícit. |
| Recordar i mesurar | Execucions, verificacions, incidents i checkpoints. | Registre de fets, no nova doctrina automàtica. |

No proposo una altra reordenació massiva de la Wiki. Estes capes són semàntiques i poden usar les ubicacions presents, amb un mapa explícit. La primera migració ha de corregir contractes i cridadors, no moure centenars de documents.

### 7.3 Una única font per tipus d'informació

- L'ID i el contracte executable de cada skill es definixen una vegada.
- El SKILL.md és el procediment humà de la skill.
- El registre executable, l'índex de Wiki i les vistes del panell són derivats regenerables.
- El contracte de governança es carrega una vegada i es referencia.
- Les lliçons expliquen per què es va prendre una decisió; l'ADR vigent identifica quina norma aplica.
- Els documents externs i candidats no entren en el conjunt executable.

Una possible organització **nova, només proposada**, mantenint l'arrel canònica existent:

```text
.agents/
  AGENTS.md                         contracte d'entrada
  PROFILE.md                        identitat estable
  protocolledge.json                rutes documentals
  skills/
    <id>/
      SKILL.md                      procediment
      skill.json                    contracte executable proposat
      references/                   fonts pròpies necessàries
      examples/                     exemples positius i negatius
      evals/                        casos de conformitat
  registry/
    skills.lock.json                resolució generada proposada
  adapters/
    <host>/                         adaptació de transport proposada
```

Els subdirectoris i fitxers no presents són **[PROPOSTA]**. No s'han creat. Tampoc són obligatoris si el mateix contracte es pot expressar més simplement: cap skill ha de tindre cinc carpetes buides per cerimònia.

Per als candidats, usar una zona de treball exclosa dels carregadors executius. La ubicació concreta l'ha de ratificar l'agent central dins de la política d'Escriptori; posar-los dins de `.agents/skills` abans de corregir F11 seria prematur.

### 7.4 Contracte mínim d'una skill

Mantindria el frontmatter documental curt i compatible amb el tractor vigent. Les estructures niades de permisos, dependències i proves anirien en un contracte específic validat; el parser actual no les representa adequadament. Font del límit: [tooling/wiki/tractor-frontmatter.mjs:119–135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:119>).

| Camp conceptual proposat | Regla |
| --- | --- |
| `id` | Estable, únic; independent del nom comercial del model. |
| `version` | Versió de comportament del procediment; cada release immutable. |
| `description` | Què resol i quan obrir-la; limitada segons l'esquema documental. |
| `lifecycle` | candidate, active, deprecated o retired; el loader respecta l'estat. |
| `owner` | Rol responsable de mantindre-la, no perfil tècnic immutable d'una marca. |
| `intents` | Intencions positives i exclusions; no sols paraules clau. |
| `inputs/outputs` | Esquemes tipats i exemples vàlids/invàlids. |
| `requires` | Skills, coneixement i versions compatibles. |
| `capabilities` | Capacitats abstractes necessàries, amb alternatives explícites. |
| `effects` | Lectura, generació local, mutació, acció externa o publicació. |
| `scope` | Recursos sobre els quals pot operar una invocació. |
| `preconditions/postconditions` | Fets comprovables abans i després. |
| `failure_policy` | Errors tipats, reintents, cancel·lació i recuperació. |
| `provenance` | Autor, origen, llicència, revisió i hashes dels recursos. |
| `evals` | Casos i criteris d'acceptació. |
| `replaces` | IDs retirats i migració de consumidors. |
| `compatibility` | Contracte del runner, requisits de host i límits coneguts. |

El contracte ha de rebutjar dependències absents, cicles executius no permesos, col·lisions d'ID, rutes fora del paquet i versions no resoltes. Els canvis del procediment alteren el seu hash; el lock fixa la versió exacta consumida. SemVer orienta compatibilitat, però la prova de compatibilitat la donen contractes i avaluacions.

### 7.5 Descoberta i resolució

El model proposa una intenció estructurada amb grau d'incertesa; el resolver comprova candidats i dependències. Si l'usuari invoca explícitament una skill, es prioritza eixa selecció sempre que siga disponible i compatible amb la tasca autoritzada.

La política de combinació ha de ser explícita:

- **Composició:** dues skills complementàries poden executar-se en ordre.
- **Exclusió:** dues estratègies alternatives no es combinen silenciosament.
- **Especialització:** una variant concreta afina un contracte general sense anul·lar-lo.
- **Conflicte:** dues regles incompatibles paren l'acció afectada i generen diagnòstic.
- **Sense coincidència:** es manté el mode de consulta o es declara capacitat absent.

No usar «prioritat més alta» com a solució universal a una contradicció semàntica. En Matrix, la prioritat ordena les skills i detecta alguns triggers literalment compartits; no és un verificador de compatibilitat normativa: [tooling/brain/matrix.mjs:91–104](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:91>), [tooling/brain/matrix.mjs:127–132](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:127>).

### 7.6 Rebut de context i execució

Exemple **[PROPOSTA]**, il·lustratiu i no aplicable:

```json
{
  "schema": "sdp.context-receipt.v1",
  "task_id": "tasca-exemple",
  "session_id": "sessio-exemple",
  "mode": "audit",
  "policy_digest": "sha256-del-contracte",
  "registry_digest": "sha256-del-registre",
  "source_revision": "commit-i-hashes-del-worktree",
  "required": ["identity", "audit-procedure"],
  "delivered": [
    {
      "id": "audit-procedure",
      "version": "1.0.0",
      "digest": "sha256-del-contingut",
      "delivery": "full",
      "transport_receipt": "identificador-del-host"
    }
  ],
  "missing": [],
  "allowed_effects": ["read", "create-authorized-report"]
}
```

Els valors són marcadors explicatius, no hashes reals. En producció, un esquema rebutjaria marcadors. La recepció de bytes pel host, quan siga observable, és diferent de la seua comprensió pel model; les postcondicions verifiquen el resultat.

La decisió d'executar s'ha de vincular al pla efectiu i als recursos actuals. En mutacions, comparar el hash anterior abans d'aplicar; en operacions remotes, usar un mecanisme d'idempotència del servei i verificar-ne el resultat. Un fitxer JSON editable no ha de ser, per si sol, una autorització irrevocable.

### 7.7 Estats d'una execució

```text
rebuda
  → classificada
  → context validat
  → preparada
  → autoritzada dins de l'encàrrec
  → executant
  → verificació
  → completada

Eixides alternatives:
  informació pendent / capacitat absent / conflicte
  cancel·lada / fallida / resultat incert
  recuperació pendent / revertida i verificada
```

La rutina de pànic passa a ser una política de recuperació: distingir error transitori, permís absent, font divergent, límit de recursos i fallada lògica. Reintentar només quan hi ha una raó nova i dins del pressupost. Guardar checkpoint abans d'un canvi de sessió. No usar un canvi de xat com a tractament automàtic d'un fitxer que falta.

### 7.8 Jerarquia i autorització per a diversos agents

El rol és independent del model: auditor, redactor, implementador, revisor o operador. Cada sessió declara el rol actiu i l'abast. Les instruccions d'un document auditat són dades de l'auditoria, no ordres que l'auditor haja d'executar.

La identitat IAIA MarIA pot ser compartida com a missió i veu. La capacitat d'implementar canvis queda en el rol central que l'usuari ha autoritzat. Un auditor extern o local no la guanya per carregar la skill d'identitat.

L'ordre general ha de respectar les restriccions del host i l'encàrrec vigent; després les normes del projecte aplicables, les skills seleccionades i, finalment, la informació consultiva. La resolució d'excepcions ha de quedar registrada. No es tracta de preguntar sempre, sinó de saber quina decisió ja està autoritzada.

## 8. Consoles com a resposta, amb Pedra Seca i sense dependència de proveïdor

### 8.1 Què hi ha i què falta

**[FET]** El xat inspeccionat representa el contingut textual del missatge en un div; eixe camí no conté un protocol d'artefactes interactius. Font: [src/sections/xat/XatSection.jsx:483–519](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatSection.jsx:483>).

Ja existixen `Boto`, `Taula`, `Pestanyes`, `Dialeg`, `Progres` i altres peces en la façana de Pedra Seca. `Taula` usa HTML natiu i un contenidor amb nom accessible i focus. Fonts: [src/components/PedraSeca/index.js:10–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/index.js:10>), [src/components/PedraSeca/organismes/Taula.jsx:9–19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/Taula.jsx:9>). Açò evita començar una biblioteca nova només per al panell.

**[PROPOSTA]** Construir un protocol propi de resposta estructurada i un renderer determinista sobre estes peces. L'assistent produïx una descripció validable de la vista; l'aplicació controla la representació i l'execució.

### 8.2 Flux complet d'una resposta amb controls

```text
Petició de l'usuari
  → dades verificades de l'execució
  → proposta de composició de la resposta
  → validació de l'esquema UI
  → renderer Pedra Seca
  → interacció de l'usuari
  → acció tipada amb context i permisos
  → runner
  → resultat verificat
  → actualització de la vista i registre
```

El model no inventa mètriques que el backend presenta com a reals. Les dades de salut venen dels rebuts i comprovacions. La redacció pot explicar-les, però la xifra, l'estat i la procedència s'han de conservar.

### 8.3 Protocol UI mínim

Exemple **[PROPOSTA]**; identificadors conceptuals nous:

```json
{
  "schema": "sdp.ui.v1",
  "artifact_id": "auditoria-exemple",
  "revision": 1,
  "title": "Estat de les skills",
  "summary": "Hi ha divergències pendents de revisió.",
  "blocks": [
    {
      "type": "metric",
      "label": "Skills presents",
      "value": 16,
      "source": "resultat-inventari"
    },
    {
      "type": "table",
      "dataset": "resultat-discrepancies",
      "columns": ["skill", "problema", "severitat"]
    },
    {
      "type": "action",
      "label": "Veure evidència",
      "action": "audit.open_evidence",
      "args": {"finding_id": "F01"}
    }
  ],
  "fallback": "Informe textual amb les mateixes dades i fonts."
}
```

La UI v1 començaria amb text, taula, mètrica, alerta, progrés, selector i acció. No afegiria un llenguatge de layout complet abans de tindre casos d'ús. Cada tipus es traduïx a components reals i variants aprovades.

### 8.4 Límits que ha d'imposar el renderer

- Tipus de bloc i acció en llista tancada; component desconegut = fallback explícit.
- Sense codi executable, event handlers, CSS arbitrari ni noms d'import proporcionats pel model.
- Límits de nombre de blocs, profunditat, volum de dades i llargària de textos.
- Referències a dades amb procedència; si una font falla, estat «desconegut» o «caducat».
- IDs estables i revisió de l'artefacte per evitar actualitzacions sobre controls vells.
- Enllaços i recursos validats pel host, amb protecció de dades per usuari i organització.
- La vista es pot serialitzar i exportar; en absència del renderer conserva text/taula útils.
- L'acceptació d'una acció s'avalua al servei executor, no només en el botó visible.
- Cada efecte queda lligat a tasca, actor, objecte, arguments i versió. Doble clic no duplica una mutació.

Per a prototips oberts que necessiten HTML lliure, usar un entorn aïllat sense capacitats privilegiades i dades sintètiques; no convertir-lo automàticament en el camí productiu. El patró habitual de gestió ha de ser composició de components coneguts.

### 8.5 Dues superfícies, segons la persona

**Consola de manteniment de la IAIA:** font del registre, release, càrrega de context, incidències, últimes proves, candidats i diferències. Pot mostrar hashes i IDs perquè són útils a qui manté el sistema.

**Interfície quotidiana del poble:** tasca, informació útil, estat comprensible i accions clares. Els detalls del model, el prompt o el digest no han d'ocupar el flux principal. La mateixa arquitectura suporta les dues superfícies sense traslladar la càrrega tècnica al veïnat.

### 8.6 Accessibilitat com a contracte

[PROPOSTA] Cada bloc té nom accessible, estat de focus, funcionament amb teclat, lectura lineal, contrast verificat, mida tàctil i alternativa textual. Les actualitzacions no han de robar el focus ni anunciar cada token d'una resposta. Les accions destructives o externes han de mostrar una previsualització concreta quan requerisquen decisió humana.

La validació ha d'incloure mòbil, augment de text, zoom, mode fosc i el web component incrustat. No es certifica WCAG amb una regex de colors o d'altures. La skill actual ja apunta a tacte i semàntica, però calen proves de la UI real: [.agents/skills/pedra-seca/SKILL.md:52–67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:52>).

## 9. Radar matinal i cicle d'automillora

### 9.1 Separar dos sistemes

**Radar autoinformatiu:** descobrix novetats i explica què podria ser útil.

**Cicle d'automillora:** converteix una hipòtesi en una millora provada i, si correspon, la promociona.

El primer no ha de poder modificar el segon. Una notícia convincent no és una prova de millora; una nova regla que el model redacta sobre si mateix no és aprenentatge verificat.

La skill exploradora actual és un punt de partida vàlid per al radar, però la fase C encara passa directament a crear la skill: [.agents/skills/skill-busca-skills/SKILL.md:23–39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-busca-skills/SKILL.md:23>). La proposta introduïx els estats i comprovacions que falten.

### 9.2 Rutina diària proposada

**[SUPÒSIT]** Hora inicial suggerida: 08:00 Europe/Madrid, configurable. No s'ha creat cap tasca programada: l'encàrrec és teòric i en esta sessió la xarxa està prohibida.

1. **Activació:** runner local o servidor programat; una sola execució per data i projecte.
2. **Preflight:** política vigent, xarxa autoritzada, pressupost, fonts disponibles i salut del registre.
3. **Ingesta:** canals i repositoris aprovats, preferint comunicats i documentació primària; RSS/Atom o adaptadors equivalents.
4. **Normalització:** títol, URL canònica, autor, data de publicació, data de consulta, revisió i hash.
5. **Deducció de novetat:** comparar IDs, revisions i hashes; un article republicat no ha de ser una novetat independent.
6. **Extracció:** separar afirmació del proveïdor, canvi verificable, exemple i inferència.
7. **Rellevància:** associar la novetat a una necessitat o incidència local concreta, començant per 00_TARGET_SKILLS.
8. **Classificació:** ignorar, observar, investigar o preparar candidat.
9. **Briefing:** poques novetats amb impacte, evidència, cost, riscos i següent pas.
10. **Tancament:** registrar resultat, cobertura i errors. Sense novetats rellevants, el sistema conserva el registre sense interrompre l'usuari.

La programació existent usa una ruta absoluta personal, Node en una ubicació concreta i un interval horari de diagnòstic; no acredita esta rutina de 08:00 ni el seu desplegament actiu. Font: [scripts/immunitari/org.socdepoble.plaquetes.plist:7–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/scripts/immunitari/org.socdepoble.plaquetes.plist:7>).

### 9.3 Fallades i límits del radar

- Xarxa prohibida o absent: informar «sense actualització», conservar l'última data de consulta i no inventar novetats.
- Una font falla: continuar amb les altres i declarar cobertura parcial.
- Resposta externa massa gran: limitar ingesta i conservar una referència a allò no processat.
- Contingut amb instruccions: tractar-lo com a dades no fiables; no executar-ne ordres.
- Descàrrega d'una skill: verificar origen, revisió, llicència i recursos abans d'obrir-la com a candidata.
- Exemple amb dependències o connexions de pagament: declarar-les; no instal·lar res automàticament.
- Execució llarga o duplicada: deadline, cancel·lació i clau d'idempotència.
- Rellotge canviat o horari d'estiu: programació amb zona horària; política de recuperació d'una execució perduda.
- Pressupost esgotat: resum parcial amb allò que falta; no degradar la precisió sense avisar.

Els límits de temps, cost i volum s'han de configurar després d'una fase de mesura. No hi ha en esta auditoria dades per prometre una quantitat de tokens o un estalvi anual.

### 9.4 Fitxa de candidata

Cada proposta ha de respondre:

- Quin problema existent resol?
- Quina font i revisió ho sustenten?
- Quina llicència permet l'ús i la redistribució?
- Què fa millor que la solució actual?
- Quines noves capacitats, dependències i permisos requerix?
- Quin conjunt de proves demostrarà la millora?
- Quin resultat faria descartar-la?
- Com s'integra, com es desactiva i què deixa en retirar-la?

Llicència desconeguda = no promoure material copiat com a part redistribuïble. Una idea es pot estudiar sense incorporar literalment una implementació.

### 9.5 Promoció per evidència

```text
descoberta
  → documentada
  → candidata
  → validació estàtica
  → experiment aïllat
  → comparació amb baseline
  → revisió de canvi
  → release de prova
  → activa
  → observació
  → mantinguda / retirada
```

La comparació ha d'usar les mateixes tasques i dades abans/després. Si el model és estocàstic, repetir casos crítics i publicar dispersió o nombre de fallades, no sols la millor mostra. Guardar una part dels casos fora del procés d'ajust per no optimitzar exclusivament contra els exemples coneguts.

Una millora menor pot promocionar-se sota una delegació explícita prèvia, si passa criteris tancats. Canvis d'identitat, permisos, esquema, retenció o efectes externs requerixen una decisió de governança adequada. No es demana aprovació diària per llegir fonts ja autoritzades; sí per ampliar l'autoritat del sistema.

### 9.6 Aprendre de la pràctica local

No tot aprenentatge ha de vindre de fora. Cada fallada recurrent pot generar una candidata:

```text
incident observat
  → reproducció
  → causa i contracte afectat
  → proposta de canvi
  → prova que falla abans i passa després
  → revisió
  → release
  → seguiment de reincidència
```

Els informes previs mostren que es vol destil·lar memòria; el defecte és promoure regles directament sense este circuit: [.agents/skills/skill-memoria-historica/SKILL.md:88–95](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-memoria-historica/SKILL.md:88>).

La mètrica útil és «la mateixa classe de fallada torna a passar en una tasca comparable?». «S'han escrit deu skills noves» mesura producció documental, no millora.


## 10. Sistema de disseny de skills: creació, consum i retirada

### 10.1 Correspondència amb un UI Kit

| En un sistema de disseny | En el sistema de skills |
| --- | --- |
| Tokens | Vocabulari de risc, efectes, estats i capacitats. |
| Components | Skills petites amb contracte. |
| Variants | Diferències d'entorn o cas d'ús declarades, no còpies quasi idèntiques. |
| Patrons de pàgina | Workflows que composen skills. |
| Catàleg | Registre navegable generat des de les fonts. |
| Espècimens | Casos d'avaluació amb dades i resultats esperats. |
| Compatibilitat | Versions i adaptadors que passen la mateixa suite. |
| Deprecació | Successor declarat i migració de consumidors. |

La regla pràctica és: **no crear una skill si el problema és una variant d'una existent, una dada del domini o una operació que hauria d'estar implementada en una eina.**

### 10.2 Criteri d'admissió d'una skill nova

Una skill candidata només entra al catàleg actiu quan:

1. Resol una classe recurrent de tasques o una operació prou crítica per justificar un procediment propi.
2. Té inputs, outputs, precondicions i límits.
3. Explica què fa quan falta informació o una capacitat.
4. Identifica fonts i dependències.
5. Passa l'esquema i els casos de conformitat.
6. No duplica ni contradiu una norma superior.
7. Té un responsable i política de retirada.
8. La seua incorporació no deixa manifest, índex, segell o adaptadors desactualitzats.

Una nova skill d'accessibilitat, per exemple, no hauria de repetir tots els tokens: hauria de consumir el contracte de Pedra Seca, executar les proves disponibles, exposar limitacions i produir una llista d'incidències amb reproducció.

### 10.3 Què conservar, separar i afegir

**Conservar i reforçar:** restauració segellada; disciplina de fonts; límits d'acció; veu i missió del PROFILE; tokens semàntics; façana de components; patró de capacitats de backend.

**Separar:** identitat de procediments; coneixement de producte de skills executables; recerca de promoció; higiene de memòria; especificació de component de guies generals; comprovació d'aplicació.

**Consolidar:** un workflow, una resolució de plantilles, un generador de catàleg, un contracte de rebut i una política de retenció.

**Afegir només on hi ha un buit real:**

| Capacitat conceptual proposada | Pot viure inicialment en | Resultat esperat |
| --- | --- | --- |
| Arrancada i represa verificable | Workflow + adaptador | Context entregat i pendents reconstruïts. |
| Recuperació d'errors | Evolució de core-context-panic | Error tipat, reintents limitats i checkpoint. |
| Descoberta i prova de capacitats | Runner | Matriu de capacitats disponibles. |
| Verificació d'evidència | Procediment d'auditoria | Cada afirmació forta amb font i límit. |
| Radar de novetats | Evolució de skill-busca-skills | Briefing traçable i candidats. |
| Avaluació i promoció | Pipeline de governança | Release provada o rebuig justificat. |
| Composició de UI estructurada | Skill + renderer | Artefacte validat sobre el catàleg. |
| Accessibilitat aplicada | Skill especialitzada | Proves, incidències i cobertura. |
| Memòria de decisions | Workflow + repositori | ADR i checkpoint vigents. |

Estos noms descriuen responsabilitats proposades, no fitxers existents ni un mandat de crear nou SKILL.md per fila.

### 10.4 Retirada sense fantasmes

Una retirada té cinc superfícies: productor, consumidor, registre, documentació i dades persistides. El cas dels espills prova per què esborrar només el resultat no basta.

Procediment proposat:

1. Enumerar tots els cridadors i referències.
2. Identificar quines funcions encara depenen de la peça.
3. Definir successor o absència deliberada.
4. Migrar consumidors i conservar un mapa de substitució explícit.
5. Desactivar productors antics abans de retirar els derivats.
6. Verificar que una arrancada, un build i un tancament no la recreïn.
7. Guardar història fora del conjunt de recuperació executiva segons la política aprovada.
8. Eliminar adaptadors transitoris només quan no quede cap consumidor necessari.

El mòdul antic `context_preflight` conserva funcions que tornen objectes/llistes buits i un digest de BOOTSTRAP presentat com a corpus. Cal incloure'l en l'inventari de retirada i revisar-ne els cridadors, sense assumir que hui s'executa: [tooling/wiki/lib/context_preflight.mjs:74–85](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/context_preflight.mjs:74>), [tooling/wiki/lib/context_preflight.mjs:117–128](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/context_preflight.mjs:117>).

## 11. Pla d'implantació per a IAIA MarIA

Totes les fases són **[PROPOSTA]**. Este informe no modifica cap skill, script, configuració o component.

| Fase | Treball acotat | Criteri d'eixida |
| --- | --- | --- |
| 0 · Congelar la línia base | Registrar commit i hashes del worktree; classificar F01–F20 i decidir quines polítiques prevalen. | Tall identificable i cap canvi concurrent sense declarar. |
| 1 · Reconciliar el registre | Completar a l'índex les quatre retirades i dues incorporacions que ja reflectix el manifest; corregir metadades; revisar F5. | Mateix conjunt de skills en tots els consumidors; esquema coherent. |
| 2 · Tallar la regeneració antiga | Unificar el generador de projeccions; separar check/apply; corregir el tancament. | Dos cicles de check/arrancada/tancament de prova no recreen espills retirats. |
| 3 · Unificar arrancada i rebut | Un resolver, identitat carregada, dependències, entrega de contingut i adaptadors. | Mateixos contractes i fonts entre hosts; cap verd sense entrega obligatòria. |
| 4 · Tancar permisos per efecte | Vincular tasca, sessió, scopes i hashes; eliminar permisos basats només en prefix. | Tots els casos negatius de permisos rebutjats sense efectes. |
| 5 · Consolidar contingut | Separar saber/procediment; reconciliar UI; retirar rituals i prescripcions antigues. | Cada regla té autoritat, propietari i comprovació. |
| 6 · Pilot de consola | Panell de lectura sobre inventari, portes i rebuts; després una acció reversible. | Renderer i fallback equivalents, accessible i amb dades reals. |
| 7 · Radar de lectura | Fonts aprovades, programació, límits i briefing. | Novetats traçables; cap mutació canònica. |
| 8 · Promoció controlada | Casos d'avaluació, candidates, releases i seguiment. | Primera millora amb abans/després i retorn provat. |

No cal esperar a una gran reescriptura per reduir risc: F01 i F02 són talls inicials concrets. No relaxar una porta perquè el corpus és roig; decidir primer si el problema és del contingut, del contracte o de la mètrica.

Per a Fable o qualsevol auditor posterior, entregar el mateix tall, esta llista de troballes, les eixides locals i preguntes de refutació. Les conclusions s'han d'acceptar per evidència, no per votació ni prestigi d'una marca.

## 12. Bateria de conformitat proposada

No s'han creat ni executat estes proves noves. Són criteris de treball perquè la implementació siga verificable i no es limite a reescriure instruccions.

| Cas | Prova | Resultat exigible |
| --- | --- | --- |
| R01 | Skill al disc sense registre actiu. | No executable; discrepància identificada. |
| R02 | Registre amb fitxer absent. | Càrrega fallida amb ruta exacta. |
| R03 | ID repetit o versió incompatible. | Rebuig determinista. |
| R04 | Dependència absent o cicle no admés. | Explicació de la cadena afectada. |
| R05 | Candidata amb status no actiu. | Mai seleccionada per al treball productiu. |
| R06 | Ruta amb escape, symlink no permés o recurs alié. | Rebuig abans de llegir/executar. |
| C01 | Tasca normal sense trigger d'identitat. | Identitat mínima carregada igualment. |
| C02 | Petició local vs externa amb paraules semblants. | Una ruta coherent amb el destinatari estructurat. |
| C03 | Registre JSON il·legible. | Error de registre; no «sense plantilla». |
| C04 | Font llegida però no entregada al host. | Context pendent; cap afirmació de càrrega completa. |
| C05 | Font obligatòria canviada després del rebut. | Invalidació i recàrrega. |
| C06 | Rebut d'una altra tasca o sessió. | Rebuig. |
| C07 | Data invàlida/futura o rebut caducat. | Rebuig, amb motiu. |
| C08 | Host amb payload diferent o hook absent. | Capacitat limitada declarada; no èxit fictici. |
| C09 | Context no cap complet. | Omissions explícites i descomposició; no truncament silenciós. |
| P01 | Ordre de lectura sobre fitxers autoritzats. | Execució directa dins de l'abast. |
| P02 | Mateix prefix d'eina, però operació mutadora. | Política per efecte, no per prefix. |
| P03 | Document extern demana ignorar governança. | Es tracta com a dada; no altera permisos. |
| P04 | Usuari autoritza exactament un informe. | Cap índex, lease auxiliar o ESTAT modificat fora del contracte autoritzat. |
| P05 | Doble clic o reintent d'operació completada. | No duplica l'efecte. |
| P06 | Procés interromput després d'una mutació. | Estat incert explícit i reconciliació abans de reintentar. |
| M01 | Retirada d'una skill fusionada. | Cap consumidor antic i mapa de substitució vàlid. |
| M02 | Tancament després d'eliminar espills antics. | No es recreen. |
| M03 | Template genera una skill. | Instància passa esquema i conformitat, no sols la plantilla. |
| U01 | Tipus UI o acció desconeguts. | Fallback sense execució arbitrària. |
| U02 | Error de dades de salut. | «Desconegut», mai zero/verd. |
| U03 | Teclat, lector de pantalla, zoom i mode fosc. | Controls operables, focus estable, contingut comprensible. |
| U04 | Canvi de tenant o actor. | Artefactes i accions no reutilitzen dades/permisos aliens. |
| U05 | Resposta en streaming incompleta. | No activa controls fins a validar un bloc complet. |
| A01 | Cap novetat matinal. | Registre tranquil; no missatge buit obligatori. |
| A02 | Xarxa prohibida o fonts caigudes. | Cobertura parcial/absent explícita. |
| A03 | Mateixa notícia amb un altre URL. | Deducció de duplicat traçable. |
| A04 | Skill externa sense llicència clara. | No promoció redistribuïble. |
| A05 | Candidata millora uns casos i trenca un invariant. | Rebuig malgrat millora mitjana. |
| A06 | Canvi de model o host. | Repetir conformitat abans de declarar equivalència. |
| A07 | Rollback d'una release. | Registre, fonts i consumidors recuperen una combinació coherent. |

Les proves de codi que ja existisquen s'han de reutilitzar. No cal convertir cada frase de prosa en un test que la repetisca: provar els límits, errors i resultats que protegixen una funció real.

## 13. Mesures del sistema i criteris d'èxit

Un panell útil necessita dades amb denominador, interval i font. Proposta de mètriques:

| Magnitud | Definició | Límit d'interpretació |
| --- | --- | --- |
| Divergències de registre | Skills presents/declarades/retirades fora de contracte. | No mesura qualitat del procediment. |
| Cobertura de context | Fonts obligatòries entregades / fonts obligatòries resoltes. | No prova comprensió; només entrega. |
| Cobertura d'avaluació | Casos requerits executats / casos requerits de la release. | Un cas passat pot ser insuficient. |
| Taxa de tasques correctes | Tasques amb postcondicions verificades / tasques comparables. | Cal segmentar per tipus, model i host. |
| Reincidència | Repetició de la mateixa classe d'incident després d'una correcció. | Requerix taxonomia d'incidents estable. |
| Cost observat | Temps, crides i tokens/cost només quan el host els expose. | Desconegut no és zero. |
| Càrrega humana | Decisions i intervencions necessàries per completar tasques comparables. | No inferir salut mental des de telemetria tècnica. |
| Temps de recuperació | Temps entre fallada i estat verificat segur/funcional. | Una represa sense verificació no tanca l'incident. |
| Frescor del radar | Temps des de l'última consulta correcta de cada font. | Data de consulta no equival a data de publicació. |
| Deute de retirada | Productors/consumidors que encara referixen peces retirades. | No premiar esborrats sense migració funcional. |

El primer objectiu no és un 10/10 d'«intel·ligència»; és **zero falsos verds en les comprovacions de frontera** i una primera millora amb evidència comparativa. Els llindars de rendiment s'han d'acordar després de mesurar una línia base.

## 14. Validació efectuada i preservació del treball

### 14.1 Comprovacions reals

| Comprovació | Mode | Resultat del tall inicial |
| --- | --- | --- |
| Inventari de skills | Lectura de fitxers presents | 16 SKILL.md; 1.190 línies; 86.323 bytes; 6 core; 0 amb version al frontmatter. |
| `node tooling/gates/tractor-manifest.mjs --json` | Només lectura | Codi 1; M2×4, M3×2. |
| `node tooling/wiki/tractor-frontmatter.mjs --estricte --json` | Només lectura | Codi 1; 217 documents; comptadors detallats en §1. |
| `node tooling/gates/segella.mjs` | Comprovació del segell existent, sense update | Segell divergent; cap resegellat. |
| `python3 -B tooling/brain/sync_agent_mirror.py . --mirror=_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR` | Check, sense write/prune | Codi 0; un índex correcte. |
| Import i crides a `classifica` | Execució en memòria, cinc peticions | Local i auditoria resoltes; tres peticions retornen null, segons §F06. |
| Scripts mutadors i cadena completa | Inspecció estàtica | No executats per l'abast d'escriptura restringit. |
| UI al navegador | No executada | Prohibició de navegador; cap certificació visual o d'accessibilitat en viu. |
| Fonts externes i novetats actuals | No consultades | Prohibició de xarxa; no es declara actualitat verificada. |

La comprovació del segell és de lectura en este tall perquè ja existix un hash no nul: el programa ix abans de la branca d'escriptura quan hi ha coincidència o divergència sense update. Si el segell faltara, el mateix comandament podria crear-lo; no s'ha generalitzat el seu mode com a read-only incondicional. Font: [tooling/gates/segella.mjs:35–52](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/segella.mjs:35>).

### 14.2 Frontmatter de l'informe i porta global

S'ha executat realment `node tooling/wiki/tractor-frontmatter.mjs --estricte --json` a les **2026-09-20T01:55:13.448229+02:00**, després de crear este informe. Resultat: **codi d'eixida 1 per al corpus complet**, 219 documents, 0 exempcions; F1=17, F2=89, F3=15, F4=8, F5=1, F6=0, F7=14 i F8=0. Els comptadors coincidixen amb els inicials: la creació de l'informe no hi ha afegit deute.

**Cap diagnòstic F1–F8 està assignat a la ruta d'este informe.** F5 és una regla agregada i no assigna ruta: la seua incidència sobre `core=true` correspon a les skills, no al frontmatter d'este document. Això permet afirmar que el tractor no detecta incidències pròpies de l'informe; **no** que la porta estricta global haja passat ni que s'haja executat una porta independent sobre un únic fitxer.

Esquema aplicat, SHA-256: `de04edc57c7ea44e1e628f168bf62ded8476a533240f4f0ac5ca314658152466`. La redacció dels resultats i de l'addenda de canvis concurrents conserva el mateix frontmatter validat. La comprovació final de cites inclou 139 referències a 63 fitxers; els rangs són vàlids.

La validació de frontmatter no comprova la veracitat de les conclusions, la resolució de totes les cites ni l'ancoratge entrant. Són comprovacions diferents i es documenten per separat.

### 14.3 Empremtes i límit del tall

S'han capturat hashes de les setze skills, el manifest, protocolledge i l'esquema després de la lectura inicial. El control de les 62 fonts citades va detectar cinc canvis concurrents; s'han rellegit els cinc fitxers, actualitzat les cites afectades i repetit les comprovacions pertinents. No s'ha creat un checkout immutable de tot el repositori ni s'atribuïxen a este auditor els canvis preexistents o concurrents.

Les empremtes inicials de 19 fonts es conserven per identificar la línia base:

| Font | SHA-256 inicial |
| --- | --- |
| [.agents/manifest.yaml](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/manifest.yaml>) | `0e4319840959d919cfc9420feb618a76cb1aaa427a338fdb0ee2bc2e985fcfaa` |
| [.agents/protocolledge.json](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json>) | `29a448e4a4185fffd8aca612ac8997b3f1f9a8a1c5c7ee79cb692a656fee39e5` |
| [.agents/skills/app-grid-shell/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/app-grid-shell/SKILL.md>) | `73d793f01611e4cba83735542e04b9c5d259a502307981f3cb4908a0cf8a56ab` |
| [.agents/skills/core-context-panic/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/core-context-panic/SKILL.md>) | `c29e842a03c3f9da01db3c5cc9b2ac65fb776a4dd00d01ff6667f211ee97c553` |
| [.agents/skills/core-restauracio-segellada/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/core-restauracio-segellada/SKILL.md>) | `4ed082c9bb0e1643d6d767ae6fed5a0a21104ee9d021249c7f409b838bc6329b` |
| [.agents/skills/pedra-seca/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md>) | `84e8bdd3315c7b0e18f6ba010e14a6dc7b2b49752b34519446b7ee5b78f0c672` |
| [.agents/skills/skill-busca-skills/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-busca-skills/SKILL.md>) | `e32f912ce6f8688e7a7f5a48e0c026bee6ea7fa43595499474550b05d1c82623` |
| [.agents/skills/skill-casos-us-essencials/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-casos-us-essencials/SKILL.md>) | `3539d31013bd7f5775815764fa329bfa25963acac3dbe070377a797d6c5f5946` |
| [.agents/skills/skill-cicle-de-vida/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md>) | `fa94f461d8d0e46453449f62c16c5c0f2d622e1eb6384fb89f93173e3ef89836` |
| [.agents/skills/skill-consell-i-colmena/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-consell-i-colmena/SKILL.md>) | `2b9c340a8be50f3f485d38d0e782697ab37ad265e75682e398e8d901a1ec224f` |
| [.agents/skills/skill-documentacio-i-reflex/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-documentacio-i-reflex/SKILL.md>) | `fd323b460598a9281e641b9b9b5c4d84f57ed1f8787449def3132fb4afa97350` |
| [.agents/skills/skill-estudi-mercat/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-estudi-mercat/SKILL.md>) | `ead3c8e980ae3467d10755e59fc339f56322d6e2ddef924c6939a68dd373c85d` |
| [.agents/skills/skill-guardia-frontmatter/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-guardia-frontmatter/SKILL.md>) | `0bb3d7490d9ca564ebf10728e35f1793490ee88982f0f938bab1ea6b29588656` |
| [.agents/skills/skill-iaia-identitat/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md>) | `172969aabf90b2e6abb215577a04310ccd27c6a730f7401bcb1f14c85e5c7c62` |
| [.agents/skills/skill-memoria-historica/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-memoria-historica/SKILL.md>) | `507c402e9f37bf9a2874d4a4525017bcaec4a9d3683542040213ed6b5e51b091` |
| [.agents/skills/skill-propagar-veritat/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-propagar-veritat/SKILL.md>) | `f609956cfd600af62a9981bffc60ba8e12c33b3ade4b7ddf7a7fa14232b2ea8b` |
| [.agents/skills/socdepoble-workflow/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/socdepoble-workflow/SKILL.md>) | `2f3a52d6d05df8613105c20402ee600d916ba8ee8cdc1c9cd70bff321885154b` |
| [.agents/skills/universal-page/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/universal-page/SKILL.md>) | `79654251ad8eda605203e93c658e16aa8c21483dae20f99743ac2fab2722bf83` |
| [tooling/wiki/schema.json](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json>) | `de04edc57c7ea44e1e628f168bf62ded8476a533240f4f0ac5ca314658152466` |


**Canvis concurrents detectats i rellegits.** Tall final: 2026-09-20T01:56:08.259632+02:00. Les altres 57 fonts citades conservaven els hashes de la comprovació de les 01:51:14. Els enllaços de les cites afectades s'han ajustat al contingut final.

| Font canviada | SHA-256 del tall final | Efecte observat |
| --- | --- | --- |
| [.agents/manifest.yaml](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/manifest.yaml>) | `4cc6de707db6cd368fcaeb548d57c53b20eb705a8dfab24fa8c0cc137c80cbd1` | Ja enumera 16 skills; F01 queda oberta per l'índex. |
| [.agents/AGENTS.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md>) | `62a094eaa58705afc0f81b6d9e730005cf1e87b388cec1a5442ee07946190f36` | L'enllaç de l'Acte Reflex apunta a la skill fusionada; les contradiccions de F08 persistixen. |
| [.agents/skills/skill-consell-i-colmena/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-consell-i-colmena/SKILL.md>) | `003156576971bdb995dcd1dc25f119131b966ff36ea6462ca2eeb8f01614d89e` | Referència de governança del Consell actualitzada; persisteixen marques/llindars sense prova. |
| [.agents/skills/skill-iaia-identitat/SKILL.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-iaia-identitat/SKILL.md>) | `5ca281885d5de85b0fa48e5ee0d3c8765dfba7f3e71acfeda92c17a0151752ce` | Afegit core:true; F07 distingix selecció de transport real. |
| [.agents/protocolledge.json](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json>) | `e457edc6565c9aa1355edc66a917a290f2c8e5c08db181f7627b78a6c13e4dc9` | Fallback canviat a una plantilla existent; F06 conserva la divergència dels resolutors. |


Recomprovació del manifest en el tall final: codi 1, sis M4; el segell continua divergent (hash calculat amb prefix `76424f93`, conservat `780605c3`). Estes constatacions no acrediten cap canvi remot ni permeten identificar qui ha editat els fitxers.

### 14.4 Bateria de veritat

- [x] S'han llegit íntegrament totes les skills executives presents, no només un índex o un bundle resumit.
- [x] Les afirmacions sobre codi inclouen rutes i línies, i les proves locals s'identifiquen separadament.
- [x] Els noms i contractes nous es presenten explícitament com a proposta.
- [x] S'han separat fets, inferències, observacions de sessió, propostes i supòsits.
- [x] No s'ha consultat web, navegador ni cap servei extern.
- [x] L'únic lliurable escrit per este auditor és este informe.
- [ ] El corpus complet passa `tractor-frontmatter.mjs --estricte`: **no; hi ha deute preexistent comprovat**.
- [ ] La proposta està implementada i provada en diversos hosts: **no; és un pla tècnic per a IAIA MarIA**.
- [ ] L'índex de l'Escriptori enllaça este informe: **pendent de l'agent central; fora de l'autorització d'esta auditoria**.

## 15. Incògnites que la següent fase ha de resoldre

1. Quin host invoca efectivament cada hook i amb quin payload? Cal una traça d'una sessió nova per host, sense assumir compatibilitat pel nom.
2. Quina configuració de Git/CI està activa i quines comprovacions són obligatòries al servidor? No s'ha consultat l'estat remot.
3. Quina política única de retenció vol ratificar el projecte? Les instruccions actuals són incompatibles.
4. Quines regles UI representen decisions vigents i quines són memòria de versions anteriors? Cal lligar-les a variants i proves.
5. Qui manté i aprova cada release del cervell? La separació entre auditor i implementador està descrita, però falta un procés de promoció complet.
6. Quines fonts, hora, pressupost i notificacions s'autoritzaran per al radar matinal?
7. Quines capacitats exposa realment Fable en este entorn? No s'inferixen límits, preus o especialitats a partir de la marca.
8. Quins incidents serviran de corpus d'avaluació i qui en fixa el resultat esperat?
9. Quina base de dades, si n'hi ha, convé per al registre d'execucions? La portabilitat no exigix canviar el backend actual ni afegir una infraestructura nova abans de provar la necessitat.

**Recomanació al Consell:** aprovar el contracte i els criteris de prova abans de redactar més regles. La primera demostració d'automillora hauria de ser que una skill fusionada desapareix correctament de tots els consumidors, la identitat arriba realment a una sessió nova i un tancament no recrea el sistema retirat.

**Ancoratge de Seguretat:** [[00_index_escriptori]] · [[00_TARGET_SKILLS]]
