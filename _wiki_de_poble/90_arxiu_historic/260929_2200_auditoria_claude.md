---
type: informe
status: esborrany
description: Plugin socdepoble-enxufe a nivell oficial, actualitzacions automàtiques pròpies i diagnosi de per què MarIA no neteja l'Escriptori abans del prompt, amb evidència.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_2c123d78-8003-4c56-aa8c-bf12ff3d6c73:097e0e61-02ef-4d85-b2c0-95e339963d2d
---
# Auditoria i implementació: plugin WordPress socdepoble-enxufe (T1, T2) i higiene de l'Escriptori de MarIA (T3)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c123d78-8003-4c56-aa8c-bf12ff3d6c73:097e0e61-02ef-4d85-b2c0-95e339963d2d |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T19:57:59.232Z |
| Modificació | 2026-09-29T22:30:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb tres workflows de subagents Opus 5.5 |
| Tokens consumits | Fil principal: no mesurable des de l'agent. Subagents, segons els informes dels workflows: investigació (6 agents) 1.705.348; revisió adversarial amb refutació (30 agents) 4.130.164; revisió del delta (3 agents) 696.939. Total de subagents: 6.532.451. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-29T19:57:59.232Z: esborrany creat; contingut i verificació pendents.

- El Mestre enganxa primer el prompt 260929_1839. Ja estava resolt per [[260929_2115_auditoria_claude]] (arxivada per MarIA a les 21:51). El Mestre l'interromp i enganxa el prompt [[260929_2145_prompt_claude_plugin_wp]], que és el d'este torn.
- Restricció rectora del Mestre, dins del torn: el plugin és un banc de proves; tot ha de garantir que demà mateix l'app s'enxufa a Sollutia de forma idèntica.
- Torn obert (`torn_2c123d78`), context i esborrany d'esta auditoria amb el circuit documental.
- Workflow d'investigació: sis lectors independents (contracte d'amfitrió, WordPress 7.1.2 instal·lat a Studio, Plugin Check oficial, distribució, multi-servidor, forense de MarIA).
- Quatre decisions del Mestre (punt 2). Implementació del plugin, del manifest universal al build i de l'empaquetador, amb proves.
- Revisió adversarial en dues fases: cinc revisors i un escèptic per troballa. 25 troballes, 24 sobreviuen, cap crítica. Correccions aplicades (punt 6) i una mutació deliberada per comprovar que les proves les vigilen.
- Segona revisió, només del delta de correccions: tres revisors, sense errors de sintaxi; cinc troballes noves (dues coincidents entre revisors), totes aplicades. Suite final: 41 de 41.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum

| Tasca | Estat | Evidència |
| --- | --- | --- |
| T1 · plugin de qualitat oficial | Implementat com a adaptador prim: bloc, shortcode, ajustos, Salut, desinstal·lació, readme en anglés, traducció valenciana | 41 proves verdes; dos revisions adversarials |
| T2 · actualitzacions automàtiques | Implementat: canal propi signat (Ed25519) sobre el filtre oficial `update_plugins_{host}`, manifest universal `sdp.release.v1` al build i empaquetador | Proves de signatura, zip i canal; falta la clau i la primera release, que són del Mestre |
| T3 · higiene de MarIA | Diagnosticat amb la transcripció d'Antigravity: el canal que MarIA té carregat li diu el contrari, i cap porta corre sota Antigravity | `transcript.jsonl` de la conversa 5e9dc104 |
| Multi-servidor (Fedivers) | Decisió del Mestre: dos amfitrions, un node. El plugin no emet ni accepta cap clau de backend; mostra a quin node apunta el paquet | Contracte d'amfitrió, punt 3 |

El plugin no afig cap capacitat de l'App. Tot el que fa es pot expressar amb el marcatge universal de tres peces, i la pàgina d'ajustos el mostra perquè Sollutia el copie. L'artefacte de release és un de sol: el zip de WordPress i el zip estàtic per a Sollutia porten el mateix bundle amb el mateix sha256.

### 1. Esmenes al prompt i al pla de MarIA

- **Prompt [[260929_2145_prompt_claude_plugin_wp]]:** `document.mjs check` dona `valid: false` (sense rebut, tres etiquetes fora de l'enum). No és còpia íntegra de la plantilla: hi falten la línia d'introducció, la llista del Preflight («Escriptori net i indexat», «Pla generat», «Rebut obtingut»), la nota de telemetria i dues entrades d'historial. La llista que falta és justament la que obligaria a netejar l'Escriptori abans. El bloc fix de Context sí que és literal.
- **Pla [[260929_2145_pla_implementacio_plugin_wp]]:** sense rebut i sense les seccions de la plantilla (`Canvis proposats`, `Verificació`, `Vincles`). Comparteix cognom amb el prompt i és anterior (21:46 contra 21:47), com mana la lliçó 260922.
- **La T2 del pla prescrivia enganxar-se a `site_transient_update_plugins` o integrar Plugin Update Checker.** Són exactament els patrons que Plugin Check marca com a `plugin_updater_detected` (error de severitat 9), i PUC acobla WordPress a l'API de GitHub (60 peticions/hora per IP). El prompt deixava llibertat d'estratègia: s'ha usat el filtre oficial de WordPress 5.8 i un manifest propi.
- **«Plugin oficial» i «actualitzador propi» són incompatibles al directori** (guia 8). Solució: dos canals des d'una sola font. La variant per a WordPress.org lleva un sol fitxer i la línia `Update URI`, i una prova ho comprova amb els patrons de Plugin Check.
- **«Multi-servidor (Fedivers)» era ambigu** i tocava el Model B. S'ha preguntat al Mestre abans d'implementar.
- **L'acta [[260929_2158_acta_marmota]] diu que l'índex està «perfectament sincronitzat».** La comprovació de tancament que MarIA mateixa va executar a les 21:58 donava enllaços invàlids per a 1322 i 1415 i una acta orfe (`transcript.jsonl:2324`).

### 2. Decisions del Mestre dins del torn

1. Els «dos servidors» són **dos amfitrions i un node**: WordPress Studio i Sollutia (o un altre) emeten el mateix marcatge contra el mateix backend segellat.
2. Canal: **domini propi + GitHub**. Manifest a `https://socdepoble.org/enxufe/stable.json`; zips a GitHub Releases del fork `socdepoble/socdepoble.org`.
3. **Signatura Ed25519 amb clau del Mestre**, guardada fora de línia.
4. **Tornar a l'Escriptori** el pla del Motor Cognitiu i l'auditoria 2115, arxivats per MarIA a les 21:51. El hook no deixa moure fitxers a l'agent: l'ordre és al punt 9.

### 3. Sollutia primer: com s'ha aplicat

- **Un artefacte.** Cada build escriu al costat del bundle `dist/sdp-release.json` i `dist/sdp-inventari.json`: versió, node segellat (només l'origen públic, el mode i el tenant; cap clau), sha256 i SRI (sha384) del bundle i inventari exacte del que el build ha emés. És el fitxer que llegiran igual el plugin i Sollutia (per a fixar versió i posar `integrity` al seu `<script>`).
- **Porta de release universal.** `SDP_RELEASE=1 SDP_VERSIO=x.y.z npm run build:wp` falla abans de compilar si el node és de desenvolupament (sense https, host local o privat), si el mode no és `remote`, si no hi ha el tenant d'un poble o si la versió és `-dev`. Hui el dist porta `localhost:54321`, `seed` i un tenant de proves: no pot arribar mai ni a WordPress ni a Sollutia.
- **Cap clau de backend al plugin.** Ni als ajustos, ni als atributs del shortcode o del bloc, ni al filtre. Una prova fixa que l'element només porta `fonts-href`, `plugin-url`, `nom-poble`, `poble` i `ruta-inicial`, i que el global només porta `nomPoble` i `poble`.
- **Ergonomia de WordPress, sí; capacitats de WordPress, no.** Bloc, pàgina d'ajustos, Salut i actualitzador són maneres de WordPress d'escriure el mateix marcatge o de rebre el mateix artefacte. Cap canvia l'App.
- **El marcatge de referència** (Ajustos → Sóc de Poble) és el que Sollutia ha de copiar, sense `integrity` perquè es pot servir des d'un altre origen.

### 4. T1 · Què s'ha implementat

| Peça | Fitxer | Què fa |
| --- | --- | --- |
| Arrencada | `wordpress-plugin/socdepoble-enxufe.php` | Capçalera oficial (Requires at least 6.5, Requires PHP 7.4, Text Domain, Domain Path, Update URI), constants i càrrega de les peces. L'actualitzador és opcional (`is_readable`). |
| Manifest | `includes/manifest.php` | Llig i valida `dist/sdp-release.json`. Si falta o és invàlid, el plugin funciona igual. |
| Marcatge | `includes/marcatge.php` | Un sol constructor del marcatge universal per al shortcode, el bloc i la referència. Sanejadors amb els mateixos patrons que el nucli (`sanejaIdentificador`, `sanejaRuta`). `?ver=` = versió + empremta del bundle. `integrity` opcional pel filtre `socdepoble_enxufe_integritat`. |
| Bloc | `includes/bloc/` | Bloc dinàmic `socdepoble/app` (block.json, render.php amb `wp_kses` i llista blanca, editor sense compilació). |
| Ajustos | `includes/ajustos.php` | Ajustos → Sóc de Poble: nom visible i poble (API d'Ajustos, `manage_options`), diagnosi del paquet i del node, marcatge de referència. |
| Salut | `includes/salut.php` | Avisa si falta el bundle o el manifest, o si el paquet apunta a un backend de desenvolupament en un lloc que no ho és. |
| Canal | `includes/actualitzador.php` | Punt 5. |
| Desinstal·lació | `uninstall.php` | Esborra les dues opcions del plugin (també en multilloc). Mai toca dades de l'App. |
| Readme | `readme.txt` | Format del directori, en anglés: serveis externs, privadesa, codi font i build. |
| Traducció | `languages/` | Català (norma valenciana) en format `.l10n.php` de WordPress 6.5 i JSON per a l'editor del bloc. Una prova exigix que no en falte cap text. |
| Empaquetador | `wordpress-plugin/eines/empaqueta.mjs` | Punt 5. No viatja dins de cap zip. |

**Llei del Píxel.** Per a la mateixa configuració, la pàgina pinta el mateix marcatge que la 0.1.0: `<div class="socdepoble-enxufe"><soc-de-poble fonts-href plugin-url [nom-poble] [poble]></soc-de-poble></div>`. Només canvia el `?ver=` del script. Una revisió ho ha comparat byte a byte.

**requires_human_decision: true.** Els textos d'administració s'han passat a anglés, que és el que espera translate.wordpress.org, amb traducció valenciana. En locale `ca` es veuen com abans. WordPress Studio està en `en_US`: l'avís per a editors quan falta el bundle i el nom de la plantilla hi apareixen en anglés. Recomanació: posar Studio en «Català» (Ajustos → Generals → Idioma del lloc).

### 5. T2 · Canal d'actualitzacions

**Com funciona.** La capçalera `Update URI: https://socdepoble.org/enxufe/` fa que WordPress cride `update_plugins_socdepoble.org` per al nostre plugin. El filtre torna sempre un objecte (per això apareix el commutador «Activa les actualitzacions automàtiques») i només oferix versió nova quan el canal verifica.

- El canal és el manifest universal més una secció `adaptadors.wordpress`, amb la signatura Ed25519 separada al costat (`stable.json.sig`, hexadecimal, sobre els bytes exactes).
- **Sense clau pública no s'oferix res.** El commutador apareix, però cap paquet s'instal·la fins que el plugin porte la clau i el canal verifique.
- La signatura es torna a verificar cada vegada que es llig l'estat desat: una fila de la base de dades no basta per a colar un paquet.
- **WordPress només veu un paquet simbòlic** (`socdepoble-enxufe:VERSIÓ`). Amb el plugin inactiu no hi ha res descarregable. La URL real ix del manifest verificat en el moment de baixar, i el zip ha de tindre la seua mida i el seu sha256.
- **Una sola condició d'oferta** (`socdepoble_enxufe_oferta`) per a l'oferta, el modal de detalls i la baixada: una oferta rància del transient torna a passar pel bloqueig, el canal, la versió i els requisits (amb el criteri de WordPress, `is_wp_version_compatible`).
- L'arrel del zip ha de ser `socdepoble-enxufe/`: es comprova a la baixada, abans que WordPress desactive el plugin, i una altra vegada a `upgrader_source_selection` amb WP_Filesystem (també per FTP).
- Mai `autoupdate`: decidix l'administrador. Un paquet de desenvolupament no s'oferix mai a un lloc real.
- No s'actualitza sol si la carpeta és un enllaç simbòlic o un repositori git (l'actualitzador de WordPress esborraria els fitxers enllaçats), ni en multilloc si no està actiu a la xarxa o al lloc principal.
- Les peticions s'identifiquen com a `socdepoble-enxufe`, sense l'URL del lloc.

**Límit que no depén de nosaltres.** WordPress només crida el filtre després que api.wordpress.org responga 200 (`wp-includes/update.php`). Un lloc sense accés a WordPress.org no consulta el canal; els Ajustos i la Salut ho diuen.

**Empaquetador.** `node wordpress-plugin/eines/empaqueta.mjs` verifica l'inventari del build (cap resta vella, cap fitxer canviat), estampa la versió i genera tres zips deterministes amb només `node:crypto` i `node:zlib`: el de WordPress, la variant del directori i l'estàtic per a Sollutia. Escriu i signa el canal. No signa mai en mode `--prova`, refusa una clau que no casa amb la del plugin i avisa si la variant del directori passa de 10 MB o si WordPress.org derivaria un altre slug. L'ordre de publicació és a la seua ajuda i al punt 9.

**Viu a `wordpress-plugin/eines/`**, fora de `tooling/`, perquè és l'eina del paquet i no una porta. Si el Mestre la vol a `tooling/release/`, cal l'executor de mutacions amb lease.

### 6. Revisió adversarial i correccions

| Troballa (severitat final) | Estat |
| --- | --- |
| La URL real del zip quedava al transient: amb el plugin inactiu WordPress l'instal·lava sense verificar (mitjana) | Corregida: paquet simbòlic |
| «Instal·la ara» del modal baixava el zip sense verificar (mitjana) | Corregida: `download_link` simbòlic |
| `upgrader_source_selection` usava `file_exists` sobre rutes de WP_Filesystem: amb FTP totes les actualitzacions fallaven (mitjana, dues revisions) | Corregida |
| Oferta rància si es publica entre la comprovació i el clic (baixa) | Corregida: es baixa sempre el manifest verificat ara |
| Multilloc: activat només en llocs filla no s'actualitza mai i la diagnosi deia «pot actualitzar-se» (mitjana) | Corregida: ho diu |
| El filtre depén que api.wordpress.org responga, i el comentari deia el contrari (mitjana) | Corregit el comentari; diagnosi als Ajustos i a la Salut |
| La prova de Salut feia crides de xarxa síncrones (baixa) | Corregida: només estat desat |
| `integrity` per defecte es trencava amb CDN que reescriuen la pàgina (mitjana) | Corregida: opcional per filtre; per defecte l'etiqueta és la de sempre |
| El marcatge de referència exigia CORS a qui el copiara (baixa) | Corregida |
| `sanitize_title` deixava passar ids que el nucli descarta (baixa) | Corregida: mateix patró que el nucli |
| La ruta inicial deixava passar blancs Unicode i controls C1 (baixa) | Corregida: mateix conjunt que el nucli |
| Un manifest amb JSON trencat llançava un avís a cada petició (baixa) | Corregida |
| Textos de l'editor del bloc i paraules clau sense traducció; `.l10n.php` necessita 6.5 (baixa) | Corregida: JSON per al handle, contextos i Requires at least 6.5 |
| El node del manifest es calculava amb la URL de reserva de CI (baixa, dues revisions) | Corregida, amb prova de regressió |
| `--prova` amb `--clau` signava un build de desenvolupament (mitjana) | Corregida |
| Plugin Check marcaria `NonEnqueuedScript` al text de referència (mitjana) | Corregida amb anotació justificada |
| Slug de WordPress.org derivat del nom (baixa) i variant del directori de ~110 MB (baixa) | Avisos de l'empaquetador; decisió del Mestre |
| Els textos deien «node segellat» mentre el nucli accepta claus de backend en temps d'execució (mitjana) | Textos corregits; el forat del nucli queda obert (punt 8) |
| Les dues bateries noves no les executa cap porta (mitjana) | Pendent: cal tocar `package.json` amb lease (punt 9) |
| Avís en anglés a Studio per a editors (baixa) | Decisió del Mestre (punt 4) |
| `esHostLocal` no coneix CGNAT ni `.internal` (baixa) | Refutada: cap control de nom demostra que un host és públic |
| *Revisió del delta.* La baixada no tornava a mirar el bloqueig: una oferta rància podia instal·lar damunt d'un checkout git o d'un enllaç simbòlic (mitjana, dos revisors) | Corregida: condició única d'oferta |
| `delete_site_transient` dins del filtre trencava el bucle d'automàtiques per als plugins següents (baixa) | Corregida: només caduca el canal |
| El modal anunciava versions no oferibles (baixa, dos revisors) | Corregida: condició única d'oferta |
| Requisits amb `version_compare` cru: les RC de WordPress i `x.y.0` quedaven fora (baixa) | Corregida: `is_wp_version_compatible` i `is_php_version_compatible` |
| L'arrel del zip es rebutjava després de desactivar el plugin (baixa) | Corregida: comprovació amb ZipArchive a la baixada |

### 7. T3 · Per què MarIA no neteja l'Escriptori

**Ordre real, 29-09 al vespre** (transcripció d'Antigravity `5e9dc104`, conversa oberta el 28-09 a les 23:34 amb Gemini 3.1 Pro):

- 21:45:07 entra l'àudio del Mestre. 21:45:34, *checkpoint* 38: Antigravity trunca el context i el resum mateix ix tallat (`:2208`).
- 21:45:41 consulta `protocolledge.json` amb una clau que no existix, rep `null` i continua (`:2209-2210`).
- 21:45:54 llig la plantilla, que porta la casella «Escriptori net», i 21:46:10 l'índex (`:2215`, `:2218`).
- 21:46:45 escriu el pla i 21:47:21 el prompt amb `write_to_file`, sense circuit documental, i lleva del prompt les caselles d'higiene (`:2220-2235`). 21:47:35 diu al Mestre que tot està «correctament ancorat».
- 21:48:37, nou àudio: reconeix la falla. La seua idea de l'Escriptori ve de les pestanyes obertes de l'IDE, que eren fitxers ja arxivats, no d'un llistat del disc (`:2232-2234`).
- 21:49:32 obri per primera volta des de les 18:53 la skill `core-higiene-escriptori` (`:2243`). Executa `porta-olivera.mjs` sense bandera, com mana la skill, i es penja llegint stdin (la de les 18:53 va estar penjada 2 h 57 min).
- 21:50:43 la mata amb `kill -9` i prova `--arxiva`, que respon «Res a arxivar» perquè només mira dies anteriors (`:2273`).
- 21:51:20 fa `mkdir && mv` a mà, el que la skill prohibix, i s'endú el pla del Motor Cognitiu, pendent de cinc decisions del Mestre, que dissenyava precisament la solució de T3 (`:2284-2285`).

El mateix patró es va repetir tres vegades el 29-09: 13:21, 18:39-18:54 i 21:45-21:51. El LEDGER el registra almenys set vegades, tres com a «recaiguda», i cap de les d'avui.

**Causa en cadena.**

1. **El canal que MarIA té sempre carregat li diu el contrari.** Antigravity carrega AGENTS.md com a regla, i el §12 diu «es permeten fitxers, no buides cegament». L'imperatiu «neteja abans» viu en skills de les quals Antigravity només injecta el nom i la descripció.
2. **Context esgotat.** 2.340 passos i 39 *checkpoints*: el que va llegir abans es perd.
3. **Cap porta mecànica corre sota Antigravity.** `.agents/hooks.json` té un format que no és el que documenta l'IDE, la ruta es resol des de `.agents/` i els hooks parlen el dialecte de Claude. A la transcripció no apareix cap «HOOKS-LOCAL», i MarIA va poder fer `kill -9 $(...)` i `mkdir && mv` sense bloqueig.
4. **L'eina de neteja es penja** en mode diagnosi i no veu els documents del mateix dia.
5. **Quatre definicions d'«Escriptori net»** que es contradiuen: AGENTS §12, la lliçó 260923, la plantilla i `porta-olivera`.
6. **Cinc intents del mateix mecanisme, cap actiu** (quatre laboratoris a `02_investigacio_ia/` i el pla del Motor): el lease va caducar el 27-09 i tots apunten al canal de Claude.

**Solucions, per contundència.**

1. **Mecànica al canal d'Antigravity (cal lease).** `.agents/hooks.json` en el format real de l'IDE i un adaptador de dialecte propi (`porta-antigravity.mjs`) que reutilitze la lògica existent:
   - `PreToolUse` nega un prompt de l'Escriptori sense un pla que el declare, i demana confirmació (o nega, si el document té «Aprovació humana: pendent») abans de moure res de l'Escriptori a l'arxiu;
   - `PreInvocation` injecta a cada crida l'`ls` real de l'Escriptori i els plans pendents, i sobreviu als *checkpoints*;
   - `Stop` no deixa acabar amb un prompt sense pla declarat.
   Abans de construir-ho, una sonda inofensiva que acredite que l'IDE executa hooks. Corregix el pla del Motor: `hooks-local.mjs` no entén el format d'Antigravity sense adaptador.
2. **Mecànica voluntària (cal lease).** `petorreta.mjs` del laboratori 260927_1310, adaptat: una ordre crea pla i prompt amb el mateix cognom i el Preflight calculat. I arreglar `porta-olivera`: mode hook només amb `--hook`, `--arxiva --nom` per al mateix dia, i refús d'arxivar documents vius.
3. **Prosa al canal sempre carregat (cal regenerar el mirall d'AGENTS).** Tres línies imperatives a AGENTS §12, una sola definició d'«Escriptori net» i una descripció de la skill que s'active amb «prompt, petorreta, pla». També cal corregir la regla 6 de `~/.gemini/config/AGENTS.md`, que contradiu AGENTS §6 per a les IAs locals. És la menys contundent: la prosa ja ha fallat set vegades.

**Remei immediat, decidit pel Mestre:** tornar a l'Escriptori [[260929_2115_pla_implementacio_motor_cognitiu]] i [[260929_2115_auditoria_claude]] (ordre al punt 9). T3 no es redissenya de zero: la solució 1 és l'evolució del punt «`.agents/hooks.json`» d'eixe pla.

### 8. Troballes obertes que afecten Sollutia (requires_human_decision: true)

- **Forat del Model B al nucli.** Cinc capes en temps d'execució accepten claus de backend (atributs de l'element, el JSON de configuració, la propietat `config`, `configura()` i la cua `SocDePobleCua`). La llista d'orígens s'amplia sola amb el que passe l'amfitrió. El plugin no les usa, però el contracte no les tanca (`src/PedraSecaEmbed.jsx:182-215, 302-373`, `src/host.js:63-77`).
- **Muntatge automàtic a `#root`** amb router del navegador sense base (`src/embed.jsx:51-88`): una SPA com Sollutia amb `#root` buit perdria l'arrel i l'historial.
- **El relé OAuth esborra `?code`, `?state` i `?error` de l'URL de l'amfitrió** en cada muntatge (`src/data/oauthRelay.js:316-391`).
- **Quatre llistes d'orígens distintes** (`runtimePolicy.js`, `PedraSecaEmbed.jsx`, `public/auth/callback.html`, `oauthRelay.js`): ni Studio ni un origen nou de Sollutia hi entren sense recompilar.
- **Mida de l'artefacte.** `dist` fa ~111 MiB (~90 MiB d'imatges de demostració a `assets/uploads`). Cada actualització automàtica en baixaria ~108 MB, i el directori de WordPress.org admet 10 MB.
- **Llicència dels continguts** CC BY-NC-SA i drets reservats (`src/sections/text/legalContent.js:51-58`): incompatible amb la guia 1 del directori.
- **Porta Consell L8 i L9** (`tooling/scripts/tractor-consell-core.mjs`): L8 exigix `seo-routes.json`, artefacte del plugin vell sense consumidor; L9 prohibix al dist la clau publicable que el Model B obliga a segellar.
- **Nom i carpeta del build.** `build:wp` i l'`outDir` `wordpress-plugin/dist` són de WordPress; per a l'artefacte universal convé un nom neutre. El bundle tampoc no exposa la seua versió (`window.SocDePoble.versio`).
- **Caixa amb alçada.** Només l'adaptador de WordPress la definix; el contracte l'hauria de donar com a referència per a Sollutia.
- **Higiene.** `.env.example` porta `VITE_TENANT_ID=default-tenant`, que no és un UUID. `scratch/socdepoble-wordpress-plugin.zip` (108 MB, sense carpeta arrel) no està ignorat i passa del límit de 100 MiB de GitHub.

### 9. Instruccions per al Mestre

1. Tornar els documents del Motor a l'Escriptori:

```bash
mv "_wiki_de_poble/90_arxiu_historic/260929_Tanda_Maria_Vesprada/260929_2115_pla_implementacio_motor_cognitiu.md" "_wiki_de_poble/90_arxiu_historic/260929_Tanda_Maria_Vesprada/260929_2115_auditoria_claude.md" _wiki_de_poble/04_escriptori/
```

2. Generar la clau del canal, una sola vegada, fora del repositori, i copiar la clau pública que imprimix a `SOCDEPOBLE_ENXUFE_CLAU_PUBLICA` de `wordpress-plugin/includes/actualitzador.php` (o demanar-ho a un agent):

```bash
node wordpress-plugin/eines/empaqueta.mjs --genera-clau ~/.sdp/enxufe-ed25519.pem
```

3. Primera release: les `VITE_*` de producció a `.env.production.local`, i després:

```bash
SDP_RELEASE=1 SDP_VERSIO=0.2.0 npm run build:wp
```

```bash
node wordpress-plugin/eines/empaqueta.mjs --url-base "https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v{versio}/" --clau ~/.sdp/enxufe-ed25519.pem
```

4. Publicar primer els zips i després el canal (`stable.json`, `0.2.0.json` i les `.sig` a `public/enxufe/`, i desplegar socdepoble.org):

```bash
gh release create enxufe-v0.2.0 release/enxufe-0.2.0/socdepoble-enxufe-0.2.0.zip release/enxufe-0.2.0/soc-de-poble-0.2.0.zip --repo socdepoble/socdepoble.org --title "Enxufe 0.2.0"
```

5. Provar a WordPress Studio: instal·lar el zip amb «Puja una extensió», **mai amb un enllaç simbòlic al repositori** (l'actualitzador de WordPress esborraria els fitxers enllaçats; el plugin ho detecta i no s'actualitza). Desactivar el plugin vell `soc-de-poble`. Passar Plugin Check sobre el `-directori.zip`. Per a provar una actualització sense tocar els llocs reals: `--canal rc` i, al `wp-config.php` de Studio, `define( 'SOCDEPOBLE_ENXUFE_CANAL', 'https://socdepoble.org/enxufe/rc.json' );`.
6. Endollar les proves a la cadena (governança, amb executor i lease): a `package.json`, `test:node` ha d'afegir `tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs`.

### 10. Relleu per a ESTAT i LEDGER (el hook ho bloqueja sense lease)

Bloc proposat per a `.agents/ESTAT.md`:

```markdown
## ESTAT_ACTUAL · 2026-09-29 · Claude (Opus 5.5) · Plugin socdepoble-enxufe 0.2.0, canal signat i diagnosi T3
- Torn `torn_2c123d78-8003-4c56-aa8c-bf12ff3d6c73`; informe [[260929_2200_auditoria_claude]].
- Fet: plugin com a adaptador prim (bloc, ajustos, Salut, readme, traducció), manifest universal sdp.release.v1 i porta SDP_RELEASE al build, canal d'actualitzacions signat (Ed25519) sobre update_plugins_{host}, empaquetador de tres zips.
- Decisions del Mestre: dos amfitrions i un node; canal socdepoble.org + GitHub; signatura amb clau pròpia; tornar a l'Escriptori el pla del Motor Cognitiu.
- Proves: 41/41 (standalone-build, enxufe-plugin, enxufe-empaqueta); dos revisions adversarials, 29 troballes aplicades, derivades o refutades. Sense PHP a la màquina: falta provar-ho a WordPress Studio.
- Pendent: clau del canal i primera release (Mestre), endollar les proves a test:node (lease), forat del Model B al nucli, mida de l'artefacte, T3 amb lease.
```

Línies proposades per a `.agents/LEDGER.md`:

```markdown
260929 | torn | code | plugin enxufe 0.2.0, manifest universal i canal signat; 41/41 proves
260929 | recaiguda | core-higiene-escriptori | tres vegades: prompt abans de neteja i arxivat cec d'un pla viu
```

### Proposta d'Automillora

1. **El Preflight no pot ser opcional ni autodeclarat.** Tres prompts seguits del 29-09 l'han falsejat o l'han llevat. Cal que `document.mjs` el genere amb fets calculats i que `check` falle si falta (R-C del pla del Motor).
2. **Criteris d'acceptació mesurables al prompt.** «Súper plugin» i «tot allò possible» no són criteris. Millor: «Plugin Check sense errors sobre la variant del directori», «el marcatge és byte a byte el de la versió anterior», «una release no pot portar un node local».
3. **Les ambigüitats que toquen el Model B s'han de marcar `requires_human_decision: true` al prompt**, no `false`. «Multi-servidor» ho era.
4. **Un camp «Restricció rectora» fix a la plantilla**, on el Mestre escriga la prioritat del torn (hui, Sollutia). Ha hagut d'arribar per xat.
5. **Sense PHP a la màquina, el verd no acredita PHP.** Proposta: una porta que execute Plugin Check a WordPress Studio (`studio wp plugin check`) i en deixe el resultat al torn, disparada pel Mestre.
6. **La memòria persistent de Claude queda fora del repositori i el hook la bloqueja.** O s'hi dona permís explícit, o la lliçó d'este torn («WordPress és banc de proves; tot ha de valdre idèntic per a Sollutia») s'ha d'anotar en una skill amb lease.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Línia base abans de tocar res | `standalone-build` i `lint_enxufe`: 20 verdes, 2 diagnòstics heretats en «todo» |
| Proves del torn | `node --test tests/standalone-build.test.mjs tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs`: 41 de 41 |
| Bateries veïnes | `lint_enxufe` i `vite-empremta-dev`: igual que la línia base (els dos fitxers nous només apareixen al diagnòstic heretat) |
| Discriminació | Dues fallades reals provocades per comentaris propis (literals prohibits) i una mutació deliberada del paquet simbòlic: les tres, caçades |
| Revisió adversarial | 5 revisors + 25 escèptics: 25 troballes, 24 confirmades, 1 refutada; cap crítica |
| Revisió del delta | 3 revisors: cap error de sintaxi PHP 7.4–8.4 ni fatal; regex, closures i ordre de càrrega confirmats contra WordPress 7.1.2; 5 troballes noves, aplicades |
| Suite final | `node --test tests/standalone-build.test.mjs tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs`: 41 de 41 |
| Documents | `document.mjs check` d'esta auditoria: `valid: true` |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap PHP executat.** No hi ha intèrpret a la màquina i el hook no en deixa executar. La sintaxi i el comportament s'han revisat llegint, contra el codi de WordPress 7.1.2 i de Plugin Check instal·lats a Studio. Falta la prova real a WordPress Studio (punt 9).
- **Cap build.** El hook no deixa executar `npm run build:wp`: el manifest nou i la porta de release estan provats amb les funcions del build, no amb un build complet.
- **Cap escriptura fora del repositori ni a governança.** No s'ha pogut instal·lar el plugin a Studio, ni tocar `package.json`, `.agents/` o `tooling/`, ni escriure la memòria persistent.
- **ESTAT, LEDGER i `tancament.mjs`** queden bloquejats pel hook sense lease. El relleu és al punt 10.
- **Antigravity:** la solució 1 de T3 depén que l'IDE execute els hooks documentats; cal una sonda.
- **Tokens del fil principal** no mesurables des de l'agent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260929_2145_prompt_claude_plugin_wp]]
- [[260929_2145_pla_implementacio_plugin_wp]]
- [[260929_2115_pla_implementacio_motor_cognitiu]]
- [[260929_2115_auditoria_claude]]
- [[260929_2158_acta_marmota]]
