---
type: document
status: esborrany
description: Què corre sol al Mas, quan, qui ho llança i si continua viu; com ho detecta Emowe i quin registre declaratiu necessita la Consola.
tags:
  - saber
  - temporal
  - maquina
---
# Calendari de processos

Esta peça de la Consola respon a una pregunta: **què corre sol, quan, qui ho llança i si continua viu**. És el complement temporal de [[01_fluxos_skills]].

## Com ho fa Emowe

- Llig `crontab -l` i traduïx cada expressió de cinc camps a diària, setmanal, mensual o «altra» (funció `regla_cron`).
- Llig els `~/Library/LaunchAgents/*.plist` que mencionen agents, skills, Claude, Python i paraules semblants. N'extrau `Hour`, `Minute`, `Weekday` i `StartInterval`; si no n'hi ha cap, la tasca queda com a «en arrancar». A Windows fa el mateix amb `schtasks`.
- Busca horaris escrits dins de les skills, però només si la cadència i l'hora van a la mateixa frase («cada día a las 02:30», «daily at 07:00»). Salta les línies d'historial: el 16-09 la paraula «diari» a soles va omplir el calendari de punts falsos.
- Pinta tres estats:
  - **real**, en color;
  - **declarat però sense ningú que el llance**, buit;
  - **exemple virtual**, en gris discontinu i amb la xapa «exemple».

  Damunt del mes, tres caixes: diàries, setmanals i mensuals.

## Què hi ha al Mas (observat el 24-09-2026)

| Procés | Llançador | Cadència | Què fa | Estat observat |
|---|---|---|---|---|
| Plaquetes | launchd `org.socdepoble.plaquetes`, fora del repositori | cada 3.600 s i en arrancar | executa `scripts/immunitari/plaquetes.mjs diagnostic --autonom` i escriu receptes a `.immunitari/receptes/` i el registre a `.immunitari/cron.out` | viu; diagnostica i no aplica mai |
| Reflex daemon | launchd `com.socdepoble.reflex_daemon`, resident (`KeepAlive`), fora del repositori | permanent | hauria d'executar `tooling/wiki/core/reflex_daemon.mjs` | **mort**: el fitxer no existix i el procés cau amb `MODULE_NOT_FOUND` en bucle |
| Arrencada de sessió | hook `SessionStart` de Claude Code | per esdeveniment | `context-local.mjs` i `despertar.mjs`, que regenera `ON_ESTIC.md` | viu |
| Router cognitiu | hook `UserPromptSubmit` | per esdeveniment | `persona_router.mjs --punters` | viu |
| Porta local | hook `PreToolUse` | per esdeveniment | `hooks-local.mjs` | viu a Claude Code |
| Segell automàtic | hook `PostToolUse` | per esdeveniment | `segell-auto.mjs` | viu; hui refusa perquè el segell està divergent |
| Hooks d'Antigravity | `.agents/hooks.json` | per esdeveniment | les mateixes portes | declarats sense consumidor acreditat |

El registre `.agents/cron/registre_tasques.json` declara cinc tasques de Plaquetes, cadascuna amb nivell, pressupost i fusible:

- `higiene-basica` (L0);
- `adopta-orfes` (L1);
- `lapida-fantasmes` (L2);
- `quarantena-brossa` (L2);
- `refresc-tokens` (L1).

Cap d'elles porta **cadència ni llançador**: la cadència viu al plist, fora de git.

**Revisió del 26-09-2026** (pla `260926_1200_pla_implementacio_infraestructura_fons`): el Reflex daemon es desinstal·la (l'script no ha existit mai, ni a l'índex de git; «reiniciar-lo» només reinicia el bucle); Time Machine no tenia plist instal·lat i s'instal·la amb `--llancador`; les cinc tasques de Plaquetes es declaren subtasques de `plaquetes-diagnostic` (vegeu el model de dades); i els hooks de git estan instal·lats via Husky, no a `.git/hooks`.

## Els dos forats que Emowe ens ensenya a vore

1. **Llançador sense declaració.** Els plist viuen a la carpeta de l'usuari, no al repositori. Cap agent, cap porta ni cap clon els veu. El Reflex daemon cau en bucle sense que ningú ho sàpiga. És exactament la caixa grisa d'Emowe «qui avisa quan alguna cosa es trenca».
2. **Declaració sense llançador.** Una tasca del registre que no té plist ni hook és només una promesa. Emowe la pinta buida, i nosaltres també ho farem.

## Model de dades proposat

Proposta: ampliar `.agents/cron/registre_tasques.json`, que és la còpia declarativa dins del repositori. Cada tasca guanya el llançador, la cadència, l'script i el que llig i escriu:

```json
{
  "id": "plaquetes-diagnostic",
  "llancador": { "tipus": "launchd", "etiqueta": "org.socdepoble.plaquetes" },
  "cadencia": { "cada_segons": 3600, "en_arrencar": true },
  "script": "scripts/immunitari/plaquetes.mjs",
  "arguments": ["diagnostic", "--autonom"],
  "llig": ["_wiki_de_poble/"],
  "escriu": [".immunitari/receptes/", ".immunitari/cron.out"],
  "registre": ".immunitari/cron.out",
  "nivell": "L0"
}
```

- Tipus de `llancador`: `launchd`, `cron`, `hook` (amb el camp `esdeveniment`), `git-hook` (amb `esdeveniment`), `tasca` (amb el camp `tasca`: l'id de la tasca declarada que la llança) i `manual`.
- `cadencia` s'expressa en segons o amb una expressió cron de cinc camps. Els esdeveniments no tenen hora: es pinten a part, no al mes.
- Una **subtasca** (`llancador.tipus: "tasca"`) no té plist propi: la llança una altra tasca del registre. Hereta l'estat i, si no en declara, la cadència de la mare. Des de l'Onada 6, una subtasca sense `script` propi no hereta el «viu»: que la mare corra no demostra que l'execute, i queda «desconegut». És el cas de les cinc tasques de Plaquetes, perquè `plaquetes-diagnostic` diagnostica i no aplica mai. Una mare absent o un cicle (dos tasques que es llancen l'una a l'altra) deixen la subtasca «declarada sense llançador».
- Un **hook de git** es jutja pel text del hook instal·lat (`.husky/<esdeveniment>`, que el compilador llig del disc): viu si cita l'script de la tasca, mort si el hook existix i no el cita, desconegut si el compilador no ha pogut llegir el hook. Els hooks de git viuen a `.husky/`, no a `.git/hooks/`: `git config core.hooksPath` apunta a `.husky/_`, i és eixa configuració la que els activa.

## Com calcula l'estat la Consola

| Estat | Regla | Com es pinta |
|---|---|---|
| viu | llançador present, script existent i registre amb activitat dins de dos cicles | traç ple |
| mort | script inexistent, o l'última línia del registre és un error | roig |
| declarat sense llançador | és al registre però no té cap plist ni hook | buit |
| llançador sense declaració | té plist o hook però no és al registre | traç discontinu, amb avís |
| exemple | només per a la demostració | gris, amb la xapa «exemple» |

El navegador no pot llegir `~/Library/LaunchAgents` ni els registres. Ho ha de compilar un script de node, de només lectura, que deixe el resultat al JSON que llig la Consola (vegeu [[04_contracte_de_dades]]).

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[03_inventari_skills]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]
