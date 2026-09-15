---
tipus: estudi
estat: actiu
description: 🛡️ AUDITORIA ESTRUCTURAL — BUNDLE 2609061232
---

# 🛡️ AUDITORIA ESTRUCTURAL — BUNDLE 260906_1232

## Verificació prèvia

445/445 fitxers extrets i comprovats contra el MANIFEST. **Zero divergències de sha256.** Contracte d'abast declarat i respectat. El bundle és de fiar.

Marque què he **executat** i què és **lectura estàtica**, perquè no val el mateix.

---

## P0 — Açò trenca demà

### 1. L'artefacte que Sollutia ha de carregar no es pot construir *(executat)*
`wordpress-plugin/dist/soc-de-poble.standalone.js` està fora del contracte del bundle. `npm run build:wp` no existix. `vite.standalone.config.js` no existix. La porta `tractor-build-previ` ho degrada a avís i passa.

### 2. El contracte del backend està incomplet: 4 mètodes que Sollutia no pot injectar *(executat)*
Falten `getProfile`, `updateProfile`, `updateUserPassword`, `updateOrganization`. `configura()` els descarta. `tractor-enxufe` ja ho detecta (E2, 4 infraccions, EXIT=1).

### 3. El tenant per defecte falla obert i està triplicat *(estàtic)*
L'UUID del tenant està triplicat. Si l'amfitrió oblida el `tenant-id`, entra al de demostració en silenci.

### 4. Registrar-se no dona accés a res *(estàtic, verificat per absència)*
`handle_new_user()` crea `profiles` però ignora `town_memberships`. Cap línia de `src/` toca `town_memberships`. Sense açò, l'usuari no pot escriure res per culpa de les RLS.

### 5. La segona edició d'una nota sempre falla *(estàtic)*
`saveNoteField` incrementa la revisió local però no l'actualitza correctament en la font. El servidor retorna 409 conflicte.

### 6. `appendChatMessages` fa `on_conflict=id` sobre una PK composta *(estàtic — verifica-ho contra la BD)*
PostgREST traduirà a `ON CONFLICT (id)` i Postgres ho rebutjarà amb 42P10.

### 7. La política de privacitat publicada descriu una arquitectura que no existix *(estàtic)*
A `seed.sql`, diu "Les teues dades viuen al teu dispositiu" (Online-First Radical), cosa que és falsa (ara és Online-First a Supabase). RGPD exigeix que la informació siga exacta.

### 8. `schema.sql` no és re-executable, i el que es perd és la seguretat *(estàtic)*
Línia 317: `create function public.create_organization(...)` no té `or replace`. Si falla, **avorta la creació dels triggers i totes les polítiques RLS**.

---

## P1 i P2 (Resumides)
- **#9:** Taula `organizations` té esquemes diferents si és nova o migrada.
- **#10:** `app_content` completament públic per a `anon`.
- **#11:** El mur és invisible per a `anon` perquè exigeix membresia.
- **#12:** `profiles.visibility = 'private'` no servix per a res, el trigger clava el `full_name` dins de `payload.author_name` que és visible.
- **#13:** `schema_notes.sql` no s'executa mai.
- **#14:** `updateNote` perd imatges i dóna falsos positius.
- **#15:** L'arrencada es penja si falla una de les peticions inicials.
- **#16:** COOP OAuth està mort.
- **#17:** Cap origen Sollutia a la whitelist del relé.
- **#18:** JWT i refresh token viuen a `localStorage` (insegur), logout no revoca en backend.
- **#19:** `.sollutia-deute.json` és un fòssil inútil.
- **#20:** `tractor-persistencia` està trencat i imposa la doctrina offline vella.
- **#21:** Dependències fantasma inútils.

*(Pots consultar l'arxiu sencer si necessites la llista completa)*


**Ancoratge de Seguretat:** [[00_index_escriptori]]
