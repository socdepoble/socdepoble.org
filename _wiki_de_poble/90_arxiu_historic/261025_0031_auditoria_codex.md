---
type: informe
status: esborrany
description: 'Reauditoria adversarial dels 70 fitxers de P1-11: filtre de poble, DTO públic, correu del titular, formats i matriu MCR.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_95ad7afe-7aaa-4eb0-99cc-8007bff05eb0:370f1ed8-03ed-4909-9815-4b4b61bcea48
---
# Gauntlet Codex · P1-11 post-commit 47eb2fa00

**Dictamen: conformitat parcial del commit; no s'emet un vistiplau incondicional.** C11-02 està corregit al SQL nou i C11-04 està resolt al DTO de l'aparador. C11-01 funciona en un servidor estable, però una nova guarda reutilitza memòria de columnes d'altres servidors i pot deixar el directori indisponible després de canviar d'amfitrió (G-P11-01, P2, reproduït). C11-03 i C11-05 continuen pendents, reconeguts per Claude.

**Verificació independent:** precommit complet, **22,71 s**, 152 fitxers / 2.959 Vitest + 259 Node, zero fallades. ESLint dels 66 fitxers JS/JSX del diff: codi 0. Estos resultats no equivalen a migració aplicada, PostgreSQL provat ni validació visual en navegador.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_95ad7afe-7aaa-4eb0-99cc-8007bff05eb0:370f1ed8-03ed-4909-9815-4b4b61bcea48 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T22:31:29.264Z |
| Modificació | 2026-10-24T22:37:38+00:00 |
| Propietari | Codex |
| Aprovació humana | Convocatòria explícita del Mestre al xat per al Gauntlet post-commit; pla 2230 vigent. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, amb tres subagents de revisió i contrast independent de la troballa nova |
| Tokens consumits | No disponibles en este entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

Torn documental `torn_95ad7afe-7aaa-4eb0-99cc-8007bff05eb0`; `context → create` de la ruta auditoria i pla 2230 vinculat. Olivera inicial: codi 0. Cap codi de producte, migració, índex Git, commit o desplegament modificat per Codex.

Abast exacte: commit **`47eb2fa005bc20025723a6ca8a765fdb8b328617`**, arbre **`b957185c0f8f4783ac804000591aedb1dfc2d9e4`**, pare `d7aa773505afb12ce34076bee11ac57d7127fdee`, branca `backup-notes-publish`. `b957185c` és un arbre Git, no un commit. `git diff --stat d7aa77350 47eb2fa00`: 70 fitxers, +2.482/−498, tots dins de `src/` i `supabase/`. El codi de treball d'estes superfícies coincideix amb el commit auditat.

Context retingut i contrastat amb el torn anterior: BIOS, Genotip, índex i taxonomia; pla/prompt 2230 i informe Codex2254. Llegits els informes nous complets de Claude2315 i Gemini2230, les actualitzacions de l'índex, ESTAT i Llibre Mestre. Skills aplicades: workflow, documentació/reflex, seguretat i **core-salfumant-radical**, a més de Pedra Seca i casos d'ús consultats en la primera auditoria. La passada se centra en els 70 fitxers convocats; no autoritza una purga del repositori ni moure documentació aliena.


<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24T22:31:29.264Z: informe creat des de la plantilla viva.

2026-10-25, hora local Europe/Madrid: revisió del diff amb tres subagents, contrast de la migració, reproducció independent de G-P11-01 i validació local de DTO/imatges/Connectar; precommit i lint independents acabats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### G-P11-01 · P2 / mitjana · La memòria d'un servidor antic bloqueja un altre servidor compatible

**Defecte nou de disponibilitat; confiança alta, reproduït dues vegades sobre el cos real.** `src/data/supabase/organizations.js:166` manté `columnesDirectoriAbsents` com un únic Set global. La guarda nova de `:228` rebutja una consulta amb `poble` si el Set conté `town_name`; `:240–242` hi incorpora l'absència detectada sense identificar de quin backend prové.

Reproducció executada en memòria amb el cos real del mètode, el detector real de `42703` i les funcions pures reals del filtre. Només el transport és simulat:

1. `listPublicOrganizations({poble:'Orxeta'}, {supabaseUrl:'https://old.invalid'})`: el transport torna `42703`, `column organization_directory.town_name does not exist`; resultat `NO-DISPONIBLE`.
2. Mateixa funció amb `supabaseUrl:'https://current.invalid'`, un transport que sí retornaria una fila d'Orxeta: resultat `NO-DISPONIBLE`, **sense cap petició al servidor nou**.
3. En netejar el Set i repetir la segona crida, arriba la petició i retorna `[{id:'org1',town_name:'Orxeta'}]`.

```text
old                 NO-DISPONIBLE
current             NO-DISPONIBLE
requests before reset: [https://old.invalid]
current after reset: [{id:org1,town_name:Orxeta}]
requests final: [https://old.invalid,https://current.invalid]
```

La memòria global preexistia, però la guarda nova transforma una degradació de columnes en indisponibilitat completa de la pestanya en altres hosts durant la mateixa càrrega de l'app. També manté l'error en el mateix host si l'esquema s'actualitza fins que es recarrega o s'invalida la memòria. `useEntitatsDelPoble` ja separa el seu estat per `backendScope`; el Set de l'adaptador anul·la eixa separació. Contradiu el canvi d'amfitrió/enxufabilitat que governa el port i el requisit de C11-01 sense regressions.

**Esmena conservadora per a Claude:** memòria de columnes per URL efectiva del backend, amb invalidació quan es torna a descobrir l'esquema o es reconecta; no simplement per tenant, perquè els tenants del mateix servidor compartixen esquema. Mantindre l'error explicable per a l'host realment antic. Afegir regressió A sense columna → B amb columna: B ha de fer petició i retornar les seues files; revisar també respostes concurrents dels dos hosts. Cap pegat aplicat. `requires_human_decision: false`.

### Correccions anteriors revalidades

| ID anterior | Estat post-commit | Evidència i límit |
| --- | --- | --- |
| **C11-01** | CORREGIT per a un backend estable; reserva G-P11-01 | `organizations.js:220–247` aplica `town_name=eq.<valor codificat>` al servidor abans del límit. `localPerfils.js` filtra abans del tall. Sense `poble`, la cerca continua global. L'absència de columna retorna NO-DISPONIBLE, sense dades globals camuflades. |
| **C11-02** | CORREGIT EN CODI; NO DESPLEGAT ACREDITAT | `2610242320_correu_propietaria_nomes_titular.sql:77–84` afig `m.user_id = v_uid` a la consulta d'auth.users. Admin diferent de l'owner rep correu per defecte buit; només la titular rep el seu correu. |
| **C11-03** | PENDENT, heretat | La RPC de membres `2610181915…sql:243–255` no canvia. Continua la carrera del candidat absent i l'UPSERT admin→member sense revalidació. No és una regressió introduïda per este commit. |
| **C11-04** | CORREGIT EN CODI I PROVES | `usePublicacionsDeLaFitxa.js:82–102` genera àlies de la fitxa visitada, i `usePublicacionsDeLActor.js:130–149,254–275` retorna `{id,item,esdeveniment}` via la conversió canònica. |
| **C11-05** | PENDENT, heretat | No hi ha projecció nova del contacte públic: el problema de public_email booleà/text continua separat de C11-02. |

**Precisió sobre C11-01:** la comparació és exacta, amb trim només del filtre, d'acord amb el contracte nou i la semàntica remota. No es declara una regressió perquè accents, variants bilingües o caixa no es pleguen: Claude ho declara a L-4. No s'ha trobat injecció nova del valor en altres paràmetres de consulta; el nom codificat es manté dins de `town_name`. La semàntica de la versió desplegada de PostgREST no s'ha comprovat contra un servidor real.

**Precisió sobre C11-02:** la migració conserva auth.uid, control de gestió, `SECURITY DEFINER`, `STABLE`, `search_path=''` i ACL explícites (`:53–68,94–95`). `desa_contacte_organitzacio` delega en la funció redefinida (`2610181915…sql:116–117`), de manera que també queda coberta. No s'ha trobat cap sobrecàrrega alternativa ni redefinició posterior. El model local i la normalització de `''` a null ja encaixen. La migració està expressament **NO aplicada**; cal verificar owner/admin/member/anon en PostgreSQL després d'aplicar-la, sense confondre una prova textual amb execució real de RLS.

### DTO i aparador: resultat de la revisió adversarial

- Els àlies provenen d'id, identitats fundacionals declarades i registre del projecte; una altra entitat amb slug `socdepoble` no hereta l'aparador. El filtre `tipusAutor` separa persona i entitat amb el mateix identificador.
- `publicacionsDeLaSeccio` desempaqueta `data.item`, deriva el model d'acte i conserva ordenació/id canònic. El hook antic de l'actor delega en la mateixa funció; no s'ha duplicat l'adaptador.
- `PublicacionsDeLaFitxa` munta Mur/Mercat/Agenda amb la vista existent, estats de càrrega/error i acció de reintent del Mur. No munta aparador per a IA o fora del Mur de l'app. La regió és al peu de PageFrame, fora de l'article que consumixen l'Índex, la traducció i el Lector.
- La finestra remota continua sent les 50 darreres publicacions carregades per secció del poble actiu. El text diu «recent» i «d'este poble»: no es certifica un historial complet ni paginació nova.
- No s'ha observat una nova fuga de notes privades ni atribució a l'actor actiu. Els tests executats cobrixen homònim persona/entitat, slug impostor, àlies del projecte, perfil visitat, Mercat, IA i errors. No substituïxen la validació de tota la cadena remota.

### Multiformat, T46 i Doble Escala Harmònica

El diff connecta les nou proporcions al Perfil i a les Notes, amb selector dins del mode senzill quan hi ha més d'una forma. No cal exigir `senzill:false`: el resultat observable demanat està cobert i es conserva la finestra existent. Fora l'exacta quadrada de capçalera, `costatLlarg:1200` conserva el retall; avatar i logotip mantenen les seues mides.

PoC amb funcions reals: 16:9→1200×675; 21:9→1200×514; 4:5→960×1200; 3:4→900×1200; 9:16→675×1200; original 4000×3000→1200×900. Amb tipus de font PNG i sortida `origen`, es conserva PNG. El retall continua als bytes (T46), sense afegir cap camp SQL.

La guarda vertical de lectura està a `layout.css:453–464` i `components.css:3363–3370`; la card manté quadrat/cover sense canvis. Perfil i Notes activen edició avançada i passen per la portada normal de PageFrame; s'ha **refutat** el possible bypass de la guarda en eixos dos editors. El salt de maquetació en `load` continua sent L-6 de Claude: no s'ha mesurat CLS ni es declara CLS=0 de tota la pàgina.

Observacions P3, sense atribuir una regressió nova:

1. Reenquadrar una capçalera existent PNG/WebP en **Notes** encara pot aplanar la transparència a JPEG: URL→sortida JPEG a `UniversalEditorShell.jsx:911–912` i `useEnquadramentImatge.jsx:154,168–170`. El Perfil sí usa FORMAT_DE_LA_FONT. Ja existia abans i la prova nova fixa explícitament eixa eixida (`UniversalEditorShell.enquadrament.test.jsx:357–360`).
2. L'API genèrica `heroComponent`, l'editor amb `edicioAvancada:false` i la portada plegable dels plugins queden fora de la guarda normal. No afecta el flux principal de Perfil/Notes; queda deute de cobertura de la superfície genèrica.
3. Sense dimensions prèvies, la detecció vertical ocorre després de carregar la imatge. L-6 és correcte; una inspecció de CSS no permet donar una xifra de CLS real.

### T5B-03 i Connectar

La vista «Membres i connexions» manté `obert:mana`; `DetallAjust` continua impedint muntar gestió per a no administradors. `PerfilShell` remunta el detall per identitat i vista, i `PerfilContext` conserva assertCurrent abans/després de les operacions. Una sola instància de QuiSegueixOrganitzacio. El canvi de vista no resol ni empitjora el defecte SQL C11-03.

La lent de vocabulari ha contrastat el diff i l'AST de Connectar/Seguidors: canvien textos i comentaris, no les crides, condicions, sessió, avortament ni avisos. Les cinc llengües canvien 32 valors existents cadascuna, sense retirar claus; a més afigen 15 claus comunes de directori/aparador. Cap marcador alterat, i 76 reserves valencianes revisades sense discrepàncies. La relació del port continua sent d'un sol sentit; canviar el lèxic no crea una connexió bilateral.

### Matriu MCR actualitzada

| Requisit | Dictamen | Evidència/pendent |
| --- | --- | --- |
| Diff real dels 70 fitxers i identitat Git | AUDITAT | Commit 47eb2fa00, arbre b957185c, pare d7aa77350; inventari següent. |
| C11-02: auth.users.email només al titular | CONFORME EN CODI | Migració nova/ACL/delegació correctes; NO aplicada ni executada per Codex. |
| C11-01: filtre abans del límit i cerca global | CONFORME AMB RESERVA P2 | Paritat remota/local correcta; G-P11-01 impedix certificar canvi d'host. |
| C11-04: DTO de fitxa visitada | CONFORME EN CODI/PROVES | Conversió única; autoria per id i tipus; límit de 50 explícit. |
| P1-11: poble sense duplicats i 2a pestanya | CONFORME EN CODI/PROVES | Muntatge diferit del directori, key per poble, estats d'error/buit. Navegador pendent de Gemini. |
| T5B-03: membres separats i permisos | CONFORME EN CODI/PROVES | Mateix detall i guardes, sense duplicació de connexions. |
| Connectar i cinc llengües | CONFORME EN SUPERFÍCIE CONVOCADA | Textos, claus i avisos coherents. Textos legals fora de l'abast. |
| Nou proporcions i exportació T46 | CONFORME EN CODI/PROVES | Selector accessible al DOM i mides proporcionals; verificació de navegador/Safari pendent. |
| Guarda vertical i card 1:1 | CONFORME EN FLUX PRINCIPAL | CSS i proves passen; observacions P3 anteriors i L-6. No s'inventa validació visual. |
| C11-03 concurrència / C11-05 contacte públic | PENDENTS HERETATS | Ja declarats a P1-13; cap correcció en este commit. |
| Precommit <30s i ESLint del diff | CONFORME EN ESTA EXECUCIÓ | 22,71 s; 2.959 + 259; ESLint 66 fitxers, codi 0. |
| Aptitud de producció i tancament global | NO CERTIFICADA | Migració, navegador i gates globals separats de les proves locals. |

### Inventari verificable dels 70 fitxers

Font: `git diff --name-only d7aa77350 47eb2fa00`. Lectura repartida entre DTO/UI, dades, permisos i imatges/vocabulari; els casos de seguretat i la troballa nova tenen contrast independent. La justificació és de l'abast del diff, no una certificació de tot el repositori.

| Fitxer | Utilitat en este canvi |
| --- | --- |
| `src/components/universal/PageFrame.hero.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/components/universal/PageFrame.jsx` | Portada/closca/editor universals; guarda vertical i selector. |
| `src/components/universal/UniversalEditorShell.enquadrament.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/components/universal/UniversalEditorShell.jsx` | Portada/closca/editor universals; guarda vertical i selector. |
| `src/components/universal/enquadrament/DialegEnquadrament.jsx` | Formats, selector i exportació proporcional; consumit pel Perfil i les Notes. |
| `src/components/universal/enquadrament/DialegEnquadrament.senzill.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/components/universal/enquadrament/DialegEnquadrament.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/components/universal/enquadrament/enquadrament.js` | Formats, selector i exportació proporcional; consumit pel Perfil i les Notes. |
| `src/components/universal/enquadrament/enquadrament.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/components/universal/enquadrament/useEnquadramentImatge.jsx` | Formats, selector i exportació proporcional; consumit pel Perfil i les Notes. |
| `src/config/idiomes/ca.js` | Claus i textos del directori/aparador/Connectar; paritat en les cinc llengües. |
| `src/config/idiomes/en.js` | Claus i textos del directori/aparador/Connectar; paritat en les cinc llengües. |
| `src/config/idiomes/es.js` | Claus i textos del directori/aparador/Connectar; paritat en les cinc llengües. |
| `src/config/idiomes/eu.js` | Claus i textos del directori/aparador/Connectar; paritat en les cinc llengües. |
| `src/config/idiomes/gl.js` | Claus i textos del directori/aparador/Connectar; paritat en les cinc llengües. |
| `src/css/components.css` | Guarda de portada vertical; tokens i geometria de cards. |
| `src/css/layout.css` | Guarda de portada vertical; tokens i geometria de cards. |
| `src/data/backendPort.js` | Contracte, adaptador o conformitat de dades; consumit pel port i el directori. |
| `src/data/conformitat/kit.js` | Contracte, adaptador o conformitat de dades; consumit pel port i el directori. |
| `src/data/contracte.js` | Contracte, adaptador o conformitat de dades; consumit pel port i el directori. |
| `src/data/localPerfils.directori.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/data/localPerfils.js` | Contracte, adaptador o conformitat de dades; consumit pel port i el directori. |
| `src/data/pobleOrganitzacio.js` | Contracte, adaptador o conformitat de dades; consumit pel port i el directori. |
| `src/data/pobleOrganitzacio.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/data/supabase/conformitat.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/data/supabase/correuPropietaria.migracio.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/data/supabase/organitzacionsCorreu.migracio.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/data/supabase/organizations.directori.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/data/supabase/organizations.js` | Contracte, adaptador o conformitat de dades; consumit pel port i el directori. |
| `src/sections/connectar/BlocRelacio.jsx` | Textos de connexions i avisos; lògica i privacitat conservades. |
| `src/sections/connectar/ConnectarSection.jsx` | Textos de connexions i avisos; lògica i privacitat conservades. |
| `src/sections/connectar/ConnectarSection.relacions.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/connectar/missatgeAlXat.js` | Textos de connexions i avisos; lògica i privacitat conservades. |
| `src/sections/connectar/organitzacio/BlocFormarPart.jsx` | Textos de connexions i avisos; lògica i privacitat conservades. |
| `src/sections/connectar/useSeguiment.js` | Textos de connexions i avisos; lògica i privacitat conservades. |
| `src/sections/detail/ItemDetailSection.imatgesPropies.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/detail/VisorDePublicacio.jsx` | Portada/closca/editor universals; guarda vertical i selector. |
| `src/sections/detail/VisorDePublicacio.vertical.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/detail/detailSectionMeta.jsx` | Pestanya/directori del poble, muntatge diferit i estats. |
| `src/sections/disseny/cataleg/detalls/EspecimenEnquadrament.jsx` | Espècimen viu del retallador; concordança amb el contracte multiformat. |
| `src/sections/disseny/cataleg/detalls/EspecimenEnquadrament.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/mur/usePublicacionsDeLActor.js` | Conversió DTO comuna reutilitzada per actor actiu i fitxa visitada. |
| `src/sections/pobles/EntitatsDelPoble.jsx` | Pestanya/directori del poble, muntatge diferit i estats. |
| `src/sections/pobles/EntitatsDelPoble.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/pobles/qualitat.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/pobles/useEntitatsDelPoble.js` | Pestanya/directori del poble, muntatge diferit i estats. |
| `src/sections/profile/DetallCompte.jsx` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/DetallCompte.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/DetallMultimedia.jsx` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/GestioMembres.jsx` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/PerfilContext.jsx` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/PerfilContext.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/PerfilEditor.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/PerfilPublicSection.aparador.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/PerfilPublicSection.jsx` | Aparador de la fitxa visitada al peu de PageFrame. |
| `src/sections/profile/PerfilPublicSection.seguidors.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/PerfilShell.espai.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/PerfilShell.jsx` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/PerfilShell.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/PublicacionsDeLaFitxa.jsx` | Aparador de la fitxa visitada al peu de PageFrame. |
| `src/sections/profile/PublicacionsDeLaFitxa.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/Seguidors.jsx` | Textos de connexions i avisos; lògica i privacitat conservades. |
| `src/sections/profile/Seguidors.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/fitxaDePerfil.js` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/perfilModel.icones.test.js` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/perfilModel.js` | Integració de perfil/vista de membres i textos compartits; sense nova autoritat. |
| `src/sections/profile/useImatgeDeFitxa.test.jsx` | Proves de regressió del mòdul homònim; contrastades amb el canvi de contracte. |
| `src/sections/profile/usePublicacionsDeLaFitxa.js` | Aparador de la fitxa visitada al peu de PageFrame. |
| `supabase/README.md` | Catàleg de migració i procediment de verificació; NO aplicada. |
| `supabase/migrations/2610242320_correu_propietaria_nomes_titular.sql` | RPC de correu del titular; cap columna ni privilegi nou. |

### Diàleg creuat amb Claude i Gemini

Es reconeixen les correccions de C11-01/02/04 i les decisions D-1/D-2 de Claude perquè el diff implementa el resultat demanat. D-3 manté `object-position:top` per a verticals, mentre l'informe antic de Gemini proposava center: és una decisió de presentació declarada, no una correcció de seguretat ni motiu per afirmar que tota la fotografia es mostra a la card. La fitxa conserva la proporció.

No s'accepten com a evidència actual les files de Gemini2230 que encara diuen «pendent d'execució», ni les afirmacions generals de simetria o CLS=0: aquell document audita el pare d7aa77350 i expressa una proposta. El Gauntlet actual tracta el commit nou. A l'emissió no hi ha un informe nou de navegador de Gemini al primer nivell; cap consens visual inventat.

Retroalimentació: afegir al criteri de fet del port el canvi de backend A→B i invalidació d'esquema, no sols un host estable; mantindre separats resultat de codi, prova SQL real, desplegament i verificació visual. El nombre de proves verdes i el nom de l'arbre no són credencials d'execució.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comanda o bateria | Resultat propi |
| --- | --- |
| `/usr/bin/time -p npm run test:precommit` | Codi 0, real **22,71 s**; 152/152 fitxers, 2.959/2.959 Vitest, 259/259 Node. Vitest 20,76 s; Node 1,60 s. |
| ESLint `--max-warnings=0` sobre els fitxers `.js/.jsx` de `git diff --name-only d7aa77350 47eb2fa00` | Codi 0, **66 fitxers**. |
| DTO/aparador/poble: PublicacionsDeLaFitxa, PerfilPublicSection.aparador, usePublicacionsDeLActor, EntitatsDelPoble, qualitat de pobles | 5 fitxers, **52/52**, 5,08 s. |
| Directori remot/local/contracte/poble/kit | 5 fitxers, **166/166**, 1,72 s. |
| Migració nova/correu/membres/model local/vistes/context | 9 fitxers, **240/240**, 7,57 s. |
| i18n de 5 llengües + ConnectarSection.relacions + Seguidors | 7 fitxers, **363/363**, 5,15 s. |
| Enquadrament, diàleg,canvas, EXIF, orientació, pujada, Perfil, Notes, PageFrame, plegable i detall vertical | 13 fitxers, **404/404**, 7,87 s. |
| PoC G-P11-01 sobre cos real |Fallada funcional reproduïda; controlador després de reset funciona. No és un test de regressió verd. |

Les bateries se solapen; no se sumen com si foren proves úniques. No s'ha repetit el Vitest sencer de 21.889 proves que Claude declara en la còpia congelada. El seu resultat està documentat com a evidència de l'executor, no com una execució de Codex. No s'han afegit proves a producció ni suavitzat assercions.

Logs temporals: `/tmp/sdp-gauntlet-47eb-precommit-codex.log`, `/tmp/sdp-gauntlet-47eb-dto-codex.log` i `/tmp/sdp-gauntlet-47eb-lint-codex.log`.

**Tancament executat:** `document.mjs check` codi 0 (`valid:true`, cap error); Olivera codi 0; `git diff --check` codi 0. `tancament.mjs --turn-id torn_95ad7afe-7aaa-4eb0-99cc-8007bff05eb0`: codi 1, 1.329 registres, estat `planned`. Passen Olivera, plantilles, autoritat, segell i skills; fallen LEDGER, Wiki i SCC. Hi ha signatura del LEDGER trencada, enllaços heretats i metadades del Llibre Mestre pendents; també falta el relleu d'este torn al LEDGER, de manera que no s'atribuïx tot a deute anterior. No s'ha resegellat el registre ni s'ha relaxat cap porta per fabricar verd. Diagnòstic: `/tmp/sdp-gauntlet-47eb-tancament-codex.json`.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

Migració nova no aplicada i PostgreSQL real no executat; RLS/ACL revisats estàticament. No hi ha noves taules o privilegis ni canvis a la Frontissa Sollutia: el port continua sent la frontera. La troballa G-P11-01 afecta disponibilitat; no s'ha demostrat cap fuga privada pel directori.

La validació de navegador està assignada a Gemini; Codex no ha simulat haver-la feta. No s'ha consultat ni canviat cap compte real ni secret. No s'han creat carpetes o dependències, ni executat commit/push/desplegament. Els canvis aliens preexistents es preserven.

Este informe no aplica pegats: l'encàrrec és auditar. G-P11-01 té un camí de correcció concret i una regressió exigible. C11-03/C11-05 i els P3 coneguts queden anotats al Llibre Mestre sense reetiquetar-los com a regressions noves. Tancament del Trio i Acta Marmota conjunta: MarIA, amb els informes finals de les dues auditores.

Cap cron o schedule creat per Codex; els subagents i processos de proves propis han acabat. Les cinc automatitzacions locals consten PAUSED; la guarda nocturna consta inactiva/finalitzada. No s'aturen serveis compartits de desenvolupament o infraestructura aliens al torn.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_2315_implementacio_claude]]
- [[261024_2230_auditoria_gemini]]
- [[261024_2254_auditoria_codex]]
- [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]]
