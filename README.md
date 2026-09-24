---
estat: "canonic"
tipus: "index"
description: "Documentació canònica de Sóc de Poble."
---
# Sóc de Poble: Portal de Pobles Connectats
**The Civic Hosting Stack for Rural Resilience**

Sóc de Poble és una infraestructura digital cívica, concebuda i dissenyada mitjançant el Sistema de Disseny Pedra Seca.
El projecte empra un empaquetament com a Llibreria (UMD/ESM) per oferir una integració fluïda i resistent en qualsevol lloc web (especialment en gestors de contingut clàssics), utilitzant Supabase com a font única de veritat.

La missió és proporcionar una eina on l'intercanvi cultural federat i la comunicació cívica (alertes, agenda) puguen funcionar de manera resilients, àgils i directes per al món rural.

## Estructura

- `src/config/`: configuració global i helpers compartits.
- `src/sections/`: cada secció té el seu component, el seu `*Content.js` i, si cal, el seu `*Seed.js`.
- `src/data/`: capa de backend, agregació i persistència.
- `src/components/`: peces reutilitzables de UI.
- `src/styles/`: estils globals.

## Arrencar

```bash
npm ci
npm run dev
```

La instal·lació només genera derivats ignorats i reproduïbles; no ha de canviar
`package.json` ni l'índex Git. S'exigeix l'ús de `npm` per al control estricte de dependències.

## Base de dades

El projecte usa **Supabase** com a base de dades remota canònica i font única de veritat.

### Ordre d'execució dels esquemes (OBLIGATORI)

En una base de dades nova, executa **tots els fitxers de `supabase/migrations/` per ordre alfabètic** i després `supabase/seed.sql`. En una base existent, aplica només les migracions pendents segons el registre de desplegament; no repetisques indiscriminadament les ja aplicades.

No uses l’antiga llista parcial d’esquemes: ometia correccions de RLS i privacitat. El directori de migracions és la font d’ordre; el seed és l’últim pas. Comprova RLS i permisos en l’entorn de proves abans de producció.

### Per què les correccions del xat no són opcionals

`260908_xat_v2.sql` crea les quatre taules correctament, però deixa tres forats
que fan el xat inservible. El pegat `260908_xat_v2_correccions.sql` els tanca:

- **Inserció circular de participants.** La política `xat_participants_insercio`
  original consulta `public.xat_fils` des de dins d'un `WITH CHECK`, i eixa
  consulta s'avalua **amb RLS**. Per a llegir la fila cal ser participant; per a
  ser participant cal poder inserir la fila. Resultat: ningú pot afegir mai el
  primer participant i cap fil arriba a ser utilitzable.
- **Noms invisibles.** La política `profiles read own` només deixa llegir el teu
  propi perfil. Sense una funció `SECURITY DEFINER` que òbriga *només* el nom de
  qui comparteix fil amb tu, el xat mostra «Veí» per a tothom, sempre.
- **Cap porta d'entrada.** `seed.sql` només omple l'antiga `chat_threads`.
  `xat_fils` naix buida i no hi ha cap manera de crear-hi res sense l'RPC
  `crea_fil_directe`.

El pegat és **idempotent**: es pot tornar a executar les voltes que faça falta.

### Comprovació ràpida (30 segons)

Amb la sessió d'un tester oberta, al SQL Editor:

```sql
-- 1. Les quatre taules i la columna es_ia hi són?
select table_name from information_schema.tables
 where table_schema = 'public' and table_name like 'xat\\_%';

-- 2. Els RPC hi són? N'han d'eixir CINC.
select proname from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname in ('crea_fil_directe','xat_fils_meus',
                   'xat_missatges_del_fil','xat_marca_llegit',
                   'membres_del_poble');
```

Si la segona consulta torna menys de cinc files, **falta executar el pas 4 o el
5** i el xat de la Beta estarà mort. El frontend ho diu amb estes paraules
exactes: *«L'esquema del xat no està aplicat a la base de dades»*.

### El directori del poble és una decisió de governança

`membres_del_poble()` (pas 5) obri una cosa que fins ara estava tancada: el
**nom** de la resta de veïns del teu poble. És el mínim imprescindible perquè un
xat existisca — no pots escriure a qui no pots trobar — però continua sent una
obertura, i afecta `LLEI_05_Privacitat` i el text de la pàgina legal, que hui
diu que les dades personals «mai es comparteixen sense consentiment».

No s'obri res més: ni correu, ni data d'alta, ni rol, ni cap dada d'un poble del
qual no sigues membre. El fitxer porta, comentat, un filtre per consentiment
RGPD per si es decidix que només aparega al directori qui l'haja donat.

## Documentació

Si vols entendre com està repartit el projecte i on tocar cada cosa, mira:

- [El Cervell Tècnic: Wiki de Poble](_wiki_de_poble/00_index.md)
- [Regles de Seguretat i Agents](.agents/AGENTS.md)
- [Protocol de la Petorreta](.agents/PROTOCOL_PETORRETA.md)

## Modes de dades

L'app admet `VITE_DATA_MODE` per a poder provar sense trencar la web:

- `auto`
  Mode per defecte. Si hi ha Supabase configurat, intenta BD i, si falla, cau al fallback local. Si no hi ha Supabase, cau al seed local.

- `supabase`
  Força la lectura des de BD. El xat també intenta guardar-se en la BD.

- `hybrid`
  Intenta BD i, si falla, cau al snapshot local o al seed.

- `seed`
  Mostra dades del codi. Va bé per a demos o proves ràpides.

Passos mínims:

1. Crear un projecte a Supabase.
2. Aplicar tots els fitxers de `supabase/migrations/` per ordre alfabètic.
3. Executar `supabase/seed.sql`.
4. Configurar les variables d’entorn corresponents sense versionar secrets.
5. Arrancar i verificar permisos/RLS amb els rols de prova.

## Sessió i emmagatzematge

La sessió (jwt, refresh-token i usuari) viu **sencera** a `sessionStorage`, i
s'escriu i s'esborra només des de `src/data/identitat.js` (`desaSessio` /
`esborraSessio`). Això vol dir que **en tancar la pestanya cal tornar a entrar**.

És deliberat. L'alternativa era baixar els tokens a `localStorage`, i a un
origen de CMS extern compartit amb Sollutia i qualsevol altre connector això és
regalar la sessió a qui vullga llegir-la. Fins al 260908 el sistema estava a
mitges — tokens a `sessionStorage` i usuari a `localStorage` — i produïa
«sessions fantasma»: la interfície et mostrava dins, i cada escriptura moria amb
un 42501 de RLS.

Si algun dia es vol sessió persistent, la manera correcta no és `localStorage`:
és una galeta `httpOnly` servida per Sollutia.

Exemple de `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DATA_MODE=auto
```

Regenerar el SQL de dades seed és una mutació governada, que requereix el segell criptogràfic de `canonada.mjs`.

## Integritat de la Wiki

La integritat de la Wiki està garantida mitjançant un contracte rígid auditat abans de cada commit. Totes les notes han de complir amb un esquema reduït de 9 propietats YAML i cap arxiu operatiu pot quedar orfe sense un índex d'ancoratge.

## Privacitat i la "Gestoria de Poble"

Aquest repositori conté el codi i el cervell tècnic (`_wiki_de_poble`). L'arquitectura informàtica està totalment separada de la burocràcia del teu grup. 

Per a mantenir la privacitat dels documents de la teua associació o poble, hauràs de crear una carpeta **fora del repositori** i utilitzar-la com un "Vault" d'Obsidian independent per a arxivar la teua burocràcia, contractes, assumptes privats i multimèdia sense perill que es pugen a GitHub.

---

**Ancoratge de Seguretat:** [[_wiki_de_poble/00_index]]

## Fer un canvi i tancar el torn

Llig `AGENTS.md`, `.agents/BOOTSTRAP.md`, l’índex de la Wiki i el bloc ESTAT_ACTUAL de `.agents/ESTAT.md`. El mapa vigent està a `.agents/cervell.json`.

```sh
node tooling/gates/obrir_torn.mjs --actor codex --scope code --output /tmp/torn-codex.json
node tooling/wiki/document.mjs --help
node tooling/wiki/document.mjs context --turn-id ID --route prompt.local --file _wiki_de_poble/04_escriptori/AAMMDD_HHMM_prompt_tasca.md
node tooling/wiki/document.mjs create --turn-id ID --route prompt.local --file _wiki_de_poble/04_escriptori/AAMMDD_HHMM_prompt_tasca.md --title "Tasca concreta" --description "Descripció concreta de la tasca autoritzada"
node tooling/wiki/document.mjs plan --turn-id ID --file CAMI_DEL_PLA_APROVAT
node tooling/wiki/document.mjs check --file CAMI_DEL_DOCUMENT
node tooling/gates/tancament.mjs --close --turn-id ID
```

Substituïx ID, data, hora i rutes pels valors reals. Completa els pendents editorials abans de validar; actualitza ESTAT i LEDGER amb el torn i les proves. `--check` és lectura i `--close` firma el checksum del LEDGER i desa el tancament només si les portes passen. Este checksum no és una signatura d’identitat.

Versiona cada document amb el seu torn tancat i els snapshots de `.agents/runtime/contracts/`. `.claude/skills/` conté enllaços relatius versionats. Els punters locals, locks i temporals no formen part del relleu.

`npm ci` activa Husky i `.husky/pre-commit`: comprova documents del staging, tancament i portes. Verifica `git config core.hooksPath`, perquè una activació explícita del Reflex pot usar `.githooks`. No ometes hooks per fer passar un clon. `node tooling/gates/run-portes.mjs --diagnostic` acumula només les portes declarades de lectura; no autoritza un commit ni un desplegament.
