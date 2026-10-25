---
type: informe
status: esborrany
description: Revisió adversarial dels DTO públics, filtre de poble, permisos de membres i persistència multiformat amb matriu MCR i proves locals.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_6a830962-0b9e-4bd0-9391-7f62869a0a2c:ea947ea6-a0f4-4924-9224-530e5f918d01
---
# Auditoria Codex · P1-11: DTOs, permisos i formats de portada

**Dictamen: P1-11 encara no té conformitat funcional completa.** La suite precommit passa en 28,18 segons, però el filtre de poble no existix al contracte actual, hi ha una exposició de correu personal per RPC i una carrera d'autorització en les altes de membres. La persistència T46 permet el multiformat sense afegir camps SQL; la tria i l'exportació continuen forçades a quadrat.

Abast: Tasca 3 de Codex del prompt 2230 i precondicions d'integració de les Tasques 1–2. Codi inspeccionat sobre HEAD `d7aa77350`, branca `backup-notes-publish`, el 2026-10-24. Cap canvi de producte, migració, commit o desplegament aplicat per Codex. Les troballes descriuen el tall observat, no una regressió atribuïda als commits anteriors.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6a830962-0b9e-4bd0-9391-7f62869a0a2c:ea947ea6-a0f4-4924-9224-530e5f918d01 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T20:55:13.785Z |
| Modificació | 2026-10-24T21:02:22+00:00 |
| Propietari | Codex |
| Aprovació humana | Encàrrec explícit del Mestre en este xat; pla 2230 aprovat. No implica aprovació del dictamen ni de desplegament. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex; tres subagents de lectura amb revisió creuada |
| Tokens consumits | No disponibles en este entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

Torn propi `torn_6a830962-0b9e-4bd0-9391-7f62869a0a2c`, abast documental. Olivera inicial: codi 0. Pla 2230 vinculat amb `document.mjs plan`. Informe creat amb `context → create` de la ruta `auditoria`, sense inventar plantilla.

Llegits íntegrament: `AGENTS.md`, `02_genotip.md`, `00_index.md`, `taxonomia_documental.md`; els quatre Markdown de primer nivell que hi havia a l'Escriptori a l'entrada (índex, Llibre Mestre, pla i prompt 2230); les skills locals de workflow, documentació, seguretat, direcció autònoma, Pedra Seca, casos d'ús i estudi de mercat. Consultats `BOOTSTRAP`, `cervell.json`, `protocolledge.json` i el bloc actual d'ESTAT. El laboratori i la producció humana no s'han recorregut en bloc ni alterat; les àncores de l'índex no s'han seguit a l'arxiu històric.

La directiva humana multiformat del torn preval sobre l'anterior regla quadrada de `sdp-pedra-seca` §8. No cal una nova autorització per executar l'abast ja aprovat. La implementació continua assignada a Claude i l'auditoria de disseny a Gemini.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24T20:55:13.785Z: esborrany creat des de la plantilla viva.

2026-10-24T20:58:00.000Z: consolidació de la revisió de DTO/RPC, membres i imatges; carrera de membres contrastada independentment; precommit verificat en execució aïllada. Informe disponible per al diàleg asíncron amb Claude i Gemini.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### C11-01 · P2 / mitjana · Filtre de poble ignorat silenciosament

**Confiança alta; defecte funcional reproduït amb transport simulat.** `src/data/supabase/organizations.js:206–224` només llig `consulta`, `limit` i `signal`; `src/data/localPerfils.js:326–337` fa el mateix. `src/data/contracte.js:201` definix un directori global. Passar `poble`, `town_name` o `tenantId` en l'objecte de filtre no canvia la petició. Per tant, el consumidor proposat al pla encara no pot mostrar amb garanties les empreses del poble visitat.

Reproducció executada en memòria sobre el cos real de `listPublicOrganizations`, amb `request` simulat: entrada `{ town_name: 'Orxeta', poble: 'Orxeta', tenantId: '00000000-0000-4000-8000-000000000123' }`; resposta simulada `[{ id: 'fora-del-poble', town_name: 'Alcoi' }]`. El resultat torna intacte i la URL és:

```text
/rest/v1/organization_directory?select=id,tenant_id,slug,name,kind,parent_organization_id,lema,description,logo_url,hero_url,presentacio_html,copyright,town_name,created_at,updated_at&order=name.asc,id.asc&limit=500
```

No és una fuga privada: la vista filtra organitzacions públiques. És una fallada de contracte respecte de P1-11. Filtrar després de rebre 500 registres globals pot ometre empreses locals situades fora d'eixa finestra.

**Esmena per a l'executor:** selector de poble explícit al port/adaptador, filtre remot abans del límit i paritat local; sense selector, preservar la cerca global. No confondre `tenant_id` d'infraestructura amb `town_name` de la fitxa. Si el servidor no admet el filtre, propagar un error explicable, sense tornar dades globals com si estigueren filtrades. Provar pobles diferents, homònims, accents, apòstrofs i un conjunt superior al límit. `requires_human_decision: false`.

### C11-02 · P2 / mitjana · Correu d'accés de la propietària exposat als coadministradors

**CWE-200; confiança alta en el SQL inspeccionat, sense lectura d'un compte real.** `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql:57–78`: `contacte_organitzacio` admet qualsevol `owner/admin` via `private.can_manage_organization`, consulta `auth.users.email` de l'owner i el retorna com `correu_per_defecte`, sense exigir que eixe owner siga `auth.uid()`. `desa_contacte_organitzacio` reutilitza la mateixa lectura. No s'ha trobat cap redefinició posterior que tanque esta via.

Reproducció pendent en una base de proves amb owner A i admin B: executar com B `POST /rest/v1/rpc/contacte_organitzacio` amb `{"p_organization_id":"<uuid de l'organització>"}`. La definició vigent retorna el correu d'accés d'A, encara que B no siga A. No s'ha llançat esta petició contra producció.

La revocació `2610211715_revoca_correu_organitzacions.sql` protegix `organizations.contact_email`; no modifica esta consulta a `auth.users`. El model local ja diferencia l'owner: `localPerfils.js:222` i el test local `:192–198` esperen absència del correu personal per a l'admin. Contradiu directament `core-seguretat-audit` §3.D.

**Esmena per a l'executor:** migració nova que limite la consulta del correu d'accés a `m.user_id = v_uid`, conservant l'accés legítim dels administradors al contacte corporatiu. Afegir prova de lectura i escriptura per a owner/admin/member/anon, amb contacte propi i sense. No editar només una migració ja desplegada. Cap pegat aplicat per Codex. `requires_human_decision: false`.

### C11-03 · P2 / mitjana · Carrera d'autorització en l'alta concurrent d'un membre

**CWE-367; confiança alta en la intercalació estàtica, execució PostgreSQL pendent.** `2610181915_organitzacions_correu_i_membres.sql:243–255`, amb la mateixa lògica a `2610081402_membres_organitzacio.sql:195–207`: el `SELECT … FOR UPDATE` no bloqueja cap fila quan el candidat encara no és membre. La comprovació de rol ocorre abans d'un `INSERT … ON CONFLICT DO UPDATE` que pot trobar una fila creada després.

Intercalació sota `READ COMMITTED`:

1. Owner A i admin B consulten un candidat C encara absent; tots dos obtenen `v_actual = NULL`.
2. B prepara alta `member` i passa la guarda: ni el rol demanat ni l'anterior són `admin`.
3. A inserix C com `admin` i confirma.
4. B arriba a l'UPSERT, troba conflicte de clau i escriu `role = 'member'` sense revalidar la promoció que A acaba de confirmar.

Resultat possible: B degrada una administradora tot i la norma «només la propietària». Dos subagents ho han revisat independentment. PK/FK/CHECK no ho impedixen; el trigger diferit `sdp_una_propietaria` només compta owners, i `xat_alta_gestor_entitat` només incorpora gestors al xat. No s'ha trobat serialització comuna ni una comprovació posterior que tanque el camí.

**Esmena per a l'executor:** serialitzar abans de llegir i autoritzar, amb un pany compartit pels camins d'alta, canvi i baixa; tornar a validar també l'autoritat de qui opera després del pany. Verificar amb dues sessions PostgreSQL i barrera controlada: owner/admin sobre el mateix candidat i revocació concurrent del rol de l'actor. Les proves actuals de SQL són textuals i no certifiquen eixa atomicitat. No es presenta com un atac remot executat. `requires_human_decision: false`.

### C11-04 · Precondició P1-11 · DTO d'activitat incompatible amb una connexió directa

`src/sections/notes/masDeLUsuari.js:102–130` torna notes virtuals `{ id, title, data: { seccio, item, ruta } }`. `src/sections/mur/PublicacionsDeLActor.jsx:57–59` espera entrades `{ id, item, esdeveniment }`. Passar directament `itemsPublicatsDe` deixa `item` indefinit. No es denuncia un render nou que ja existisca: és la integració pendent del pla.

Ja existix `publicacionsDeLaSeccio` a `src/sections/mur/usePublicacionsDeLActor.js:129–143`: desempaqueta `data.item`, calcula el model d'acte, ordena i retorna el DTO canònic. Cal reutilitzar esta conversió amb els àlies del perfil **visitat**; el hook complet actual usa l'actor actiu. Provar persona A visitant B, empresa, grup, Mercat i Agenda. L'històric remot disponible està limitat a la finestra carregada de 50 per secció: no anomenar-lo «tot l'aparador» sense càrrega progressiva. `requires_human_decision: false`.

### C11-05 · P3 / baixa · Contacte corporatiu públic sense projecció coherent

`src/data/supabase/perfils.js:76` espera un text en `org.public_email`. La columna `organizations.public_email` creada a `2610181915…sql:30` és booleana, i la definició de `organization_directory` de `2610081401_organitzacions_poble.sql:59–78` no la projecta. Un contacte expressament publicat no arriba a la fitxa remota per este camí.

Convé definir una projecció pública de text condicionada a l'opt-in, amb nom de DTO inequívoc i proves de privat/publicat. No concedir SELECT públic al correu privat ni reutilitzar `auth.users.email` com a contacte públic. És deute funcional preexistent, separat de C11-02. `requires_human_decision: false`.

### T46 · Persistència conforme; multiformat encara pendent

El camí ja recodifica el rectangle triat en un fitxer nou: `DialegEnquadrament.jsx:625–633 → imatgeCanvas.js:179–185 → useImatgeDeFitxa.jsx:145–151 → uploadMedia → heroImage/hero_url`. El hook espera la pujada i el desat abans de donar èxit. `imageUtils.js:78–92` reduïx proporcionalment i `pujadaImatge.js:204–218` ajusta qualitat; no hi ha un segon retall quadrat. La proporció es recupera de les dimensions del raster. **No cal camp addicional ni migració SQL per conservar el retall visual**, amb el contracte T46 actual.

Hi ha tres obstacles independents a resoldre:

- `useEnquadramentImatge.jsx:80–105`: llista de capçalera amb un sol `1:1` i `exacta:1200×1200`.
- `configDeForma:139` activa `senzill`; `DialegEnquadrament.jsx:644–710` no mostra selector de Forma. Afegir formats a una constant no els fa accessibles.
- `enquadrament.js:145–152` prioritza `sortida.exacta`: un retall 16:9 continua eixint 1200×1200 i es deforma si es deixa eixa mida.

PoC amb la funció pura real: rectangle 1600×900 + `exacta:{amplada:1200,alcada:1200}` → 1200×1200; sense exacta → 1200×675. En vertical, el límit actual d'amplada pot generar 1200×1600 (3:4) o 1200×2133 (9:16) abans que la compressió ho reduïsca. Fixar el màxim pel costat llarg evita canvas innecessari. Mantindre les mides pròpies d'avatar i logotip.

`PageFrame.jsx:1015–1019` i `src/css/layout.css:435–445` ja pinten la imatge a amplada completa i `height:auto`, sense aspect-ratio forçat. No cal un redisseny general de PageFrame per a conservar la proporció natural; sí verificar els breakpoints i el scroll de columna després del canvi.

El contracte humà general també enumera `21:9`, `3:2` i `9:16`. La subtasca reduïda de sis formats no els inclou tots. Per a l'executor, el conjunt complet és `original`, `21:9`, `16:9`, `3:2`, `4:3`, `1:1`, `3:4`, `4:5`, `9:16`. «Original» conserva la proporció; no promet conservar els bytes sense recodificar, ni recuperar zones ja eliminades d'un retall anterior.

### Targeta i portada · Recomanació per al consens de disseny

La card actual conserva `aspect-ratio:1/1` i `object-fit:cover` (`components.css:1209–1223`); la portada conserva les dimensions naturals. Per a l'aparador d'una artesana, `cover` pot tornar a amagar joies als extrems encara que la pujada siga panoràmica.

Proposta conservadora: conservar la geometria uniforme de la graella i mostrar l'actiu complet amb `contain` sobre el token de fons canònic, mentre la fitxa utilitza la proporció natural. Comparar visualment amb `cover` per a fotografies de context abans de fixar una política comuna. Una card d'alçada variable afecta la geometria i necessita validació específica; no és necessària per a conservar tota la fotografia. Cap canvi de card aplicat per Codex; és assessorament per a Gemini i MarIA.

### Controls satisfactoris i límits de la conformitat

- El directori públic fa SELECT explícit; `organization_directory` és `security_invoker`, `security_barrier`, restringida a `visibility='public'`. No retorna correus, `created_by` ni membres/propietaris al DTO. GRANT acumulats per columna, sense SELECT públic de `contact_email`, per inspecció de les migracions locals.
- Les RPC de membres comproven `auth.uid()` i `can_manage_organization`, usen `search_path=''` i revoquen EXECUTE a public/anon. Un membre ordinari no rep poder d'edició pel frontend. L'owner està protegit en operacions seqüencials; C11-03 limita la garantia concurrent.
- La UI té guarda síncrona de doble enviament i avorta lectures/cerca en desmuntar. `PerfilContext` comprova la sessió abans/després, i `PerfilShell` remunta `DetallCompte` amb `key={identitat.id}`. No s'ha demostrat contaminació entre fitxes per canvi d'organització.
- El port neutral i la Frontissa de Sollutia no s'han modificat. No s'han afegit dependències ni carpetes.

### Matriu MCR del torn

| Requisit | Estat al tall | Evidència i criteri pendent |
| --- | --- | --- |
| T3.1: DTO públic sense dades privades de gestors | CONFORME EN CODI per al directori | SELECT explícit/vista pública/GRANT. Producció no inspeccionada. |
| T3.1: filtre de poble sense fallada silenciosa | NO CONFORME | C11-01; selector absent i tall global abans del filtratge. |
| T3.1: correu personal només per al titular | NO CONFORME EN SQL | C11-02; RPC retorna auth.users.email a altres admins. |
| T3.2: autorització seqüencial de membres | CONFORME AMB RESERVA | RPC i rols al servidor; no substituïx prova concurrent. |
| T3.2: concurrència de membres | PARCIAL | C11-03; intercalació revisada, PostgreSQL a dues sessions pendent. |
| T3.3: persistència de proporció sense nou esquema | CONFORME amb T46 | Retall recodificat i hero_url existent. |
| T1.4: tria i exportació multiformat | PENDENT D'IMPLEMENTACIÓ | Formats, selector senzill i exacta encara quadrats. |
| T1.1–T1.3 i aparador públic | PENDENT D'IMPLEMENTACIÓ/REVISIÓ | No es certifica codi de Claude absent; conversió DTO C11-04 obligatòria. |
| T2: dilema de card/accessibilitat final | ASSESSORAMENT EMÉS | Proposta anterior; cap validació visual final ni informe Gemini al tall. |
| Regressió precommit i menys de 30 s | CONFORME EN ESTA EXECUCIÓ | 151 fitxers/2.945 Vitest + 259 Node, zero fallades; real 28,18 s. |
| T3.4: informe, Llibre Mestre i MCR | EMÉS | Este document i anotacions de C11-01..05/IDEA-20. |
| Tancament global del repositori | NO CONFORME | Olivera/plantilles/autoritat/segell/skills passen; LEDGER, Wiki i SCC fallen. El torn continua planned. |

### Retroalimentació sobre el prompt i consens asíncron

El pla explica el resultat desitjat, però cal convertir les precondicions C11-01/C11-04 en passos explícits de l'executor. Afegir la comprovació del selector senzill i de les dimensions efectives del fitxer: provar només la constant de formats produiria un fals positiu. Unificar la llista de nou proporcions entre la instrucció general i la subtasca, i usar els noms efectius del model SQL, sense convertir etiquetes de producte en enums inventats.

Separar «fonts llegides» de «fonts enllaçades»: exigir lectura recursiva de tota la producció humana i del laboratori a cada torn no és un abast útil d'auditoria. La lectura íntegra dels documents actius de primer nivell sí s'ha completat. Les carpetes protegides es consulten per referència concreta quan cal.

Al tall d'emissió no hi ha informes nous de Claude o Gemini al primer nivell de l'Escriptori. S'ha llegit i contrastat el pla complet i el Llibre Mestre, incloses les observacions prèvies sobre filtre i DTO. No s'inventa consens amb informes encara absents ni es crea una vigilància recurrent per esperar-los. Les aportacions dels tres subagents d'esta auditoria són revisions de Codex, no substituïxen els rols externs convocats.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades des de `socdepoble.org`, sense instal·lar dependències:

| Verificació | Resultat |
| --- | --- |
| `npm run test:precommit` | Codi 0: 151/151 fitxers, 2.945/2.945 Vitest i 259/259 Node. Primera passada Vitest 28,69 s i Node 1,61 s, amb altres bateries en paral·lel. |
| `/usr/bin/time -p npm run test:precommit` | Repetició justificada pel límit temporal: sense altres bateries simultànies, codi 0, real **28,18 s**; Vitest 26,20 s i Node 1,59 s. Mateixos recomptes. |
| Directori remot/local/contracte, correu i publicacions | 7 fitxers, 85/85 proves, 11,03 s. |
| GestioMembres, membresModel, organizations.membres, organitzacionsCorreu.migracio | 4 fitxers, 51/51 proves, 8,63 s. |
| `node --test tests/migracio-membres-organitzacio.test.mjs` | 18/18 proves. |
| enquadrament, imatgeCanvas, imageUtils, DialegEnquadrament.senzill, useImatgeDeFitxa, PageFrame.hero | 6 fitxers, 138/138 proves, 4,31 s amb 2 workers. |

Les bateries se solapen i no se sumen com si foren proves úniques. Les proves actuals de capçalera fixen expressament l'antic contracte: absència de Forma (`DialegEnquadrament.senzill.test.jsx:72`) i capçalera 1200×1200 amb format únic (`:229–264`). Passar-les no acredita el multiformat nou. Les proves SQL textuals tampoc acrediten concurrència ni desplegament.

Registres detallats de les dues passades precommit a `/tmp/sdp-p111-precommit-codex.log` i `/tmp/sdp-p111-precommit-isolat-codex.log` (diagnòstics temporals, no documents de lliurament).

`document.mjs check`: codi 0, `valid:true`, cap error. `git diff --check`: codi 0. Olivera final: codi 0. `node tooling/gates/tancament.mjs --turn-id torn_6a830962-0b9e-4bd0-9391-7f62869a0a2c`: codi 1, **1.329 registres**, estat `planned`. Passen Olivera, plantilles, autoritat, segell i catàleg de skills; fallen LEDGER, Wiki i SCC. Hi ha signatura del LEDGER trencada, enllaços heretats i metadades preexistents del Llibre Mestre (tags/reflex). També falta el relleu d'este torn al LEDGER: no es presenta tot el recompte com a deute previ. No s'ha resegellat ni alterat l'historial per fabricar un tancament verd. Diagnòstic complet a `/tmp/sdp-p111-tancament-codex.json`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s'ha connectat cap base remota ni executat cap migració. PostgreSQL local no disponible i Docker sense daemon, segons les comprovacions del subagent; C11-02/03 descriuen el SQL del repositori i no certifiquen l'estat desplegat. No s'ha executat l'escaneig extern Claude Security ni s'ha simulat la seua aprovació.

Cap referent extern o bundle compilat requerix enginyeria inversa en este abast: és una auditoria del nostre codi font. L'estudi de mercat i les afirmacions causals sobre competidors no s'han revalidat en esta Tasca 3; no es presenten com a conclusions d'esta auditoria. Tampoc es certifica la funcionalitat de cures, TPV, cotxe compartit, Menjar a Casa o E2EE a partir de l'existència de pestanyes. El canvi de vocabulari a Connectar no prova per si sol una relació simètrica.

No s'han aplicat pegats de seguretat: abans de fer-ho, l'executor ha d'afegir regressions que fallen amb el defecte i fer revisar el pegat, d'acord amb `core-seguretat-audit` §1.3. El dictamen de P1-11 queda pendent de corregir i reauditar C11-01/02/03 i la integració multiformat/DTO. Açò és l'entrega d'auditoria de Codex, no el tancament funcional del Trio.

Recursos: cap cron o schedule creat per este torn; cinc automatitzacions Codex locals trobades amb estat PAUSED i guarda nocturna inactiva/finalitzada. Les bateries i subagents propis han acabat; no es deixa vigilància recurrent. No s'han aturat serveis compartits de desenvolupament ni sentinelles d'infraestructura aliens al torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]]
- [[261024_2230_prompt_claude_gemini_codex_logica_actors_i_disseny_interior_pedra_seca]]
