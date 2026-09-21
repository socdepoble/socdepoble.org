# Auditoria Supabase — socdepoble.org

**Abast:** 16 migracions + seed.sql + 12 fitxers de src/data/supabase/ + 4 de src/data/ + tooling/gates/tractor-rls.mjs.
**Avís previ:** `supabase/config.toml` NO existix. No hi ha CLI local, ni `supabase/.temp`, ni taula `supabase_migrations.schema_migrations` al repositori. L'ordre d'aplicació és una convenció documentada a mà (`supabase/README.md:53`). Tot l'informe descriu l'estat que resulta d'aplicar els 16 fitxers en ordre alfabètic.

## CONFIRMAT llegint el codi

### C1 · El bucket mitjans és PÚBLIC i qualsevol anònim en pot enumerar tots els objectes — CRÍTIC
**Forat:** `public = true` fa que tot objecte se servisca sense token. A més, la política "mitjans llegir" no filtra per carpeta, permetent a un anònim enumerar l'arbre complet d'UUIDs d'usuaris i pobles (trencant la privacitat que `membres_del_poble` protegeix).
**Proposta:** 
```sql
drop policy if exists "mitjans llegir" on storage.objects;
create policy "mitjans llegir" on storage.objects for select to anon, authenticated
  using (bucket_id = 'mitjans' and cardinality(storage.foldername(name)) between 2 and 3);
create policy "sdp mitjans llista frontera" on storage.objects
  as restrictive for select to anon using (bucket_id <> 'mitjans_privats');
```

### C2 · Cap usuari nou pot registrar-se: el client no envia tenant_id i el trigger l'exigix — CRÍTIC
**Forat:** L'únic lloc que crida `registerWithPassword` no envia `tenant_id`. El trigger `on_auth_user_created` l'exigeix i, com no hi ha fallback (es va llevar a `260915_0000`), GoTrue avorta amb un error 500.
**Proposta:** Passar `tenant_id: tenantId` al metadata del registre a `OnboardingSection.jsx`, i restaurar el replegament a `private.ajustos` al trigger per als camins OAuth.

### C3 · anon conserva privilegis INSERT/UPDATE/DELETE sobre towns, section_submissions i app_content — ALT
**Forat:** L'esquema mai fa `revoke all on all tables ... from anon`. L'únic que impedeix un DELETE a `app_content` per part d'un anònim és la manca de política.
**Proposta:** 
```sql
revoke all on public.towns, public.section_submissions, public.app_content from anon;
grant select on public.towns, public.app_content to anon;
```

### C4 · revoke ... from anon, public no lleva els privilegis directes d'authenticated — MITJÀ
**Forat:** Les taules del xat, consentiments i notes tenen privilegis orfes per a `authenticated` per defecte, tot i els revokes a `anon, public`.
**Proposta:** Canviar `from anon, public` per `from anon, authenticated, public`.

### C5 · Taules amb RLS activat i zero polítiques d'escriptura: bloqueig total — MITJÀ
**Forat:** `organization_memberships` i `consentiments` tenen bloqueig total per manca de polítiques. 
**Proposta:** Revocar els grants orfes de `consentiments` i `app_content`.

### C6 · profiles update own va perdre la clàusula visibility = 'private' i va guanyar is_public — MITJÀ
**Forat:** La política va relaxar-se, deixant la seguretat a un sol CHECK de base de dades.
**Proposta:** Restaurar `and visibility = 'private'` i llevar `is_public` del grant update fins que tinga definició semàntica.

### C7 · La política de lectura del Mur peta per a anon, i el client s'ho empassa — MITJÀ
**Forat:** `anon` falla en avaluar `private.is_town_member` per manca de privilegis USAGE sobre l'esquema `private`. El client (`content.js`) amaga l'error 401 i retorna `[]`.
**Proposta:** Partir la política (una per a anon, una per a authenticated) i llevar `opcional()` dels errors d'autorització al client.

### C8 · promoteToPublic és una porta d'un sol sentit cap al bucket públic — MITJÀ
**Forat:** No hi ha `demoteToPrivate`. Combinat amb C1, publicar fa l'arxiu llegible mundialment per sempre.
**Proposta:** Implementar retirada d'arxius, i solucionar C1.

### C9 · Errors d'autenticació silenciats que fabriquen dades — BAIX
**Forat:** A `auth.js`, si falla la lectura de perfils per RLS/expiració, fabrica un perfil amb `user_metadata` (sessió fantasma).
**Proposta:** Distingir error 401/403 i propagar-lo; només replegar per a errors de xarxa.

### C10 · Polítiques permissives duplicades que s'uneixen amb OR — BAIX
**Forat:** `organizations` té polítiques redundants.
**Proposta:** `drop policy if exists "members read own organizations" on public.organizations;`

### C11 · No hi ha cap camí per a atorgar el rol de superadmin; resol_reclamacio és inabastable — MITJÀ
**Forat:** No existeix camí per fer-se superadmin, inutilitzant certes funcionalitats d'administració.
**Proposta:** Afegir una migració de sembra o un RPC atorgador de rols.

### C12 · Funcions SECURITY DEFINER: estat real — BAIX
**Forat:** `private.is_town_member` té EXECUTE concedit a public/anon (causa arrel de C7).
**Proposta:** `revoke execute on function private.is_town_member(uuid) from public, anon;`

### C13 · Res de service_role, i la validació ho impedix activament — SENSE TROBALLA (Positiu)
**Estat:** Protecció sòlida. Tokens ben emmagatzemats, rutes segures.

### C14 · Què comprova i què NO comprova tooling/gates/tractor-rls.mjs — ALT
**Forat:** La porta valida text parcial, no l'estat d'esquema. No vigila `storage.buckets`, falla amb GRANT multi-verb, no aplica `DROP POLICY`, i té exempcions caducades.
**Proposta:**
- Canviar regex de grant per acceptar llistes.
- Afegir R10 (prohibir bucket public=true).
- Llevar l'exempció `isLegacyExempt`.

## Conclusió
L'arquitectura té defenses sòlides però fuites en la capa d'Emmagatzematge (C1) i fallades mecàniques (registres trencats C2, gatekeeper enganyat C14). La neteja és obligatòria abans de producció.
