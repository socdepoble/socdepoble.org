---
type: document
status: esborrany
description: "Pla d'implementació per crear el plugin de WordPress (Enxufe) i habilitar la interfície multi-tenant al Frontend."
tags: [implementacio, wordpress, enxufe, fedivers]
---

# Pla d'Implementació — Endoll WordPress Multi-tenant (Gent de la Torre)

**Estat del Pla:** en elaboració

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | pla_enxufe_wp |
| Versió | 1.0.0 |
| Entorn | Desenvolupament (Claude Desktop) |
| Creació | 260929_1322 |
| Modificació | 260929_1322 |
| Propietari | IAIA MarIA |
| Aprovació humana | [pendent] |
| Model IA | Claude / MarIA |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest pla dissenya l'estratègia per permetre la inserció de Sóc de Poble dins de sistemes externs (ex. WordPress) de manera nativa i transparent, generant una aparença de xarxa distribuïda ("Fedivers" visual).

## Historial

- 260929_1322: Creació del pla després de la validació de la idea per part del Mestre.

## Canvis proposats

### 1. Context i Troballes (Research)
L'arquitectura actual genera el fitxer `soc-de-poble.standalone.js` gràcies al `vite.standalone.config.js`. Ja teníem una carpeta `wordpress-plugin` però es reescriurà des de zero per a esta nova funcionalitat. WordPress es provarà en local mitjançant eines com *Local by Flywheel* o *WordPress Studio*.

### 2. Preguntes Obertes (User Review Required)
- Volem que l'usuari logged in de WordPress es passe automàticament a Sóc de Poble (SSO) en esta iteració, o per ara només injectem la vista pública i el registre es fa des de dins?

### 3. Canvis Proposats (Proposed Changes)

#### [Acció: NEW] `wordpress-plugin/socdepoble-enxufe.php`
Creació d'un plugin clàssic de WordPress que:
1. Registra un shortcode `[socdepoble_app]`.
2. Enqueues l'arxiu JS i CSS compilat.
3. Injecta la variable de configuració en el `<head>` o abans del JS:
```html
<script>
  window.SocDePobleConfig = {
    tenant: "gentdelatorre",
    nomPoble: "Gent de la Torre",
    mode: "fedivers"
  };
</script>
```

#### [Acció: MODIFY] `src/App.jsx` i `src/layouts/AppGridShell.jsx`
Llegir `window.SocDePobleConfig`.
- Si hi ha config de tenant:
  - Mostrar un banner a la part superior (mòbil) que diga: *"📍 Estàs al servidor de {nomPoble}"*.
  - A l'ordinador, canviar el títol a la topbar: `Sóc de Poble | {nomPoble}`.

### 4. Pla de Verificació (Verification Plan)
1. Claude instal·larà el plugin en l'entorn de WordPress Local.
2. S'inserirà el shortcode en una pàgina (ex. `/comunitat`).
3. Verificarem que en mòbil i escriptori el banner i títol s'adapten llegint el context.
4. Es validarà amb la `porta:build` que la compilació *standalone* inclou bé els canvis.

## Verificació

[pendent]

## Riscos

[pendent]

## URGENT: Bug de Dades Buides (Ordre del Mestre per a Claude)
**ATENCIÓ CLAUDE:** El Mestre acaba de comprovar que en `http://localhost:3340` (versió standalone local), no es carreguen els productes del Mercat, ni els Pobles, ni la Multimèdia (tot ix buit o «TOTS (0)»). 

**Diagnòstic de la IAIA MarIA:** 
El problema ve perquè `resolveDataMode` (en `src/config/dataMode.js`) llegeix el `localStorage` i veu que hi ha una elecció `mode: 'remote'`, forçant `runtimeDataMode = 'remote'`. Llavors intenta llegir de Supabase. Tanmateix, al fitxer `.env`, `VITE_TENANT_ID` està a `00000000-0000-0000-0000-000000000000`, de manera que Supabase retorna arrays buits. 
D'altra banda, `.env.local` té `VITE_DATA_MODE=seed`, però `resolveDataMode` prioritza el LocalStorage (`mode: 'remote'`). 

**Acció requerida (restauració immediata):**
Sisplau, revisa com s'està resolent el `tenantId` i el `dataMode` en desenvolupament local (`npm run dev`) per assegurar-te que carreguem correctament les dades de seed (`appSeed.js`) o corregeix l'env/tenant perquè tornen a aparéixer els productes i pobles. El Mestre té un amic informàtic a punt d'arribar i necessita que això funcione i done bona impressió. Restaura-ho ràpidament!

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
