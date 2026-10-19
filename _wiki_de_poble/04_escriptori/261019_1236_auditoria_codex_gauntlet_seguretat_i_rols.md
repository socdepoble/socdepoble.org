---
type: informe
status: esborrany
description: Contrast independent dels sis pegats de client, les migracions F01 i el disseny de Superadministració; evidència local i criteris de desplegament.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_77a87bc0-17fc-408f-82e8-e665f4a3e1a5:9a93f35e-8be1-48e3-89e6-bd8bf502fc3a
---
# Auditoria adversarial Codex: pegats de seguretat, F10 i commutador de rols

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_77a87bc0-17fc-408f-82e8-e665f4a3e1a5:9a93f35e-8be1-48e3-89e6-bd8bf502fc3a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T10:39:13.726Z |
| Modificació | 2026-10-19T10:49:56+00:00 |
| Propietari | Codex |
| Aprovació humana | Auditoria encarregada pel Mestre; informe sense autorització implícita de desplegament |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, família GPT-6; revisió paral·lela amb tres agents del mateix torn |
| Tokens consumits | No disponibles: esta sessió no exposa un comptador verificable |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-19: contrast independent de l’informe 2315 i dels sis pegats presents a l’arbre de treball. Reproduccions locals amb dades sintètiques, revisió SQL en còpia temporal i revisió adversarial de la proposta 2256. Cap canvi al producte ni a Supabase.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen executiu

**Conservar els sis pegats. No he demostrat cap regressió nova causada per ells; tampoc considere tancades totes les troballes que pretenen corregir.** F03, F04, F05 i F14 passen la revisió focal. F06 tanca el vector per UUID, però conserva deute d’aïllament entre àmbits. F11 conserva una via reproduïble que atribuïx falsament una fotografia a la IAIA després de derivar-la des del Mur, Mercat o Agenda.

**Les dues migracions són candidates a staging, condicionades al preflight; no tenen vistiplau de producció.** La revisió estàtica no troba un bloquejant nou al SQL. Falten execució PostgreSQL, prova dels permisos efectius i contracte de la versió real de Storage. El seu preflight documental necessita ampliació.

**F10 és vàlida com a confusió de compte / login CSRF amb interacció.** He reproduït que l’adaptador adopta la sessió del compte de l’enllaç després de «Desa», sense confirmar la identitat. La contrasenya modificada és la d’eixe compte. No hi ha prova de presa del compte previ de la víctima ni d’escalada a superadmin.

**La proposta 2256 continua sent vàlida com a arquitectura, no com a funcionalitat implementada.** Un commutador visual no reduïx els privilegis que hui concedix `private.es_superadmin()`. El mode Veí real exigix autorització de servidor i tancar tots els accessos elevats alternatius.

### 1. Abast, evidència i model d’amenaça

Fonts principals: [[261018_2315_auditoria_claude]], `PEGATS.md`, els sis diffs de client, el diff amb les dues migracions, la nova skill i [[261018_2256_auditoria_codex_creuada_claude_i_superadministracio]]. Es conserva com a context el pla 2000 i l’auditoria backend 2030. L’acta 2330 és antecedent; les seues afirmacions de verd global no substituïxen verificació.

**Identificadors:** ací `F01…F14` corresponen a **Claude Security**. No són les dotze `F1…F12` de l’informe 2045: per exemple, la F03 actual tracta tipus de payload; l’antiga F3 tractava esborrat de mitjans. `C01…C04` són conclusions pròpies d’este contrast.

| Element | Model auditat |
|---|---|
| Actius | Identitat autenticada, permisos de poble/plataforma, autoria i drets d’imatge, correus privats, objectes de Storage, disponibilitat del client. |
| Adversaris | Anònim amb la clau pública del paquet; membre que escriu JSON per API; compte que remet el seu propi enllaç de recuperació; client que fabrica camps o reenvia peticions antigues. |
| Fronteres | JSONB → mapejador → components/derivades; JWT i concessions → RPC/RLS; referència opaca → Storage; enllaç de correu → sessió; actor visual → emissor autoritzat. |
| Evidència | Lectura del codi actual, correspondència dels pegats, proves focals, sondes sintètiques i documentació primària. Les conclusions remotes queden condicionades. |
| Fora d’abast executat | SQL contra Supabase, correus reals, comptes reals, upload/delete, compilació o publicació de WordPress/mòbil. |

L’escaneig original declara 129/169 fitxers llegits fins a conclusió dins dels components i 40 no assolits; és acotat, no certifica tot el repositori. Els 81 investigadors i els vots de verificació augmenten el contrast, però no equivalen a una reproducció d’explotació. Les 19.638 proves verdes són el resultat **declarat per Claude**; no he repetit eixa suite global.

### 2. Els sis pegats: acceptació i límits de regressió

| Pegat | Dictamen | Evidència i límit |
|---|---|---|
| **F03 / F07 / F09 — tipus del payload** | PASS focal | [mapejadorSeccions.js:432](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/mapejadorSeccions.js>) normalitza camps consumits i s’aplica a la fila publicada. Els objectes, etiquetes i origen malformats provats ja no tomben estes vistes. No valida totes les llargàries/estructures al servidor; `app_content` usa un altre camí. |
| **F04 / F12 — regex lineal** | PASS focal | [detailHelpers.jsx:14](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/detailHelpers.jsx>) i `semblaHtml` (:54) eliminen la repetició quadràtica inspeccionada. 50.000 casos diferencials curts: zero diferències. No tanca les regex de cerca/Markdown que PEGATS ja declara pendents. |
| **F05 — camí de Storage** | PASS focal | [storage.js:327](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js>) rebutja segments i caràcters que poden canviar la URL abans de signar/promoure. 50.000 camins sintètics, 3.527 admesos: cap desviació del prefix de signatura. Noms llegats amb `%`, delimitadors o espai final deixen de resoldre’s deliberadament: cal cens de compatibilitat en staging. |
| **F06 — entitat del projecte** | PASS del vector inicial; tancament parcial | [PerfilPublicSection.jsx:248](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilPublicSection.jsx>) deixa de registrar una homònima aliena per obrir-ne l’UUID. Persistixen Set global, cerca sense tenant i slug no reservat: C02. |
| **F11 — autoria de l’arxiu** | Tancament parcial; residual confirmat | La fila directa ja no pot declarar autoritat IAIA a voluntat; la protecció es perd en fotos derivades: C01. Les proves originals verdes no cobrien eixa cadena completa. |
| **F14 — venedor del servidor** | PASS focal | [detailSectionMeta.jsx:382](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/detailSectionMeta.jsx>), [indexCerca.js:429](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/search/indexCerca.js>) i [NotesEditor.jsx:136](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx>) prioritzaren el nom autoritatiu i no recuperen `seller` en aportacions amb propietària, inclòs el nom amb NBSP. Depén que el trigger d’autoria estiga desplegat; no s’ha comprovat remotament. |

F03/F14 són defenses de consum. Mantindre la derivació d’autoria al servidor, validar tipus i límits allí, reservar els camps d’autoritat i usar `section_id` autoritatiu. Un canvi de React no transforma el JSONB existent en una dada fiable per a tots els consumidors.

El F05 original descriu un POST desviat **dins de l’origen Supabase**: perquè tinga impacte cal una ruta que accepte eixe mètode/cos i els permisos de la sessió. No l’interprete com una evasió demostrada de RLS ni com una petició a qualsevol servidor extern.

### 3. C01 · F11 conserva atribució IAIA falsa en fotos derivades

**CWE-345 · severitat baixa · confiança alta en el recorregut local · residual preexistent.** No és una regressió introduïda pel pegat. És una correcció incompleta del mateix límit de confiança.

[origenImatges.js:64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/multimedia/origenImatges.js>) identifica una aportació amb `ownerUserId`. Les projeccions [mediaContent.js:50](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/multimedia/mediaContent.js>), :86 i :133 creen un nou objecte sense conservar eixe camp. La regex `/ibanez/i` (:40) inspecciona tot `src` (:77), també la consulta de la URL.

Entrada reproduïda, passada pel mapejador de publicacions:

```js
{
  id: '00000000-0000-4000-8000-000000000001',
  ownerUserId: '00000000-0000-4000-8000-000000000002',
  titol: 'Foto', createdAt: '2026-10-19T09:00:00Z',
  payload: {
    sectionId: 'mur', // repetit amb mercat i events
    title: 'Foto', author_name: 'Maria Real',
    image_url: '/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_150735.jpg?ibanez'
  }
}
```

La foto existix i el cens la declara `foto` a [censImatges.js:190](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/multimedia/censImatges.js>). La fila original es classifica com a foto; la derivada perd la propietària i es classifica com a IA. Passa el filtre de font pròpia, la fusió del proveïdor i la fusió amb el cens real. [MultimediaSection.jsx:81](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/multimedia/MultimediaSection.jsx>) la inclou en IAIA i les files del panell mostren «Il·lustració d’IA» i els drets de Sóc de Poble. Reproduït per a les tres seccions, sense navegador ni baixada HTTP. La sonda final evita avatars i recursos d’interfície.

**Precondició i impacte:** membre amb dret a publicar al seu poble que envie el payload per API. Desinformació sobre origen/drets d’imatge; cap accés entre pobles ni escalada de permisos demostrat.

**Correcció proposada, encara no aplicada:** preservar la procedència autoritativa del DTO en totes les projeccions; classificar el pathname canònic sense query/fragment i preferir un manifest explícit per a la marca de la casa. Fragment mínim que cal incorporar en les tres derivadores, conservant la regla del mapejador que sobreescriu qualsevol propietària del payload:

```js
return {
  // altres camps de la foto derivada...
  ownerUserId: item.ownerUserId,
};
```

Açò és una direcció de correcció, no un pegat complet certificat. Prova d’acceptació: fila aliena → derivada → dues fusions → filtre IAIA → panell, amb asset del cens, asset amb `?ibanez`, font externa i `srcDelPort`; cap ha d’adquirir autoria institucional pel camí o perdre la seua procedència.

### 4. C02 · F06 necessita identitat del projecte vinculada a l’àmbit

**CWE-807 · severitat mitjana condicionada · comportament del mòdul reproduït, explotació UI no demostrada · deute preexistent.** [navigation.js:163](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/navigation.js>) manté IDs del projecte en un `Set` global. La resolució diferencia àmbits, però el registre/consulta dels IDs (:194–200, :238–246) no els incorpora.

Sonda amb el mòdul real: resoldre A al tenant A i després B al tenant B deixa **A i B** reconegudes com a projecte, amb ruta `/empresa/socdepoble`. Cal un canvi d’àmbit o diversos nodes en el mateix runtime; no s’ha demostrat que la UI desplegada permeta este recorregut hui. És especialment rellevant abans d’introduir el commutador de poble.

Altres límits ja reconeguts per Claude: [perfils.js:116](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/perfils.js>) busca el slug globalment amb `limit=1` si falta `tenantId`; el slug `socdepoble` encara pot ser registrable quan està lliure. Un nom visible no ha de concedir marca ni rol.

**Contracte de correcció proposat:** registrar/consultar `(backendScope, tenantId, canonicalOrganizationId)`, rebutjar resolucions tardanes d’una generació anterior i no resoldre una identitat privilegiada amb tenant desconegut. Esbós:

```js
esEntitatDelProjecte(scope, id) {
  return scope != null && idDelProjectePerAmbit.get(scope) === id;
}
```

Cal adaptar tots els consumidors i reservar al servidor la identitat canònica; canviar només el `Set` no tanca el vector del slug. La insígnia continua sent presentació, mai prova de drets per publicar avisos.

### 5. Migracions F01/F02/F08/F13: preparades per a validació, no certificades per a producció

El [pegat SQL](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/pegats/F01_F02_F08_F13_migracions_de_seguretat.patch>) crea dos fitxers; encara no estan incorporats a `supabase/migrations/`. SHA-256 del pegat: `604ebf46c559989c7a6c2d48caa3542231e546fdd2211cfa79d95829875af9a1`.

**2610190100, correu d’organitzacions.** PASS estàtic. El `REVOKE SELECT(contact_email)` tanca el grant de columna; `has_column_privilege` detecta si encara hi ha accés efectiu per una altra via i aborta la transacció amb `SDP-ORGMAIL-010`. És una guarda, no una reparació automàtica dels grants amplis. Revocar una columna no elimina un privilegi de taula. [PostgreSQL: REVOKE](https://www.postgresql.org/docs/current/sql-revoke.html).

La RPC conserva signatura, autenticació, `can_manage_organization`, `SECURITY DEFINER` i `search_path=''`. `m.user_id=v_uid` limita el correu d’entrada al titular. No he trobat la regressió sospitada sobre owner/admin: es conserva l’UPDATE i `desa_contacte_organitzacio` usa la RPC; la UI ja admet que l’administrador no reba el correu personal del titular.

Condicions: aplicar després de `2610181915`; **no tornar a executar 2610181915 després**, perquè reobriria el grant i la funció. `public_email=true` tampoc permetrà lectura directa de la columna. Si es vol un contacte públic explícit, cal exposar-lo per una vista/RPC filtrada; no restablir SELECT per a tots. No s’ha trobat un consumidor públic actual que necessite la columna directa.

**2610190110, llistat de mitjans.** PASS estàtic sobre `storage.objects`. La permissiva pròpia i les dues restrictives mantenen el llistat dins del prefix autoritzat; una nova permissiva ampla no anul·la la restrictiva. És coherent amb la composició OR/AND de [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). Es conserven els formats nou i llegat. Amb el format nou, deixar de pertànyer al poble també afecta la lectura pròpia: cal provar este cas de producte.

**C03 · Preflight incomplet, risc de certificació incorrecta; no vulnerabilitat remota demostrada.** Els comentaris només comproven `anon` sobre `storage.prefixes`; cal comprovar també `authenticated`. El snapshot de polítiques amb `qual LIKE '%mitjans%'` omet `USING(true)`, altres polítiques amples i `with_check`. Capturar totes les polítiques i ACL afectades.

La versió importa: [Storage 0034](https://github.com/supabase/storage/blob/master/migrations/tenant/0034-optimize-search-function-v1.sql) consulta carpetes a `storage.prefixes`; [Storage 0063](https://github.com/supabase/storage/blob/master/migrations/tenant/0063-fix-search-name-relative-to-prefix.sql) les deriva de `storage.objects`. Estes fonts proven que hi ha implementacions diferents; no proven la versió ni l’exposició del nostre node.

Consultes orientatives de només lectura per al preflight, sense dades personals:

```sql
select to_regclass('storage.prefixes');
select r, has_column_privilege(r, 'public.organizations',
                              'contact_email', 'SELECT') as pot_llegir_correu
from unnest(array['anon','authenticated']) as r;
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname='public' and tablename='organizations')
   or (schemaname='storage' and tablename in ('objects','prefixes'));
select n.nspname, p.oid::regprocedure, p.prosecdef
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='storage' and p.proname like 'search%';
```

Afegir snapshot dels grants de taula/columna, estat RLS, propietaris/ACL i definicions de les RPC/helpers i `storage.search*`. Consultar privilegis de `prefixes` només si la relació existix. Les consultes de catàleg no substituïxen provar l’API amb rols reals: el propietari SQL o `service_role` pot eludir RLS.

| Prova en staging | Resultat exigible |
|---|---|
| SELECT directe de `contact_email`, anon i authenticated | Sense permís efectiu; no només ocultació de la UI. |
| RPC contacte: owner / admin / membre / extern | Owner i admin gestionen contacte; només owner rep el seu correu d’entrada; els altres no accedixen. |
| Storage list: anon i usuari B, arrel i prefix d’A | Cap nom, carpeta o objecte alié, també amb paginació i API real de la versió desplegada. |
| Storage propi, formats nou/llegat i baixa de pertinença | Comportament coherent amb helper i especificació; evitar perdre accés de recuperació inadvertidament. |
| Promoció inicial/duplicada i esborrat d’una fixture pròpia | Compatibilitat amb els permisos de lectura/escriptura; cap dada real usada en proves. |
| URL pública coneguda | Continua accessible: és el contracte actual, no una prova de privacitat. |

**Dos límits crítics de comunicació:** estes migracions no privatitzen objectes ni revoken URL/CDN ja públiques. Un bucket públic servix els fitxers a qui coneix la URL, segons [Supabase Storage](https://supabase.com/docs/guides/storage/buckets/fundamentals). Tampoc resolen la integritat d’esborrat: [blindatge Storage:56](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2609200300_blindatge_storage_i_contingut.sql>) continua permetent DELETE propi sense consultar referències. El risc antic F3 i el contracte `comprovaUsImatge` de l’informe 2030 continuen oberts.

El rollback que restaura els grants/policies antics reintroduïx les fugues. Preparar una correcció endavant i, si hi haguera una emergència de compatibilitat, documentar l’exposició que reobri la reversió; no anomenar-la restauració segura.

### 6. C04 · F10: confirmada com a canvi de compte induït

**CWE-352 · severitat baixa amb les precondicions demostrades · confiança alta en la lògica local.** Pot tindre més impacte si la persona guarda després dades sensibles en el compte alié; eixa cadena posterior no s’ha executat. Mantinc el nivell baix del diagnòstic original, sense presentar-la com una presa de comptes.

A [auth.js:736](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js>), «Desa» verifica el `token_hash`; :760 envia la contrasenya amb el bearer de la sessió recuperada; :779 desa eixa sessió globalment. [OnboardingSection.jsx:416](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/onboarding/OnboardingSection.jsx>) presenta la pantalla genèrica sense correu verificat. La crida va al servidor legítim des de l’aplicació: una capçalera CSRF genèrica o CORS no resolen per si soles la confusió d’intenció.

Escenari: l’atacant obté un enllaç vàlid del seu compte, aconseguix que la víctima l’òbriga i introduïsca una contrasenya. Es modifica el compte de l’atacant i la víctima queda actuant dins d’ell. L’atacant continua controlant el seu correu i pot recuperar-ne l’accés; no cal afirmar que una sessió antiga sobreviu al canvi de contrasenya. No s’ha provat ni suposat que es modifiquen les credencials del compte previ de la víctima.

**Reproducció:** codi real d’`auth.js`, transport i persistència simulats. Dos casos, amb `currentUser=null` i amb `currentUser=VICTIMA`; `/verify` retorna `ATACANT`. Ambdós executen `/verify → PUT /user` amb `jwt-atacant`, criden `desaSessio(ATACANT)` i emeten canvi d’identitat a `ATACANT`. No hi ha petició en obrir l’enllaç. Són proves de l’adaptador, no enviament de correu ni sessió real contra GoTrue.

El patró és coherent amb la confusió de compte descrita per [OWASP, login CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#possible-csrf-vulnerabilities-in-login-forms). El token_hash autentica el seu titular; no acredita que la persona davant de la pantalla volguera operar sobre eixe compte.

**Redisseny proposat:** conservar la protecció contra escàners de correu. Supabase documenta que el prefetch pot consumir l’enllaç; per tant, no verificar automàticament en muntar la pantalla. [Supabase, email prefetching](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching).

```text
Enllaç pendent → acció explícita «Comprova l’enllaç»
→ verificació amb sessió privada temporal
→ mostrar compte retornat pel servidor i confirmar-lo
→ definir contrasenya amb eixa sessió
→ revocar/netejar sessió temporal i tornar a entrada normal
```

La variant recomanada evita adoptar automàticament la sessió recuperada. Si es vol conservar eixa adopció, requerix confirmació explícita del compte abans del PUT, especial atenció si diferix de la sessió anterior, i nova inicialització de context/cachés en mode Veí. No confiar en correu, nom o rol de la URL. Una petició de recuperació iniciada en el mateix navegador pot afegir correlació d’intenció; la recuperació entre dispositius necessita un flux alternatiu explícit. PKCE no és una substitució mecànica compatible amb tots els requisits actuals.

Conservar single-flight, cancel·lació, caducitat, token només en memòria i tractament de resposta perduda després del PUT. En cancel·lar, revocar la sessió temporal amb abast local i preservar la sessió anterior. Provar confirmació, compte discrepant, reintents, dues pestanyes, pèrdua de resposta, escàner i tornada OAuth. El redisseny requerix una implementació pròpia; no està dins dels sis pegats acceptats.

### 7. Superadministració: ratificació i concreció de 2256

**Punt d’entrada:** Perfil → El meu compte → Administració i mode d’actuació. Reutilitzar l’accés actual al Tauler i al segon factor de [PerfilContext.jsx:203](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilContext.jsx>), les facetes d’Admin i la ruta protegida. Evitar dos panells amb lògica de permisos divergent.

| Mode visible | Context obligatori | Capacitats proposades |
|---|---|---|
| **Veí** | Persona autenticada i poble actiu | Operacions ordinàries segons pertinença, propietat i privacitat; sense excepcions de plataforma o d’administració local. Mode inicial. |
| **Administració de poble** | Poble + emissor canònic autoritzat; etiqueta Editor o Administrador | Editor crea/edita/publica avisos concedits. Administrador gestiona també concessions locals dins dels límits aprovats. No són el mateix permís encara que compartisquen posició del commutador. |
| **Superadministració** | Persona, context de plataforma, concessions vigents i AAL2 | Gestió global autoritzada, amb registre; reautenticació recent per a concessions/exportacions/operacions destructives sensibles. |

Un sol subjecte `auth.uid()`; separar-ne **mode**, **actor que firma**, **poble** i **node/backend**. «Gent de la Torre» ha de ser un emissor canònic verificat i vinculat al poble. El nom no acredita ser Ajuntament. Javi, Damián i Torsten es vinculen per UUID amb concessions de servidor; esta auditoria no ha verificat les seues concessions remotes.

**Estat actual:** [SessionContext.jsx:166](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/SessionContext.jsx>) deriva `esSuperadmin` del rol i exposa la necessitat de segon factor. [2610061448:2](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2610061448_superadmin_aal2.sql>) comprova rol + AAL2, però no mode efectiu. Les [RPC d’admin](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/admin.js>) tampoc reben context. `IdentitatContext` és una preferència d’actor validada contra pertinences; no és reducció de privilegis. No he trobat implementació del context autoritatiu proposat en 2256.

El contracte proposat continua sent:

```text
contextId opac + subjectUserId + sessió + backendScope
+ mode + townId + actorId + channelId/generation
+ grantsVersion + expiresAt
```

El servidor emet i valida el context, no accepta eixos camps com a prova perquè els envie el client. La petició d’elevar mode comprova concessions i MFA; la petició de publicar comprova també emissor i poble, deriva autoria i registra resultat. `user_metadata` és editable i els claims del JWT poden quedar desactualitzats fins a renovar-lo: el context ha de tindre revocació i comprovacions autoritatives. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

**Condicions per afirmar que Veí prova permisos reals:**

1. Inventariar totes les RPC, views i polítiques que concedixen poder per superadmin/editor. Sense context vàlid, cap excepció elevada. Incloure lectures sensibles i accessos directes a PostgREST/Storage; no basta afegir el context a les noves RPC.
2. Canvi a Veí i invalidació de la generació anterior coordinats al servidor amb les mutacions. Una operació confirmada abans del canvi no es desfà; la següent amb context antic es denega. Una simple consulta abans de mutar deixa carrera temporal.
3. Una altra pestanya explícitament elevada té context separat i visible. Conéixer/fabricar `channelId` no autoritza ni permet recrear una elevació sense comprovar-la. Oferir una eixida de totes les elevacions per a l’ús en dispositius compartits.
4. Cache/cues per node, tenant, subjecte, actor i context. En reduir permisos o canviar compte, invalidar dades elevades i respostes antigues. Autosave pendent conserva destí/autoria originals o es rebutja; mai es reenvia silenciosament amb un altre actor.
5. Logout, recuperació de contrasenya, canvi d’usuari, revocació de rol i expiració invaliden elevacions. F10 mai pot arrossegar el context de la víctima al nou subjecte.
6. Completar i restringir `town_memberships.role` després de censar els valors: la taula ja existix amb text lliure. Editor/admin s’atorguen per RPC territorial, sense autoescalada; `moderador` de plataforma no significa editor de qualsevol poble.

El mode reduït evita errors i permet provar les rutes ordinàries del mateix compte; un administrador legítim pot tornar a elevar-se pel flux autoritzat. Per a comprovar un veí sense propietats o pertinences excepcionals de Javi, mantindre un compte de prova amb concessions mínimes en staging.

**Matriu adversarial mínima:** editor A intenta publicar en B; emissor alié i `official:true` inventat; superadmin AAL1; AAL2 en mode Veí amb crida directa a RPC antiga; context caducat/revocat; replay després de tornar a Veí; cursa amb autosave; dues pestanyes; canvi de compte per recuperació. Verificar també que superadmin no obté lectura indiscriminada de notes/xats i no pot saltar-se la integritat relacional d’imatges.

La UI ha de mostrar sempre «qui firma · en quin poble · en quin mode», amb text i selecció accessible. Canviar poble i emissor ha de ser atòmic. Mantindre una eixida visible «Tornar a Veí». Mentrestant, qualsevol commutador només visual s’ha d’identificar com a previsualització.

### 8. La nova skill: adoptada, amb precisions necessàries

La [skill core-seguretat-audit](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/core-seguretat-audit/SKILL.md>) encerta en no confiar en el client, revisar independentment els pegats i separar diagnòstic de desplegament. Este informe seguix el model d’amenaces i el lliurable Markdown; SARIF és opcional segons §4 i no s’ha demanat integració CI. No he creat un SARIF redundant.

Propose estes esmenes, sense alterar la skill en este torn:

- Substituir «garanteix que cap línia […] continga vulnerabilitats» per garantia del **procediment i abast**, amb límits i risc residual explícits. Cap escaneig ni recompte de proves acredita absència universal.
- Exigir estat per troballa: confirmada, corregida i provada, parcial, risc acceptat o no verificada; fixar snapshot/hash, precondicions, prova positiva i negativa i versió desplegada. Un PASS estàtic no és un PASS de RLS.
- Precisar que una sessió de l’amfitrió/claim només autoritza si el backend la valida per emissor, audiència, subjecte, caducitat i abast. Un rol en el payload del Web Component no és autoritat.
- Conciliar els límits de fitxers amb el producte. La skill diu 10 MB i quatre MIME; [storage.js:25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js>) usa 5 MiB públic / 25 MiB privat i :292 admet AVIF i PDF privat. És divergència de contracte, no motiu per imposar silenciosament 10 MB a tot. Validar contingut real i política de bucket/servidor; MIME i extensió declarats pel navegador no basten.
- La privacitat per defecte de la skill no modifica per si mateixa el DEFAULT públic ni les files existents. Mantindre el pla de convergència de 2256: alta, SQL, NULL, contactes, DTO i UI han de compartir política. Este informe no acredita eixa migració feta.

### 9. Ordre de relleu per al pròxim Gauntlet

1. **Backend:** preflight ampliat i prova de les dues migracions en staging amb rols reals; preparar la incorporació amb ordre explícit. Certificar cada node separat. Mantindre obert el risc d’URL públiques i esborrat referenciat.
2. **Client:** completar F11 amb la cadena derivada sencera. Conservar els quatre pegats amb PASS focal i F06, afegint a F06 l’àmbit canònic abans del canvi de poble del panell.
3. **Auth:** implementar el redisseny de F10 amb confirmació d’identitat i protecció de Safe Links; verificar que no transporta context elevat entre comptes.
4. **Administració:** autorització/context de servidor, concessions territorials i proves adversarials abans de presentar el commutador com a reducció real. Després, integrar-lo a El compte.
5. **Release:** repetir proves afectades després de cada canvi i verificar el bundle real que es distribuïx. L’informe 2315 indica que WP v1.1.6 no porta els pegats; en este torn no s’ha recompilat ni tornat a inspeccionar eixe paquet. Una suite del codi font no certifica un ZIP anterior.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Les verificacions següents són d’este torn, separades de la suite global declarada per Claude:

| Bloc | Resultat | Abast real |
|---|---|---|
| F04/F05/F06 i compatibilitat | 10 fitxers, **144 proves passades** | Vitest local; comprovació inversa dels tres diffs sense aplicar-los. |
| F03/F11/F14 | 9 fitxers, **109 proves passades** | 15/15 postimatges de hunks presents; mapejador, Mercat, Multimèdia, autoria, venedor i cerca. |
| Recuperació/F10 | 1 fitxer temporal, **43 proves passades** | 41 casos existents adaptats a imports absoluts + 2 sondes adversarials amb transport simulat. |
| SQL | 1 fitxer, **9 proves estàtiques passades** | `git apply --check` i aplicació només en còpia temporal; comprova text, no compila ni executa PostgreSQL. |
| Regex | 50.000 casos diferencials: zero divergències | Oracle antic només sobre textos curts; 10k/100k/1M repeticions en el nou: 0,056/0,430/4,278 ms, mesura local orientativa. |
| Camins Storage | 50.000 casos, 3.527 admesos, zero desviacions | Construcció i resolució de URL; no prova de permisos de Storage. |
| F11 | Bypass reproduït en les tres derivacions | Inclou fusions, cens i dades del panell; no navegador/HTTP. |
| F06 | Persistència d’identitats entre àmbits reproduïda | Mòdul de navegació real; precondició UI no demostrada. |

Arbre compartit amb canvis previs, HEAD `1e6ffecee3e10c73ec4822d91344398d1d3fa3e7`. Manifest dels **20 fitxers dels sis pegats**, calculat com línies ordenades `sha256  ruta\n`: SHA-256 `2aae1c1d4a5b98ca8f47d196cc437df9235194db0d2cb576732279ed0769f183`. Açò fixa el codi inspeccionat, no és una signatura de release.

Sondes temporals reproduïbles d’esta sessió:

- F10 i suite adaptada (`/private/tmp/sdp-gauntlet-f10-261019/f10.test.mjs`), config (`/private/tmp/sdp-gauntlet-f10-261019/vitest.config.mjs`), resultat (`/private/tmp/sdp-gauntlet-f10-261019/resultat.txt`). Execució: `vitest run --config /private/tmp/sdp-gauntlet-f10-261019/vitest.config.mjs` amb el binari local del repositori.
- F11, cadena completa (`/private/tmp/sdp-gauntlet-f11-composicio.mjs`), executable amb Node local; manifest de fitxers (`/private/tmp/sdp-gauntlet-manifest-261019.txt`). Són temporals i no substituïxen proves de regressió versionades.
- Còpia SQL: `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-sql-gauntlet-wxgb5vkv`. Hash SQL 0100: `e56ac9e68ce6f2b1a63c340f9ce0458ac93fe544e888fba307ad6dd5054c543f`; SQL 0110: `25ec4e5c0a5320eae0664c558d99edbb2751e2a49791e67cb4630321a4388b3d`.

Els primers intents de les còpies temporals van fallar per resolució `/tmp`/`private/tmp` (F10) i cwd (SQL); corregit l’entorn, les execucions indicades passen. No eren fallades del producte.

**Verificació documental:** `document.mjs check` passa; la segona lectura independent no proposa correccions materials. La porta Olivera passa sense moviments de documents. S’ha actualitzat ESTAT i l’informe està ancorat a l’índex.

`node tooling/gates/tancament.mjs --turn-id torn_77a87bc0-17fc-408f-82e8-e665f4a3e1a5` retorna **exit 1**. Olivera, plantilles, autoritat, integritat del LEDGER i compilació wiki passen; fallen segell, catàleg de skills i SCC. Resultat: **408 errors** — 69 enllaços invàlids, 315 documents no ancorats segons SCC, 21 orfes operatius, divergència de segell, divergència de skills i falta del relleu propi al LEDGER. **Cap error apunta a este nou informe.** El primer intent també detectà enllaços locals amb número de línia i temporals fora de l’arrel: s’han corregit i no figuren en el resultat final.

El segell actual `1f9d0b59` diferix del registrat `5e7339db`; l’executor de mutacions protegides exigix un segell previ vàlid abans d’escriure. No he resignat regles alienes ni forçat el relleu al LEDGER per eludir eixa condició. El torn continua `planned`, no tancat mecànicament. És un límit de governança local, no un rebuig de l’auto-review ni una fallada del producte. Log temporal: `/private/tmp/sdp-codex-261019-gauntlet-tancament-final.json`.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

No he inspeccionat secrets ni l’estat viu de Supabase. No he aplicat pegats al producte, incorporat migracions, fet commits, pujat fitxers o publicat cap paquet. Les úniques escriptures persistents són l’informe i el seu registre documental/índex/ESTAT; sondes en directoris temporals.

No hi ha PostgreSQL local disponible per a esta revisió. Els permisos i l’ordre reals de migracions continuen sense certificar. Les fonts de Storage al branch principal expliquen variants d’implementació; no identifiquen la versió del projecte.

La comprovació HTTP local de la primera sonda F11 no va connectar per EPERM de la sandbox; la cadena de transformacions i del panell sí s’ha executat. No és una denegació d’auto-review ni s’ha demanat escalació. La sonda final usa una foto real no avatar i no necessita assumir eixa baixada per demostrar l’etiqueta falsa.

Este torn no torna a auditar la migració WebP, les variants del Mercat ni tots els F1–F12 de 2045: conserven el detall de 2030/2256. No s’ha celebrat ni registrat consens nou entre tots els agents. Relleu per a la pròxima Acta Marmota: incorporar este dictamen i els riscos oberts; este informe no és una acta de tancament de jornada.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_2315_auditoria_claude]]
- [[261018_2256_auditoria_codex_creuada_claude_i_superadministracio]]
- [[261018_2030_auditoria_codex]]
- [[261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki]]
- [Índex de pegats](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/pegats/PEGATS.md>)
- [Resultats de Claude Security](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/CLAUDE-SECURITY-RESULTS.md>)
