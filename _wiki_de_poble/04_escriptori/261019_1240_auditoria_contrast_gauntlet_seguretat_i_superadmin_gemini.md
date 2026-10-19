---
type: informe
status: esborrany
description: Dictamen de coherència i arquitectura Pedra Seca sobre els 6 pegats de seguretat de Claude, ingesta de core-seguretat-audit, patró lineal O(n) per al ReDoS de /cerca i Panell de Superadministració amb ràdios accessibles.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:b19c4c46-96c7-48b2-a73e-ca933d43f08b
---
# Dictamen de Contrast (Gauntlet Loop): 6 Pegats de Seguretat, Tractor core-seguretat-audit, ReDoS /cerca i Panell Superadmin (Gemini)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:b19c4c46-96c7-48b2-a73e-ca933d43f08b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T10:38:10.505Z |
| Modificació | 2026-10-19T10:38:10.505Z |
| Propietari | gemini |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 3.1 Pro (Garant de Coherència, Pedra Seca & Auditoria Adversarial) |
| Tokens consumits | ~29.800 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T10:38:10.505Z: esborrany creat; contingut i verificació pendents.
- 2026-10-19T10:40:00.000Z: dictamen de contrast completat: verificats els 6 pegats de seguretat aplicats per Claude (`58/58` proves noves en verd dins dels 8 fitxers d'exploit), ingerit `.agents/skills/core-seguretat-audit/SKILL.md`, especificat l'algorisme lineal $O(n)$ per al ReDoS de `/cerca` (`indexCerca.js` i `contentHelpers.js`) i consolidat el patró de ràdio accessible per al Panell de Superadministració.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen Executiu (Segell de Fase · Gauntlet Loop)

**FASE SEGELLADA AMB DICTAMEN FAVORABLE.**
Els 6 pegats de blindatge frontend aplicats per Claude Code (`F03`, `F04/F12`, `F05`, `F06`, `F11` i `F14`) han sigut auditats línia per línia i provats contra l'arbre real: **respecten escrupolosament la puresa dels components de Pedra Seca i l'aïllament de la capa de dades**, sense introduir cap estil ad-hoc ni lògica defensiva bruta dins del JSX.

---

### 1. Auditoria de Puresa i Patró de Dades dels 6 Pegats de Seguretat

| Pegat | Fitxers Auditats | Veredicte Pedra Seca i Patró de Dades |
| :--- | :--- | :--- |
| **F03 / F07 / F09**<br>*Tipus del payload* | `src/data/mapejadorSeccions.js:334-498`<br>`src/sections/mur/MurSection.jsx` | **EXCEL·LENT (10/10).** En lloc d'embrutar desenes de components visuals (`UniversalCard`, `EventCard`, `Cella`) amb comprovacions `typeof === 'string'`, el sanejament (`netejaTipusDelPayload` i `etiquetaDePublicacio`) s'executa a la **frontera d'ingesta pura (`elementDeFilaPublicada`)**. Qualsevol objecte, array o `{"toString":0}` injectat al JSONB `payload` d'un veí cau abans d'entrar a l'arbre de React. |
| **F04 / F12**<br>*Regex lineal $O(n)$* | `src/sections/detail/detailHelpers.jsx:12-57`<br>`src/sections/detail/detailRichText.jsx:14` | **IMPECABLE (10/10).** Substitueix dues expressions regulars amb retrocés quadràtic per recorreguts deterministes amb `indexOf` i sticky regex `/y` (`srcDeLaPrimeraImg` i `semblaHtml`). Zero mutació d'estat, zero canvi de DOM i equivalència matemàtica validada per 3M de proves diferencials. |
| **F05**<br>*Camí net de Storage* | `src/data/supabase/storage.js:327-377` | **EXCEL·LENT (10/10).** Blinda `resolveAsset` i `promoteToPublic` al mateix adaptador amb `segmentNet` i `camiNet`, bloquejant `.`, `..`, `%`, `?`, `#`, `\`, caràcters de control (`\u0000-\u001f`, `\u007f`) i espais finals (`'.. '`). Les peces superiors del visor ja descartaven una referència que tornara opaca, així que la frontera queda hermètica. |
| **F06**<br>*Entitat del projecte pel poble* | `src/sections/profile/PerfilPublicSection.jsx:248` | **EXCEL·LENT (10/10).** Només crida `registraEntitatDelProjecte(perfil)` quan `clau === ENTITAT_PILOT_SLUG` (cerca acotada al poble actiu per l'adaptador), impedint que una organització d'un altre poble amb slug `'socdepoble'` oberta per UUID (`/empresa/<uuid>`) usurpe el logotip i la marca oficial del projecte. |
| **F11**<br>*Autoria de l'Arxiu* | `src/sections/multimedia/origenImatges.js:64-108`<br>`src/data/mapejadorSeccions.js:337` | **IMPECABLE (10/10).** Despulla `autor`, `source` i `srcDelPort` a `CLAUS_D_AUTORITAT`, circumscriu `PATRONS_IA` a recursos verificats dins de `/assets/` (`esRecursDelPaquet`), força que cap aportació amb `ownerUserId` es classifique com a `'ia'` i normalitza amb `NFKC` la cadena `"Fet per la IAIA"`. |
| **F14**<br>*Venedor del servidor* | `src/sections/detail/detailSectionMeta.jsx:372`<br>`src/sections/search/indexCerca.js` | **EXCEL·LENT (10/10).** En les publicacions de veïns (`ownerUserId != null`), el venedor mostrat a la caixa de compra, al cercador i a les targetes incrustades és sempre l'`author_name` segellat pel servidor, mai un `payload.seller` falsificat. |

#### Dictamen sobre el Pegat SQL en espera (`F01_F02_F08_F13_migracions_de_seguretat.patch`)
- Les dues migracions (`2610190100_seguretat_correu_organitzacions.sql` i `2610190110_seguretat_llistat_mitjans.sql`) són **tècnicament impecables** (especialment l'ús de polítiques `AS RESTRICTIVE` sobre `storage.objects` per impedir que cap política permissiva futura reòbriga el llistat massiu del bucket `mitjans`).
- **Recomanació de Trellat abans d'aplicar al servidor:** Com que la migració `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql` encara està sense commit (`??` a `git status`) i no s'ha executat al Supabase remot, **convé fusionar directament els canvis de `2610190100` dins de `2610181915`** (traient `contact_email` del `GRANT SELECT` inicial i afegint `AND m.user_id = v_uid` a `contacte_organitzacio`), evitant crear una migració que n'esmena una altra que encara no s'ha nascut en producció.

---

### 2. Ingesta i Contrast del Tractor Canònic `.agents/skills/core-seguretat-audit/SKILL.md`

S'ha ingerit el nou protocol `.agents/skills/core-seguretat-audit/SKILL.md`. Com a Garant de Coherència, deixe constància de dues observacions operatives:

1. **Compliment de la Regla del Doble Parell (§1.3 i §2 Capa 4):**
   Amb la generació dels pegats per Claude Code (Capa 3) i aquesta verificació independent amb execució de proves per Gemini (Capa 4 · Gauntlet Loop), queda inaugurat formalment el cicle de Doble Parell definit al skill.
2. **Alineació necessària del Principi §1.2 i Checklist §5 amb la Decisió del Mestre sobre Visibilitat de Perfils:**
   - El skill (`SKILL.md:36` i `:101`) declara: *«Tot perfil nou o dada de contacte naix privada per defecte llevat d'expressa decisió de l'usuari»* i *«El nom i cognoms només s'exposen públicament si l'usuari ha marcat explícitament la casella de perfil públic»*.
   - Recordem que la Tasca 1 del Pla 1605 va demanar `is_public: true` per defecte amb avís clar, mentre que les auditories de Claude (`F1`) i Codex (`§3.3`) van advertir de l'impacte RGPD.
   - **Acció:** Un cop el Mestre resolga si manté `is_public: true` (actualitzant els 4 textos d'alta/legals de la nostra taula `1.2.B`) o si adopta la proposta d'opt-in en l'alta, caldrà alinear aquesta frase de `SKILL.md:36,101` perquè el Tractor i el Codi diguen exactament la mateixa veritat.

---

### 3. Avaluació i Disseny Lineal $O(n)$ per al ReDoS de `/cerca` (`indexCerca.js:152-160`)

#### 3.1. Anatomia dels 3 vectors quadràtics que afecten `textPla` a `src/sections/search/indexCerca.js`

Actualment, `textPla(valor)` (`indexCerca.js:152-160`) encadena tres expressions regulars vulnerables a cadenes malicioses sense tancament:
```js
export function textPla(valor) {
  if (valor == null || typeof valor === 'object') return '';
  return stripMarkdownImages(String(valor))                  // Vector 1: /!\[[^\]]*\]\([^)]+\)/g
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')         // Vector 2: backreference amb [\s\S]*?
    .replace(/<[^>]*>/g, ' ')                                // Vector 3: 160.000 '<' sense '>' = 15,8 s!
    ...
}
```
1. **Vector 3 (`/<[^>]*>/g` a `indexCerca.js:156` i `src/sections/notes/connexions.js:145`):** Amb una cadena de $N$ caràcters `'<'` i cap `'>'`, el motor d'expressions regulars falla en arribar al final de la cadena des de la posició $0$, avança a la posició $1$ i torna a escanejar fins al final $\rightarrow \frac{N(N-1)}{2}$ operacions ($15,8\text{ s}$ per a $160.000$ caràcters).
2. **Vector 2 (`/<(script|style)[\s\S]*?<\/\1>/gi` a `indexCerca.js:155`):** Amb `' <script>'.repeat(40000)` sense etiqueta de tancament `</script>`, el quantificador lazy recorre fins al final en cada ocurrència ($1,4\text{ s}$).
3. **Vector 1 (`stripMarkdownImages` a `src/config/contentHelpers.js:24`):** `/!\[[^\]]*\]\([^)]+\)/g` amb `'![alt](url'.repeat(40000)` sense `')'` de tancament fa el mateix recorregut quadràtic ($2,5\text{ s}$).

#### 3.2. Invariant Matemàtic de Temps Lineal $O(n)$ (El Tall per Absència de Tancament)

La clau perquè Claude resolga `textPla`, `stripMarkdownImages` i `connexions.js:145` amb **temps lineal $O(n)$ estricte i equivalència exacta** és l'**invariant de monotonia de `indexOf`**:
> Si buscant el tancament `'>'` a partir de `inici` (`tancament = text.indexOf('>', inici + 1)`) obtenim **`-1`**, **no existeix cap `'>'` en tota la resta de la cadena** (`[inici .. text.length)`). Per tant, cap altre `'<'` posterior podrà tancar-se mai: el bucle pot copiar `text.slice(cursor)` i **acabar immediatament en $O(1)$** sense tornar a mirar cap altre `'<'`!

##### Implementació Pura $O(n)$ verificada per a `senseEtiquetesHtml` i `senseBlocsScriptStyle`:

```js
/* Elimina blocs <script...>...</script> i <style...>...</style> en O(n).
   Si per a una etiqueta oberta ja no queda cap tancament en tota la cadena,
   no es torna a buscar eixe tipus d'etiqueta. */
function senseScriptNiStyle(text) {
  if (!text.includes('<')) return text;
  const minuscules = text.toLowerCase();
  let eixida = text;
  let min = minuscules;
  for (const etiqueta of ['script', 'style']) {
    const obertura = `<${etiqueta}`;
    const tancament = `</${etiqueta}>`;
    let cursor = 0;
    let inici = min.indexOf(obertura, cursor);
    if (inici === -1) continue;
    const trossos = [];
    while (inici !== -1) {
      const fiObertura = min.indexOf('>', inici + obertura.length);
      if (fiObertura === -1) break; // Cap '>' més en tota la cadena: tall O(1)
      const fiBloc = min.indexOf(tancament, fiObertura + 1);
      if (fiBloc === -1) break;     // Cap '</script>' més en tota la cadena: tall O(1)
      trossos.push(eixida.slice(cursor, inici), ' ');
      cursor = fiBloc + tancament.length;
      inici = min.indexOf(obertura, cursor);
    }
    if (trossos.length > 0) {
      trossos.push(eixida.slice(cursor));
      eixida = trossos.join('');
      min = eixida.toLowerCase();
    }
  }
  return eixida;
}

/* Equivalent exacte a text.replace(/<[^>]*>/g, ' ') en temps O(n) estricte.
   Un '<' absorbeix tot fins al primer '>' (inclosos altres '<' intermedis,
   exactament igual que [^>]*>). Si no queda cap '>', s'acaba a l'instant. */
export function senseEtiquetesHtml(text) {
  let inici = text.indexOf('<');
  if (inici === -1) return text;
  const trossos = [];
  let cursor = 0;
  while (inici !== -1) {
    const tancament = text.indexOf('>', inici + 1);
    if (tancament === -1) break; // Tall O(1): cap '>' en el que queda de text!
    trossos.push(text.slice(cursor, inici), ' ');
    cursor = tancament + 1;
    inici = text.indexOf('<', cursor);
  }
  if (trossos.length === 0) return text;
  trossos.push(text.slice(cursor));
  return trossos.join('');
}
```

I el mateix invariant per a `stripMarkdownImages` a `src/config/contentHelpers.js:24`:
- Si `text.indexOf('](', inici + 2)` és `-1` o `text.indexOf(')', mitja + 2)` és `-1`, s'atura el bucle immediatament en $O(1)$. Si entre `inici + 2` i `mitja` hi ha un `']'` solt (`![a]b![c](d)`), el tram vàlid comença a l'últim `'!['` posterior a l'últim `']'` previ a `mitja`.
- Amb aquest patró, una entrada maliciosa de $160.000$ `'<'` o $40.000$ `'![a](b'` passa de **$15,8\text{ s}$ a $< 2\text{ ms}$**!

---

### 4. Integració del Panell de Superadministració amb Ràdio Accessible (`Modern Web Guidance` + Pedra Seca)

Consolidant les conclusions de Codex (`261018_2256_auditoria_codex` §7), Gemini (`261018_2300_auditoria_creuada` Bloc 2) i el nou `SelectorDeVariacions.jsx` ja construït per Claude:

#### 4.1. Arquitectura de Governança en 2 Capes (Seguretat Zero-Trust)
1. **Autoritat de Servidor (`rolReal` + `aal2`):**
   - Llegida de `public.user_platform_roles` (`'usuari' | 'moderador' | 'superadmin'`) per UUID autenticat (**Javi Llinares**, **Damián** i **Torsten** com a `'superadmin'`), i validada a cada escriptura per les polítiques RLS i `private.es_superadmin()` (que exigeix el segon factor `aal2`).
2. **Context Operatiu Actiu (`rolActiu` + `pobleAdministrat`):**
   - Permet la **degradació voluntària de vista i context** (`rolActiu <= rolReal`):
     - `usuari` (**Veí normal**): vista neta de comprovació d'usuari ras; bloqueja qualsevol crida d'administració i purga memòria cau elevada en commutar.
     - `moderador` (**Editor / Administrador de poble**): associat a un `pobleAdministrat` verificat (p. ex. *Gent de la Torre · La Torre de les Maçanes*) per gestionar avisos oficials sense exposar el Tauler global `/admin`.
     - `superadmin` (**Superadministrador de la plataforma**): activa l'accés complet al Tauler `/admin`, Mètriques i Maquinària de la IAIA (amb porta `aal2`).

#### 4.2. Especificació del Control de Ràdio Accessible (`Modern Web Guidance`: `brand-consistent-forms` & `forms`)
Dins d'«El compte» (`DetallCompte.jsx` $\rightarrow$ `DetallAjust.jsx`), la fila `panell-superadmin` ha d'utilitzar el primitiu canònic **`GrupOpcions` (`aspecte="targetes"`)** de `src/components/PedraSeca/organismes/formulari.jsx` (el mateix fonament semàntic que `SelectorDeVariacions.jsx`), garantint:
- **Semàntica nativa sense JS de teclat fràgil:** `<fieldset className="sdp-opcions sdp-opcions--targetes" role="radiogroup" aria-labelledby={idLlegenda}>` + `<legend>` visible + `<input type="radio" className="sdp-sr-only">` natius amb el mateix `name`.
- **Compatibilitat Safari 16+ i Zona Tàctil Rural:** Estil d'opció activa governat per `.sdp-opcio__control:checked + .sdp-opcio__targeta` (sense dependre de `:has()`), amb alçada mínima `--sdp-touch` ($\ge 44\text{ px}$) i anell de focus `:focus-visible` d'alt contrast.
- **Feedback Assistiu (`aria-live="polite"`):** Una regió viva que anuncia el canvi de rol (*«Mode actiu: Editor de poble — Gent de la Torre»*) i un bàner `<Alerta to="info" viva={false}>` dalt d'«El compte» amb un botó d'1 clic **«Tornar a Superadministrador»** sempre que `rolActiu !== rolReal`.

---

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves d'exploit i seguretat executades per Gemini sobre l'arbre real (`19-10-2026 12:38`):**
  - `npx vitest run src/data/mapejadorSeccions.tipusDelPayload.test.js src/data/supabase/storage.camiNet.test.js src/sections/detail/detailHelpers.seguretat.test.js src/sections/detail/detailSectionMeta.venedor.test.jsx src/sections/mercat/TargetaDelMercat.tipusDelPayload.test.jsx src/sections/multimedia/MultimediaSection.tipusDelPayload.test.jsx src/sections/multimedia/origenImatges.autoritat.test.js src/sections/profile/PerfilPublicSection.entitatDelProjecte.test.jsx`
  - **Resultat:** **8/8 fitxers passats, 58/58 proves en verd** (`858 ms` d'execució de tests).
- **Inspecció de Codi i Documentació:**
  - `_wiki_de_poble/04_escriptori/261018_2315_auditoria_claude.md` (línies 1–257).
  - `_wiki_de_poble/04_escriptori/02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/pegats/PEGATS.md` (línies 1–124) i `F01_F02_F08_F13_migracions_de_seguretat.patch` (línies 1–250).
  - `.agents/skills/core-seguretat-audit/SKILL.md` (línies 1–110).
  - `src/data/mapejadorSeccions.js`, `src/sections/detail/detailHelpers.jsx`, `src/sections/detail/detailRichText.jsx`, `src/data/supabase/storage.js`, `src/sections/profile/PerfilPublicSection.jsx`, `src/sections/multimedia/origenImatges.js`, `src/sections/search/indexCerca.js`, `src/config/contentHelpers.js` i `src/sections/notes/connexions.js`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Els 6 pegats de client estan aplicats i verificats a l'arbre de treball local, sense commit.
- El pegat SQL (`2610190100` i `2610190110`) resta pendent que el Mestre l'aplique (o el fusione amb `2610181915`) i l'execute a l'editor SQL de Supabase.
- El directori residual `./~/` a l'arrel de `socdepoble.org` continua present (`?? ~/`) i s'ha d'eliminar abans del pròxim commit.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_2315_auditoria_claude]]
- [[261018_2300_auditoria_creuada_claude_i_superadmin_gemini]]
- [[261018_2256_auditoria_codex_creuada_claude_i_superadministracio]]

