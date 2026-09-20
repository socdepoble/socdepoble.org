---
type: petorreta
status: esborrany
description: Consulta al Consell (Claude/Codex) per rebre feedback sobre RLS, Realtime i el Pla d'Onades
tags:
  - arquitectura
  - seguretat
---

# Petorreta — Avaluació del Pla d'Onades i Dubtes CRÍTICS

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 22:20 |
| Modificació | 26-09-19 22:20 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[../10_actes/260919_1945_ACTA_MARMOTA_Fusion_Sidebar]]

## Entrades

- No hi ha cap bundle associat. Els agents convocats ja tenen context natiu en local o l'han processat en la sessió actual.

## Consell convocat

Claude · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. El codi és l'actual a la teua sessió local.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
4. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex en Cursor), tens **ESTRICTAMENT PROHIBIT** modificar, afegir, esborrar cap línia de codi, o "proposar canvis". El teu rol és única i exclusivament d'auditor i analista. Generaràs l'informe amb els defectes trobats i la solució explicada de forma teòrica. **CRÍTIC PER A CODEX I CURSOR:** Tens PROHIBIT generar blocs de codi adreçats a l'aplicació automàtica que disparen la interfície o la barra de "Confirmar Canvis" (Confirm Changes) a l'editor. L'humà no ha de prémer cap botó per aplicar el teu codi, ni volem que la barra de confirmació de canvis aparega MAI a la pantalla, ja que l'agent central (IAIA MarIA) s'encarregarà d'eixa faena. Tota la teua proposta s'ha d'exposar de forma purament explicativa; si has de mostrar codi, fes-ho sense incloure la ruta del fitxer dalt del bloc o utilitza text pla, per evitar que l'IDE intente aplicar-ho automàticament i destrosse el sistema. No ens demanes confirmar cap canvi.
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
6. Aquesta petorreta és exclusiva i s'adreça als agents locals per avaluar el pla d'implementació. <<<FI_DEL_BUNDLE>>>

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda" perquè ningú acabe renegant de nosaltres el dia que ho fem lliure. La IA que llig açò ha d'entendre que no valen pegats ràpids; calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat. (Sollutia és l'agència SaaS externa que ens proveeix exclusivament el backend, però el nostre cor és independent).

## Informe d'avanç

Acabem de rebre les dues auditories extremes (Codex amb un 4,5/10 i Claude amb un 4,3/10) que demostren que l'aïllament, la modularitat del contracte, l'escala i la persistència de dades fallen dràsticament sota la superfície. He resolt la pèrdua d'imatges C1 (sanitize.js) i l'absència d'error C2 (publicCredentials.js), i ara mateix he creat el següent **Pla de Convergència**:

```markdown
# Pla de Convergència — Refactor Arquitectònic Extrem (Onada 1 a 3)

Després de rebre els colpidors informes d'auditoria de **Codex (4,5/10)** i **Claude (4,3/10)**, queda clar que l'arquitectura actual de Sóc de Poble pateix de deute tècnic acumulat. El disseny teòric és bo, però la implementació falla en l'aïllament, la modularitat del contracte, l'ofec per sondeig ineficient i la persistència.

Aquest pla desglossa les solucions per onades per dur la resiliència del codi de `4,4` a un `7,5` sòlid i auditable, permetent que l'aplicació funcione realment per a 10.000 usuaris sense col·lapsar el backend o trencar les sessions actives.

## Proposed Changes

### Onada 1 — El Canvi Radical (Enxufabilitat)

Canviarem el contracte del backend. Actualment, el `CONTRACTE_NUCLI` té 32 mètodes i qualsevol component nou trenca TOTS els possibles backends enxufables (Sollutia, per exemple).

#### [MODIFY] contracte.js
- Buidar el `CONTRACTE_NUCLI` deixant-hi només les primitives genèriques (ex. `getCurrentUser`, `getBackendConfigurat`).
- Moure totes les altres funcionalitats a l'objecte `CAPACITATS` agrupades per domini (`mur`, `notes`, `xat`, `identitat`, etc.).

#### [MODIFY] Seccions i Contextos
- Modificar l'arrencada de cada secció perquè, abans de muntar-se, interrogue el port a través de `teCapacitat('nom_capacitat')`. 
- Si no té la capacitat, el component o secció mostra un estat degradat / «no disponible amb aquest proveïdor» en lloc de petar o bloquejar el projecte sencer.

#### [MODIFY] tractor-enxufe.mjs
- Afegir una nova llei (E5) que prohibisca inserir mètodes nous al `CONTRACTE_NUCLI` lliurement. Qualsevol nova acció ha d'estar darrere d'una capacitat declarada.

### Onada 2 — Que Aguante la Gent (10k Usuaris)

Els problemes d'escala detectats no són de latència sinó de disseny de peticions (excés de descàrregues i límits tancats no paginats).

#### [MODIFY] App.jsx
- Traure l'amuntegament global dels 6 proveïdors massius (`MurProvider`, `MultimediaProvider`, `NotesDataProvider`, etc.) de l'arrel de l'aplicació.
- Situar cada proveïdor dins del `Route` de la secció corresponent perquè s'inicialitze només si s'hi navega.
- Envoltar tots els imports `lazy()` de l'esquema de rutes amb la funció `ambReintent` perquè no es trenquen les sessions existents al mig d'un desplegament Vercel.

#### [MODIFY] content.js
- Netejar `loadMur` i `loadMultimedia` per a que **no** criden massivament `loadAppData`. Només demanaran els JSON del bucket o claus específiques que necessiten per renderitzar-se, eliminant les lectures redundants al 80%.

#### [MODIFY] XatContext.jsx
- Traslladar el sondeig de 25s fora del `XatProvider` cap a `XatSection`. Si la secció no està pintada en pantalla, no hi ha sondeig de fils.
- Afegir l'estrategia de "Decadència Exponencial amb Dispersió" (*Jitter*) als `setTimeout` per evitar pics de 10.000 trucades alineades després d'un tall de xarxa.

#### [MODIFY] Supabase Data Handlers (xat.js, notes.js)
- Reescriure els getters per suportar una autèntica Paginació per Cursor en comptes del silenciós `limit=50`. Afegir gestió de `hasMore` i un token o offset basat en `created_at`.

### Onada 3 — Integritat de les Dades (Desats i Aïllaments)

Garantir la durabilitat, l'aïllament i l'observabilitat. Quan falles offline al bancal, l'escriptura mai s'ha de perdre.

#### [MODIFY] GlobalSaveManager.js
- Substituir el desat efímer de 600ms cec per una **Cua d'Escriptura Persistent** utilitzant `IndexedDB` o un store més robust per sobre de `sessionStorage`.
- Afegir reintents i una llista d'estats clara (pendent, desant, fallat, confirmat) per exposar visualment al client a la UI.
- Purgar les memòries de `knownRevisions` per evitar fuites de memòria durant sessions llargues.

#### [MODIFY] NotesDataContext.jsx i XatContext.jsx
- Incorporar una validació de Seguretat de Context. En canviar de *tenant* (poble) o identificar-se l'usuari (generació), netejar **atòmicament** tots els esborranys, fils, i variables compartides prèvies. Tancar l'escletxa on Notes/Xats d'un context previ acaben fusionats en el nou.

#### [MODIFY] ErrorBoundary.jsx
- Instal·lar un mòdul de Telemetria Bàsic per reportar 500s de dades i pèrdues de render, atès que amb 10k usuaris no podem dependre que ens telefonen.
```

## Situació i dades opaques

Hi ha dos punts del pla d'implementació que em generen dubtes estructurals que només vosaltres em podeu resoldre, donat que jo sóc l'arquitecte però vosaltres coneixeu els racons de les vostres pròpies auditories. Aquesta és la clau de per què necessite el vostre feedback.

## Missió

1. Llegiu el Pla de Convergència (Onades 1 a 3) adjunt més amunt. Què n'opineu? Valideu si aquest pla cobreix els defectes estructurals que vau detectar a les vostres auditories o si m'estic deixant algun punt cec letal (com per exemple la fuita de memòria o algun cicle infinit al muntar els proveïdors).
2. Doneu-me una resposta raonada, clara i directa per a la primera incògnita (**RLS i Postgres**): Hem de modificar la porta `tractor-rls.mjs` per connectar-se al Supabase remot per comprovar que les regles RLS estan efectivament aplicades o deixem el control com una advertència purament local i teòrica en CI? Què és el que us dóna més confiança per aconseguir el "zero brossa"?
3. Responeu a la segona incògnita (**Realtime del Xat**): Actualment el WebSocket llença peticions cegues i no fa res útil, però si ho esborrem haurem de dependre del sondeig manual (que estem modificant a *Jitter*). Ens traiem l'escut Realtime i anem per via curta (sondeig) o l'habilitem directament?
4. Actueu com els assessors principals de la IAIA MarIA i el Mestre; critiqueu el pla amb duresa si veieu que hi ha camins ineficients (especialment sobre la idea de la "Paginació per Cursor" de l'Onada 2 vs el Realtime).

## Eixida esperada

Responeu-me directament al xat amb una avaluació concisa. Expliqueu-me el vostre criteri sobre el Pla i els dubtes concrets sense escriure codi, donat que jo m'encarregaré personalment d'implementar els canvis arquitectònics.

## Incògnites

- Quin rendiment exacte tindrem si utilitzem *Jitter* en lloc de WebSockets complets en un entorn tan poc asíncron com la muntanya?

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] He comprovat la sentinella abans de respondre?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
