---
type: informe
status: esborrany
description: "Auditoria dels quatre encarrecs visuals del Bloc de notes: tres puntets, bola del mon, targeta rectangular i unificacio del boto de data i hora."
tags: [auditoria, disseny]
reflex: "sdp:torn_5fb65121-b1ca-4046-8ba6-28270cbbf643:d384a07a-1b7e-490e-b247-a84df78fe0bc"
---

# Auditoria de disseny del Bloc de notes i la Live Preview

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CLAUDE-260924-0055 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 00:55 |
| Modificació | 26-09-24 01:12 |
| Propietari | Claude (agent local) |
| Aprovació humana | pendent |
| Model IA | Opus 5 (`claude-opus-5`) |
| Tokens consumits | estimats ~95.000 d'entrada / ~9.000 d'eixida; mesurats reals no exposats per l'amfitrió |
| Plantilla | auditoria_canonica.md (ruta `auditoria`, v2.0.0) |
| Ruta | `_wiki_de_poble/04_escriptori/260924_0055_auditoria_claude.md` |
| Rebut | `sdp:torn_5fb65121-b1ca-4046-8ba6-28270cbbf643:d384a07a-1b7e-490e-b247-a84df78fe0bc` |
| Torn | `torn_5fb65121-b1ca-4046-8ba6-28270cbbf643` (abast `documents`) |
| Tall d'evidència | `a555b1ed`, branca `backup-notes-publish`, arbre net a l'inici de sessió |
| requires_human_decision | true (T0, T2.2, T3.4, T3.5) |

## Acte reflex

Petorreta rebuda: `260924_0035_prompt_disseny_claude.md`. Abans d'escriure res he llegit el Pla d'Implementació de la IAIA (`260924_0035_pla_implementacio_disseny_claude.md`) i he resolt la plantilla per `document.mjs context --route auditoria`, en lloc d'escriure de memòria.

Aquesta entrega és **auditoria, no implementació**. El §3 del Protocol de l'Olivera diu «Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut)», i això contradiu l'ordre «executa aquests canvis» de la Instrucció del torn dins del mateix document. Davant de dos manaments oposats al mateix full, trie el que no es pot desfer per la via curta: entregue el codi exacte, verificat contra el disc, i no toque cap fitxer de `src/`. **Zero fitxers de codi modificats.** Si el Mestre vol que l'aplique jo, és una ordre d'una línia i el codi ja està escrit ací baix.

## Historial

- **v1.0.0 (260924_0055):** Primera entrega. Auditoria dels quatre encàrrecs de la petorreta de disseny, més la resposta directa a la pregunta del Mestre sobre el botó de data i hora.
- **v1.1.0 (260924_0112):** Codex lliura la seua auditoria mentres jo escrivia. Llegida sencera i contestada: nova troballa **T6**, que documenta una col·lisió directa entre la seua F5 (llistat de metadades i detall sota demanda) i la meua T3.6 (la targeta necessita `subtitle` i `lead` a la fila), i proposa com resoldre-la sense que cap dels dos retire res. Esmenades les afirmacions de T0 i de Límits que la seua entrega havia deixat obsoletes.

## Troballes

### T0 · El camí de recuperació del hook no existix · P0 · `tooling/gates/hooks-local.mjs`

**Evidència reproduïble.** Amb el torn obert, aquestes dos ordres es llancen seguides des de l'arrel:

```
node tooling/wiki/document.mjs context --turn-id ID --route auditoria --file CAMÍ   → OK, torna plantilla i rebut
node tooling/wiki/document.mjs create  --turn-id ID --route auditoria --file CAMÍ … → [HOOKS-LOCAL] BLOQUEIG
```

El text del bloqueig és, literalment, una instrucció per a executar `document.mjs create`. És a dir: **la porta emet com a remei l'ordre que ella mateixa acaba de denegar.** L'allowlist és per prefix i discrimina el subcomandament: `context` (lectura) passa, `create` (escriptura) no.

L'abast del bloqueig és més ample del que sembla. En aquesta sessió el hook ha denegat `ls`, `cat`, `grep`, qualsevol `cd X && Y`, la cerca d'eines i l'obertura del servidor de previsualització. L'única superfície viva és la lectura explícita de fitxers i `node tooling/...` en mode lectura. Això vol dir que un agent local **no pot** completar el cicle documental que AGENTS §4 i la skill `wiki-cicle-de-vida` li exigixen per a tancar cap tasca.

**Nota d'honestedat, i és doble.** Primera: aquest document sí que s'ha pogut escriure, perquè el hook d'escriptura demana una cosa distinta —un rebut persistent al frontmatter (`reflex:`)— i eixe rebut sí que l'emet `context`. O siga: el camí viu existix, però **no és el que el missatge d'error nomena**. Un agent que obeïsca el text del bloqueig entra en bucle; un que el desobeïsca i pose el rebut al frontmatter, passa.

Segona: `260924_0055_auditoria_codex.md` porta els marcadors `<!-- SDP:SECTION auditoria.sN -->` que només emet `draft()`. O siga que **a Codex sí que li ha funcionat `create`** en la mateixa franja horària. Per tant això no és «l'eina està trencada»: és que la porta discrimina per agent, per sessió o per la forma exacta de l'ordre. Ho deixe com a observació i no com a diagnòstic: no he pogut llegir `hooks-local.mjs` ni `mutation-policy.mjs` per a saber quin dels tres. Qui ho mire, que comence per ahí.

**Font de veritat en conflicte.** AGENTS §4 («Cap tasca es considera finalitzada fins que hagis actualitzat l'ESTAT i executat `tancament.mjs`») contra el comportament efectiu de `hooks-local.mjs`. La skill `wiki-cicle-de-vida` §2 descriu `document.mjs create` com el pas normal del cicle, no com una mutació privilegiada.

**Severitat.** P0 de governança: no trenca cap píxel, però desorienta l'agent i l'empeny a inventar-se el camí, que és exactament el que la porta vol evitar.

**Proposta conservadora.** Dos opcions, i la tria és del Mestre:
1. Afegir `tooling/wiki/document.mjs create|plan|own|handoff` a l'allowlist quan hi ha `--turn-id` viu i vàlid; el torn ja fa de lease.
2. Si la intenció és que `create` no s'use mai i que l'escriptura vaja directa amb el rebut al frontmatter, **reescriure el text del bloqueig** perquè ho diga: «posa `reflex: <rebut>` al frontmatter i escriu el fitxer», i no una ordre denegada.

`requires_human_decision: true`. No deduïsc la intenció: pot ser una fortificació volguda mal retolada, o una regressió.

#### T0b · I el camí de governança està tancat en cercle · P0 · fusible

Escriure `.agents/ESTAT.md` —que AGENTS §4 exigix per a tancar qualsevol tasca— no es pot fer per cap via disponible:

1. **Escriptura directa:** denegada. `hooks-local.mjs` respon «Governança: usa `executor-mutacio.mjs` amb pla exacte i lease; l'eina directa no té autoritat».
2. **L'executor sancionat:** `tooling/gates/executor-mutacio.mjs:42` diu

   ```js
   if (!verificaSegell(root).ok) throw new Error('Segell previ invàlid; reconciliació explícita requerida');
   ```

   i el segell **està trencat ara mateix**. Verificat en execució:

   ```
   $ node tooling/gates/segella.mjs --verify
   ❌ [Llei Z] Ruptura de segell detectada! El hash actual c81eed08 no coincideix amb el segellat 08338d7b.
   ```

3. **Resegellar amb `--update`:** és la tecla que obriria les dues portes, i **no la toque**. L'ESTAT de les 23:31 diu literalment «Segell no reconciliat **a posta**». Resegellar certificaria com a aprovada tota la deriva acumulada des d'eixe punt —inclosa la de Codex i la meua, que ningú ha revisat— i això és un acte de govern, no de comptabilitat. Un agent no té autoritat per a signar això.

**Conseqüència operativa.** El cicle documental es pot completar per als documents (aquesta auditoria és `valid: true` i està ancorada), però **no per a l'ESTAT ni el LEDGER** mentres el segell estiga roig. El relleu d'aquest torn viu, de moment, només dins d'aquest fitxer.

**El que ha de fer el Mestre**, i només ell: revisar el diff que separa `c81eed08` de `08338d7b`, decidir si eixa deriva s'accepta, i llavors `segella.mjs --update`. A partir d'eixe moment l'executor torna a funcionar i el relleu es pot escriure. **No ho faces a cegues**: el motiu pel qual el segell es va deixar roig fa dues hores continua sense resoldre's.

---

### T1 · Els tres puntets · encàrrec 1 · `src/sections/notes/NotesEditor.jsx`

**On és de veritat.** El menú no viu a la plantilla ni al `DocumentEditor`: naix a `NotesEditor.jsx:29-54` (`AccionsIdentitat`), es memoïtza a `:73-82` (`identityActions`) i entra a l'adaptador a `:121`. Des d'ahí fa **dos camins**, no un:

- Nota oberta: `DocumentEditor.jsx:206` → `UniversalEditorShell.jsx:149` → `useEditorShell` → `barActions` a `UniversalEditorShell.jsx:337`.
- Estat buit (cap nota seleccionada): `DocumentEditor.jsx:154` → `EmptyDocumentPage` → `barActions` a `DocumentEditor.jsx:63`.

Qui només talle un camí, vorà els puntets reaparéixer en l'altre. Tallant-ho a l'origen (l'adaptador) cauen els dos alhora i no cal tocar cap component universal.

**Canvi exacte.** A `NotesEditor.jsx`:

1. Esborrar la funció `AccionsIdentitat` sencera (línies 28-54, inclòs el comentari de capçalera).
2. Esborrar el `useMemo` de `identityActions` (línies 73-82).
3. Llevar `identityActions,` de l'objecte retornat (línia 121) i de l'array de dependències (línia 127).
4. Netejar el que queda orfe, o el linter tombarà la porta:
   - línia 3: `import { useSession, ESTAT } from …` → `import { useSession } from …`
   - línia 4: `useNavigate` deixa de fer falta → llevar l'import i la línia 61 (`const navigate = useNavigate();`)
   - línia 6: llevar l'import sencer de `lucide-react` (`MoreVertical, LogIn, UserRound, LogOut`)
   - línia 7: llevar l'import de `Dropdown, DropdownItem`
   - línia 60: `const { currentUser, estat, logout } = useSession();` → `const { currentUser } = useSession();`

Resultat: a la caputxa taronja queden el cadenat/globus d'estat de publicació i el botó de data i hora. Res més.

**Concern d'una línia, i després avant.** `AccionsIdentitat` és avui **l'únic** punt del Bloc de notes on l'usuari pot connectar-se, obrir el perfil o tancar sessió — ho diu el comentari del propi codi a `:28`. En llevar-lo, un foraster que entre a `/notes` no té cap porta d'entrada des d'eixa secció. Ho dic i tire avant: l'ordre és clara i és teua. Si vols, la passarel·la es pot recuperar després des de la barra negra global, que és on viu la identitat a la resta del sistema.

---

### T2 · La bola del món · encàrrec 2 · `PageFrame.jsx` + `UniversalEditorShell.jsx`

#### T2.1 · Moure-la només a `PageFrame.jsx` no es vorà · P1

El Pla de la IAIA diu «Moure la bola del món de `.sp-card-actions` a la caputxa taronja (`.bar-actions`) en `PageFrame.jsx`». Fet així, **no té cap efecte al Bloc de notes.**

Mira `PageFrame.jsx:263-271`:

```jsx
<div className="bar-actions">
  {topBarData?.barActions ? topBarData.barActions : (
    <>
      {(barTime || barDate || barDateTime) && (
        <DateTimeControl … />
      )}
    </>
  )}
</div>
```

La branca `else` només s'executa si ningú passa `barActions`. I el camí de Notes **sempre** en passa: `UniversalEditorShell.jsx:172` l'injecta des de `useEditorShell` (`:318-339`), i `DocumentEditor.jsx:60-65` fa el mateix per a l'estat buit. La branca `else` és, per a Notes, codi mort. Afegir-hi la bola és pintar una paret que ningú mira.

**On s'ha de posar de veritat.** A `UniversalEditorShell.jsx:318-339`, dins de `barActions`, que és l'únic lloc pel qual passen els dos estats de l'editor. Cal que `useEditorShell` accepte el mànec:

```jsx
// UniversalEditorShell.jsx — signatura de useEditorShell (:218-231)
export function useEditorShell({
  onSaveField,
  onImageUpload = null,
  heroImage,
  logoImage,
  isPublished,
  formattedTime,
  formattedDate,
  showStatusToggle = true,
  showLogoUpload = true,
  previewTitle = "Exemple de Publicació",
  previewHelp = "Aquesta targeta és una previsualització de com quedarà al Mur.",
  identityActions = null,
  onTranslate = null,          // ← nou
  onToast = console.log
}) {
```

```jsx
// UniversalEditorShell.jsx — barActions (:318-339)
barActions: (
  <>
    {showStatusToggle && (
      <Dropdown …>…</Dropdown>
    )}
    <IconButton label="Traduir" onClick={onTranslate} presentation>
      <TranslateIcon className="icon" />
    </IconButton>
    <DateTimeControl time={formattedTime} date={formattedDate} />
    {identityActions}
  </>
)
```

amb l'import corresponent al capdamunt del fitxer:

```jsx
import { Dropdown, DateTimeControl, IconButton, TranslateIcon } from '../PedraSeca/index.js';
```

i el pas del mànec a `UniversalEditorShell` (`:137-151`, afegint `onTranslate` a la llista de props i a la crida de `useEditorShell`). Per a l'estat buit, la mateixa peça a `DocumentEditor.jsx:60-65`.

`presentation` és obligatori: sense ell, `IconButton` (`controls.jsx:73`) retorna `null` quan no hi ha `onClick` i el botó no es pinta mai.

#### T2.2 · Llevar-la de la barra blava no té mànec · P1 · `requires_human_decision`

«Lleva de pas qualsevol altre botó sobrant d'eixe espai» no es pot complir amb el codi d'avui. A `PageFrame.jsx:153-160`:

```jsx
} = useAccions({
  title, onConnect, onTranslate, onComment, onShare,
  hasFooter: true // Assuming full chrome provides a footer-like context for these
});
```

`hasFooter: true` està escrit a mà, i `useAccions.js:53-57` calcula `traduirVisible = showTranslate ?? (perDefecte || …)` amb `perDefecte = hasFooter === true`. Com que `PageFrame` **no accepta** cap prop `showTranslate`/`showComment`/`showShare`, els tres botons de `.sp-card-actions` són incondicionals a tota pàgina amb barra blava. No hi ha interruptor.

Per a apagar-los només al Bloc de notes cal obrir-ne un, i això toca un component universal que fan servir totes les seccions. Tres opcions, de menys a més invasiva:

- **(a)** `PageFrame` accepta `showTranslate`, `showComment`, `showShare` i els passa a `useAccions`; Notes els posa a `false`. Retrocompatible: sense prop, `undefined ?? perDefecte` manté el comportament actual arreu.
- **(b)** Afegir `chrome="editor"` a `PAGE_CHROME_MODES` amb barra blava sense accions. Més net conceptualment, més superfície tocada.
- **(c)** Deixar la barra blava com està i acceptar dos globus (un dalt, un baix).

**Recomane (a).** És la de menor risc i la que no toca la cascada. Però és una modificació del contracte d'un component universal, i això és decisió teua, no meua.

---

### T3 · La targeta rectangular · encàrrec 3 · `src/sections/notes/NotaFitxa.jsx`

#### T3.1 · D'on ixen els cantons i l'ombra · confirmat

No cal buscar-ho a ull. `components.css:551-565`:

```css
.sp-card {
  background: var(--sdp-fons-targeta);
  border-radius: var(--sdp-radi-m);
  overflow: hidden;
  box-shadow: var(--sdp-ombra-2);
  margin: 0 auto 32px;
  width: 100%;
  max-width: 500px;
  …
}
```

i `components.css:670-672`:

```css
.sp-card:hover { box-shadow: var(--sdp-ombra-3); }
```

**El radi i l'ombra no són l'únic problema dins d'eixa columna.** `max-width: 500px` i `margin: 0 auto 32px` fan que la targeta **es centre** dins de la llista i deixe 32px morts a sota, mentres les seues germanes de llista (`.sdp-gestor-fitxa`, `modules.css:62-77`) són `width: 100%`, `border-radius: 0` i es cusen amb `border-bottom: 1px solid var(--sdp-vora)`. Per això «queda muy mal»: no és només el cantó, és que la peça activa canvia de geometria respecte de les inactives. Una variant plana que només toque `border-radius` i `box-shadow` deixarà la targeta flotant i centrada, i el Mestre tornarà a dir que queda malament.

La variant ha d'igualar la geometria de la fitxa de gestor, no només llevar-li el radi.

#### T3.2 · El mecanisme ja existix: no fa falta CSS ad-hoc

`UniversalCard.jsx:182` accepta `variant` i el pinta com `sp-card--${variant}` (`:325-330`). El precedent ja està al full: `.sp-card--onboarding` i `.sp-card--action` (`components.css:770-782`). Per tant la Llei de Pedra Seca §7 es respecta amb una variant, no amb una classe pegada.

Regla nova, dins de `@layer components` a `components.css`, al costat de les altres variants:

```css
/* Variant PLANA · Live Preview dins d'una columna de llista.
   La targeta ha de compartir geometria amb .sdp-gestor-fitxa: ample sencer,
   sense radi, sense ombra i cosida amb vora. Pedra Seca §5 (frugalitat). */
.sp-card--pla {
  max-width: none;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid var(--sdp-vora);
}
.sp-card--pla:hover { box-shadow: none; }
```

La regla de `:hover` és imprescindible: sense ella, `.sp-card:hover` (`:670`) torna a encendre `--sdp-ombra-3` en passar el ratolí, i el Mestre vorà l'ombra aparéixer i desaparéixer.

#### T3.3 · El contingut que demanes no està on el busques · P0 funcional

Ací està el clau de l'encàrrec, i és el que faria fracassar una implementació ràpida.

`NotesSection.jsx:29-46` construïx l'item del workspace així:

```js
title:    extractPlainText(note.title || '', Infinity) || 'Sense títol',
subtitle: note.formattedDate,                                            // ← la DATA
excerpt:  extractPlainText(note.subtitle || note.lead || '', Infinity)    // ← H2 O lead, col·lapsats
          || note.plainText || '',
data:     note                                                            // ← la nota sencera
```

Conseqüències directes:

- `item.subtitle` **no és el subtítol**: és la data formatada. Per això `NotaFitxa.jsx:52` fa `date={item.subtitle}` i funciona.
- `item.excerpt` és **el H2 o l'entradeta, el primer que existisca**, mai els dos. Demanes H2 **i** entradeta com a coses separades: amb `item.excerpt` és impossible.
- Els camps de veritat viuen a `item.data.subtitle` i `item.data.lead`, i són **HTML** (els escriu `EditableField` amb `contentEditable` i `sanitizeHtml`, `UniversalEditorShell.jsx:37-50`). Si els pintes crus dins de la Card, es vorà `<p>` com a text.

Per això la Card ha de llegir de `item.data` i passar pel mateix `extractPlainText` que ja fa servir la llista.

#### T3.4 · La bola del món dins de la Card no té forat · `requires_human_decision`

`UniversalCard` no té cap ranura per a accions a la caputxa taronja. `CardHeader` (`UniversalCard.jsx:51-67`) només accepta `autor`, `pin` i `dataHora`, i `.sp-card-meta` (`components.css:735-742`) només allotja eixos dos últims. La bola, a la Card, només pot anar al peu blau (`.sp-card-footer`, `background: var(--sdp-accio)`, `components.css:973-983`).

Complir literalment «la bola a la caputxa de la targeta viva» obliga a obrir una ranura nova a la Targeta Mestra, i eixa peça la fa servir tot el sistema (Mur, Mercat, Pobles, Events…). És el canvi de més radi de tota la petorreta i el que més fàcilment trenca coses darrere l'escena.

**Recomane no obrir-la ara.** La proposta de sota deixa la bola al peu blau, que és on la resta del sistema la té, i marca aquest punt com a decisió pendent. Si dius que sí, la ranura es fa amb un prop `headerActions` i es pinta dins de `.sp-card-meta`, abans del `pin`.

#### T3.5 · El peu blau està apagat a posta · `requires_human_decision`

`NotaFitxa.jsx:53-57` passa `showPin={false} showTranslate={false} showComment={false} showShare={false} hasFooter={false}`. Amb `hasFooter={false}`, `peuVisible` (`UniversalCard.jsx:323`) és `false` i **no hi ha peu**. Demanes que el peu blau siga idèntic al de la vista acabada: això vol dir encendre'l. Cal dir quins botons hi han d'anar. A la vista acabada (`PageFrame` amb `hasFooter: true`) són Traduir, Comentar i Compartir. La proposta els encén tots tres.

#### T3.6 · Fitxer complet proposat

`src/sections/notes/NotaFitxa.jsx`, sencer, llest per a copiar:

```jsx
import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { UniversalCard } from '../../components/PedraSeca';
import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { extractPlainText } from '../../utils/contentAdapter.js';
import { useMemo } from 'react';
import { PenSquare } from 'lucide-react';

/**
 * Targeta rica de nota per al llistat del Bloc de Notes.
 * S'injecta al UniversalWorkspace via `renderItem`; el nucli no la coneix.
 * Quan està activa es converteix en una UniversalCard plana (Live Preview):
 * mateixa anatomia que la vista acabada, geometria de fitxa de llista.
 */
export function NotaFitxa({ item, active, onSelect }) {
  const identitatCtx = useIdentitat();
  const actorId = identitatCtx ? identitatCtx.actorId : null;

  const coreCtx = useCoreContent();
  const agents = coreCtx ? coreCtx.agents : [];

  const sessionCtx = useSession();
  const currentUser = sessionCtx ? sessionCtx.currentUser : null;

  const currentProfile = useMemo(() => {
    const isExampleNote = item?.id === 'n1';
    if (isExampleNote) {
      return {
        name: 'Sóc de Poble',
        avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
        location: 'La Torre de les Maçanes'
      };
    }
    const agent = agents?.find(a => String(a.id) === String(actorId));
    if (agent) return { name: agent.name, avatar: agent.avatar_url || agent.image_url, location: agent.location };
    return {
      name: currentUser?.user_metadata?.name || currentUser?.full_name || 'Foraster',
      avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || null,
      location: 'Poble de la persona forastera'
    };
  }, [agents, actorId, currentUser, item?.id]);

  /* El workspace col·lapsa H2 i entradeta en `excerpt` i posa la data a
     `subtitle` (NotesSection.jsx:29-46). Per a pintar-los separats cal anar
     a la nota original, que és HTML de l'editor: es passa per extractPlainText. */
  const nota = item?.data;
  const subtitol = useMemo(
    () => extractPlainText(nota?.subtitle || '', Infinity),
    [nota?.subtitle]
  );
  const entradeta = useMemo(
    () => extractPlainText(nota?.lead || '', Infinity) || item?.excerpt || '',
    [nota?.lead, item?.excerpt]
  );

  if (active) {
    return (
      <UniversalCard
        variant="pla"
        className="sdp-nota-fitxa-viva"
        title={item.title || 'Sense títol'}
        subtitle={subtitol}
        body={entradeta}
        imageUrl={item.image}
        author={currentProfile.name}
        avatarUrl={currentProfile.avatar}
        location={currentProfile.location}
        date={item.subtitle}
        labels={item.tags || []}
        copyright={nota?.copyright || '© Sóc de Poble'}
        showPin={false}
        hasFooter
        showTranslate
        showComment
        showShare
        onMainClick={onSelect}
        icon={nota?.isDraft ? <PenSquare size={16} /> : null}
      />
    );
  }

  return (
    <button
      type="button"
      className="sdp-gestor-fitxa sdp-nota-fitxa"
      onClick={onSelect}
    >
      <ItemMedia item={item} titleFallback="Sense títol" className="sdp-nota-fitxa__media" />
      <span className="sdp-gestor-fitxa__text sdp-nota-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol sdp-nota-fitxa__titol">{item.title || 'Sense títol'}</span>
          {item.subtitle ? (
            <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
              {item.subtitle}
            </time>
          ) : null}
        </span>
        {item.excerpt ? (
          <span className="sdp-gestor-fitxa__subtitol sdp-nota-fitxa__entradeta">{item.excerpt}</span>
        ) : null}
      </span>
    </button>
  );
}
```

Notes del canvi, una per una:

- `variant="pla"` engancha la regla de T3.2. Cap estil en línia, cap `!important`.
- `icon` ja no porta `Lock`; els esborranys conserven el `PenSquare`, que no és el cadenat i sí que informa. L'import de `Lock` desapareix.
- `subtitle` i `body` ixen de `nota.subtitle` i `nota.lead`, netejats (T3.3). L'H1 és `title`, que `UniversalCard` pinta com `.sp-card-title`.
- `labels={item.tags}` llista les etiquetes. **Límit honest:** això mostra les etiquetes lliures, no les carpetes ni les categories; eixes les calcula `etiquetesDeNota(nota, noteFolders, params)` i `noteFolders` viu a `useNotes()`, que `NotaFitxa` no consumix. Si les vols totes, `NotaFitxa` ha de cridar `useNotes()` — digues-ho i ho afig.
- `copyright` llig de la nota i cau a `© Sóc de Poble`, igual que fa l'editor (`NotesEditor.jsx:125`).
- `hasFooter` + els tres `show*` encenen el peu blau (T3.5).
- `aria-current` fora de la branca inactiva: vegeu T5.1.

#### T3.7 · La Llei de Pedra Seca §9 bloqueja la variant fins que estiga al catàleg

«Res existix fins que no està al manual». `.sp-card--pla` és un component nou de UI i §9 diu que no es pot programar la funció abans que l'espècimen visual estiga a `DesignSection`. El catàleg és per manifest: `src/sections/disseny/cataleg/manifest.js` (`CATALOG_ITEMS`) i `src/sections/disseny/cataleg/detailRegistry.js` (`CATALOG_DETAIL_LOADERS`). Registrar la variant és barat — una entrada al manifest i un espècimen que pinte una `UniversalCard variant="pla"` al costat d'una normal — però **és un pas obligatori i cal comptar-lo**, no descobrir-lo a mitja implementació.

---

### T4 · El botó de data i hora · encàrrec 4 · la resposta a la pregunta del Mestre

Em preguntes per què m'he inventat un botó de data i hora diferent en lloc de reutilitzar el component base. Et conteste amb el disc a la mà, i la resposta no és la que esperaves.

**No hi ha cap component inventat.** N'hi ha un i només un: `DateTimeControl`, a `src/components/PedraSeca/atoms/controls.jsx:29`. El fan servir els quatre llocs del sistema, sense excepció:

| On | Línia | Com el crida |
| --- | --- | --- |
| Barra taronja de pàgina | `PageFrame.jsx:268` | `time`, `date`, `dateTime`, `onClick={onDateTime}` |
| Caputxa de la Targeta Mestra | `UniversalCard.jsx:292` | `time`, `date`, `dateTime`, `onClick={handleDateTime}` |
| Barra taronja de l'editor | `UniversalEditorShell.jsx:336` | `time`, `date`, **sense `onClick`** |
| Barra taronja de l'estat buit | `DocumentEditor.jsx:62` | `time`, **sense `onClick`** |

I la pell és única i està documentada com a tal. `components.css:1245-1257` obri un bloc titulat «CONTROLS DE BARRA · LLEI DE PEDRA SECA» que declara «Una sola família per a tots els botons que viuen damunt d'una barra de color», amb `.btn-date-time` dins. Les regles (`:1258-1339`) seleccionen **per classe**, mai per element. La pastilla és la mateixa.

**Aleshores, per què les veus diferents?** Per tres motius acumulats, i cap és un component duplicat:

**T4.1 · L'àtom es bifurca en dos elements HTML segons si té `onClick`.** `controls.jsx:40-62`:

```jsx
if (onClick) {
  return <button type="button" className="btn-date-time" …>{content}</button>;
}
return <time className="btn-date-time" dateTime={dateTime} …>{content}</time>;
```

La classe és la mateixa, així que la pastilla es veu igual. Però un `<button>` és focalitzable, entra a la navegació per tabulador i respon al clic; un `<time>` no fa res de tot això. A la columna de Notes tens les dues formes a **un pam l'una de l'altra**: la de la targeta és botó viu, la de l'editor és text inert. Semblen el mateix i no es comporten igual, i això és precisament el que et fa desconfiar.

**T4.2 · No porten la mateixa càrrega.** L'editor passa `time` **i** `date` (`UniversalEditorShell.jsx:336`), i l'àtom pinta dos `<span>`. La targeta rep només `date`, perquè `NotaFitxa.jsx:52` fa `date={item.subtitle}` i no passa `time` — i un `<span>` ocupa menys que dos. **Aquesta és la diferència que veus de veritat.** No és una pell diferent: és el mateix motle amb la meitat de contingut.

**T4.3 · La targeta té una acció per defecte que l'editor no té.** `UniversalCard.jsx:255-260`:

```jsx
const handleDateTime = onDateTime || ((e) => {
  e.preventDefault();
  e.stopPropagation();
  const dia = diaDeLaTargeta(dateTime, date);
  navigate(dia ? `/mur?date=${encodeURIComponent(dia)}` : '/mur');
});
```

`handleDateTime` **mai** és `undefined`. Per tant la Targeta Mestra sempre entrega un `onClick` a l'àtom, sempre cau a la branca `<button>` i sempre salta al Mur filtrat per eixe dia. La Live Preview del teu Bloc de notes té, ara mateix, un botó que se'n va del Bloc en clicar-lo. Ningú ho va demanar: ix del valor per defecte de la Targeta.

**T4.4 · I ací sí que hi ha un element de data fet a mà.** És a la **fila inactiva** de la llista, no a la targeta. `NotaFitxa.jsx:75-79`:

```jsx
<time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
  {item.subtitle}
</time>
```

Amb pell pròpia a `modules.css:3472-3478`: text menut, gris, `tabular-nums`, sense pastilla ni fons. Això **no** passa per `DateTimeControl`. És l'únic lloc del Bloc on la data s'ha escrit a banda.

**I està bé que siga així.** La fila de llista no és una barra de color: és una fitxa de gestor amb un pressupost vertical calculat al mil·límetre (`modules.css:8-19` en documenta l'aritmètica, 95,6 ≤ 96px). Ficar-hi una pastilla de 48px d'alt (`--sdp-touch-comode`) rebentaria eixe pressupost i trencaria la llei de la fitxa de gestor, que té porta pròpia (`tooling/gates/tractor-fitxa-gestor.mjs`). Són dos contextos amb dos contractes: barra de color → pastilla; fila de llista → metadada.

**Conclusió per a la teua pregunta.** El que has vist no és un component duplicat sinó **un àtom amb una bifurcació amagada i tres cridadors que no es posen d'acord** sobre l'element, la càrrega i l'acció. Això és pitjor que una duplicació visible, perquè no es detecta comptant components: els comptes donen 1 i tot pareix correcte.

**Unificació proposada.** Que la caputxa taronja de la targeta de Notes porte exactament la mateixa peça que l'editor. No n'hi ha prou amb passar `onDateTime={undefined}`, perquè el `||` de `UniversalCard.jsx:255` el substituïx pel salt al Mur. Cal un interruptor explícit a la Targeta Mestra:

```jsx
// UniversalCard.jsx:255 — respectar onDateTime={false} com «sense acció»
const handleDateTime = onDateTime === false
  ? undefined
  : onDateTime || ((e) => { … });
```

i llavors `NotaFitxa` passa `onDateTime={false}`. Amb això la targeta pinta un `<time class="btn-date-time">` inert, idèntic en element i en comportament al de l'editor, i el Bloc deixa de tindre una porta al Mur que ningú va demanar. El patró `prop === false` per a apagar un comportament ja és viu al codi: `DesignSection.jsx:24` fa `onConnect={false}`.

**Sobre l'hora que falta.** Si vols que la pastilla de la targeta mostre hora **i** data com la de l'editor, cal afegir `time` a l'item del workspace (`NotesSection.jsx:38`, `note.formattedTime`) i passar-lo. Ho deixe fora de la proposta perquè canvia el contingut de la fila de llista, i això és un canvi de disseny que no has demanat.

---

### T5 · Troballes col·laterals (no demanades, no toque res)

**T5.1 · `aria-current` mort i CSS que no es pot encendre mai · P2.** `NotaFitxa.jsx:68` fa `aria-current={active ? 'true' : undefined}` **dins de la branca que només s'executa quan `active` és fals**. L'expressió sempre val `undefined`. Conseqüència: la regla `.sdp-bloc-list--notes .sdp-gestor-fitxa[aria-current="true"]` (`modules.css:3444-3447`, fons `--sdp-accent-subtil` i vora taronja) i la seua germana genèrica (`modules.css:85-88`) **no poden casar mai** al Bloc de notes. La proposta de T3.6 lleva l'atribut; el ressalt d'actiu ja el dóna la targeta, que substituïx la fila.

**T5.2 · El rellotge que no fa tic · P2.** `NotesEditor.jsx:105-110` recalcula `dynamicTime` amb `new Date()` per a tota nota que no siga `n1`, **sobreescrivint** `activeNote.formattedTime`. Viu dins d'un `useMemo`, així que no s'actualitza amb el temps: només quan canvia una dependència. Resultat: la caputxa de l'editor mostra l'hora d'un instant arbitrari del passat, presentada com si fóra l'hora de la nota. Suma-li T4.2 i tens la caputxa i la targeta dient dos coses distintes sobre la mateixa nota. No ho toque perquè no ho has demanat, però si algun dia et pregunta algú per què les hores ballen, és ací.

**T5.3 · La Live Preview centra el text, la llista l'alinea a l'esquerra · P2.** `.sp-card-body` és `text-align: center` (`components.css:753-758`) i `components.css:873-880` ho reforça per a `h1`, `h2`, `.sp-card-title`, `.sp-card-subtitle` i els paràgrafs. Les files de llista són a l'esquerra. Quan la targeta plana ocupe tot l'ample de la columna, eixe contrast es notarà més que ara. La regla d'escapament ja existix (`.has-aside`, `.has-price`, `.has-calendar-badge` → `text-align: left`, `components.css:882-904`), però encendre-la per a la targeta plana **és un redisseny**, i la Llei del Píxel diu que això necessita ordre teua. Ho deixe apuntat i quiet.

**T5.4 · Risc d'amuntonament a la caputxa taronja · P2.** `section.bar-orange` té alçada fixa `--sdp-alt-accio` i `.bar-orange .bar-actions` és `flex: none; white-space: nowrap` (`layout.css:251-267`, `:280`), amb `gap: var(--sdp-space-5)` (20px). Després de T2.1 la caputxa portarà tres peces: estat de publicació, bola del món i data/hora. En la columna estreta del Bloc, el bloc d'autor (`flex: 1`) s'encongirà i el nom caurà en punts suspensius (ja té `text-overflow: ellipsis`, `components.css:715-717`). Funciona, però va just. Si es veu apretat, la solució Pedra Seca és baixar el `gap` a `--sdp-space-3` **només** dins de `.bar-orange`, no encongir els controls: `--sdp-touch-comode` és llei de vida i no es toca.

### T6 · Olivera · la proposta de Codex i la meua xoquen en un punt concret · P0 de coordinació

Codex ha lliurat [[260924_0055_auditoria_codex]] mentres jo escrivia. L'he llegida sencera. És bona i va per un altre eix (sessió, àmbit de dades, Frontissa, càrrega), i en general no toca el meu. **Però hi ha un xoc directe, i cal resoldre'l abans de picar res.**

**El xoc.** La seua F5 diu que `src/data/supabase/notes.js:85-100` es baixa el corpus sencer amb `select=*` i proposa, com a correcció, «`loadNotesPage` amb cursor estable, **llistat de metadades i detall sota demanda**».

La meua T3.6 fa exactament el contrari: perquè la Live Preview puga pintar H1, H2 i entradeta separats, `NotaFitxa` ha de llegir `item.data.subtitle` i `item.data.lead` — és a dir, **el cos de la nota, dins de la fila de la llista**. Si la F5 de Codex aterra primer, `item.data` passarà a portar només metadades i la meua targeta pintarà un H2 buit i una entradeta buida. Silenciosament: cap error, cap prova roja, només dos camps que desapareixen.

**No és un empat: Codex té raó en el fons.** Baixar-se 97 MiB per a 10.000 notes per a poder ensenyar dues línies de text en una targeta és insostenible, i la seua taula d'estrés ho quantifica. La meua proposta viu damunt d'un defecte que ell ha diagnosticat bé.

**Com es resol sense que ningú retire res.** El llistat de metadades ha d'incloure `subtitle` i `lead` com a **camps de metadades**, no de detall. No són el cos: són dues línies curtes que la targeta i la fila de llista ja necessiten avui (`NotesSection.jsx:39` ja col·lapsa `subtitle || lead` dins d'`excerpt`, o siga que la llista **ja** els consumix). El que ha d'anar sota demanda és `content`, que és el que pesa. Concretament, quan s'escriga el `select` explícit de `loadNotesPage`, que porte: `id, folderId, title, subtitle, lead, coverImage, heroImage, tags, categories, updatedAt, revision, isPublished, copyright`. Amb això la F5 de Codex conserva tot el seu guany i la meua T3.6 continua funcionant.

**Ordre d'implementació que propose al Mestre.** Primer el meu bloc visual (T1-T4), que és superficial i reversible; després la F5 de Codex, que reescriu la capa de dades. A l'inrevés, la targeta es queda muda i ningú sabrà per què. Si s'ha de fer al revés per la raó que siga, llavors T3.6 ha d'esperar i entrar dins del mateix torn que F5.

**On sí que estem d'acord, sense haver-ho parlat.** Codex escriu a la seua secció d'Olivera: «Recomane coordinar `NotesContext` i `NotesEditor` abans d'implementar càrrega de metadades/detall, perquè són superfícies compartides». La meua T1 toca `NotesEditor.jsx` (lleva `useSession`, `useNavigate` i `ESTAT`). És la mateixa advertència des de l'altra vora: que la IAIA no òbriga eixe fitxer amb els dos informes mig llegits.

**Una esmena menuda a Codex.** La seua secció d'Evidència diu «En el tall inicial no hi havia una auditoria nova de Claude a l'escriptori». És cert al seu tall; ja no ho és. El que va llegir és el Pla de la IAIA, no una auditoria meua. Quan tanque la seua següent passada, que llija aquest document: la seua frase «no cal canviar ara targetes, CSS ni la nomenclatura visual» es va escriure sense saber que el Mestre havia demanat expressament eixos canvis en una petorreta paral·lela.

---

## Verificació

**El que he verificat llegint el disc**, fitxer i línia, al tall `a555b1ed`:

- `NotaFitxa.jsx` (87 línies), `NotesEditor.jsx` (130), `NotesSection.jsx` (171), `PageFrame.jsx` (343), `DocumentEditor.jsx` (215), `UniversalEditorShell.jsx` (344), `UniversalCard.jsx` (362), `controls.jsx` (117), `useAccions.js` (69), `PedraSeca/index.js` (39): llegits sencers.
- `components.css`: llegides les línies 1-380, 377-796, 796-1125 i 1125-1348 (el fitxer tanca `@layer components` a 1346). Cobrix `.sp-card`, `.sp-card-header`, `.sp-card-footer`, les variants i tot el bloc de controls de barra.
- `modules.css`: llegides 1-1859, 1860-2099 i 2900-3621 de 3622. Cobrix `.sdp-gestor-fitxa*`, `.sdp-nota-fitxa*` i el bloc «BLOC DE NOTES».
- `layout.css`: llegides 1-390 de ~700. Cobrix `.bar-blue`, `.bar-orange`, `.bar-actions` i `header.page-title`.
- `.agents/protocolledge.json`, `tooling/wiki/schema.json` i la plantilla `auditoria_canonica.md` per `document.mjs context`.

**El que NO he pogut verificar, i per què.** Cap comprovació en execució. Les portes canòniques que la plantilla mana executar —

```bash
npm run porta:documents -- --all
npm run porta:frontmatter
npm run porta:cognitiu
npm run porta:llaurador
npm run porta:reflex
```

— i el servidor de proves de `http://localhost:3340` són **inabastables des d'aquesta sessió**: `hooks-local.mjs` denega `npm`, qualsevol shell composta i l'obertura del navegador integrat (T0). Per tant:

- **No he vist la pantalla.** Cap captura, cap píxel mesurat, cap estil computat. Tot el que dic de com es veu ix de llegir la cascada, no d'observar-la.
- **No he executat cap prova.** Ni `npm test`, ni el linter, ni cap porta.

Això no transforma l'auditoria en «zero incidències» ni en «verd»: la plantilla diu expressament que un error d'execució és un resultat fallit, mai un aprovat. Les troballes T1-T5 són **lectures de codi verificades a la font**; la seua *conseqüència visual* és inferència, i s'ha de confirmar amb els ulls abans de donar cap tasca per bona.

**Com verificar-ho quan s'implemente** (per a la IAIA MarIA):

1. `npm run dev` i obrir `http://localhost:3340/notes`.
2. Amb `n1` oberta: comprovar que la targeta activa fa l'ample sencer de la columna, sense cantó ni ombra, **i passar-hi el ratolí per damunt** (T3.2, la regla de `:hover`).
3. Comprovar que es veuen H1, H2 i entradeta com a tres coses distintes, sense cap etiqueta HTML visible (T3.3).
4. Comprovar que a la caputxa taronja de l'editor no hi ha tres puntets, ni amb nota oberta ni amb el Bloc buit (T1, els dos camins).
5. Clicar la pastilla de data de la targeta: **no** ha d'anar al Mur (T4.3).
6. `npm test` i `npm run porta` abans de commit.

## Límits

- **Auditar no autoritza res més.** Zero fitxers de `src/` tocats. El codi d'aquest informe és una proposta per a la pissarra de l'Olivera, no un canvi aplicat.
- **No he llegit la petorreta de Codex.** `260924_0045_prompt_arquitectura_codex.md` és a l'Escriptori i el Protocol de l'Olivera em dóna autoritat per a llegir-la, però el hook em va denegar les primeres lectures en bloc i vaig prioritzar el codi. No sé, per tant, si Codex proposarà tocar els mateixos fitxers. **Punt de col·lisió probable:** el seu encàrrec és «Estat i Contextos», i T1 lleva `useSession`/`useNavigate` de `NotesEditor.jsx`. Que la IAIA mire els dos informes abans d'editar eixe fitxer.
- **L'auditoria de Codex s'ha omplit mentres jo escrivia.** Quan la vaig obrir per primera vegada tenia Troballes, Verificació i Límits en `[pendent]`; quinze minuts després estava completa. L'he llegida sencera i l'he contestada a T6. **L'arbre es mou en calent**: si la IAIA llig aquest document, que comprove abans que cap dels dos no s'haja tornat a moure.
- **La meua versió de la petorreta de Codex continua sense llegir-se.** `260924_0045_prompt_arquitectura_codex.md` no l'he obert; he anat a la seua auditoria directament, que és el que importa per a la col·lisió de T6.
- **Fragments de CSS no llegits:** `modules.css` 2100-2899, `layout.css` 390-final, `base.css` i `sdp.css` sencers. Cap d'ells conté els selectors citats —els he localitzat tots— però una regla d'una d'eixes zones podria entrar en conflicte amb `.sp-card--pla`. La cascada està a favor (`components` guanya `legacy`), i el radi i l'ombra que el Mestre veu ixen de `.sp-card`, que sí que he llegit.
- **La Llei del Píxel no s'aplica ací.** Això és un redisseny demanat pel Mestre, no una neteja. El criteri d'èxit **no** és «es veu igual»; és «es veu com el Mestre ha dit». Però per això mateix fa falta pla aprovat (sdp-workflow §1), i per això entregue codi i no commits.
- **Tres decisions de disseny pendents, i són teues:** T2.2 (com apagar el globus de la barra blava), T3.4 (obrir o no una ranura d'accions a la Targeta Mestra) i T3.5 (quins botons van al peu blau). T0 n'és una quarta, de governança.
- **Proposta de millora de `prompt_local.md`**, que la plantilla convida a fer: la secció «Instrucció del torn» i el «Protocol de la Reunió a l'Olivera» es contradiuen quan la instrucció diu «executa» i el protocol diu «cap línia de codi». Suggerisc un camp nou al Registre, `mode: auditoria | implementacio`, que resolga la contradicció d'una ullada i que el generador òmpliga sempre. Avui cada IA local ho ha de decidir pel seu compte, i dos IAs poden decidir distint damunt del mateix fitxer.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0035_pla_implementacio_disseny_claude]]
- [[260924_0035_prompt_disseny_claude]]
