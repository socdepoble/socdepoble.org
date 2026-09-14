# 🧠 ACTA D'ESTUDI: Arquitectura de la Segona Plantilla (Admin Mode)
**Data:** 2026-09-10
**Objectiu:** Sintetitzar i debatre les propostes del Consell per a l'abstracció de `UniversalManagerShell` i l'accés offline.

---

## 1. Aportació de Gemini Pro
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció:**
Gemini Pro proposa una desconstrucció directa de l'actual Bloc de Notes, aprofitant l'`AppGridShell` de tres columnes:
- **`ManagerSidebar`**: Reemplaça el menú de carpetes per un `Accordion` dinàmic que accepta JSON (grups i taxonomies).
- **`ManagerList`**: Llistat genèric que usa el `UniversalSearch` i accepta una funció `renderItem` per dibuixar qualsevol targeta.
- **`ManagerDetail`**: Un formulari CRUD dinàmic muntat sobre `UniversalEditorShell` amb els inputs de Pedra Seca.

**Estratègia d'Accés Local:**
- **Entorn:** Condicionat a `VITE_DATA_MODE=seed` o pèrdua de connexió.
- **Persistència:** Injecta un JWT simulat directament al `sessionStorage`, esquivant les regles RLS de Supabase. Molt pragmàtic per a l'entorn de desenvolupament local.

**Model de React (API):**
Ha optat clarament per un model **Declaratiu basat en Props** (tipus `<UniversalManagerShell sidebar={...} list={...} detail={...} />`). Això és extremadament llegible i aïlla bé l'estat, evitant l'excés de Context.

---

## 2. Aportació de Gemini Flash
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció:**
Ha portat la idea genèrica de Gemini Pro a una implementació gairebé completa i llista per a producció.
- **Configuració per Contracte:** Extrau tota la lògica visual a un arxiu `adminManagerConfig.js` purament declaratiu (icones, formularis, camps, botons). Això fa que la plantilla siga 100% agnòstica.
- **Context React:** Proposa `UniversalManagerContext.jsx` com a cervell (màquina d'estats) per gestionar el filtratge, l'element actiu i l'esborrany de canvis abans de guardar. Això evita forçar *props drilling* innecessari en la graella.

**Estratègia d'Accés Local:**
Ha entès perfectament l'`ADR-2026-08-ONLINE-FIRST`. Proposa injectar un JWT mockejat de *superadmin* al `sessionStorage` (`socdepoble-jwt`) juntament amb les dades d'usuari (`socdepoble-user`), des de la pantalla de `/registre` quan s'està en mode desenvolupament. És la forma més neta de saltar-se l'Auth de Supabase sense embrutar la lògica de producció.

**CSS i Pedra Seca:**
Ha respectat de manera estricta l'arquitectura de variables CSS (`--sdp-*`) i el disseny Vanilla. Els formularis tenen estats de *readonly*, botons *primary/secondary* clars i iconografia integrada.

**Extensió cap al Backend:**
Ofereix crear les accions RPC i la connexió SQL/Supabase per gestionar de manera real `user_platform_roles` i `organization_claims`. Açò és or pur per connectar-ho demà amb Sollutia.
---

## 3. Aportació de Grok
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció:**
Grok ha fet una aportació fonamental que complementa a la perfecció la de Gemini Flash: **el `DataAdapter`**. 
Mentre que Flash s'havia centrat molt en la UI i l'estat (Context), Grok proposa un patró on el `UniversalManagerShell` rep la `config` (visual) i un `adapter` (dades). Açò significa que el panell no sap ni li importa si les dades venen de Supabase, de Dexie (local) o d'un array dur. Brutal per a la nostra arquitectura.

**Estratègia d'Accés Local:**
- **Entrada acotada:** Afegeix el concepte de `sdp.allowLocalAdmin` o la comprovació de `navigator.onLine === false` com a condició indispensable per veure l'opció de "Mode Local".
- **Persistència Híbrida (Dexie):** Suggereix utilitzar la infraestructura existent de cues locals (que en el nostre cas és el `syncManager` o `storage.js`) per emmagatzemar el hash local sense tocar les cookies de sessió compartides. Cap "backdoor" silenciós cap al servidor de producció.

**Model de React (API):**
Proposa exactament l'ordre de construcció Pedra Seca (Aixada, canvi mínim):
1. Crear el Shell + Context buit.
2. Migrar `NotesSection` al Shell **sense que canvie res visualment** (reutilitzant l'adaptador actual de Notes).
3. Una vegada validat que Notes funciona amb el nou Shell, escalar-ho a l'Administrador (Usuaris).

---

## 4. Aportació de Mistral Vibe
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció:**
Vibe ha consolidat les idees de Grok i Flash presentant el codi React pràcticament enllestit. Ens ha regalat l'esquelet complet de l'API de React:
- **`ManagerConfig` estructurat:** Defineix clarament com especificar les columnes (`columns`), el formulari dinàmic (`form.fields`), la jerarquia (`hierarchy`) i les accions personalitzades.
- **Renderitzat Dinàmic:** Ha aportat la funció de renderitzar qualsevol formulari basat en un JSON (`renderField` amb *switch* entre `textarea`, `select`, `multiselect`, `boolean`, `file`, i `text`).

**Estratègia d'Accés Local:**
- **Modal d'Accés Mestre:** Proposa un component `AdminAccessButton` flotant (només actiu en mode `development`) amb un formulari per posar el "Codi Master". És la manera més senzilla i neta d'autenticar-se localment sense dependre del panell sencer d'Onboarding.
- Ens aporta l'adaptador de **LocalStorage** complet (`localStorageAdapter.js`) amb tots els mètodes CRUD simulats.

---

## 🏗️ Síntesi Executiva (Decisió Final de la IAIA MarIA)
## 5. Aportació de Dola
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció:**
Dola fa un pas enrere i analitza de forma brillant el **patró arquitectònic real** que tenim: l'`AppGridShell` de 3 columnes sobre un `NotesProvider`. Ens confirma que la clau de la universalitat és entendre que només canvien quatre coses: *la semàntica, els camps, el render del detall, i l'adaptador*.

**Estratègia de Migració (Molt important):**
Defineix un full de ruta per no trencar res, alineat amb la filosofia de "canvi mínim" (Pedra Seca):
1. **Fase 1:** Construir el `UniversalManager` sencer, però estrenant-lo només amb la nova secció "Gestor d'Usuaris" (Admin). No es toca el Bloc de Notes actual.
2. **Fase 2:** Una vegada provat, refactoritzar el Bloc de Notes perquè passe a utilitzar l'`UniversalManagerShell` en lloc del seu propi *shell*.

**Estratègia d'Accés Local:**
Proposa interceptar la funció fonamental `getCurrentUser()` dins de `backendPort.js` perquè primer comprove si hi ha una sessió local de superadmin (`getLocalAdminSession`), i si no, caiga al flux normal de Supabase. Açò centralitza l'autenticació de forma elegantíssima i sense haver de fer hacks pel mig dels components.

---

## 6. Aportació de Z (Codex/Opus)
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció:**
Maldament no va rebre el bundle per un error de tall, Z ha deduït de forma mestra l'essència del patró Pedra Seca. Introdueix el concepte clau de **Facetes (`tree` vs `flat`)**: 
El Sidebar no és una llista de carpetes. És un **filtre per facetes**. Si la faceta és `tree` (jeràrquica com les carpetes), el filtre cerca els descendents. Si és `flat` (com les etiquetes o rols), el filtre busca coincidències a l'array. Aquesta abstracció (el descriptor `scope`) és el que fa universal al panell de debò, més enllà de la pura UI.

**Estratègia de Migració i Verificació:**
Proposa un **Pla Strangulador** idèntic al de Dola: primer muntar el Shell i moure-hi el Bloc de Notes sense canviar res visual (Fase 1). 
A més, ha llistat 6 **Punts de Verificació (PV)** essencials (p.ex. comprovar l'emmagatzematge actual de Notes per no trencar les dades antigues) abans d'escriure ni una línia de codi.

**Seguretat del Mode Local:**
Eleva l'estàndard de seguretat del "Mock JWT". Proposa fer un *hash* PBKDF2 de la contrasenya local de l'Administrador perquè no es quede en text pla. L'identitat durable viu a `localStorage` (amb el hash), però la **sessió activa** (que permet saltar el bloqueig) viu exclusivament a `sessionStorage` perquè muira amb la pestanya, corregint per defecte l'error P0 del dia passat (fuita de galetes).

---

## 7. Aportació de Qwen
*(Analitzada: 2026-09-10)*

**Visió d'Abstracció i Relacions:**
Qwen reafirma la necessitat d'una **UI basada en configuració (Config-Driven UI)** a través de proveïdors de Context per evitar el "props drilling". Però fa una aportació teòrica vital per a l'escalabilitat del panell: **Les Relacions en l'Esquema**.
Qwen proposa que el diccionari de camps suporte tipus relacionals (ex: `{ type: 'relationship', targetEntity: 'companies' }`). Això significa que quan configurem l'administrador d'usuaris, podrem vincular un usuari a una empresa només declarant aquesta relació en l'arxiu de configuració, sense haver de programar formularis ni selects personalitzats. La plantilla farà la consulta a l'entitat destí automàticament.

**Persistència i Detecció Offline:**
Insisteix fermament en l'ús de **Dexie.js** per gestionar IndexedDB en mode local (recolzant el codi que ja ens havia donat Grok). També proposa utilitzar `navigator.onLine` i listeners de xarxa perquè el Shell canvie de proveïdor de dades automàticament (de l'API al local) sense que l'usuari se n'adone.

---

## 8. Aportació de Deepseek
*(Analitzada: 2026-09-10)*

**Visió Arquitectònica i CSS:**
Deepseek ha analitzat de prop l'API real d'`AppGridShell` i `AppGridColumn` que ja existeix. Ha proporcionat l'esquelet complet de com el `UniversalManagerShell` ha d'embolcallar aquests components. 
A més, ha sigut l'únic en llistar els **tokens reals** (`--sdp-fons-app`, `--sdp-text-titol`, `--sdp-vora`, etc.) per construir el CSS del panell (`UniversalManager.css`), assegurant que no s'inventa res i que tot complirà les lleis de Pedra Seca.

**Integració del Mode Local:**
Ha detectat el mateix conflicte que Z amb l'ADR de l'Online-First, i ho ha resolt de la mateixa manera elegant: el mode local és purament d'autenticació per a desenvolupament. Proposa injectar un adaptador local en calent (`createAdminAdapter`) només quan el `currentUser` té el *flag* `local: true`, i caure a Supabase en cas contrari.

---

## 9. Aportació de Gemini Flash (Backend i Supabase RPC)
*(Analitzada: 2026-09-10)*

Flash ha portat la peça del trencaclosques que faltava per a quan l'Administrador funcione en producció (enllaçat a Sollutia/Supabase): **L'aïllament SQL**.
Com que l'aplicació té RLS (Row Level Security) estricte per defecte i ningú pot fer lectures massives, Flash ens ha redactat una migració PostgreSQL on exposa les funcions de llistat d'usuaris i de reclamacions mitjançant funcions RPC amb `SECURITY DEFINER`. D'aquesta manera, només la funció interna `private.es_superadmin()` obri la porta, mantenint la seguretat intacta.
També ens ha donat la implementació exacta per a `host.js`, `backendPort.js` i `supabaseBackend.js`, deixant el contracte de dades completament lligat per a la Fase 3.

---

## 🏗️ Síntesi Executiva (Decisió Final de la IAIA MarIA - Esborrany viu)
La confluència d'idees d'aquest Consell nocturn ens dóna l'arquitectura perfecta per a la "Segona Plantilla":

1. **Abstracció de Dades (Z / Grok / Vibe / Qwen):** La plantilla s'alimentarà d'una **Configuració Declarativa** (que inclourà suport per a relacions entre entitats) i d'un **`DataAdapter`** estricte (CRUD). L'estat el gestionarà un `UniversalManagerContext`.
2. **Navegació per Facetes (Z):** El Sidebar no gestionarà "Carpetes", sinó *Facetes* (`tree` i `flat`). Açò resol la cerca i el filtratge de qualsevol entitat de forma matemàtica.
3. **Punt d'Accés Superadmin (Flash / Dola / Z / Qwen):** S'accedirà via una modal / ruta oculta en mode desenvolupament. Es validarà contra un hash local (PBKDF2) i la sessió efímera s'injectarà a `sessionStorage`, sent llegida directament a `backendPort.js -> getCurrentUser()`.
4. **Backend de Producció (Flash):** Totes les dades massives passaran per funcions RPC (`admin_list_users`, `admin_list_claims`) bloquejades per `SECURITY DEFINER` per saltar el RLS de manera segura.
5. **Ordre d'Execució Strangulador (Dola / Z):**
   - **Pas 1 (PVs):** Resoldre els punts de verificació (estat actual de Notes, tokens sdp, router).
   - **Pas 2 (Shell):** Construir els components del Shell i el Context usant les "Petorretas Finals".
   - **Pas 3 (Migració):** Convertir el Bloc de Notes a configuració i canviar-lo al nou Shell. Verificació 1:1.
   - **Pas 4 (Admin Offline & Online):** Habilitar el login local i el Gestor d'Usuaris, preparant l'adaptador de Supabase per al futur.
