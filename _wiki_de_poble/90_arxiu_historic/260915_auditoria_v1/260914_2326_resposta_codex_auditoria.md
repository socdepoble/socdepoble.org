---
tipus: petorreta
estat: esborrany
description: Auditoria tècnica del paquet auditoria amb evidències verificables
---

# 🛡️ PETORRETA AL CONSELL: AUDITORIA (Resposta de Codex)

## Dictamen

**NO APTE per a promoció encara.** El paquet compila conceptualment i la suite existent passa, però conté una regressió de privacitat entre pobles, dos defectes funcionals en l'edició de perfils/organitzacions i un manifest que ja no correspon exactament al repositori auditat.

No s'ha fet cap cerca web ni cap modificació del projecte font.

## Troballes prioritzades

### P0 — `membres_del_poble` permet enumerar membres d'un altre poble

**Evidència.** La migració `supabase/migrations/260908_xat_v2_membres.sql`, línies 58–66, comprova explícitament que `auth.uid()` siga membre de `p_tenant_id`. La migració posterior `supabase/migrations/260914_0100_auditoria_rls_fixes.sql`, línies 68–108, reemplaça la mateixa funció `SECURITY DEFINER` però elimina eixa comprovació. Com que la funció té `EXECUTE` per a `authenticated` i corre amb privilegis del definidor, qualsevol persona autenticada que conega un UUID de poble pot obtindre fins a 500 noms de perfils consentits d'eixe poble.

**Causa.** Regressió per reemplaçament incomplet: s'ha afegit el filtre RGPD però s'ha perdut la “Porta 1” de pertinença al poble.

**Correcció mínima.** Reincorporar, abans del `return query`, la validació fail-closed de la migració anterior:

```sql
if auth.uid() is null or not exists (
  select 1
  from public.town_memberships tm
  where tm.town_id = p_tenant_id
    and tm.user_id = auth.uid()
) then
  raise exception 'SDP-XAT-003: no eres membre d''aquest poble.'
    using errcode = '42501';
end if;
```

Per usar `IF`, mantindre la funció en `language plpgsql` (com en la versió anterior), o incorporar la comprovació equivalent dins de la consulta i negar la crida sense sessió.

**Verificació.** Test SQL amb dos pobles i dos usuaris: A pot llistar A; A rep `42501` quan passa l'UUID de B; anònim i sessió nul·la no poden executar; un membre sense `consentiment_rgpd_at` no apareix.

### P1 — Logo i lema d'organització no es desen

**Evidència.** `src/sections/profile/PerfilContext.jsx`, línies 45–52 i 150–153, exposa i envia `logo_url` i `lema`. Però `src/data/supabaseBackend.js`, línies 818–829, només copia `name`, `slug`, `description`, `kind` i `parentOrganizationId` al payload. Per tant, `logo_url` i `lema` arriben a `updateOrganization` i allí desapareixen. Amb un payload buit, la petició pot fallar; si el servidor l'acceptara, la UI encara podria aparentar el canvi localment a la línia 153 sense haver-lo persistit.

**Causa.** Llista blanca del backend desalineada amb el catàleg editable.

**Correcció mínima.** Afegir mapes explícits per a `lema` i `logo_url` a `updateOrganization`. No habilitar `slug`, `kind` ni `parentOrganizationId` des d'aquesta pantalla si la governança els considera immutables. Confirmar també que els privilegis SQL d'`organizations` permeten actualitzar `logo_url` i `lema` només a qui la pot administrar.

**Verificació.** Test unitari del payload i test d'integració: canviar lema/logo, recarregar des de Supabase i comprovar el valor; usuari no gestor ha de rebre denegació.

### P1 — La capçalera de perfil intenta escriure una columna inexistent

**Evidència.** `src/sections/profile/DetallAjust.jsx`, línies 59–67, envia sempre `hero_image` quan canvia la imatge de capçalera, inclòs el perfil personal. `PerfilContext.jsx`, línies 139–151, deriva les persones a `updateProfile`. Cap migració crea `profiles.hero_image`; l'única columna `hero_image` trobada pertany a `public.notes` (`260914_0000_schema_notes.sql`, línia 16). A més, els privilegis de perfil de `260911_0600_perfil_avatar_i_permisos.sql`, línies 8–17, tampoc l'inclouen.

**Causa.** Un component compartit tracta notes, perfils i organitzacions com si compartiren esquema físic.

**Correcció mínima.** Decidir el contracte abans de tocar dades: o ocultar/desactivar `heroImage` per a identitats, o crear columnes i permisos/RLS específics per a persona i organització. La intervenció mínima segura és no oferir eixa edició fins que existisca el contracte de dades.

**Verificació.** Test de component que impedisca enviar `hero_image` per a persona/organització; si s'adopta l'esquema nou, test PostgREST amb recàrrega i denegació per a un altre usuari.

### P2 — El bundle verificat està obsolet respecte del `HEAD`

**Evidència.** El manifest declara 529 entrades. La verificació SHA-256 local ha trobat 528 coincidències i una divergència: `.agents/AGENTS.md` consta al bundle amb 5.992 bytes, 58 línies i hash `d395…a4a`; el fitxer actual té 6.509 bytes, 61 línies i hash `e2f2…30dd`. El `HEAD` actual és `1624ca3f` i modifica precisament eixe fitxer després de generar el bundle. No hi ha fitxers del manifest absents.

**Causa.** El paquet es va generar abans de l'últim commit i no està ancorat a un commit immutable dins del seu manifest.

**Correcció mínima.** Regenerar el bundle des d'un arbre net i afegir al manifest `git_commit` i `git_dirty`. La verificació ha de fallar si canvia qualsevol fitxer després de la captura.

**Verificació.** Recalcular els 529 hashes i exigir: `missing=0`, `badHash=0`, `git_dirty=false` i `git_commit == HEAD`.

## Evidència d'execució

- `git status --short`: arbre net abans i després de l'auditoria.
- `npm test -- --run`: **12 fitxers, 75 tests, tots aprovats**.
- `npm run lint`: **0 errors, 123 avisos**. Els avisos són principalment imports, arguments i variables sense ús; no bloquegen la porta actual però indiquen deute de manteniment.
- Cobertura absent: la suite només referencia `hero_image` en el traductor de notes; no hi ha tests per a `membres_del_poble`, `updateOrganization`, `logo_url`, `lema` ni la integritat del bundle.

## Ordre mínim de correcció

1. Restaurar la comprovació de pertinença en `membres_del_poble` i afegir el test entre dos pobles.
2. Tancar o implementar contractualment `hero_image` en identitats.
3. Alinear `updateOrganization` amb `lema` i `logo_url`, amb RLS i test de recàrrega.
4. Regenerar i segellar el bundle contra `HEAD`.

## Límit de l'auditoria

No s'ha connectat a una instància Supabase ni s'han aplicat migracions: les conclusions SQL provenen de l'ordre i el contingut verificable dels fitxers del paquet. La suite local no prova les polítiques RLS; per això els casos SQL anteriors són condició de tancament.

## Identitat i criteris respectats

L'auditoria tracta Sóc de Poble com una React SPA Online-First amb Supabase i integració sòcia, sense presentar els fallbacks locals o el llegat Offline/Local-First com l'arquitectura vigent. No s'han tocat dades personals, no s'ha introduït Tailwind ni cap dependència.

**Conclusió:** una regressió de privacitat demostrable i dos contractes d'escriptura trencats impedixen considerar el paquet sanejat, encara que els 75 tests actuals passen.
