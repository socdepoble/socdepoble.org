# Integració del Tractor de Psicopatia

## Fitxers

Copia mantenint aquestes rutes des de l'arrel del repositori:

```text
tooling/gates/tractor-psicopatia.mjs
tooling/gates/tractor-psicopatia.test.mjs
requirements/online-first.json
requirements/requirement-gate.schema.json
```

## `package.json`

Afig les ordres següents a `scripts`:

```json
{
  "scripts": {
    "porta:psicopatia": "node tooling/gates/tractor-psicopatia.mjs",
    "test:porta:psicopatia": "node --test tooling/gates/tractor-psicopatia.test.mjs",
    "build:app": "vite build",
    "build": "npm run porta:psicopatia && npm run build:app"
  }
}
```

Si el `build` actual conté més portes, el tractor de psicopatia ha d'anar **primer**, abans de tests, generadors i Vite:

```json
"build": "npm run porta:psicopatia && npm run porta:enxufe && npm run test && vite build"
```

Posar-lo primer evita gastar temps compilant un arbre que ja parteix d'un contracte contradictori. Els operadors `&&` són obligatoris: així un exit 1 deté la cadena.

No és recomanable usar només `prebuild`: npm executa `prebuild` amb `npm run build`, però altres runners poden invocar Vite directament. Mantindre la porta dins de `build` fa visible la protecció. Si es conserva `prebuild`, deixa igualment una comprovació explícita al workflow de CI.

## CI

Executa sempre el script de npm, no `vite build` directament:

```yaml
- name: Portes i compilació
  run: npm run build
```

Opcionalment, conserva l'informe encara que falle la porta:

```yaml
- name: Coherència arquitectònica
  run: node tooling/gates/tractor-psicopatia.mjs --json-report reports/tractor-psicopatia.json
```

## Excepcions documentades

Una explicació històrica legítima dins d'un fitxer viu necessita una excepció local amb l'identificador exacte i un motiu no buit:

```md
<!-- tractor-psicopatia: allow ZOMBIE-OFFLINE-FIRST -- antecedent històric de l'ADR -->
Offline-First fou l'estratègia anterior, ja retirada.
```

Per a JavaScript o CSS també pot usar-se un comentari en la línia anterior:

```js
// tractor-psicopatia: allow ZOMBIE-IPAD-A10 -- prova de regressió documental
const legacyFixture = 'iPad A10';
```

No afegisques excepcions globals per comoditat. Els documents que realment ja no són vigents han de portar `status: historical`, `status: superseded` o moure's a una ruta històrica declarada.
