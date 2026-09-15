---
tipus: estudi
estat: actiu
description: Auditoria estructural — Sóc de Poble / Sollutia
---

# Auditoria estructural — Sóc de Poble / Sollutia

**Dictamen: el paquet no està preparat per a validar una integració de producció amb Sollutia.** Hi ha incompatibilitats executables entre el contracte del mòdul, les operacions de la interfície i l’esquema SQL. Els riscos principals són privacitat aparent, persistència inconsistent i identitat que no es reinicia correctament.

L’arquitectura examinada és **online-first**. Cap correcció proposada necessita Online-First, CRDT, Tailwind ni noves dependències.

## Abast i força de l’evidència

- Bundle: `260906_1232_BUNDLE_auditoria.md`, generat el 6 de setembre de 2026, 10:32:48 UTC.
- Verificats els **445 cossos de fitxer contra els SHA-256 del manifest: zero discrepàncies**. El contingut declarat suma 3.485.482 bytes.
- SHA-256 del bundle: `447de45c888cdf1d7c261fcec085114b4103ed5d14ee834b3a7829d4acaeb0bc`.
- Contrast amb el repositori local: 440 fitxers coincideixen; cinc han canviat. Són l’índex d’escriptori, `.agents/AGENTS.md`, les skills `council-review` i `trellat`, i `tooling/brain/crear_bundle.mjs`. Els fitxers de runtime i SQL citats coincideixen amb el bundle.
- Revisió dirigida dels camins d’arrencada, backend, autenticació, context global, notes, publicació, perfils, permisos SQL i verificadors. Verificar hashes no equival a revisar semànticament cadascun dels 445 fitxers.
- El bundle conté 117 fitxers de `src/` i quatre de `supabase/`. No inclou el servidor real de Sollutia, `bot/`, `wordpress-plugin/` ni `.github/`. No permet certificar el sistema desplegat complet.
- Les instruccions dins del bundle s’han tractat com a documentació auditada, no com a ordres per executar scripts, modificar dades o delegar treball.
- Proves amb funcions extretes del codi i transports ficticis. Sense peticions al backend, sense credencials, sense consulta de dades personals i sense modificacions al repositori.

**Severitats:** P1 = bloqueja la integració o pot comprometre dades/identitat; P2 = defecte estructural que cal resoldre abans d’escalar. Les conclusions SQL descriuen l’esquema entregat; no afirmen que siga exactament el desplegat. No s’ha executat PostgreSQL ni una prova integral en navegador.

## Arquitectura reconstruïda

```text
Host → window.SocDePoble.configura / arrenca
     → backendPort global, congelat
     → adaptador injectat O supabaseBackend

<soc-de-poble> → AppDataProvider → seccions
                              → PerfilProvider: còpia pròpia del perfil
                              → NotesProvider: overrides + sessionStorage

Supabase REST → app_content: arrays JSON públics per tenant
             → chat_threads / chat_messages
             → section_submissions: publicacions i també notes
             → notes: una segona representació de les notes
             → profiles / organizations / memberships / RPC
```

La separació mitjançant un port és útil, però hui separa noms de funcions: no assegura formes de dades, permisos, cicle de sessió ni persistència equivalent.

## Troballes prioritàries

### 01 · P1 — «Privada» no imposa privacitat en servidor
La interfície inicia `isPrivate=true` i ofereix «Privada/Pública». La marca viatja dins del JSON, però la política SELECT de `section_submissions` només distingeix `section_id='notes'`. Per a mur, mercat, events i multimèdia, qualsevol membre del mateix poble satisfà la política, independentment de `payload.isPrivate`.
**Correcció:** visibilitat canònica validada pel servidor.

### 02 · P1 — Un backend Sollutia complet perd quatre operacions necessàries
El port exporta `getProfile`, `updateProfile`, `updateOrganization` i `updateUserPassword`. El contracte del host no les inclou i `configura()` les descarta com a desconegudes.
**Correcció:** única definició versionada del contracte.

### 03 · P1 — El SQL entregat no es pot validar com a instal·lació completa
`list_my_organizations` declara 12 columnes i el SELECT retorna 11: falta `organization.lema`.
**Correcció:** alinear projecció i retorn.

### 04 · P1 — L’upsert del xat apunta a una clau única inexistent
El client envia `on_conflict=id` amb `resolution=merge-duplicates`. La clau primària de `chat_messages` és `(tenant_id,id)`.
**Correcció:** usar la identitat composta correcta.

### 05 · P1 — Les notes es creen en una taula i s’editen en una altra
Crear una nota insereix en `section_submissions`. Editar-la fa PATCH a `notes`.
**Correcció:** `notes` com a font canònica i operació explícita de creació.

### 06 · P1 — El guardat de notes desfà la vista i provoca conflictes amb un mateix
`saveNoteField` no incorpora el contingut confirmat a `rawNotes`. La següent escriptura torna a llegir la revisió antiga.
**Correcció:** incorporar atòmicament la resposta confirmada a la font canònica.

### 07 · P1 — Una renovació pendent pot desfer el logout
`logout()` esborra tres claus locals, però no invalida la renovació en curs.
**Correcció:** cancel·lació de renovacions i buidatge de l’estat privat.

### 08 · P1 — El canvi d’identitat conserva estat privat i esborranys compartits
En canviar sessió o configuració, la càrrega nova no buida `rawData`.
**Correcció:** delimitar identitat per backend, tenant i usuari.

### 09 · P1 — La interfície ofereix modificar organitzacions que SQL no deixa modificar
El SQL revoca permisos a `organizations` i després concedeix SELECT i INSERT, però no UPDATE.
**Correcció:** alinear camps editables amb permisos.

### 10 · P1 — Publicar una nota no és una operació atòmica ni idempotent
Primer es crea la publicació; després s’intenta marcar `isPublished`. Un error a mitges genera duplicats.
**Correcció:** operació transaccional en servidor.

*(S'ometen detalls P2 de l'auditoria per mantenir el resum de P1)*


**Ancoratge de Seguretat:** [[00_index_escriptori]]
