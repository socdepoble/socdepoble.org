---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: auditoria de l'arquitectura i el manifest (Gemini)"
---
# 🛡️ INFORME DEL CONSELL — AUDITORIA DEL PAQUET `260914_2308_BUNDLE_auditoria` (Resposta de Gemini)

L'auditoria tècnica del paquet i del repositori consolida les evidències directes extretes del bundle. Es prioritzen les troballes per severitat operativa (P0 crític, P1 funcional i P2 deute arquitectònic), identificant les causes arrel i aportant les solucions mínimes verificables.

---

### Diagnòstic de Troballes i Evidències

| ID | Àmbit | Severitat | Fitxers Afectats | Descripció de la Troballa |
| --- | --- | --- | --- | --- |
| **T-01** | Backend / Dades | **P0 - Crític** | `src/sections/profile/DetallAjust.jsx`, `src/data/supabaseBackend.js` | Intent de persistència del camp inexistent `hero_image` a `public.profiles`. |
| **T-02** | Backend / Dades | **P0 - Crític** | `src/data/supabaseBackend.js` | Pèrdua silenciosa de dades a `updateOrganization`: s'ignoren `lema` i `logo_url`. |
| **T-03** | Seguretat / Llavor | **P1 - Alta** | `src/sections/mercat/marketSeed.js`, `tooling/gates/tractor-llavor.mjs` | Dades personals reals a la llavor que activaran la fallada del tractor `porta:llavor`. |
| **T-04** | Arquitectura UI | **P1 - Alta** | `src/sections/admin/AdminSection.jsx`, `src/components/universal/workspace/UniversalWorkspace.jsx` | Niament il·legal d'`AppGridShell` dins d'un altre `AppGridShell` envoltat per `UniversalPage`. |
| **T-05** | Enrutador | **P1 - Alta** | `src/app/contexts/RouterContext.jsx`, `src/sections/gestoria/GestoriaSection.jsx` | Fallada de prefix a `resolvePath`: camins amb barra inicial esclafen el context del pare. |
| **T-06** | Compilador Wiki | **P2 - Mitjana** | `tooling/wiki/compiler/01_build_index.mjs`, `02_build_ontology.mjs` | Cisma de taxonomia: el compilador busca carpetes antigues i rebutja el graf. |
| **T-07** | Dependències | **P2 - Mitjana** | `package.json` | Dependència òrfena (`react-day-picker`) sense cap import al codi font. |

---

### Anàlisi d'Evidències i Causes

* **Incompatibilitat d'atributs a `profiles` (T-01):**
* *Evidència:* A `DetallAjust.jsx` (línia 52), quan es modifica la capçalera d'una persona (`identitat.mena === 'persona'`), s'invoca `guardarCampPerfil('hero_image', value, identitatId)`. Això desemboca a `updateProfile` dins de `supabaseBackend.js`, executant un `PATCH` a `/rest/v1/profiles`.
* *Causa:* L'esquema SQL de `public.profiles` (`supabase/migrations/260911_0600_perfil_avatar_i_permisos.sql`) només declara `avatar_url`, `town_name`, `bio` i `is_public`. No existeix la columna `hero_image` a `profiles`, provocant un error HTTP 400 (PGRST204) de PostgREST en intentar desar.

* **Pèrdua de camps a `updateOrganization` (T-02):**
* *Evidència:* A `src/data/supabaseBackend.js` (línies 490–496), la funció `updateOrganization` construeix la càrrega útil manualment filtrant només `name`, `slug`, `description`, `kind` i `parentOrganizationId`.
* *Causa:* Si l'usuari actualitza el lema o el logotip d'un grup o empresa des de `DetallAjust.jsx`, els camps `updates.lema` i `updates.logo_url` es descarten abans d'arribar a la crida a Supabase, causant una pèrdua silenciosa de dades.

* **Contaminació de dades personals a `marketSeed.js` (T-03):**
* *Evidència:* `src/sections/mercat/marketSeed.js` (línies 12 i 15) declara literals `seller: 'Javi Llinares'` i `author_name: 'Javi Llinares'`.
* *Causa:* `tooling/gates/tractor-llavor.mjs` bloqueja explícitament el commit si `seed.sql` o `appSeed.js` contenen aquesta cadena. Si s'executa `npm run db:seed:generate`, `scripts/generate-supabase-seed.mjs` importa les dades de mercat i escriu el nom real a `supabase/seed.sql`, trencant la porta `porta:llavor`.

* **Doble bastida de graella a l'administració (T-04):**
* *Evidència:* `src/sections/admin/AdminSection.jsx` embolcalla tota la vista amb `<UniversalPage><AppGridShell .../></UniversalPage>`. Al panell central (`middleColumn`), s'instancia `AdminUsersManager` i `AdminCompaniesManager`, que al seu torn instancien `<UniversalManager>`.
* *Causa:* `UniversalManager.jsx` és un àlies directe d'`UniversalWorkspace`, component que ja munta el seu propi `AppGridShell`. Això genera una graella de 3 columnes imbricada dins de la columna central d'una altra graella de 3 columnes, violant la regla d'or de `.agents/skills/universal-page/SKILL.md` (§5), que prohibeix que `UniversalWorkspace` visca dins d'una `UniversalPage` o d'un altre shell de graella.

* **Conflicte de resolució a `RouterContext.jsx` (T-05):**
* *Evidència:* A `src/app/contexts/RouterContext.jsx`, la funció `resolvePath(base, path)` conté:
```javascript
if (path.startsWith('/')) return path;
```
* *Causa:* A `src/sections/gestoria/GestoriaSection.jsx` es defineix `<Route element="{<Navigate" path="/" replace to="/gestoria/home"/>} />`. Com que el subcamí comença per `'/'`, `resolvePath('/gestoria', '/')` retorna `'/'` en compte de `'/gestoria/'` o `'/gestoria'`. En conseqüència, la subruta de gestoria col·lisiona amb l'arrel global de l'aplicació.

* **Divergència a la taxonomia dels compiladors de la Wiki (T-06):**
* *Evidència:* A `tooling/wiki/compiler/01_build_index.mjs`, `CONFIG.carpetesTaxonomia` conté els noms històrics (`00_SER_Brain_Identitat`, `01_SABER_Cultura_Coneixement`, `02_ACTUAR_Maquina_Tecnica`, `03_GOVERNAR_Normativa_Regles`).
* *Causa:* El repositori ha consolidat les carpetes físiques com a `01_ser`, `02_saber`, `03_actuar`, `04_escriptori` i `10_actes`. Tot i que `detectPilar` fa coincidir el prefix numèric, assigna el nom llarg com a `doc.pilar`. Posteriorment, `02_build_ontology.mjs` (línia 74) valida si `doc.path.split('/')[0] !== doc.pilar` i llança una excepció fatal perquè `01_ser` no és igual a `01_SABER_Cultura_Coneixement`.

---

### Propostes de Correcció Mínimes

**1. Correcció a `src/data/supabaseBackend.js` (T-02):**
Incloure `lema` i `logo_url` al payload de mutació d'organitzacions.

**2. Correcció a `src/sections/profile/DetallAjust.jsx` (T-01):**
Restringir la modificació d'`hero_image` exclusivament a entitats que disposen d'eixa columna o desviar-ho a una metadada compatible.

**3. Anonimització a `src/sections/mercat/marketSeed.js` (T-03):**
Substituir el nom personal per identitat sintètica del sistema.

**4. Aplanament de bastida a `src/sections/admin/AdminSection.jsx` (T-04):**
`AdminSection` ha d'instanciar directament `UniversalWorkspace` com a arrel, delegant les pestanyes i vistes als panells interns sense embolcallar-ho prèviament en una `UniversalPage` ni duplicar `AppGridShell`.

**5. Correcció de resolució de rutes relatives a `src/app/contexts/RouterContext.jsx` (T-05):**
Ajustar `resolvePath` perquè reconega si el context pare té un prefix definit.

**6. Sincronització del compilador d'ontologia (T-06):**
Actualitzar `CONFIG.carpetesTaxonomia` a `tooling/wiki/compiler/01_build_index.mjs` i el conjunt `PILARS` a `tooling/wiki/compiler/02_build_ontology.mjs` per reflectir els directoris canònics vigents.

**7. Neteja de dependències a `package.json` (T-07):**
Eliminar `react-day-picker` si no s'utilitza en cap vista de calendari o data.
