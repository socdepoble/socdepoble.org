---
tipus: informe
estat: canonic
data: 2026-09-10
hora: "23:35"
autor: "Flash / IAIA MarIA (Red Teamer)"
titol: "Auditoria Destructiva: UniversalManagerShell, Adapters i LocalAdminStep"
tags: [auditoria, redteam, pedra_seca, seguretat, appgrid, rls]
---

# 🛡️ AUDITORIA DESTRUCTIVA: UNIVERSAL MANAGER SHELL & LOCAL ADMIN

> **Auditor Red Team:** IAIA MarIA / Gemini Flash  
> **Destinatari:** Mestre Javi & Consell d'IAs  
> **Objectiu:** Destrossar i auditar a fons la implementació de Fase 1 (UniversalManagerShell), Fase 2 (Adapters i Configs) i Fase 3 (Mode Administrador sota `/admin`).  
> **Verdict:** ⛔ **BLOQUEJAT PER SEGURETAT (SDP-LOCK) I TRENCAMENT DE LLEIS BASALS.**

## 🔗 Xarxa Neuronal i Ancoratges
- [[00_index]] (Índex Arrel)
- [[00_INDEX_ARXIU]] (Arxiu Històric)
- [[estandard_ui_universal]] (Estàndard UI Universal)
- [[pedra_seca]] (Llibre Blanc de Pedra Seca)

---

## Executive Summary (El Trellat Inicial)

L'arquitectura proposada per a un `UniversalManagerShell` és una bona intenció modular, però l'execució actual ha estat una **hiper-implementació precipitada** que ha trencat les regles fonamentals del projecte, ha introduït una **vulnerabilitat crítica de filtració massiva de dades personals (RGPD)**, trenca el tractor d'enxufabilitat de Sollutia, al·lucina classes CSS inexistents i viola repetidament la Llei de Pedra Seca.

A continuació es detallen els **7 fronts de destrucció** amb proves forenses irrefutables.

---

## 🔴 FRONT 1: SEGURETAT I PRIVACITAT CRÍTICA (P0 / RED TEAM BOMB)

### 1.1 Bretxa RGPD Massiva via Supabase RPC (`admin_list_users`)
- **Ubicació:** `supabase/migrations/260912_admin_panel.sql` (línies 11-35) i `src/sections/admin/AdminSection.jsx` (línia 18).
- **Vulnerabilitat:** La funció SQL `public.admin_list_users(admin_secret text)` s'ha definit amb `SECURITY DEFINER`. En PostgreSQL/Supabase, per defecte les funcions en l'esquema `public` tenen permís d'execució concedit a `public` i `anon`.
- **El forat:** El secret d'autenticació és la paraula estètica `'Mestre'`, incrustada en text pla tant al codi SQL com al bundle compilat de React (`AdminSection.jsx: adminListUsers('Mestre')`).
- **Vector d'atac:** Qualsevol usuari anònim del món pot executar sense iniciar sessió:
  ```bash
  curl -X POST 'https://<project-ref>.supabase.co/rest/v1/rpc/admin_list_users' \
    -H "apikey: <anon-key-publica>" \
    -H "Content-Type: application/json" \
    -d '{"admin_secret": "Mestre"}'
  ```
  **Resultat:** Es bolca la taula sencera `auth.users` amb tots els correus electrònics reals de la gent del poble, IDs i dates de connexió.
- **Infracció:** Violació directa del manament *"No tocar dades personals sense base legal"* i violació de les normes RLS de Supabase.

### 1.2 Search Path Hijacking (Privilege Escalation)
- **Ubicació:** `supabase/migrations/260912_admin_panel.sql`.
- **Prova automatitzada:** `node tooling/gates/tractor-rls.mjs`:
  ```
  ❌ [RLS] Trobades 2 infraccions de seguretat.
     R6 · supabase/migrations/260912_admin_panel.sql: Funció security definer admin_list_users no té set search_path = ''
     R6 · supabase/migrations/260912_admin_panel.sql: Funció security definer admin_list_organizations no té set search_path = ''
  ```
- **Risc:** Un usuari maliciós amb permisos per crear objectes en esquemes previs pot segrestar l'execució de la funció amb privilegis de superusuari.

### 1.3 Falsa Seguretat per Obscuritat al Client (`LocalAdminStep`)
- **Ubicació:** `src/sections/admin/AdminSection.jsx` (línies 18-22).
- **Codi:** `if (secret === 'Mestre') { onLogin(secret); }`.
- **Diagnòstic:** Autenticació purament visual de joguet. No hi ha cap token criptogràfic, cap sessió signada per GoTrue ni verificació de claims JWT. Qualsevol modificació de 2 bytes en memòria o un breakpoint a les DevTools salta la barrera.

---

## 🔴 FRONT 2: CONTRACTES TRENCATS I ENXUFABILITAT (SOLLUTIA LAW §8)

### 2.1 Desincronització del Host (`tractor-enxufe.mjs` - Fallada E2)
- **Prova:** `node tooling/gates/tractor-enxufe.mjs`
- **Diagnòstic:** S'han afegit `adminListUsers` i `adminListOrganizations` a `src/data/backendPort.js`, però **S'HAN OBLIDAT** d'afegir-los a `CONTRACTE_BACKEND` a `src/host.js`.
- **Conseqüència:** Quan Sollutia injecte el seu backend a través de `configura({ backend })`, aquests dos mètodes seran rebutjats com a `desconeguts` i ignorats pel segellat. El panell d'administració intentarà cridar mètodes que no existiran al backend nou, provocant excepcions fatals.

### 2.2 Violació de Persistència Encapsulada (`tractor-persistencia.mjs` - Fallada L2)
- **Ubicació:** `src/components/universal/manager/adapters/localStorageAdapter.js` (línies 76, 77, 118, 191).
- **Prova:** `node tooling/gates/tractor-persistencia.mjs` detecta 4 infraccions.
- **Motiu:** Crida directa al global `localStorage` en compte d'utilitzar la façana canònica del projecte a `src/config/storage.js`.

### 2.3 Orfandat Total (Codi Mort) de `localStorageAdapter.js`
- **Diagnòstic:** `createLocalStorageAdapter` NO s'importa, no s'enxufa a cap lloc ni s'usa en cap component de la plataforma. La Fase 2 és una il·lusió: l'adaptador està aïllat del món, no té cap suite de test associada i conté zero integració amb `UniversalManager`.

---

## 🔴 FRONT 3: TRENCAMENT DE LAYOUT I CONTRACTES D'APPGRIDSHELL

### 3.1 Ús Aberrant d'`AppGridColumn` com a Wrapper de Contingut
- **Contracte d'origen:** `AppGridColumn.jsx` és estrictament la **CAPÇALERA D'ACORDIÓ/REPLEGAMENT** de 44px d'una columna (`<div className="app-grid-col-header">`).
- **L'abús a `AdminSection.jsx`:**
  ```jsx
  // Línies 60, 101, 135, 168:
  <AppGridColumn classLayout="app-col-sidebar app-col-sidebar-left">
    <div className="notes-sidebar-inner">...</div>
  </AppGridColumn>
  ```
- **La destrossa:** `AppGridColumn` no accepta cap prop anomenada `classLayout`. Posa tot el contingut passat com a `children` dins de `<div className="app-grid-col-header__accions">`, és a dir, **com si tot el formulari o llistat foren botons d'acció de la barra de títol**. La semàntica i el flux visual queden completament deformats.

### 3.2 Al·lucinació de Classes CSS
- Ni `app-col-sidebar`, ni `app-col-middle`, ni `app-col-llista`, ni `app-col-editor` existeixen en cap full d'estils del projecte. S'han inventat classes que no tenen regles associades.

### 3.3 Segrest de Classes de Notes (`NotesSection.css`) sense Importar
- `ManagerFacets.jsx` i `ManagerList.jsx` utilitzen `.folder-item`, `.notes-list`, `.notes-list-header`, `.search-bar`.
- Aquestes classes pertanyen exclusivament a `NotesSection.css` sota l'ancoratge jeràrquic `.notes-page .folder-item`. Com que `UniversalManager` no importa eix full ni usa la classe contenidora `.notes-page`, l'aspecte a `/admin` és el d'un HTML nu sense estils de Pedra Seca.

### 3.4 Desbordament i Destrucció per Embolcall Contained
- `UniversalManagerInner` crida:
  ```jsx
  <UniversalPage layout="contained">
    <AppGridShell ... />
  </UniversalPage>
  ```
- `UniversalPage` no té cap propietat `layout`. En no passar-li `chrome="none"` ni `noPadding`, `UniversalPage` embolcalla la graella dins d'un `<article className="content-wrapper">` amb marges i paddings que rebenten l'`inset: 0` d'`AppGridShell`, produint un layout deformat amb barres de desplaçament dobles.

---

## 🔴 FRONT 4: INCOHERÈNCIES DE MODEL I SCHEMA (DISSENY VS BD)

### 4.1 `usersManagerConfig` vs `admin_list_users`
- `usersManagerConfig.js` cerca filtrar per `item.role` (`getValue: (item) => item.role || 'user'`) i cerca per text usant `item.raw_user_meta_data?.nom`.
- Tanmateix, l'RPC `admin_list_users` de PostgreSQL només retorna: `id, email, created_at, last_sign_in_at`.
- **Resultat:**
  - El nom mai es mostra; sempre apareix el correu.
  - La faceta de rols no funciona: tots els usuaris tenen `role === undefined`, fent que filtrar per 'master' o 'admin' retorne sempre 0 resultats.

### 4.2 `companiesManagerConfig` vs `admin_list_organizations`
- `companiesManagerConfig.js` defineix la faceta sobre `item.type`.
- La funció SQL retorna `kind` (`o.kind`), mai `type`.
- **Resultat:** `item.type` és sempre `undefined`. Totes les entitats cauen al fallback `'empresa'`. Les opcions d'«Ajuntament» o «Grup» mai retornen cap registre.

---

## 🔴 FRONT 5: DEFECTES AL MANAGER SHELL (`ManagerContext.jsx`)

### 5.1 Algorisme d'Arbre (`treeAllowedByFacet`) Trencat per Disseny
- L'algorisme de `ManagerContext.jsx` reconstrueix la jerarquia de carpetes iterant sobre els `items` (`for (const item of items)`) i executant `facet.getParentId(cursor)`.
- **Errors flagrants:**
  1. Cap configuració defineix `facet.getParentId`. Com que és `undefined`, `childrenMap` sempre queda buit.
  2. Construir la topologia de les carpetes des dels ítems és conceptualment invàlid: si una subcarpeta no té cap ítem en eixe moment, el gestor n'elimina el parentesc.
  3. Quan l'usuari selecciona una carpeta arrel a `ManagerFacets`, cap element dels subnodes no es mostra mai.

### 5.2 Tempesta de Re-renders per SearchQuery Síncron
- `value` de `ManagerProvider` inclou tant `searchQuery` com `deferredSearchQuery` dins del mateix objecte memoritzat.
- A cada pulsació de teclat, `searchQuery` canvia, invalidant el `useMemo` del context i forçant el re-render immediat de tot l'arbre de components. `useDeferredValue` queda completament neutralitzat.

### 5.3 Estat Esquizofrènic (`activeItemId` vs `activeItem`)
- Si un ítem està seleccionat (`activeItemId = "x"`), però l'usuari escriu un text al cercador que el deixa fora dels resultats, `activeItem` cau a `filteredItems[0]`, però `activeItemId` **continua mantenint la selecció antiga**. Això provoca estats incoherents on `getItemId(activeItem) !== activeItemId`.

---

## 🔴 FRONT 6: DEUTE DE DISSENY I PEDRA SECA (TRACTORS BLOQUEJATS)

### 6.1 25 Violacions d'Inline Styles
- `node tooling/gates/tractor-inline-styles.mjs`: **25 violacions** directes a `ManagerFacets.jsx`, `ManagerList.jsx` i `AdminSection.jsx` (`display: flex`, `padding`, `margin`, `textAlign`, etc.).
- `node tooling/gates/design_guard.mjs`: El deute d'estils en línia salta de 23 a 52. Build suspès.
- `node tooling/gates/tancament.mjs`: Avorta el tancament de sessió per violació de la Llei de Pedra Seca.

---

## 🔴 FRONT 7: ACCESSIBILITAT (A11Y) I EXPERIÈNCIA D'USUARI

1. **ManagerFacets:** Els botons de les facetes utilitzen classes visuals (`folder-item--active`) sense atributs ARIA (`aria-current` o `aria-pressed`).
2. **ManagerList:** `<li role="button">` dins d'un `<ul>` destrueix la semàntica de llista (`listitem`) per a lectors de pantalla.
3. **LocalAdminStep:** Formulari sense `id` al camp d'entrada, sense associació de `<label for>`, i sense `aria-describedby` per al missatge d'error d'autenticació.
4. **AdminSection Navigation:** Les pestanyes són estat local (`useState('dashboard')`). No suporten URL directa (sense rutes filles) ni historial del navegador (Back/Forward). A més, entrar a "Usuaris" destruïx la graella de 3 columnes del panell d'administració, obligant a tornar arrere amb un botó artificial.

---

## 📋 PLA D'ACCIÓ CORRECTIU OBLIGATORI (Recomanació del Consell)

1. **REVERTIR / AÏLLAR la migració `260912_admin_panel.sql` immediatament:**
   - No es pot exposar `auth.users` amb una contrasenya en text pla a `anon`.
   - Si cal un mode admin de veritat, ha de basar-se en rols de Supabase (`app_metadata.role = 'superadmin'`) o RPCs autenticades amb `auth.uid()` i polítiques RLS reals.
2. **Sincronitzar `CONTRACTE_BACKEND` a `src/host.js`:**
   - Afegir els mètodes al contracte o retirar-los del port si només són de desenvolupament.
3. **Arreglar `AppGridColumn`:**
   - Substituir l'ús erroni com a contenidor pel patró correcte utilitzat a `NotesSidebar` i `NotesList` (un `<aside className="notes-column">` amb `AppGridColumn` com a primera línia de capçalera).
4. **CSS Semàntic de Pedra Seca:**
   - Crear `UniversalManager.css` indexat i modular, eliminant els 25 estils en línia i les classes segrestades de notes.
5. **Corregir l'algorisme de jerarquia a `ManagerContext`:**
   - L'arbre s'ha de derivar de les `facet.options`, no dels `items` mitjançant un `getParentId` inexistent.
6. **Encapsular la persistència:**
   - Fer que `localStorageAdapter` passe per `src/config/storage.js` o connectar-lo al sistema reactiu del projecte.
