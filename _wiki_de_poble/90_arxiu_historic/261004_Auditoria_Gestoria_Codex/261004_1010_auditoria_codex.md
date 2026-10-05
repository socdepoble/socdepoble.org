---
type: informe
status: esborrany
description: Contrast independent del nucli Veri*Factu, la Llei de la Targeta i els estils globals amb reproduccions locals.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a6932539-8ecf-4fae-84b4-02faa6959a8e:ef186881-32cb-4779-a664-d4be29ff0548
---
# Auditoria independent de Gestoria, targetes i CSS

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a6932539-8ecf-4fae-84b4-02faa6959a8e:ef186881-32cb-4779-a664-d4be29ff0548 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T08:11:35.469Z |
| Modificació | 2026-10-04T09:16:36Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; variant exacta no exposada en esta sessió |
| Tokens consumits | No mesurats: el comptador exacte del torn no és accessible; no equival a zero |
| Torn | torn_a6932539-8ecf-4fae-84b4-02faa6959a8e |
| Tall d'evidència | HEAD f23dcf2b4d5df0ea13a2091b9a2cfe1d6d682f7f + WIP concurrent; auditoria inicial 10:10–10:38, ampliació fins a 11:16, Europe/Madrid |
| requires_human_decision | false; informe consultiu, sense canvis productius |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-04T08:11:35.469Z: document creat pel circuit canònic, amb rebut i àncora a l'índex.

2026-10-04T08:38:00Z: auditoria independent amb quatre reproduccions adverses, contrast de casos oficials, proves locals i observació del navegador. Es distingixen defectes vigents, limitacions ja declarades i correccions concurrents. Cap font de producte modificada per Codex.

2026-10-04T09:01:00Z: v1.1.0, ampliació del torn per al relleu de Compartir/Índex i per a auditar entrada personal, Sollutia i paquet de producció. Nou informe [[261004_1045_auditoria_codex]] creat, omplit i compartit al disc; el relleu 20 de Claude accepta F01–F06 i anuncia integració, encara sense pegats comptables al tall rellegit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen: base modular aprofitable, però no blindada ni llesta per a emetre factures reals. La conversió a UniversalCard és efectiva; el compliment complet de la Llei de la Targeta continua sent parcial. La reixeta principal es conserva, però no hi ha acreditació global del CSS ni del tancament.**

No ratifique expressions com «cap defecte» o «blindat» sense delimitar la garantia. Les suites ordinàries passen molts casos, però he reproduït entrades que el llibre accepta i que contradiuen el seu contracte. No he trobat acoblament de Supabase al nucli de facturació. Tampoc he demostrat pèrdua de dades reals: totes les reproduccions comptables han usat ports en memòria i dades sintètiques.

### Matriu de T1–T4

| Tasca | Resultat independent | Què queda pendent |
| --- | --- | --- |
| T1 · Facturació | Models purs, cèntims enters, recàlcul i dos adaptadors; els hashes oficials 1 i 2 són correctes | F01–F03; cas d'ús d'emissió amb política de sèrie; capacitat del backend i remissió AEAT |
| T2 · Targetes | Consola contrastada amb boina, cos i detall; Lector i Nevera reutilitzen UniversalCard | F04–F05; excepcions explícites per a dades externes, identitat privada i detall commutable |
| T3 · CSS | Reixeta canònica i separació en tokens conservades en les peces revisades | F06; portes globals roges i verificació visual incompleta |
| T4 · Informe | Troballes, reproduccions, prioritats i límits documentats | Integració i contrast sobre un tall immutable; no es dona l'onada per tancada |

P1 indica un bloqueig abans d'activació comptable; P2, una garantia o funció incompleta; P3, una contradicció documental de menor impacte. La prioritat no implica que la UI actual expose el defecte a una persona usuària.

### F01 · P1 · El port pot guardar un encadenament que el seu verificador rebutja



La reproducció executa el port de memòria. IndexedDB crida la mateixa `comprovaAfegit` dins de la transacció; és una extensió sustentada en el codi compartit, sense haver alterat una base real del navegador. El camí ordinari `registraAlta()` construeix bé la referència, però `afegix()` és una frontera pública del contracte i ha de refusar entrades incoherents.

**Correcció proposada:** comparar dins de l'operació atòmica la referència completa amb `encadenamentDe(ultim)` —emissor, número, data i empremta— i refusar la discrepància abans d'escriure. Fixar el mateix cas als dos adaptadors. No alterar el hash de l'AEAT per a tapar el problema.

### F02 · P1 · La política NOVA / F tancada existix com a helper, però no governa l'alta


He registrat `F260001`, expedida el 03/10, amb instant de generació del 04/10: l'alta s'accepta i la cadena és vàlida. Amb llegat F/2026 i pas 04/10, la crida separada a `comprovaEmissio()` refusa la mateixa sèrie amb `SERIE_CONFUSA`. La configuració existix, però el flux d'alta no la consumix.


**Correcció proposada:** un cas d'ús pur d'emissió que exigisca configuració, llegat i data de pas; calcule el següent número; i assegure la reserva del número i l'alta sense carreres. En backend, la unicitat de negoci també ha de ser atòmica. Mantindre el constructor fiscal genèric i la identitat del registre separats d'esta política. No atribuir garanties d'emissió al helper abans de connectar-lo.

### F03 · P2 · Restaurar una «còpia exacta» només compara empremtes parcials


Exporte una alta, canvie només `factura.descripcio` en la còpia i intente restaurar-la sobre el port original. La còpia passa `verificaCadena()` i la restauració acaba amb `{ afegits: 0 }`; el text del port i el text de la còpia són diferents. No s'ha sobreescrit el port ni s'ha perdut informació en este cas, però no es detecta la divergència promesa.

El hash oficial no cobrix la descripció, tots els noms ni tots els domicilis. El recàlcul d'imports detecta moltes incoherències, però no autentica tot el document ni impedix una reescriptura coherent seguida de nous hashes. Això ja és parcialment declarat a `cadena.js` i a l'auditoria de Claude; no ho presente com un error de SHA-256.

**Correcció proposada:** comparar canònicament els registres complets que se solapen si la garantia és de còpia exacta; separar la verificació fiscal de la integritat de la còpia. Un resum local addicional pot ajudar, però l'autenticitat i la detecció d'un truncament exigixen un punt de control independent i fiable. No ampliar els camps del hash oficial.

### T1 · Enxufabilitat que sí existix i enxufabilitat que encara falta

El model de factura, sèries, pressupostos, QR i cadena viu en JS pur, amb constructors immutables. El port fa explícits quatre mètodes i refusa altres funcions, incloses claus Symbol. Els registres es copien abans del resum asíncron. IndexedDB comprova l'últim registre, el duplicat i l'afegit en una transacció; això és una base sòlida per a un adaptador intercanviable.


Falten el contracte remot implementat, la concurrència entre clients al servidor, la traducció al protocol de remissió, la validació contra esquemes, el tractament de respostes i reintents, i els punts de control acceptats. La remissió està prevista al servidor, cosa coherent amb la independència de la UI. Són fases pendents declarades, no un acoblament ocult a Supabase. L'acceptació d'AEAT queda fora de les proves locals. La [documentació tècnica oficial](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/informacion-tecnica.html) és la referència per a eixa futura integració.

Al Tauler he contrastat ports injectables, autorització abans de llegir fitxers i reducció de dades sensibles en el tractor. El nom i el NIF del creditor no es retenen en la projecció revisada. Les dades importades són locals i temporals. No he confirmat el suposat error de l'ull global: el pare canvia la `key` en alternar la visibilitat, de manera que remunta les targetes amb l'estat inicial correcte. No s'ha d'arreglar una incidència que el codi actual ja evita.

### F04 · P2 · Usar UniversalCard no assegura l'anatomia completa de cada targeta


| Superfície | Contrast propi | Límit |
| --- | --- | --- |
| Consola | 19 targetes al tauler observat: 9 de navegació i 10 de xifres; boina Sóc de Poble enllaçada a /projecte, títol, subtítol i entradeta. El detall de torns caducats obri pàgina amb dada viva | Mostra independent, no cens propi de les 73 pàgines que declara Claude; la recàrrega final queda sense acreditar |
| Notícies del Lector | Boina de la font, resum i detall PaginaApp; `?article=` conserva el detall en recarregar una notícia de prova | No es passa subtítol a la targeta. Sense font, el nou fallback usa l'autor del text sense inventar Sóc de Poble; si tampoc hi ha autor, la identitat continua absent |
| Nevera, catàleg de Casa | 98 targetes observades, amb boina d'entitat; zero subtítols i zero entradetes en eixe catàleg | El clic principal commuta l'article; el detall secundari és un diàleg d'especificació. No és la pàgina completa descrita per la regla general |
| Articles privats de la Nevera | `AUTORIA_PROPIA` declara «Tu» | No té nom ni enllaç real de perfil perquè la plataforma no entrega eixa identitat a l'app; Claude ja ho reconeix |
| Tauler de Gestoria | UniversalCard amb titular i detall PaginaApp dins de la closca | Detall local en estat React, sense ruta pública; és una decisió explícita de privacitat, que cal reconciliar amb la regla de slug compartible |


**Correcció proposada:** una matriu explícita de requisits per a targeta de sistema, article extern, article privat i targeta commutable. Per als articles propis, passar la identitat amb una capacitat de plataforma, sense importar autenticació Supabase dins del catàleg. Per al contingut RSS que no té subtítol o autor, decidir l'excepció amb transparència; no inventar dades per a superar una prova. Per a la Nevera, fer accessible un detall que complisca el contracte acordat conservant la commutació. Els documents privats no han de posar dades financeres en una URL per a aparentar compliment.

### F05 · P2 · Compartir una notícia des de la targeta compartix la llista



**Correcció proposada:** passar a la targeta la ruta del detall per al peu, mantenint el retorn i el focus que gestiona `obri()`. Afegir una prova de la URL rebuda per `navigator.share` o el fallback, tant en router de navegador com de memòria. Una prova que només comprova que apareix el botó no detecta esta fallada.

### T3 · Reixeta, CSS i apilament


`GraellaTargetes` és un contenidor legítim dins de PedraSeca: reutilitza `.sdp-card-grid`, `.sdp-card-llista` i `SeccionsCategoria`; no implementa una nova closca ni duplica UniversalWorkspace. La responsabilitat de disposar targetes dins d'una columna és distinta de la de disposar les columnes del Workspace. La seua suite independent passa. Que tota app haja de passar sempre pel Workspace és un altre criteri, que no es pot deduir només del nom d'esta peça.

Els nivells centrals revisats posen la taronja a 99080, la blava a 99090, la negra a 99100 i el calaix a 99990. Un número alt no demostra per si mateix un error: importen els contextos d'apilament. Els diàlegs modals natius viuen a la capa superior. No he reproduït un solapament persistent entre la barra taronja i un diàleg, toast o menú slash. Cal una comprovació visual específica per a eixa combinació; les proves de codi no certifiquen tots els sostres enganxosos. Claude declara un front propi en curs sobre este punt.

### F06 · P3 · La documentació de la tipografia fluida contradiu els tokens


La primera passada detectà que el test encara esperava el mínim anterior. Durant l'auditoria s'ha actualitzat el test i la suite CSS posterior passa. Per tant, **no reporte aquella fallada de test com a vigent**. El comentari contradictori sí que queda: cal descriure el rang real i la directriu que el justifica, sense canviar automàticament les mides acordades.

### Ampliació del torn · Entrada personal, Sollutia i producció

**F07 · P1 d'acceptació beta · L'entrada real continua bloquejada en l'entorn observat.** Després del reinici, una pestanya nova a `http://localhost:3340/registre?mode=entrar` carrega la pàgina, però mostra «El servidor del poble no respon ara mateix. Continues en mode de proves: pots explorar l’app, però encara no pots crear el compte ni entrar». Google, correu, contrasenya, entrada i recuperació apareixen desactivats. El reintent manté el bloqueig. Açò no acredita una avaria global del backend: acredita que este entorn no supera el requisit d'accés personal.

La pantalla espera la capacitat opcional de salut del port abans de passar a remot (`OnboardingSection.jsx:132`). L'adaptador actual sonda `/auth/v1/health`, amb cinc segons de topall (`auth.js:326`), i agrupa configuració, xarxa, resposta HTTP negativa i timeout en `{ ok: false }`. La causa concreta continua pendent. Cal distingir-la al diagnòstic i confirmar la configuració del node de proves; no llevar la guarda per a simular que l'entrada funciona. No he escrit credencials ni creat comptes.

**Aclariment posterior de Claude al relleu 20:** el node local `127.0.0.1:54321` està apagat. El contrast propi del port no troba cap procés escoltant; corrobora l'absència del servei local, sense exposar secrets de configuració. Per tant, F07 és un bloqueig d'acceptació de l'entorn de proves, **sense regressió de codi demostrada**. El ZIP de producció apunta a un node remot diferent i no se n'ha provat una entrada real: no traslladar la conclusió de localhost a Gent de la Torre.

**La frontera d'entrada és modular en l'abast llegit:** UI i SessionContext consumixen el port genèric; les crides GoTrue es queden a l'adaptador. Salut i recuperació són opcionals. RequireAuth espera la resolució de sessió i usa permisos del contracte; no substituïx l'autorització del servidor. Això permet adaptar Sollutia sense importar Supabase a la UI, però encara no hi ha una prova amb els endpoints de Sollutia.

**F08 · P2 de verificació · Marcatge WordPress i tests no sincronitzats.** Les 56 proves de plugin, pantalla, runtime i empaquetat donen 55 passades i una fallada. `tests/enxufe-plugin.test.mjs:183` espera sis atributs; PHP pot emetre també `base-path` i `ruta-a-url`. `contracteAmfitrio.js:57` declara base-path i reserva ruta-a-url com a opt-in. Cal reconciliar la prova amb el contracte i verificar l'emissió condicional. No és evidència suficient d'una avaria del connector ni d'acoblament al proveïdor.

**Avatar personal:** el canvi vigent usa Avatar `lg`, actualment 56 px segons els tokens, per damunt del mínim de 48. Per a una persona amb una sola identitat, el botó porta a `/el-meu-perfil`; amb organitzacions conserva el selector d'identitat. Les dues suites d'identitat i el cas de perfil propi d'App passen al repàs aïllat. És un contrast de DOM, props i CSS; el bloqueig d'entrada impedix acreditar eixe avatar amb el compte real del Mestre.

**Paquet final encara pendent.** `stable.json` declara 1.0.2, generada a les 05:27 locals. He contrastat el ZIP `socdepoble-enxufe-v1.0.2-261004_0527.zip`, la seua entrada JS i l'inventari amb **215 fitxers: zero divergències de mida/hash**. SHA-256 del ZIP: `1fcc32db6816a954b49b8289444f8bfe2293744622a92687b638c4353b1f47a3`. La coherència d'eixe paquet antic no acredita els poliments posteriors. Claude anuncia preparar 1.0.3 i un guió d'empaquetat, amb compilació per MarIA o el Mestre perquè el seu hook bloqueja npm/vite; no hi ha un artefacte nou observat al tall. No s'ha desplegat a Gent de la Torre.

El relleu específic [[261004_1045_auditoria_codex]] conté l'ordre de contrast per a Claude. Una passada final estable ha de provar l'URL d'article compartida, el salt de l'Índex i les capes en l'amfitrió previst, les quatre reproduccions comptables amb els pegats, la configuració d'entrada del node i els bytes del paquet nou. Les correccions anunciades al relleu 20 són un pla acceptat, encara no una verificació completada.

### Portes generals

La porta Sollutia passa les comprovacions S1, S3 i S4. Això acredita la frontera que inspecciona eixa porta; no acredita la remissió de factures ni un WordPress/Joomla real.

La porta de tokens dona 160 incidències i la de graella, 9. No equivalen a 169 regressions nocturnes: el detector també compta tokens sintètics de tests i variables locals legítimes, i la graella denuncia divergències entre props i documentació. Hi ha referències CSS antigues desconegudes, com `--sdp-text-sm` i `--sdp-text-sec`. Cal classificar-les per fitxer i antiguitat abans d'atribuir-les a Claude. Sí que impedixen proclamar una arquitectura global amb totes les portes verdes.

`run-portes.mjs` passa Plantilles i Autoritat i es para en el segell de skills: hash actual diferent del segell guardat. No s'han executat les portes posteriors d'eixe runner. No he actualitzat el segell per a convertir esta discrepància en un verd administratiu.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Proves executades

Totes les passades Vitest pròpies usen un worker. Les xifres de passades que se solapen no se sumen com si foren tests distints.

| Ordre / abast | Resultat | Interpretació |
| --- | --- | --- |
| `vitest run src/sections/gestoria --maxWorkers=1 --reporter=dot` · 10:11 | 74 fitxers, 1.991/1.991 | Verd inicial de Gestoria; hi ha canvis posteriors |
| CSS, UniversalCard, PageFrame, Consola, Lector, Nevera i esquelet comú · 10:19 | 75 fitxers; 1.477 passades, 1 fallada i 1 omesa | Fallada del literal antic en `tokens.contracte.test.js:144`; corregida durant el torn |
| Facturació, Tauler, CSS, AppLector i Temporada · 10:28 | 30 fitxers; 544 passades i 6 fallades | Sis expectatives del Tauler anteriors a les etiquetes privades i als valors absents nous; no fallades del hash ni d'IndexedDB |
| Tres fitxers afectats del Tauler + GraellaTargetes · 10:36 | 4 fitxers, 53/53 | Correccions concurrents contrastades; les sis fallades anteriors deixen de ser vigents |
| ESLint de facturació, Tauler, Consola, Lector, Nevera, ColumnaCataleg i UniversalCard amb `--max-warnings=0` | Eixida 0, sense avisos | Tall anterior als últims canvis de Consola; no certificat de tots els canvis posteriors |
| Quatre casos adversos del llibre · repetits a les 10:35 | F01, dos casos de F02 i F03 reproduïts | Continuen presents malgrat els tests ordinaris verds |
| `tractor-sollutia.mjs` | Verd, S1/S3/S4 sense incidències | Frontera del proveïdor revisada |
| `tractor-tokens.mjs` / `tractor-graella.mjs` | Roig: 160 / 9 | Diagnòstic global; atribució i falsos positius pendents |
| Sessió, auth, recuperació, onboarding, App i configuració, 20 fitxers | 397 passades / 5 fallades | Les 5 fallades són a App; 19 suites passen. Simulacions, sense credencials reals |
| App + dues suites d'identitat, repàs aïllat | 94 passades / 2 fallades | Xat i Consola ja passen; continuen discrepàncies de barra mòbil i Telefonades |
| Connector WordPress, 56 proves Node/PHP/fixtures | 55 passades / 1 fallada | Marcatge i expectativa del contracte divergents; sense servidor WordPress real |
| ZIP 1.0.2 de les 05:27 | Inventari 215/215 coherent | És anterior als poliments finals; cap artefacte 1.0.3 contrastat |
| `run-portes.mjs` | Roig en el segell de skills | Runner interromput abans de completar la cadena |

Ordre exacta de la passada de les 10:19:

```sh
```

Ordre exacta de la passada de les 10:28:

```sh
```

### Casos oficials 1 i 2

He contrastat els vectors de `empremta.test.js` amb els casos 1 i 2 del PDF oficial, pàgines 10 i 11. Coincidixen els dos resultats i l'ordre de camps amb l'especificació; el càlcul SHA-256 és correcte en estos vectors. Això no valida tota la factura ni una futura resposta del servei. Font: [AEAT, especificació d'empremta v0.1.2](https://www.agenciatributaria.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/Veri-Factu_especificaciones_huella_hash_registros.pdf).

```text
Cas 1: 3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60
Cas 2: F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97
```

### Reproducció autocontinguda de F01–F03

Executar des de l'arrel `socdepoble.org` amb Node. Només usa memòria, sense backend, fitxers de factures ni escriptura a IndexedDB. El cas de llegat assumeix una política F/2026 i pas 04/10 per a demostrar que la guarda aïllada i l'alta estan desconnectades.

```sh
node --input-type=module <<'JS'
const instant = Date.UTC(2026, 9, 4, 10);
const domicili = { adreca: 'Plaça de Prova, 1', codiPostal: '46999', poblacio: 'Poble de Prova' };
const f = (numSerie, dataExpedicio = '2026-10-04') => creaFacturaEmesa({
  tipus: 'F1', numSerie, dataExpedicio,
  emissor: { nif: 'B12345674', nom: 'Emissor de prova', domicili },
  destinatari: { nif: ['1234', '5678', 'Z'].join(''), nom: 'Client de prova', domicili },
  descripcio: 'Servici de prova',
  linies: [{ concepte: 'Servici', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }]
});
const p1 = creaPortMemoria();
const primer = await registraAlta(p1, f('A2026-0001'), { instant });
const segon = JSON.parse(JSON.stringify(await creaRegistreAlta({
  factura: f('A2026-0002'), anterior: primer, instant: instant + 1000
})));
segon.encadenament.numSerie = 'A2026-0999';
await p1.afegix(segon);
console.log('F01', (await p1.llig()).length, await verificaCadena(await p1.llig()));
const p2 = creaPortMemoria();
await registraAlta(p2, f('A2026-0001', '2026-10-03'), { instant });
await registraAlta(p2, f('A2026-0001', '2026-10-04'), { instant: instant + 1000 });
console.log('F02 número', (await p2.llig()).length, (await verificaCadena(await p2.llig())).valida);
const p3 = creaPortMemoria();
await registraAlta(p3, f('F260001', '2026-10-03'), { instant });
let guarda;
try {
  comprovaEmissio({ prefix: 'F', any: 2026 }, {
    llegat: [{ prefix: 'F', any: 2026 }], dataPas: '2026-10-04', dataExpedicio: '2026-10-03'
  });
} catch (e) { guarda = e.codi; }
console.log('F02 llegat', (await p3.ultim('B12345674')).numSerie, guarda);
const p4 = creaPortMemoria();
await registraAlta(p4, f('A2026-0001'), { instant });
const copia = JSON.parse(await p4.exporta());
copia.registres[0].factura.descripcio = 'Una descripció diferent';
console.log('F03 verifica', (await verificaCadena(copia.registres)).valida);
console.log('F03 restaura', await restauraCopia(p4, JSON.stringify(copia), { verifica: verificaCadena }));
console.log('F03 textos', copia.registres[0].factura.descripcio, (await p4.ultim('B12345674')).factura.descripcio);
JS
```

Resultats observats: F01 guarda dos registres i dona TRENCAMENT; F02 guarda els dos números iguals amb cadena vàlida i també F260001 malgrat SERIE_CONFUSA en la guarda; F03 dona verificació vàlida, zero afegits i textos diferents.

### Navegador local

He observat `http://localhost:3340`: Consola, una xifra amb detall, Notícies i catàleg de la Nevera. L'article de prova conserva el detall amb `?article=` després de recarregar; el clic marca la notícia llegida i he restaurat l'estat de no llegida en acabar. No he enviat cap missatge, compartició ni formulari extern, ni he importat dades comptables reals.

Les amplades CSS efectives llegides del navegador eren 1.000 i 312 px, encara que l'eina demanava 1.200 i 375: no les presente com una certificació de 375 px. A les pantalles observades no hi havia desbordament horitzontal del document. A 312 px, el catàleg conserva columnes estretes i fragmenta alguns noms; cal contrastar les mides acordades i un iPad real abans de certificar eixa UX. S'ha restablit la mida del navegador.

A les 10:33, el navegador registra un error concurrent de Vite: `Identifier 'senseMesura' has already been declared`, amb recàrregues fallides de peces de Consola. A les 10:35, `node --check src/sections/consola/xifresComu.js` ja passa: no el classifique com a defecte sintàctic vigent. La recàrrega següent acaba amb connexió refusada i no hi ha procés escoltant al port 3340. La recuperació visual final de la Consola queda sense acreditar; no he atribuït l'aturada del servidor a un error permanent del producte.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Tall i concurrència

El HEAD ha sigut estable, però l'arbre de treball no: al manifest de les 10:35 hi ha **57 de 604 fitxers vigilats diferents** respecte de l'inici. El relat de Claude continua rebent relleus, i les proves i el navegador han coincidit amb eixes mutacions. L'informe acredita els casos i els talls indicats, no una fotografia immutable de tota la macro-onada.

Manifest de les 10:35, SHA-256: `7a61402e86a2737bad4880e057e87c23e5f20b38ebc457395da2b5f5ea2374d8`. Evidències temporals a `/tmp/sdp-audit-codex-initial.json`, `/tmp/sdp-audit-codex-final.json` i `/tmp/sdp-audit-*.log`; les reproduccions essencials estan copiades ací per a no dependre de la supervivència de `/tmp`.

Empremtes de les fonts que sostenen els defectes comptables al tall de les 10:38:

| Font | SHA-256 |
| --- | --- |
| `facturacio/registre/port.js` | b2e9330900b4144bffcad29ef4fbb69aa44f14c0e26f45362449966e9d66fa2b |
| `facturacio/registre/cadena.js` | ffb3b6c5ea7de8ff85c38a746eb7fa997ec45e14e59d1c6171ecc19e72771c87 |
| `facturacio/registre/validacio.js` | 7798874f726079c2b5e767594fcbfa24605d19028ecf9857aff13aa171380898 |
| `facturacio/serie.js` | 91121c738436c8064a9c5ee90061f029de5c3ca5d825e24a9991abba4e90b6b4 |
| `lector/vistes/Noticies.jsx` | 15871546415e27362d88f3363c4b2b28e774897309f6b21fd91002a81189bde0 |
| `comu/esquelet/ColumnaCataleg.jsx` | 60aa9505a476ed7b60f450b9f2e6cbec77d952f494045297505809b58135556a |

### Governança i abast

Lectures obligatòries fetes: AGENTS, genotip, índex de Wiki, taxonomia i procediments locals pertinents. S'han llegit sencers els documents actius de l'Escriptori i l'índex; del relat viu de Claude, també els relleus fins al 20. Això inclou els prompts de les 05:15, 10:06, 10:42 i 10:45, el pla de les 05:15, les instruccions UX, triatge, Animalets i la nota de les 10:15. Els documents de producció/investigació i els exemples de NEXUS s'han llegit com a context; no s'han adoptat com a encàrrecs ni com a skills noves. La lectura no autoritza a executar les tasques ajornades o a modificar zones humanes.

La plantilla diu que este prompt és el pla d'auditoria. He intentat vincular el document de les 10:06 al torn, però `bindPlan()` el refusa perquè té `type: prompt` i exigix `type: document`; missatge «Pla invàlid». No he alterat el prompt ni vinculat un pla alié per a fer passar el tràmit. El pla substantiu aplicat és T1–T4 d'esta ordre; el torn mecànic continua `context_loaded`.

El tancament inicial dona 1.185 incidències, abans de completar este informe. El contrast final `tancament.mjs --check`, després d'omplir i validar els dos informes i escriure ESTAT/LEDGER, dona **valid:false, 1.208 incidències, context_loaded**. Plantilles, Autoritat i catàleg de skills passen; LEDGER, segell, compilació estricta de Wiki i SCC fallen. Inclou el pla mecànic absent, canvis concurrents fora de l'abast documental, prompts aliens amb telemetria pendent, instruccions sense frontmatter i deute global previ. **No és un recompte de 1.208 defectes de producte ni de regressions de Claude.** Els dos informes propis passen `document.mjs check`; Olivera també passa. No s'ha resegellat ni tancat el torn en fals.

La signatura del LEDGER ja era invàlida abans d'afegir els relleus propis: el contrast previ conservat dona una empremta distinta de la seua signatura terminal. Les entrades noves preserven la història; no s'ha recalculat un segell per a certificar-la sense reconciliació.

Al tall documental final s'han llegit també els prompts urgents 1106 i 1108 per a Claude: accés permanent a les barres del Workspace/Wiki i logotips grans en pàgines d'entitat. Són nous criteris per a la integració final, encara en diagnòstic al relat llegit. No els presente com a canvis ja verificats. El manifest de les fonts vigilades de les 11:09 té **101 de 604 fitxers diferents** respecte de l'inici; SHA-256 `cb2a96938ca5dbb9ec8f3488ff4af6d1b906966ce849ba7bc70ec939804d19d4`. Les sis fonts principals de F01–F05 continuen amb les empremtes de la taula al repàs posterior.

El prompt urgent 1111, pull-to-refresh mòbil, també s'ha llegit sencer. És un requisit nou per al candidat de Claude; no s'ha implementat ni verificat en esta auditoria de lectura.

No s'ha executat `npm run build`: el prebuild regenera artefactes de la Wiki i hauria introduït escriptures alienes a una auditoria de lectura. No s'ha provat la remissió AEAT, un backend Sollutia real, WordPress/Joomla d'extrem a extrem ni Safari/iPad físic. Les proves sintètiques no són una acreditació normativa ni una validació de producció. No s'han creat automatitzacions, desplegaments, commits ni nous equips d'agents.

La lectura de context abasta els documents Markdown presents i els relleus actius indicats; els laboratoris històrics de `02_investigacio_ia/` contenen molts prototips `.txt` i còpies de codi que no s'han carregat en bloc. La fórmula «qualsevol document» del prompt no distingix eixe material del relleu actiu: cal un manifest de lectura explícit, com proposa l'automillora. No declare una lectura íntegra de tot eixe laboratori ni una revalidació de les seues propostes.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261004_1045_auditoria_codex]]
- [[taxonomia_documental]]
- [[261004_0605_auditoria_claude]]
- [[261004_0515_pla_implementacio_claude]]

## Proposta d'Automillora

### Anàlisi del prompt

**Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient:** «Audita en lectura el commit X més el manifest WIP Y, contrastant T1–T4. Usa el pla documental Z, de tipus document i vinculat al torn. Llig el manifest de documents actius següent. Classifica cada troballa com nova, coneguda, corregida o pendent, amb reproducció i hash de font. No modifiques producte. Lliura l'informe 261004_1010 i executa les portes documentals.»

Les friccions concretes que cal resoldre són:

1. **Pla declarat contra pla mecànic.** El prompt es proclama pla, mentre el vinculador només admet `type: document`. La instrucció de refusar qualsevol prompt sense Pla d'Implementació també és ambigua quan no hi ha una secció amb eixe nom però sí tasques suficients. Unificar el contracte, sense refusar una auditoria autoritzada per una discrepància de tipus.
2. **Tall imprecís.** «HEAD + 10:06» no fixa els canvis no confirmats ni els fitxers nous. Exigir commit, diff i manifest amb hashes, i separar la passada estable de les correccions que vinguen després.
3. **Context sense frontera.** «Qualsevol document a 04_escriptori» pot incloure laboratoris permanents i zones humanes. Enumerar els documents solts actius i els recursos seleccionats, amb lectura íntegra d'eixe conjunt. No buidar ni recórrer cegament tota la jerarquia.
4. **Regla universal contra necessitats particulars.** Slug compartible, commutació de la Nevera i privacitat comptable no són la mateixa interacció. Fixar una matriu d'acceptació i excepcions; també per a subtítols i autoria absents en RSS extern.
5. **Visió futura contra obligació actual.** Offline-first és una visió del prompt; el genotip operatiu manté online-first. «Enxufabilitat instantània» no acredita la fase de remissió fiscal. Separar principis vigents, objectius futurs i proves mínimes del port.
6. **Telemetria no disponible.** Exigir tokens exactes sense donar un comptador força valors inventats o pendents. El generador ha d'injectar la mesura, o admetre «no disponible» amb motiu. Zero no és una mesura vàlida per defecte.
7. **Duplicació normativa.** La còpia íntegra conserva la traça, però repetir història, ordres de lectura i criteris en diversos llocs facilita contradiccions. Mantindre una autoritat única per regla i fer explícites les excepcions del torn; qualsevol canvi de plantilla s'ha de tramitar pel circuit canònic, no modificar-la ací.

### Capacitats i flux de treball de l'equip

No tinc evidència per a afirmar que haja aparegut una capacitat nova del model en una actualització recent, ni per a inventar la variant o el consum d'este torn. Sí que estan disponibles ara la inspecció directa del repositori, execució de proves, navegador local i documents persistents. L'app també documenta worktrees, revisió Git, skills i tasques programades; són capacitats del producte, no una garantia automàtica de qualitat. Font: [OpenAI, funcions de l'app Codex](https://learn.chatgpt.com/docs/whats-new#the-codex-app-launches-on-macos).

**Exigència de procés per al nucli MarIA + Claude + Codex:** MarIA entrega un tall identificable; Claude és l'escriptor del front acordat; Codex audita eixe tall en un checkout separat i entrega casos adversos i hashes. Les reparacions entren en una passada posterior amb delta concret. Un worktree creat només des de HEAD no copia el WIP: cal preservar explícitament els canvis necessaris abans de declarar-lo representatiu. No cal que tres IAs editen simultàniament els mateixos fitxers.

Cada troballa ha de portar ID estable, prioritat, origen nou/conegut, passos, resultat observat, resultat esperat i última font contrastada. Una sola passada final de proves després d'integrar, amb pressupost de workers acordat, evita atribuir temps límit a errors funcionals quan la màquina està carregada. La memòria útil del torn és l'informe amb reproduccions i l'estat de relleu, no la promesa que el xat ho recordarà tot; és coherent amb el [flux oficial de treball llarg de Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex).

Les automatitzacions o agents en paral·lel poden servir en un encàrrec futur explícit. En esta auditoria no s'han activat: el guany immediat és un tall estable, una frontera d'escriptura i una validació que no suma resultats de versions diferents.
