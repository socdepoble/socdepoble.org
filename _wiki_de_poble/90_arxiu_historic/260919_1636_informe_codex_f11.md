# Informe Codex: Arquitectura de mitjans (F11)

**Recomane l’opció C: dos buckets separats per exposició, amb referències duradores als fitxers i una publicació explícita dels mitjans.** És l’opció A completada amb un model d’autorització i de cicle de vida. Mantindria `mitjans` per a contingut deliberadament públic i crearia `mitjans_privats` per als adjunts restringits. No triaria B com a arquitectura general del portal.

He revisat exclusivament l’arbre local, les migracions i el SDK instal·lat. No he modificat cap fitxer ni consultat serveis externs. **El dictamen acredita l’estat declarat pel codi; no certifica quines migracions estan aplicades ni quins objectes existixen en la base de dades desplegada.**

La decisió ha de partir dels següents fets verificats:

1. **F11 continua present en el recorregut de pujada.** Notes passa `carpeta: 'notes'`, però l’adaptador envia sempre a `mitjans` i retorna una URL pública. Els avatars utilitzen la mateixa operació. Evidències: `src/sections/notes/NotesEditor.jsx:12–16`, `src/data/supabase/storage.js:100–114` i `src/sections/profile/PerfilContext.jsx:201–205`.

2. **Hi ha dos controls que cal corregir: configuració del bucket i política de lectura.** La migració declara `public = true` i crea `mitjans llegir`, amb lectura per a `anon` i `authenticated` de tot el bucket. La posterior elimina `Lectura lliure mitjans`, un nom diferent, i reafirma `public = true`. Per tant, eixa correcció no elimina la política anterior. Evidències: `supabase/migrations/260913_0500_bucket_mitjans.sql:8–20` i `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:57–59`. **Canviar només `public = false` seria insuficient:** deixaria declarada una autorització de lectura massa ampla.

3. **La privacitat de Notes és més estricta que «usuari del mateix tenant».** Les notes exigixen ser propietari i membre del poble. Les escriptures de Storage només comproven el primer segment del camí contra `auth.uid()`, i la pujada no rep una identificació de nota ni incorpora el tenant al camí. Un futur bucket privat amb lectura per a tots els membres del poble continuaria vulnerant la privacitat personal. Evidències: `supabase/migrations/260914_0000_schema_notes.sql:53–86` i `supabase/migrations/260913_0500_bucket_mitjans.sql:22–36`.

4. **Les URLs formen part del document desat.** L’editor inserix la URL en el `src` de les imatges del cos, el gestor de capçalera desa el valor retornat per la pujada i l’adaptador persistix `heroImage` i `logoImage`. Substituir directament estes URLs per URLs firmades faria que el document guardara accessos amb caducitat. Evidències: `src/components/universal/richText/extensions/index.js:104–119`, `src/hooks/useHeroImageHandler.js:43–56` i `src/data/supabase/notes.js:47–58`.

5. **Publicar una nota no gestiona els permisos dels seus fitxers.** El flux copia el contingut i la imatge al mur, envia la publicació i després marca la nota com a publicada. A més, la política local de `section_submissions` exigix pertinença al poble: **«publicat al mur» no significa automàticament «accessible a tot Internet».** Evidències: `src/sections/notes/NotesContext.jsx:165–195` i `supabase/migrations/260908_0000_initial_schema.sql:763–768`.

Una precisió sobre el dilema inicial: `getPublicUrl` **continuaria construint una cadena** encara que el bucket fora privat; fallaria l’accés al recurs. El SDK local ho explica expressament. També oferix descàrrega autenticada, de manera que les URLs firmades no són l’única via de lectura privada. Evidències: `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts:1027–1029` i `StorageFileApi.ts:890–923`.

En l’**opció A — mantindre `mitjans` públic i afegir `mitjans_privats`**, el DAFO és:

| Dimensió | Valoració |
|---|---|
| **Fortaleses** | Separa dos necessitats reals: distribució pública i accés restringit. Els avatars públics conserven URLs estables i no depenen de generar una firma abans de mostrar-se. Permet polítiques, límits i tractament de memòria cau diferenciats. Reduïx l’abast d’una incidència del servei d’autorització sobre el portal públic. |
| **Debilitats** | Dos buckets exigixen govern coherent. Afegir el bucket no resol, per si mateix, l’autorització per nota, les referències duradores, la publicació ni els fitxers ja exposats. Si la destinació depén només d’una cadena enviada pel component, les futures funcionalitats poden tornar a equivocar-se. |
| **Oportunitats** | Construir un contracte de mitjans independent del proveïdor; incorporar exports portables; aplicar permisos segons el recurs propietari; reservar el bucket públic per a contingut aprovat. És una base clara per a nous tipus d’adjunts restringits. |
| **Amenaces** | Oblidar objectes antics en el bucket públic; copiar polítiques massa permissives al privat; persistir URLs firmades; publicar accidentalment totes les imatges d’una nota quan només se n’ha aprovat una versió. |

**Valoració:** A és una arquitectura vàlida i durable. Queda incompleta si s’implementa únicament com un canvi de bucket en la funció de pujada.

En l’**opció B — fer `mitjans` privat i servir-ho tot amb URLs firmades**, el DAFO és:

| Dimensió | Valoració |
|---|---|
| **Fortaleses** | Un únic magatzem privat establix un valor per defecte conservador. Pot centralitzar l’autorització i evitar còpies entre buckets. Facilita un model en què canviar l’audiència siga una decisió de permisos sobre el mateix objecte. |
| **Debilitats** | Introduïx generació i renovació d’URLs també per a contingut destinat a qualsevol visitant. Cal tractar caducitat, pestanyes obertes, errors de firma i reutilització de memòria cau. Les referències guardades i les integracions externes necessitarien una resolució estable. Fer-ho tot asíncron no resol per si mateix estes necessitats. |
| **Oportunitats** | És una bona base per a una aplicació essencialment privada, o per a una plataforma que necessite autoritzar cada accés mitjançant un servei propi. Pot simplificar canvis d’audiència si la distribució pública estable té poca importància. |
| **Amenaces** | Una fallada del servei de firma pot afectar també avatars i logos. Un emissor de firmes anònim amb permisos massa amplis reproduiria F11. Augmentar excessivament la duració de les firmes per evitar errors de càrrega reduiria el control temporal que es pretenia guanyar. |

B pot permetre visites anònimes: caldria autoritzar la firma exclusivament dels objectes classificats com a públics. **No caldria exigir sessió a tots els visitants**, però sí mantindre una distinció fiable entre audiències. El SDK local indica que crear una URL firmada requerix permís `select` sobre l’objecte; la firma no substituïx una política correcta. Evidència: `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts:685–720`.

**Valoració:** B pot ser segura, però trasllada complexitat al camí de lectura públic sense aportar, per a este projecte, una millora equivalent respecte d’A ben dissenyada.

L’**opció C que propose** conserva els dos buckets d’A i afegix tres peces: **catàleg de mitjans, autorització vinculada al recurs i transició explícita de publicació**. No requerix un tercer servei d’emmagatzematge.

| Dimensió | Valoració |
|---|---|
| **Fortaleses** | Combina distribució pública estable amb adjunts privats per defecte. Cada fitxer té identitat, propietari, context i estat verificables. Separa el document durador de les credencials temporals d’accés. Permet conservar l’esborrany privat mentre es distribuïx una versió pública concreta. |
| **Debilitats** | Requerix una refactorització més profunda del contracte de dades i de l’editor. La coordinació entre fitxers i files de base de dades necessita estats intermedis, reintents i neteja. Les còpies públiques poden augmentar l’espai ocupat. |
| **Oportunitats** | Exportar documents amb adjunts i manifest; canviar de proveïdor sense reescriure tot el contingut; gestionar permisos d’organitzacions; restaurar dades i fitxers de manera coherent; provar el model d’autorització com a part del contracte amb Sollutia. |
| **Amenaces** | Desajustos entre catàleg i Storage; còpies públiques òrfenes després d’una fallada; eliminacions prematures de fitxers compartits. També hi ha risc de sobredisseny si es construïx un gestor documental general abans de necessitar-lo. |

Per concretar C, fixaria els següents criteris arquitectònics:

1. **La classificació ha de seguir l’audiència.** Una nota personal és accessible al propietari autoritzat; una publicació del poble, als membres autoritzats; un avatar declarat públic, a qualsevol persona. Les dos primeres categories poden compartir bucket privat amb polítiques diferents. Només l’última justifica distribució pública.

2. **El document ha de guardar una referència estable al mitjà.** El catàleg hauria de relacionar l’identificador del fitxer amb tenant, recurs propietari, ubicació en Storage, versió i estat. La UI resol l’accés quan necessita mostrar-lo. Una URL firmada, amb la seua caducitat, és estat temporal de visualització i no ha d’acabar dins del contingut persistent.

3. **L’autorització ha de comprovar el recurs pare.** Per a un adjunt de Notes, cal validar que la persona pot accedir a eixa nota i pertany al tenant corresponent. Afegir `tenant_id` o `note_id` al camí ajuda a organitzar, però no és una autorització. Les metadades i associacions tampoc poden ser modificables lliurement pel client.

4. **La publicació ha de fixar una revisió i els seus adjunts.** Compartir amb el poble mantindria els fitxers restringits. Publicar a Internet generaria una versió pública separada dels mitjans seleccionats, després d’una autorització explícita. Una edició posterior de l’esborrany no hauria de canviar silenciosament la imatge ja publicada.

5. **El procés ha de tolerar fallades parcials.** No s’ha de pressuposar una única transacció atòmica que incloga còpies de fitxers i canvis SQL. Cal registrar la intenció autoritzada, executar operacions idempotents, confirmar el resultat i reconciliar els intents incomplets. L’usuari només ha de veure «publicat» quan el procés estiga complet.

6. **Cal definir retirada i eliminació.** Llevar una imatge de l’editor no equival a eliminar l’objecte: el gestor actual únicament buida el camp. La futura neteja ha de comprovar referències encara vigents i aplicar una retenció definida. Evidència: `src/hooks/useHeroImageHandler.js:65–69`.

Per als adjunts privats, faria servir URLs firmades de duració limitada, renovades sota autorització vigent i guardades només en memòria, amb separació per backend, usuari i tenant. **No assumiria que tancar sessió revoca una URL ja emesa.** El SDK la descriu com un accés compartible durant un temps determinat i inclou un token en la URL. Si algun flux exigira comprovar permisos en cada petició, valoraria descàrrega autenticada o un intermediari autoritzador. Evidència: `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts:631–637 i 729–732`.

Pel que fa a **Sollutia i la portabilitat**, la refactorització decisiva està en el contracte. Actualment la capacitat `mitjans` només enumera `uploadToStorage` i `getPublicUrl`; el port, a més, filtra els mètodes que accepta segons eixe contracte. Afegir una funció al mòdul Supabase no bastaria per exposar-la correctament a la resta de l’aplicació. Evidències: `src/data/contracte.js:47–62` i `src/data/backendPort.js:15–23`.

Propose que el contracte expresse operacions del producte: adjuntar a un recurs, resoldre l’accés, publicar una versió i retirar-la. Els noms dels buckets i els detalls del SDK quedarien dins de l’adaptador. Una implementació que no tinga capacitat de mitjans privats hauria de declarar-ho i desactivar eixe flux, sense presentar la pujada com a resolta.

Hi ha també una incògnita documental: l’ADR local de Sollutia descriu Supabase de SdP com a font de veritat i Sollutia com a amfitrió i integració de lectura; figura com a esborrany amb signatura pendent. No la prenc com a prova del desplegament real. La proposta C és compatible amb eixa separació, però cal acordar qui opera Storage, les migracions, les còpies de seguretat i la recuperació. Evidència: `_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md:10–41`.

Per a la filosofia portable del projecte, recomane exportacions amb documents, adjunts relatius i un manifest d’identificadors. Les URLs firmades no haurien de formar part del format d’arxiu. La durabilitat també requerix còpies de seguretat tant de les metadades com dels objectes, i una prova de restauració que comprove que continuen relacionats.

La migració hauria de tractar **els adjunts existents com a part de F11**, amb este ordre:

1. Inventariar objectes i referències en capçaleres, logos, HTML de notes, publicacions i perfils. La carpeta `notes` és una pista, no una classificació suficient.
2. Contindre noves pujades sensibles al bucket públic. Si l’inventari és incert o la migració s’allarga, prioritzar la privacitat fent privat el bucket antic i reconstruint la distribució pública des d’una llista validada.
3. Migrar els fitxers restringits, verificar integritat i substituir les referències per identificadors estables. Incloure les imatges inserides dins del cos.
4. Retirar les còpies públiques indegudes mitjançant Storage i revisar derivats i memòria cau. Copiar al bucket privat sense retirar l’original públic deixa la fuga oberta.
5. Mantindre un registre recuperable de la migració; un rollback no ha de tornar a exposar fitxers privats.

La retirada pot impedir accessos futurs sota el vostre control; **no pot recuperar còpies que una altra persona ja haja descarregat**.

Donaria F11 per tancat quan les proves sobre el backend desplegat demostren:

- Denegació de lectura, llistat i firma a anònims, altres usuaris del mateix poble i usuaris d’un altre tenant per als adjunts personals.
- Accés del propietari només amb els permisos vigents, inclosa la pèrdua de pertinença al poble.
- Avatars públics accessibles sense sessió i mitjans del mur amb l’audiència que realment els correspon.
- Reobertura de notes després de caducar una firma, sense URLs temporals persistides.
- Publicació coherent davant reintents, errors parcials i edicions concurrents.
- Inaccessibilitat dels antics objectes públics classificats com a privats, amb el tractament de memòria cau documentat.

**La decisió que traslladaria a IAIA MarIA és C, construïda sobre A.** La inversió principal ha d’anar a la identitat dels mitjans, l’autorització i la publicació coherent. Fer firmar també tots els avatars públics no resol eixos problemes estructurals.
