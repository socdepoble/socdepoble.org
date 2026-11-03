---
type: document
status: esborrany
description: Inventari verificable del port i requisits d'allotjament Model B
---
# API del port neutral i allotjament Model B

Contrast: arbre de l'assalt 261101_1246 (torn_3f5652a2; el hash del commit es posa
en fer-lo), 01-11-2026. Esborrany. Inventari de codi; no acredita
cap nou desplegament ni l'aprovació d'una ADR. Les signatures i DTO són a
`src/data/contracte.js` i a les implementacions; la llista següent enumera noms.

## 32 operacions obligatòries del Nucli (`CONTRACTE_NUCLI`)

Font: `src/data/contracte.js`. Una implementació vàlida les oferix totes:

- `loadCoreContent`
- `loadMur`
- `loadMultimedia`
- `loadNotes`
- `appendChatMessages`
- `appendSectionSubmissionNetworkOnly`
- `updateNote`
- `loginWithMagicLink`
- `registerWithPassword`
- `loginWithPassword`
- `loginWithGoogle`
- `listMyOrganizations`
- `createOrganization`
- `updateOrganization`
- `updateProfile`
- `updateUserPassword`
- `getProfile`
- `recullTornadaOAuth`
- `logout`
- `getCurrentUser`
- `getBackendConfigurat`
- `getRuntimeDataMode`
- `getDefaultUserId`
- `createNote`
- `loadFils`
- `loadMissatges`
- `enviaMissatge`
- `marcaLlegit`
- `creaFilDirecte`
- `carregaMembres`
- `subscribeToXat`
- `unsubscribeFromXat`

## 37 capacitats atòmiques opcionals (`CAPACITATS`)

86 mètodes addicionals; 118 mètodes en `CONTRACTE_BACKEND`. Una capacitat
està disponible només si el port disposa de tots els seus mètodes. No hi ha
un camp `capacitats` obligatori a l'adaptador ni `capacitatsDisponibles()`.

| Capacitat | Mètodes literals |
| --- | --- |
| `sessioExterna` | `adoptaSessioExterna` |
| `paginacioNotes` | `loadNotesPage` |
| `paginacioSeccions` | `loadSeccioPage` |
| `admin` | `adminListUsers`, `adminListOrganizations` |
| `sessio` | `refrescaSessio`, `elMeuRol` |
| `mitjans` | `uploadToStorage`, `getPublicUrl`, `resolveAsset`, `promoteToPublic` |
| `mitjansPropis` | `llistaElsMeusMitjans`, `esborraElMeuMitja` |
| `xatMultimedia` | `quotaXat`, `publicaAdjuntXat`, `urlAdjuntXat`, `descartaAdjuntXat` |
| `clausXat` | `publicaIdentitatXat`, `laMevaIdentitatXat`, `desaFraseXat`, `clausDeXat`, `desaLlibretaXat`, `laMevaLlibretaXat`, `estatXifratXat`, `epoquesDelFilXat`, `sobresMeusXat`, `obriEpocaXat`, `enviaXifratXat`, `reembolcallaXat`, `demanaXifratXat` |
| `xatMultimediaXifrat` | `publicaAdjuntXifratXat`, `bytesAdjuntXat` |
| `agenda` | `loadActesAgenda` |
| `compte` | `exportaLesMeuesDades`, `estatBaixa`, `demanaBaixa`, `cancelaBaixa` |
| `consentiment` | `estatConsentiment`, `registraConsentiment`, `revocaConsentiment` |
| `cicleNotes` | `mouNota`, `esborraNota` |
| `directori` | `loadPerfilPublic` |
| `directoriEntitats` | `listPublicOrganizations` |
| `agents` | `listMyAgents`, `updateAgent` |
| `reclamacions` | `reclamaOrganitzacio`, `lesMevesReclamacions` |
| `contacteOrganitzacio` | `llegeixContacteOrganitzacio`, `desaContacteOrganitzacio` |
| `xatDePagina` | `obriFilDePagina` |
| `salut` | `comprovaServidor` |
| `versioClient` | `versioMinimaClient` |
| `recuperacioContrasenya` | `demanaRecuperacioContrasenya`, `definixContrasenyaNova` |
| `entradaAmbToken` | `entraAmbTokenDeProveidor` |
| `membresOrganitzacio` | `llistaMembresOrganitzacio`, `desaMembreOrganitzacio`, `llevaMembreOrganitzacio` |
| `transferenciaPropietat` | `transfereixPropietatOrganitzacio` |
| `segonFactor` | `llistaFactors`, `inscriuFactor`, `reptaFactor`, `verificaFactor`, `retiraFactor` |
| `personalitzacio` | `adminDesaPersonalitzacio`, `adminHistorialPersonalitzacio` |
| `moderacio` | `denunciaContingut`, `llistaBloquejos`, `bloquejaAutor`, `desbloquejaAutor` |
| `normesConvivencia` | `estatNormes`, `acceptaNormes` |
| `seguiments` | `segueix`, `deixaDeSeguir`, `estatSeguiment`, `elsMeusSeguiments`, `quiEmSegueix` |
| `titularPublic` | `loadTitularPublic` |
| `consentimentTitular` | `estatTitularPublic`, `marcaTitularPublic` |
| `dadesObertes` | `llegixDadesObertes` |
| `restauracioDadesObertes` | `restauraDadesObertes` |
| `avisosPush` | `desaDispositiuAvisos`, `retiraDispositiuAvisos` |
| `silenciXat` | `silenciaFil` |

## Validació i conformitat

`src/data/backendPort.js` exporta `validaBackendImplementation`,
`setBackendImplementation`, `getBackendImplementation` i `teCapacitat`.
La validació prepara els mètodes i només després substituïx el port, rebutja
getters i capacitats parcials. No és una prova funcional d'un servidor remot.

`src/data/conformitat/kit.js` **exporta** `CASOS`, `contextDeConformitat`,
`executaCas` i `metodesSenseCas`. **Els casos tornen** `ok`, `falla` o `omés`.
**Les omissions** i `metodesSenseCas()` fan visible la **cobertura pendent**; no es
pot dir que les 118 operacions tinguen **comportament certificat**. **Les proves**
són `src/data/conformitat/kit.test.js` i `qualitat.test.js` en eixa carpeta.
No hi ha les API `verificaContracteBackend` o `executaKitDeConformitat`.

## Frontissa de lectura i sessió

`src/data/adaptadors/sollutia/client.js`: `CONFIGURACIO` té `apiOrigin: null`,
`allowedOrigins: []` i `resources: {}`. `ESCRIPTURES_PERMESES` és buit.
`llig` no té recursos activats sense una captura versionada.

`src/data/adaptadors/sollutia/creaFrontissa.js` **exporta** `creaFrontissa` i
`ErrorDades`. **Valida HTTPS**, **origen admés**, **rutes, paràmetres i captures**;
usa GET, credentials omit, redirect error i Accept application/json.
Cada recurs aporta `timeoutMs`, `maxBytes` i `decode`, que **valida el DTO**.
Els **codis literals** inclouen `INVALID_ORIGIN`, `INVALID_RESOURCE`,
`UNKNOWN_RESOURCE`, `INVALID_QUERY`, `CANCELLED`, `TIMEOUT`,
`PAYLOAD_TOO_LARGE`, `INVALID_PAYLOAD`, `UNAUTHENTICATED`, `FORBIDDEN`
i `UNAVAILABLE`. No són codis FRONTISSA_*.

La sessió externa és una capacitat separada; el seu issuer no és un origen
de dades. Les dades del poble continuen darrere del port de Sóc de Poble.

## Allotjament verificable

- WordPress: `wordpress-plugin/socdepoble-enxufe.php` carrega
  `dist/soc-de-poble.standalone.js` i `dist/sdp-release.json` relatius al plugin.
  El codi curt `[socdepoble_app]` (`includes/marcatge.php`) i el bloc `socdepoble/app`
  (`includes/bloc/block.json`) allotgen el component.
  L'aprovació de l'slug `socdepoble` ja consta en Ronda 1; no prova una versió
  publicada ni un nou desplegament d'este lot.
- Web estàtica: `firebase.json` servix `dist` i declara Content-Security-Policy,
  X-Content-Type-Options, Referrer-Policy i Permissions-Policy. No declara
  HSTS ni X-Frame-Options; la política de marcs és dins de CSP. Les projeccions
  de federació i el seu desplegament són una verificació separada.
- Node municipal: `flake.nix` i `tooling/instalador/flake.nix` són peces diferents.
  `tooling/instalador/inicia-node-germa.mjs` prepara fitxers locals. Les proves
  Node no substituïxen executar Nix ni acrediten infraestructura desplegada.

Cal configurar **domini HTTPS**, **origen del backend**, **clau pública del navegador**
i **municipi** abans de construir/servir la web. **Cap clau service_role o secret**
entra al frontend. No es fixen costos, RAM, proveïdors alternatius ni recursos
mínims **sense mesurar-los**. Qualsevol canvi de backend requerix adaptador,
conformitat, **cobertura declarada** i la decisió documentada del projecte.

## Vincles

- [[00_index]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
