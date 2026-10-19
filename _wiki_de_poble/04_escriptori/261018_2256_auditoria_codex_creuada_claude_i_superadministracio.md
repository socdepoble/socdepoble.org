---
type: informe
status: esborrany
description: Contrast adversarial de F1–F12 amb codi i migracions, i proposta de rols i permisos per al panell del Perfil.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3a8edb7f-14e0-4192-a6cf-4486815d21fc:f19024d2-53e8-4ca8-810e-c5768ccc6520
---
# Auditoria creuada de Claude i arquitectura de Superadministració

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3a8edb7f-14e0-4192-a6cf-4486815d21fc:f19024d2-53e8-4ca8-810e-c5768ccc6520 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T20:56:28.008Z |
| Modificació | 2026-10-18T23:07:23+02:00 |
| Propietari | Codex |
| Aprovació humana | Encàrrec directe d’auditoria creuada i consulta d’arquitectura; no implementació |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (GPT-6) i tres subagents de contrast |
| Tokens consumits | No mesurables amb precisió en esta sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 18-10-2026, 22:55–23:00 CEST: encàrrec directe del Mestre per a contrastar F1–F12 i preparar l’arquitectura del panell per al 19-10-2026. Torn `torn_3a8edb7f-14e0-4192-a6cf-4486815d21fc`, abast documental.
- Llegit íntegrament l’informe Claude 2045; el prompt i pla 2000 i les auditories 2030 ja s’havien llegit en el torn anterior. Pla 2000 vinculat de nou, hash `3fd431fac6d09024769dcc00898b656dfc97638e18d8a0b431d5610bf933b61f`. Llegida també íntegrament l’Acta Marmota 2105 i contrastada amb l’ESTAT actual.
- Tres franges de lectura independents: F1/F2/F4 i SQL de perfils; F3/F5/F9 i artefacte WordPress; F6–F12, identitats i pertinences. La integració comprova les fronteres del servidor i l’arquitectura de permisos.
- Referència Git `1e6ffecee3e10c73ec4822d91344398d1d3fa3e7`, **arbre amb canvis sense commit**. Hi ha treball posterior al tall de Claude: no se li atribuïxen automàticament els canvis actuals ni es considera erroni un diagnòstic que descrivia fidelment el tall anterior.
- S’ha deixat un relleu provisional en este mateix document durant la lectura. Revisió independent final llegida íntegrament: incorporada invalidació del context elevat anterior en tornar a Veí i prova de reintent amb context caducat. Cap canvi en producte, migracions, publicacions, Storage o documents aliens.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Dictamen executiu

**L’informe de Claude identifica problemes reals i el fre UI de F3 és útil. No acredita encara integritat relacional ni preparació del conjunt per a producció.** Cal corregir dos remeis que podrien donar una falsa sensació de resolució: ajornar el DEFAULT públic no arregla totes les promeses de privacitat vigents; declarar l’UUID de Javi no fa, tot sol, que `/javillinares` consulte la seua fila remota.

La inspecció del **ZIP estable local v1.1.6** confirma que encara conté l’esborrat anterior, sense `integritatMitjans`. No s’ha comprovat quin paquet està servint el lloc remot. La signatura vàlida no prova que incloga els últims canvis revisats.

Per al panell, recomane **un compte personal, tres modes d’actuació i permisos efectius imposats pel servidor**. Reutilitzar Perfil, Tauler, segon factor i taules existents. La tria visual de rol no ha de canviar `auth.uid()`, concedir privilegis ni simular una prova de permisos real.

Sóc de Poble continua el treball rural del Rentonar. Es manté el Model B: Supabase, font de veritat darrere del port neutral; Sollutia i WordPress, amfitrions. No es proposa cap backend en l’enxufe ni accés d’escriptura a Sollutia.

### 2. Veredicte de F1 a F12

Prioritat **P1**: corregir abans d’habilitar o distribuir la funcionalitat afectada. **P2**: defecte real o contracte incomplet que cal resoldre en la següent implementació. **P3**: disseny, cobertura o coordinació. Les decisions humanes de la taula són pendents per a la funcionalitat, no obstacles per a entregar esta auditoria.

| Claude | Veredicte al tall actual | Prioritat, proposta conservadora i decisió humana |
|---|---|---|
| **F1** Públic per defecte i textos | **Confirmada i ampliada.** Públic és llegible per qualsevol compte autenticat, sense compartir poble. Privat encara exposa identitat mínima a membres d’un poble compartit. Hi ha també divergència `NULL`: UI pública, RPC privada. | **P1.** Definir audiència i camps abans d’activar el DEFAULT; corregir ja les promeses falses de les publicacions actuals. No basta retocar el text legal. `requires_human_decision: true` per a la política de publicació. Detall §3. |
| **F2** `visibility='public'` | **Confirmada; correcció adequada.** `profiles.visibility` continua restringit a `private`; `is_public` governa la fitxa pública. Fallaria una escriptura amb el literal incompatible, no totes les altes actuals. | **P2 resolta en eixe canvi local.** Mantindre els dos conceptes separats i provar la migració real. No cal una decisió nova per a usar `is_public`. `requires_human_decision: false`. SQL inicial:65,70,799–804. |
| **F3** Esborrat | **Mitigació UI confirmada, garantia backend pendent.** No s’activa amb una simple bandera injectada al port real. Però el mètode destructiu continua accessible i declarar la capacitat en el futur reobriria l’acció sense consulta. | **P1.** Integrar consulta, operació protegida i tancament de vies directes com una unitat. Mantindre la capacitat absent mentrestant. `requires_human_decision: false`: el mandat ja és explícit. Detall §4. |
| **F4** Convergència pilot | **Diagnòstic confirmat; remeis parcials/refutats.** L’alineació SQL puntual no lleva la hidratació de cada lectura. El registre d’UUID no resol l’àlies públic. | **P2.** Fer autoritativa la fila real i resoldre explícitament slug→UUID; reservar la llavor al context adequat. `requires_human_decision: true` només per a la política de la representació fundacional estàtica. Detall §5. |
| **F5** v1.1.6 a mig fer | **Confirmada amb evidència de bytes**, més forta que la cronologia: el ZIP estable local no porta el fre F3. | **P1 per a distribució.** Preparar una versió nova traçable i verificada; no substituir silenciosament una versió ja distribuïda. Publicació fora d’este torn. `requires_human_decision: true` per a publicar. Detall §6. |
| **F6** Fallback d’avatar | **Parcialment superada.** `personaDeSessio.js:114` ja exclou `hero_url`. Persistix el fallback a `identities.google` quan la fila té avatar buit. La procedència del canvi no altera el defecte. | **P2.** Distingir «no triat» de «retirat expressament»; una retirada ha de produir inicials si eixe és el contracte. Afegir cas amb `identities` reals. `requires_human_decision: false` per a complir la semàntica ja descrita. Detall §5. |
| **F7** Multi-poble en text | **Confirmada amb dos rectificacions.** `town_memberships` ja existix. No s’ha trobat límit SQL de 120 caràcters en `profiles.town_name`; el CHECK de 120 és d’`organizations`. | **P2.** Separar etiqueta, preferència de poble i pertinença autoritzada; no deduir permisos de `town_name`. `requires_human_decision: true` per a les regles d’alta/pertinença, no per a reconéixer l’esquema existent. Detall §7. |
| **F8** Biblioteca en llavor | **Certa per al llistat Storage; parcialment superada en la UI actual.** `storage.js:543–544` continua retornant `[]` en llavor, però `DetallMultimedia` incorpora ara `mediaItems` amb titularitat explícita. | **P3.** Provar local amb fixtures útils i remot amb actors separats. No confondre biblioteca de mostra amb Storage real. `requires_human_decision: false`. |
| **F9** Llistat públic del bucket | **Confirmada en les migracions; remot desconegut.** SELECT general permetria enumerar objectes. Servir URL pública i autoritzar llistat són permisos diferents. | **P2 de privacitat**, no només cosmètic. Restringir llistat als actors autoritzats i preservar la distribució pública prevista. Independent del fre d’esborrat. `requires_human_decision: false` per a evitar enumeració no necessària; política de publicació al §3. |
| **F10** Botons blaus | **Confirmada com a defecte de cascada.** `PerfilShell.css:238–255` es carrega després del component (`css/index.css:63–66`) i trepitja variants secundària, fantasma i perill, amb excepcions més específiques. La prova fixa selectors, no semàntica. | **P3.** Preservar les variants de Pedra Seca i distingir acció destructiva per text/iconografia, no sols color. `requires_human_decision: true` per al canvi visual, sense bloquejar el backend. |
| **F11** Accions fora del 1605 | **Límit del torn i desajust de documentació.** El prompt actual enumera accions/tasques addicionals (:82–84,94–96), però l’historial encara parla de cinc (:40–41). La navegació global continua desactivada (`UniversalCard.jsx:642,676`). | **P3.** Registrar les tres accions com a pendents de verificació/execució amb responsable. Hi ha altres canvis posteriors, però no acrediten estes tres accions ni una autorització retroactiva al xat de Claude. `requires_human_decision: false` per a documentar abast. |
| **F12** Auditoria Gemini 1718 antiga | **Confirmada la deriva temporal.** Un informe nou és el tall més recent per a eixos fitxers, no esborra evidència anterior ni substituïx una validació actual del conjunt. | **P3.** Conservar els informes amb data, font i estat per troballa. `requires_human_decision: false`. |

### 3. F1: públic, privat i desconegut han de significar el mateix al client i al servidor

#### 3.1 Qui veu què, segons les migracions locals

La RPC `perfil_public` de `2610021520_perfil_public.sql:62–90` aplica esta taula, sempre que la fila existisca i no estiga en baixa:

| Lectura de la persona | `is_public=true` | `is_public=false` o `NULL` |
|---|---|---|
| Titular autenticat | Camps de la fitxa | Camps de la fitxa |
| Altre compte autenticat, comparteix poble | Camps de la fitxa | `id`, nom, avatar i poble |
| Altre compte autenticat, sense poble compartit | Camps de la fitxa | Cap fila |
| Anònim | RPC no autoritzada | RPC no autoritzada |

«Camps de la fitxa» inclou capçalera, bio, lema, presentació HTML, copyright, icona i dates; **no** inclou correu, rol ni metadades d’Auth. La funció no exigix compartir poble per a llegir una fitxa pública ni comprova allí el registre de consentiment. Les identitats fundacionals del paquet tenen, a banda, representacions estàtiques accessibles per fallback: no són la mateixa font ni la mateixa garantia.

Per això són imprecises tant «només al teu poble» per a la fitxa publicada com «ningú més veu» per a la privada. Evidència textual: `OnboardingSection.jsx:432,445`, `OnboardingSteps.jsx:177`, `legalContent.js:118`, `visibilitatFitxa.js:39,45`. No cal esperar la nova migració per a corregir la descripció d’un comportament que ja existix en l’RPC.

#### 3.2 Què canvia realment el DEFAULT

`2610181800_perfil_public_per_defecte.sql:52` canvia el default a `true`, sense backfill ni `NOT NULL`. El trigger d’alta i `completa_la_meua_alta` ometen `is_public` i hereten el default (`2609261500_identitat_perfil_f1.sql:807,870`). La fila es crea abans del bloc de consentiment de `:830`; la publicació no queda condicionada a eixe bloc. Amb OAuth això mereix una prova específica d’alta, encara que l’accés inicial siga amb Google.

**No hem trobat auto-PATCH de publicació d’una fila `false` provocat només pel nou frontend.** `updateProfile` envia els camps rebuts; no afig `is_public=true` a cada canvi de nom/avatar. La reserva no editable tampoc prova publicació remota. És important no convertir una discrepància visual en una filtració que no s’ha demostrat.

En canvi, `perfilCamps.js:117` interpreta `NULL/absent` com públic i l’RPC com privat. Per a Javi, `getProfile` passa la fila real per `hidrataPerfilPersonaPilot` (`auth.js:181,194`), que transforma `NULL` en `true` (`identitatsSeed.js:392`). `PerfilEditor.jsx:477–482` pot considerar «ja desat» eixe valor hidratat i ometre el PATCH de publicar. Recomanació: estat explícit `publicat / privat / desconegut`, valor cru separat de la presentació, i cap «publicat» inferit d’una columna absent. Una migració que faça `NOT NULL` necessitaria decidir i tractar els nuls existents, no assignar-los públic a cegues.

#### 3.3 Política proposada per a decidir demà

Recomane alta amb **fitxa extensa privada** i acció explícita «Publicar la meua fitxa», amb previsualització dels camps i de l’audiència. La identitat mínima comunitària, si es manté, necessita una explicació pròpia i coherent. El nom «públic» s’ha de precisar: hui l’RPC significa tots els comptes autenticats, no Internet ni exclusivament el poble. No ampliar l’EXECUTE anònim sense decidir-ho.

Açò és una recomanació de canvi respecte a l’ordre de públic per defecte, no una modificació executada ni una aprovació atribuïda al Mestre. La motivació no és sols de copy: l’article 25.2 del RGPD tracta accessibilitat i intervenció individual; la Comissió posa les configuracions de perfil de xarxes socials com a exemple de protecció per defecte. Cal revisar finalitat, base jurídica i públic destinatari amb qui assumix la responsabilitat de protecció de dades. Esta auditoria identifica el risc i la conducta tècnica; no emet una certificació jurídica. [RGPD, art. 25](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), [Comissió Europea: principis i privacitat per defecte](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en).

Canviar després el DEFAULT a `false` no retira les fitxes creades mentrestant amb `true`. El desplegament i la reversió necessiten cens de les files afectades i preservar les decisions expresses dels titulars.

### 4. F3 i F9: el fre actual i la frontera que falta

#### 4.1 Què està comprovat

En el fitxer actual, `DetallMultimedia.jsx:568` consulta la capacitat; `:739` la requerix també dins de la confirmació; `:881` tanca duplicats. La sonda del **port real** confirma que una capacitat desconeguda o un mètode extra no es colen per una bandera: `backendPort.js:21–39,57–58` valida i descarta allò que el contracte no coneix. No hem reproduït eixa evasió.

Tanmateix, una crida directa a `backendPort.esborraElMeuMitja` es delega encara que `integritatMitjans` siga falsa (`backendPort.js:61–65,144`). L’adaptador comprova propietari/ruta i després crida `storage.remove` (`storage.js:569–578`). Les polítiques SQL comproven ruta pròpia, però no usos ni la carpeta exclusiva `avatars` que restringix el client (`2609200300_blindatge_storage_i_contingut.sql:39–70`). Un client antic o una crida autenticada directa pot continuar eliminant **objectes propis referenciats**. No es demostra capacitat d’eliminar objectes aliens.

**Risc latent demostrable:** declarar la capacitat sense canviar el consumidor reobriria l’eliminació directa de `DetallMultimedia.jsx:746–748`. La prova actual activa `integritatMitjans` (`DetallMultimedia.test.jsx:127–133`) amb un mock que ni tan sols conté `comprovaUsImatge` (`:28–33`) i verifica la destrucció de duplicats (`:298–324`). Prova la bandera i el comportament actual; no la integritat que el comentari li atribuïx.

#### 4.2 Condició d’habilitació

El contracte complet continua en [[261018_2030_auditoria_codex]]. Cal entregar conjuntament:

1. Consulta autoritativa amb usos visibles, existència d’usos no visibles sense detalls, cobertura completa i revisió. Una fallada o cobertura incompleta conserva el fitxer.
2. Diàleg que mostre la conseqüència i permeta resoldre referències autoritzades. No retornar títols privats simplement per explicar el bloqueig.
3. Operació de servidor que revalide autorització i usos amb bloqueig de la identitat del mitjà; registre `pending_delete` i treball de purga idempotent. Una consulta prèvia sola té una carrera amb una publicació nova.
4. Restriccions de DELETE directe, sobreescriptura, substitució i vies alternatives; incloure baixes de compte i la cua de purga ja existent. Les referències actives no poden apuntar a un objecte en purga.
5. Proves en PostgreSQL/Storage de referència concurrent, usuari sense permís, actor entitat, ús ocult per RLS, fallada, reintent i client antic.

`integritatMitjans` només s’anuncia quan tots els consumidors i el servidor complixen el contracte. La UI no ha d’invocar després un esborrat cru que ignore la revisió de la comprovació. Mantindre noms i arguments versionats en el port i kit de conformitat; no donar per implementat el contracte perquè existisca el nom.

#### 4.3 Enumeració pública

`2609130500_bucket_mitjans.sql:16–18` dona SELECT general a `anon/authenticated`; el blindatge posterior el conserva. Si està desplegat així, es poden enumerar paths, UUID inclosos a les rutes i metadades del bucket públic. `storage.js:398–400` reconeix que el filtratge de prefix propi és de client.

Proposta: llistat limitat a titular/actor autoritzat, mantenint GET de les derivades que s’hagen publicat. Un bucket públic servix objectes sense que calga obrir tot el llistat; les polítiques de les altres operacions continuen sent rellevants. La correcció de F9 és independent de la protecció relacional de F3. Verificar les funcions disponibles en la versió de Storage abans d’usar ajudants de filtratge per operació. [Supabase: buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [control d’accés](https://supabase.com/docs/guides/storage/security/access-control).

### 5. F4 i F6: autoritat de la fila, àlies i retirada d’avatar

La cadena de la ruta canònica és `src/app/App.jsx:1045–1046` → `PerfilPublicSection.jsx:181` → `supabase/perfils.js:105,136`. Es passa el slug `javillinares`; la consulta de persona només usa `perfil_public` quan la clau és UUID. `IDS_REMOTS_FUNDACIONALS` reconeix identitats/fallback, però **no traduïx l’àlies en eixa cadena**. Per tant, cal retirar del relleu la instrucció «posa l’UUID i la ruta ja serà remota» com a solució suficient.

Recomanació conservadora: resolució explícita de l’àlies al node canònic, amb tipus i àmbit quan pertoque; una vegada associat a una fila real, el lector no ha de reomplir buits expressament desats ni substituir la foto triada. Les llavors continuen servint el mode de prova i les representacions editorials declarades. El fallback fundacional de `PerfilPublicSection.jsx:221–222` no és una filtració de la fila remota, però la privacitat de la fila no retira eixa còpia estàtica del paquet.

Els snippets són útils com a operacions puntuals, amb límits:

- `2610181800_alinea_perfil_javi_llinares.sql:70–103` valida un compte acreditat i ompli buits; no toca `is_public`. Repetir-lo després de buidar bio/lema desfà la nova tria. SQL substituïx Google/buit; JS substituïx qualsevol foto no pròpia: encara divergeixen per a URL externes no Google.
- `2610181800_publica_perfil_javi_llinares.sql:53–61` és idempotent si l’estat no canvia, però tornar-lo a executar després de privatitzar torna a publicar. No és una autorització permanent.
- Un resultat SQL sense error pot afectar zero files. Cal comprovar fila existent, baixa, valors abans/després i recompte; no interpretar «Success» com a convergència certificada.

Per a F6, la capçalera ja no passa a avatar, però `personaDeSessio.js:75–81,148` encara pot recuperar la foto de Google des d’`identities`. `identitat.js:401–431` lleva foto/avatar de metadades però conserva `identities` mitjançant `...usuari`. La sonda amb `avatar_url:null` i `identities.google.identity_data.picture` torna la foto de Google. El test de retirada actual no inclou eixa identitat; un altre test valida el fallback. Cal un estat autoritatiu de retirada explícita i una sola regla de resolució en sessió, perfil i barra, sense recuperar-la d’una altra font.

### 6. F5: el paquet signat encara no incorpora F3

Artefacte local que referencia `wordpress-plugin/builds/stable.json:63–66`:

- `wordpress-plugin/builds/261018_1939_wordpress_enxufe_v1.1.6.zip`.
- **135.676.631 bytes**; SHA-256 `83ef3612cc48021ca66b6457c03f462bf7996bfc3c520947675192951045e1a5`.
- Manifest generat `2026-10-18T17:39:58.386Z`; signatura Ed25519 verificada amb la clau pública del plugin.

El subagent ha aplicat la skill `reverse-engineer-anything` a l’artefacte local i ha seguit la crida entre chunks, sense executar l’app. REA: manifest `agm_80a05e437a7604cae012b1b9e965d83dde997ff8ab5c733895f661f00c748912`, evidència `ev_5431fab5cc2c19857250315a15819987fa2c63a1389978f4fa5fab74653f6421`.

En `socdepoble-enxufe/dist/trossos/PerfilShell-D9Uda5vU.js:1`, «Eliminar duplicats» es condiciona amb `disabled:!f||ge`; la confirmació acaba en `await Ur(Y.ref,i)`. `Ur` importa `g3` de `soc-de-poble-0ro2hlS5.js`, vinculat a `je("esborraElMeuMitja")`; `index-BoZZzYE7.js:1` acaba en `.storage.from(Ms).remove([s])`. Cap dels 293 JS del ZIP conté `integritatMitjans`. L’evidència és la cadena executable i les seues guardes, no sols l’absència de la cadena de text.

No presentar este ZIP com la versió que porta el fre F3. La següent release necessita font identificada, proves, build net, comparació de contingut i manifest amb hash del ZIP final; si 1.1.6 ja s’ha distribuït, una versió nova evita dos artefactes diferents amb la mateixa identitat. No s’ha consultat ni modificat la distribució remota.

### 7. Panell dins d’«El meu compte»: proposta d’arquitectura

#### 7.1 Reutilitzar el que ja existix

| Peça actual | Evidència | Ús en la proposta |
|---|---|---|
| Entrada al Tauler i segon factor dins d’El compte | `PerfilContext.jsx:203–205`; `DetallAjust.jsx:462–471` | Punt d’entrada del panell; conservar navegació i components de Perfil. |
| `/admin`, Tauler i facetes | `AdminSection.jsx:26–27,98–179`; `RequireAuth.jsx:34–64` | Reutilitzar les facetes en el context administratiu; conservar ruta directa protegida, sense duplicar lògica. |
| Rol de plataforma | `user_platform_roles`, SQL inicial:115–120,846–852; `auth.js:134–140` | Concessions persistents de plataforma. Cap llista d’emails al frontend. |
| Segon factor | `2610061448_superadmin_aal2.sql:2–10`; `SessionContext.jsx:163–174` | L’autoritat superadmin actual requerix rol en BD i `aal2`; la UI pot guiar la verificació. |
| Identitat que publica | `IdentitatContext.jsx:153–208`; `CalaixIdentitats.jsx:19–55` | Reutilitzar «Amb qui actues?» i l’actor persona/entitat; no confondre’l amb el mode de permisos. |
| Pertinença a poble | `town_memberships`, SQL inicial:23–32,752–754 | Ja hi ha PK `(town_id,user_id)`. `role` és text sense CHECK en l’esquema inspeccionat; `is_town_member` comprova pertinença, no editor. Cal completar rols i polítiques. |
| Administració d’entitat | `organization_memberships`; autoria `author_org_id` | `owner/admin/member` d’una entitat no són rols de plataforma ni autoritat municipal automàtica. |

El valor `moderador` de plataforma no s’ha de reciclar com a «editor de poble»: té un altre abast. Tampoc el camp de text `town_name` acredita pertinença. «Fer principal» canvia el perfil i l’etiqueta d’autoria; `supabase/content.js:99–124` continua escrivint amb el `tenantId` de configuració. Cal un canvi de context real si es vol publicar en un altre poble, amb autorització corresponent.

#### 7.2 Experiència recomanada

Dins d’**El meu compte → Administració i mode d’actuació**, presentar un commutador de selecció única:

| Opció visible | Controls que apareixen | Context persistent a la pantalla |
|---|---|---|
| **Veí** | Ús habitual i comprovació amb permisos de veí | «Actues com Javi · Veí · La Torre de les Maçanes». |
| **Administració del poble** | Poble autoritzat; funció efectiva «Editor» o «Administrador»; emissor de l’avís | «Actues com Gent de la Torre · Editor · La Torre de les Maçanes». |
| **Superadministració** | Verificació del segon factor; funcions globals; selecció explícita de poble quan l’acció en requerix un | «Javi · Superadministració · Plataforma» o el poble destinatari concret. |

Editor i administrador de poble compartixen la segona opció visual, però tenen permisos diferents. No es concedix el rol més alt per canviar el selector. Els pobles es carreguen de concessions reals, no de la cadena `A · B`. Si no hi ha concessió, eixe mode no es pot activar.

Un sol context d’actuació alimenta tant el panell com «Amb qui actues?». Qualsevol canvi que combine emissor i poble ha de ser atòmic: no deixar seleccionat un emissor de La Torre mentre el destí ja és un altre poble. Abans d’enviar un avís, el resum mostra **qui firma, on es publica i amb quin abast**. Mantindre una eixida clara «Tornar a mode Veí», selecció accessible amb teclat i focus estable. La informació de rol es mostra amb text, no només amb color.

El mode inicial recomanat és Veí, també per a Javi, Damián i Torsten. L’entrada elevada és deliberada i temporal; un error de verificació no ha de pintar una concessió que no s’ha pogut comprovar. El component `RequireAuth` és una barrera visual; el seu comentari que atribuïx la RLS a Sollutia (`:28`) és obsolet segons el Model B: la garantia ací és de Supabase.

#### 7.3 Quatre conceptes separats

- **Persona autenticada:** `auth.uid()`, immutable durant la sessió. Sempre permet saber qui ha fet l’acció.
- **Actor que firma:** persona o organització/publisher canònic. No canvia les credencials de qui opera.
- **Àmbit:** node/backend i, dins d’ell, plataforma o `town_id` concret. Una etiqueta de poble no és un id ni un permís; un context d’un node no val en un altre.
- **Mode i capacitats efectives:** allò que esta operació pot fer dins de les concessions vigents.

Esquema de contracte orientatiu, **nou i no implementat**:

```js
ContextActuacio = {
  contextId,                 // opac, emés pel servidor
  backendScope,              // emissor/node de confiança, vinculat al context
  channelId, generation,     // canal de pestanya i generació activa al servidor
  subjectUserId,             // derivat de la sessió, mai confiat al client
  mode: 'vei' | 'poble' | 'plataforma',
  townId: null | uuid,
  actor: { type: 'persona' | 'entitat', id },
  capabilities: [],          // projecció informativa; el servidor revalida
  grantsVersion,
  expiresAt,
}
```

Permís efectiu = **concessió vigent ∩ restricció del mode ∩ àmbit del recurs ∩ força requerida de sessió**. Una capacitat tècnica del backend (`admin`, `integritatMitjans`) indica que sap fer l’operació; no concedix permís a la persona.

#### 7.4 Com provar de veres com a veí

Canviar `SessionContext.esSuperadmin` a `false` o amagar botons no lleva a la sessió els permisos de `private.es_superadmin()`. Amb el mateix UUID i `aal2`, les RPC actuals continuen reconeixent el privilegi. Per això una primera implementació només visual s’ha de dir **«Previsualització de veí»** i no certificar amb ella l’aïllament.

Per a complir el mandat de **comprovació real d’usuari ras**, completar el context al servidor:

1. El backend emet un context opac vinculat a node, UUID, sessió autenticada, canal de pestanya, generació, mode, actor, poble, versió de concessions i caducitat. La tria que arriba del navegador és una petició, no una autorització; tampoc es confia en un `channelId` arbitrari per acreditar una elevació.
2. Totes les RPC i polítiques que hui concedixen privilegi per rol global han de considerar el mode efectiu. Sense context vàlid, les operacions elevades es deneguen. No pot quedar una RPC antiga ni accés directe amb el privilegi global de sempre.
3. El context Veí no aplica excepcions de superadmin ni permisos d’editor/administrador. Per a provar un veí sense cap vinculació excepcional a una entitat, usar també un compte de prova real amb eixes concessions mínimes en staging; el compte de Javi pot conservar propietats legítimes que un veí nou no té.
4. Revocació i concessió es comproven contra dades de confiança. Un camp de `user_metadata`, una capçalera client o un rol guardat al navegador mai concedixen drets. El context és revocable i no ha de confiar només en un JWT antic.
5. Canviar de context invalida lectures sensibles, respostes en vol i claus de caché, separades per node/poble/subjecte/actor/context. Les cues conserven l’autoria i l’àmbit originals, però això no les autoritza a continuar amb permisos antics. Els desaments elevats pendents es completen abans del canvi o es pausen/rebutgen fins a nova elevació explícita; mai es reenvien sota el nou context.
6. El servidor manté una generació activa per canal de pestanya. Tornar a Veí invalida atòmicament el context elevat anterior d’eixe canal; cada mutació comprova la generació dins de la seua transacció, coordinada amb el canvi de context. Una operació ja confirmada abans del canvi no es desfà retroactivament, però una crida posterior amb el context antic es denega. Una altra pestanya explícitament elevada té context separat; la UI ha de fer visible esta distinció. Caducitat, logout i revocació netegen context i dades sensibles. Tornar a Veí no retira permanentment el càrrec ni obliga a reatorgar-lo.

La documentació de Supabase advertix que `user_metadata` és editable per l’usuari i que els canvis de claims no apareixen en un JWT fins a renovar-lo. Açò reforça l’ús de concessions autoritatives i la revocació en servidor; el disseny de context anterior és una proposta pròpia adaptada al repositori. [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

#### 7.5 Matriu mínima de permisos proposada

| Acció | Veí | Editor de poble | Administrador de poble | Superadministrador en mode plataforma |
|---|---|---|---|---|
| Perfil i notes personals | Pròpies | Pròpies | Pròpies | Pròpies; cap lectura indiscriminada de privats |
| Publicació personal | Segons pertinença i regles | Igual, quan actua com a persona | Igual | Igual; elevar no substituïx l’autoria |
| Avís de l’emissor oficial/comunitari | No | Crear/editar/publicar dins de l’emissor i poble concedits | Igual, més gestió local autoritzada | Només amb acció i destinació explícites, registrada |
| Nomenar editors locals | No | No | Dins del poble i límits aprovats | Sí, amb auditoria |
| Atorgar superadmin | No | No | No | Procediment especial, verificat i auditat |
| Usuaris globals, configuració de plataforma | No | No | No | Només capacitats necessàries, MFA i registre |
| Purga de mitjans referenciats | No | No | No | Tampoc ignora integritat; cal resoldre usos pel protocol |

La divisió de publicar directament o sotmetre un avís a aprovació és una decisió editorial pendent. La taula proposa publicació directa per als editors designats; si es preferix revisió, separar `notices.create` de `notices.publish` sense donar-los superadmin.

#### 7.6 Emissor d’avisos i dades persistents

«Gent de la Torre» és un nom visible; no acredita automàticament representació de l’Ajuntament. Registrar un **emissor canònic verificat** i el seu tipus (comunitari o institucional) amb vinculació al poble. Reutilitzar `organizations`/`author_org_id` quan l’emissor siga una entitat real. Si l’emissor és el poble com a tal, definir una vinculació explícita sense crear una persona fictícia ni duplicar entitats.

Completar `town_memberships.role` amb valors aprovats i restricció després de censar els existents; conservar la PK actual. No donar `editor` perquè una persona escriga el nom d’un poble al perfil. Definir RPC d’assignació/revocació amb actor autoritzat, poble, registre i cap autoescalada. L’usuari final no ha de tindre UPDATE directe de la taula de concessions.

Per als avisos, persistir id canònic, poble, emissor, creador, darrer editor, estat i versió. Les FK han de lligar emissor i poble; el servidor valida la concessió en publicar. `official:true` dins d’un JSON no pot ser una prova d’autoritat. Mantindre `created_by` immutable i auditoria de revisions. Les polítiques actuals centrades en `owner_user_id` no equivalen a edició compartida d’un canal d’avisos; l’RPC nova haurà de definir eixe dret sense obrir totes les publicacions del poble.

La font segueix sent única: reutilitzar `section_submissions` si suporta el cicle i l’autoria requerits; si cal estructura nova, migrar amb ids/àlies preservats. No crear alhora una còpia autoritativa a `app_content` i una altra al nou tauler. Qualsevol avís anunciat al xat ha de mantindre la relació amb el node original i validar també els permisos del canal.

#### 7.7 Javi, Damián i Torsten

Els tres són els destinataris de superadministració indicats pel Mestre, **no rols verificats en remot en este torn**. Vincular les concessions als seus UUID autenticats en `user_platform_roles`; no al nom, slug, correu, compte pilot ni contingut editable del perfil. El pilot és expressament `usuari` (`sessionService.js:144–157`); no concedir cap rol des de la hidratació de `PERSONA_PILOT`.

Conservar l’exigència actual de `aal2` i afegir reautenticació recent per a canvis de rols, exportacions o accions destructives sensibles. Mostrar el segon factor dins del compte, reutilitzant `SegonFactor`. Preveure recuperació administrativa fora de la sessió perduda, registre de concessions/revocacions i impedir deixar la plataforma sense cap administrador recuperable. La recuperació no ha de consistir en desactivar MFA globalment. [Supabase: MFA i autorització](https://supabase.com/docs/guides/auth/auth-mfa).

Registrar en cada acció administrativa: persona real, actor emissor, context/mode, àmbit, acció, recurs, versió, instant i resultat. Evitar tokens i contingut privat innecessari al registre. El superadmin gestiona la plataforma; no necessita llegir tots els xats o notes privats per defecte.

#### 7.8 Alternatives descartades

- Un boolean global `modeAdmin` només al client: és fàcil de pintar, però no permet la prova real de permisos ni evita crides directes.
- Tres comptes obligatoris per a cada administrador: aïllen credencials, però fragmenten autoria i manteniment quotidià. Conservar comptes de prova mínims per a QA independent; per a l’ús normal, un subjecte amb context autoritzat explícit és més coherent.

### 8. Relleu executable per al 19-10-2026

1. **Coordinació:** fixar un tall de codi i relacionar cada troballa amb fitxers/proves. Corregir en el relleu F4/UUID i F7/taula; no donar per desplegades les migracions perquè existisquen al disc.
2. **Privacitat:** decidir audiència i publicació per defecte; mantindre el desplegament del DEFAULT pendent d’eixa decisió. Corregir textos vigents, tractament de NULL i flux d’alta/OAuth junts, preservant decisions existents.
3. **Backend/mitjans:** implementar el contracte d’integritat i restringir vies directes; integrar després la UI, sense activar la capacitat abans de tindre les proves.
4. **Identitat:** retirar transformació de files reals quan substituïx una tria expressa; resoldre àlies; provar retirada d’avatar amb `identities.google`.
5. **Administració:** aprovar la matriu funcional, inventariar concessions reals i implementar primer el context autoritzat, després commutador/facetes. El mode visual pot servir de prototip, etiquetat com a tal.
6. **Release:** verificar la nova compilació i versió. No presentar v1.1.6 com a paquet amb F3 corregida. Fer una prova remota controlada d’alta, perfil, MFA i Storage amb comptes de rols diferents.

**Decisions de producte per al Mestre:** audiència i publicació de la fitxa personal; identitat comunitària/institucional de l’emissor d’avisos; editors que publiquen directament o amb revisió; administradors de cada poble. La consulta ja autoritza esta proposta. No s’ha demanat una aprovació addicional per a completar l’auditoria.

### 9. Precisió documental necessària

L’Acta Marmota 2105 declara «consens absolut», absència de bloquejos i bateria completament verda. **Això no es desprén dels informes citats:** Claude manté F1–F12 obertes i una fallada coneguda de cens en el seu tall; Codex 2030 distingix disseny d’implementació i un tancament global fallit. Un canvi posterior pot resoldre una troballa, però requerix evidència nova. Esta auditoria no modifica l’acta aliena; deixa la rectificació perquè la coordinació no use aquelles frases com a certificació de producció.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Proves executades ara

| Franja | Resultat | Límit |
|---|---|---|
| Guarda de ruta, sessió, Tauler, amfitrió i segon factor | 6 fitxers, **100 proves passades**, 14,88 s | Fixtures/mocks; no catàleg remot. |
| F1/F2/F4: pilot, avatar/Auth, migracions de perfil, RPC client i camps | 6 fitxers, **107 proves passades** | Algunes validacions SQL són estàtiques. |
| Migració perfil públic i convergència (Node) | **22 proves passades** | No executen el desplegament en PostgreSQL remot. |
| F3: DetallMultimedia i Storage propi | 2 fitxers, **100 proves passades** | Inclou l’eliminació amb bandera mock; no acredita comprovació d’usos. |
| F6/F7: persona de sessió, IdentitatContext, pobles, compte i àmbit CSS | 5 fitxers, **167 proves passades**, 11,64 s | El cas Google després de retirada requerix la sonda addicional. |

**Total d’esta passada: 496 proves passades.** No són les xifres de Claude ni del torn Codex anterior; no s’ha executat la suite global. Les proves que passen reproduint un comportament deficient no convertixen eixe comportament en correcte.

Sondes adversarials addicionals: port real amb capacitat desconeguda i crida directa; fila amb avatar retirat i `identities.google`; recorregut d’àlies no UUID; verificació Ed25519 i seguiment de la cadena d’esborrat dins del ZIP amb REA. No s’ha creat una biblioteca de proves paral·lela dins del producte.

Comandes principals reproduïbles des de l’arrel del repositori:

```sh
node_modules/.bin/vitest run src/app/guards/RequireAuth.test.jsx src/app/contexts/SessionContext.test.jsx src/sections/admin/AdminSection.test.jsx src/sections/admin/AdminSection.amfitrio.test.jsx src/sections/admin/SegonFactor.test.jsx src/data/supabase/segonFactor.test.js
node_modules/.bin/vitest run src/data/identitatsSeed.pilot.test.js src/data/supabase/auth.avatarPropi.test.js src/data/supabase/perfilPublicPerDefecte.migracio.test.js src/data/supabase/perfilUpdatePropi.migracio.test.js src/data/supabase/perfils.test.js src/sections/profile/perfilCamps.test.js
node --test tests/migracio-perfil-public.test.mjs tests/migracio-convergencia-perfil.test.mjs
node_modules/.bin/vitest run src/sections/profile/DetallMultimedia.test.jsx src/data/supabase/storage.mitjansPropis.test.js
node_modules/.bin/vitest run src/app/contexts/personaDeSessio.test.js src/app/contexts/IdentitatContext.perfil.test.jsx src/sections/pobles/nomsDelPoble.test.js src/sections/profile/DetallCompte.test.jsx src/sections/profile/PerfilShell.ambit.test.js
```

### Proves d’acceptació de la proposta de rols

- Matriu permet/denega amb comptes reals separats: veí, editor A, administrador A, editor B i superadmin; MFA `aal1/aal2`, sessió caducada i rol revocat.
- Superadmin en mode Veí: crida directa a RPC administrativa i lectura privilegiada denegades; cap dada elevada en caché després del canvi. Mode absent/falsificat/caducat no eleva. Reusar el context plataforma anterior de la mateixa pestanya després de tornar a Veí es denega, també en reintents de cua; comprovar la carrera entre canvi de generació i mutació.
- Editor A no publica com l’emissor B ni altera un altre `tenantId`, encara que manipule el payload; tampoc es pot nomenar administrador.
- Canvi de context amb autosave pendent, resposta antiga i dues pestanyes: autoria i destí originals preservats o desament rebutjat, mai reassignat silenciosament.
- Avís amb versió concurrent, retirada del permís abans de publicar, reintent duplicat i emissor desactivat: resultat autoritatiu i auditat.
- Cap nom/correu/pilot o `user_metadata.role` permet escalada; concedir/revocar usa UUID i flux de servidor.
- Usuari sense privilegis té la mateixa experiència amb o sense existència del panell; control de teclat, focus i lector de pantalla verificats visualment quan s’implemente.

### Tall d’evidència i tancament

Empremtes SHA-256 del tall inspeccionat:

| Fitxer | SHA-256 |
|---|---|
| Informe Claude 2045 | `abfe04dc1c88e33fd466cdb515a7604f84d1186dac1649d59076d008edf9445d` |
| `DetallMultimedia.jsx` | `3c0337f3b4644d4cc5d389810cf31feeb81b34cefaa510ceec3c0dc368cfb95f` |
| `personaDeSessio.js` | `c240402e37b78b86fdb1ffd01771f652d67b8f2fef306b0f99a10ef5c860dbe2` |
| `supabase/storage.js` | `53af77d1e1dda2d3ec2f4f4452e306dd23a2fc764c634d173103de827412eb6b` |
| Migració de públic per defecte | `e14615859272f38cd84fb12f52b157d9656b30a171ce20f23dbce9ebeddc6423` |

`document.mjs check`: **vàlid**. `tancament.mjs`: **exit 1**, torn en estat `planned`. Olivera, plantilles, autoritat, comprovació del LEDGER existent i compilador Wiki passen; segell, catàleg de skills i SCC fallen. Diagnòstic: 69 `LINK_INVALID`, 303 `ESCRIPTORI_UNANCHORED`, 20 `ORPHAN_OPERATIVE`, divergència del segell, projecció de skills i falta del relleu propi al LEDGER. Cap error assenyala este informe; no hi ha error de codi concurrent atribuït a este torn.

El relleu queda en este informe i en ESTAT. El registre formal de LEDGER queda pendent: l’executor de mutació exigix segell previ vàlid (`tooling/gates/executor-mutacio.mjs:42`), i el segell divergeix (`89e74094` / `5e7339db`). No s’ha resegellat governança aliena per forçar el resultat. L’auditoria s’entrega, però no es declara el torn mecànicament tancat ni el repositori globalment verd. Les cinc empremtes de la taula s’han tornat a verificar al final sense canvi.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Auditoria local de codi, migracions, proves i ZIP. No s’han consultat secrets, files d’usuaris ni catàleg remot de Supabase; no es certifiquen RLS/GRANTs, defaults, concessions de Javi/Damián/Torsten o versió servida en producció.
- Arbre compartit en evolució. F6 i F8 inclouen canvis posteriors al document Claude; les línies són les del tall indicat. No és una auditoria completa de tota la implementació posterior de Mercat, enquadrament o àlbums.
- Lectura completa de l’informe encarregat, fonts canòniques del torn anterior, procediment documental i Acta 2105; lectura focal del codi segons les franges. No es declara llegida tota la història d’ESTAT ni tot el repositori. No s’ha llegit l’arxiu històric automàticament.
- Informe, ancoratge, ESTAT i rebuts són els únics canvis propis. No s’ha implementat el panell, concedit rols, aplicat SQL, regenerat el paquet, canviat textos del producte, fet commit o desplegat.
- Cap missatge enviat a altres xats de Claude/Gemini; el relleu és este fitxer. Cap cron ni seguiment futur programat. La jornada de demà disposa de l’informe, no d’una execució automàtica.
- Hi ha Acta Marmota 2105, però necessita el contrast del §9; este informe deixa relleu nou i no se’n genera una altra acta de jornada en este torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_2045_auditoria_claude]]
- [[261018_2030_auditoria_codex]]
- [[261018_2030_auditoria_gemini]]
- [[261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki]]
- [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]]
- [[261018_2105_acta_marmota_auditoria_trio_i_relleu_implementacio]]
