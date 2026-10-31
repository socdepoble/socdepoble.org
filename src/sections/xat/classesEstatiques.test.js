// @vitest-environment node
/* Cicle 2 del Gauntlet (261030), àrea G · vocabulari.
   La porta tooling/gates/tractor-vocabulari.mjs (V2 · classe-opaca) no pot
   verificar una classe composta amb plantilla com `a${cond ? ' a--mod' : ''}`:
   el tros «a» queda enganxat a la interpolació i la porta el dona per opac.
   Les huit que quedaven de les 11 del cicle 1 (PortesTargeta, MenuTraduir i
   EspecimenColumnes ja les havia tancades una altra mà) passen a noms de
   classe complets i estàtics: `cond ? 'a a--mod' : 'a'`.
   Llei del Píxel: el DOM ha de ser el mateix. Ací s'avalua l'expressió viva de
   cada `className` en tots els estats i es compara, cadena a cadena, amb la
   plantilla d'abans (copiada literal a ABANS). La línia base
   .agents/deute/.vocabulari-deute.json és de governança i no es toca. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse, parseExpression } from '@babel/parser';
import { beforeAll, describe, expect, test } from 'vitest';
import { escaneja } from '../../../tooling/gates/tractor-vocabulari.mjs';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const normalitza = (ruta) => ruta.split(path.sep).join('/');

const VERITAT_I_FALSEDAT = Object.freeze([true, false, 1, 0, 'sí', '', null, undefined, {}]);
const booleana = (nom) => VERITAT_I_FALSEDAT.map((valor) => ({ [nom]: valor }));

/* Cada lloc: el fitxer, una classe que només hi apareix en eixe className
   (per a trobar-lo), la plantilla d'abans i els estats que se n'avaluen. */
const LLOCS = Object.freeze([
  {
    fitxer: 'src/sections/disseny/cataleg/detalls/EspecimenXatRail.jsx',
    clau: 'sdp-xat-especimen--carril',
    abans: "`sdp-xat sdp-xat-especimen sdp-xat-especimen--rail${plegat ? ' sdp-xat-especimen--carril' : ''}`",
    estats: booleana('plegat')
  },
  {
    fitxer: 'src/sections/xat/XatSection.jsx',
    clau: 'sdp-xat-cerca__camp--actiu',
    abans: "`sdp-xat-cerca__camp${cercaActiva ? ' sdp-xat-cerca__camp--actiu' : ''}`",
    estats: booleana('cercaActiva')
  },
  {
    fitxer: 'src/sections/xat/components/Bombolla.jsx',
    clau: 'sdp-xat-bombolla__accions--obert',
    abans: "`sdp-xat-bombolla__accions${menuObert ? ' sdp-xat-bombolla__accions--obert' : ''}`",
    estats: booleana('menuObert')
  },
  {
    fitxer: 'src/sections/xat/components/ControlsAdjunt.jsx',
    clau: 'sdp-xat-adjunts--activa',
    abans: "`sdp-xat-adjunts${activa ? ' sdp-xat-adjunts--activa' : ''}`",
    estats: booleana('activa')
  },
  {
    fitxer: 'src/sections/xat/components/FilaConversa.jsx',
    clau: 'sdp-xat-avatar-icona--sm',
    abans: "`sdp-xat-avatar-icona${mida === 'sm' ? ' sdp-xat-avatar-icona--sm' : ''}`",
    estats: ['sm', 'md', 'lg', undefined].map((mida) => ({ mida }))
  },
  {
    fitxer: 'src/sections/xat/components/FullAjustos.jsx',
    clau: 'sdp-xat-ajustos__fila--perill',
    abans: "`sdp-xat-ajustos__fila${fila.perill ? ' sdp-xat-ajustos__fila--perill' : ''}`",
    estats: [{ perill: true }, { perill: false }, { perill: 'sí' }, {}].map((fila) => ({ fila }))
  },
  {
    fitxer: 'src/sections/xat/components/ResultatsCercaXat.jsx',
    clau: 'sdp-xat-fila--comunitat',
    abans: "`sdp-xat-fila${comunitat ? ' sdp-xat-fila--comunitat' : ''}`",
    estats: booleana('comunitat')
  },
  {
    fitxer: 'src/components/layout/AppGridColumn.jsx',
    clau: 'app-grid-col-header--replegable',
    abans: "`app-grid-col-header app-grid-col-header--replegable${esDark === 'intens' ? ' app-grid-col-header--dark-intens' : esDark ? ' app-grid-col-header--dark' : ''}`",
    estats: ['intens', true, 'suau', false, undefined, '', 0].map((esDark) => ({ esDark }))
  }
]);

/* Les identitats que la porta donava per NOVES (regla|fitxer|token). */
const OPAQUES_DEL_CICLE_1 = Object.freeze([
  'classe-opaca|src/components/layout/AppGridColumn.jsx|app-grid-col-header--replegable${…}',
  'classe-opaca|src/sections/disseny/cataleg/detalls/EspecimenXatRail.jsx|sdp-xat-especimen--rail${…}',
  'classe-opaca|src/sections/xat/XatSection.jsx|sdp-xat-cerca__camp${…}',
  'classe-opaca|src/sections/xat/components/Bombolla.jsx|sdp-xat-bombolla__accions${…}',
  'classe-opaca|src/sections/xat/components/ControlsAdjunt.jsx|sdp-xat-adjunts${…}',
  'classe-opaca|src/sections/xat/components/FilaConversa.jsx|sdp-xat-avatar-icona${…}',
  'classe-opaca|src/sections/xat/components/FullAjustos.jsx|sdp-xat-ajustos__fila${…}',
  'classe-opaca|src/sections/xat/components/ResultatsCercaXat.jsx|sdp-xat-fila${…}'
]);

/* ─── Avaluador mínim de les expressions de className ───
   Només els nodes que hi apareixen; un node o una variable no previstos fan
   caure la prova en lloc de donar un resultat inventat. */
function avalua(n, entorn) {
  switch (n.type) {
    case 'JSXExpressionContainer': return avalua(n.expression, entorn);
    case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': return n.value;
    case 'NullLiteral': return null;
    case 'Identifier':
      if (n.name === 'undefined') return undefined;
      if (!Object.hasOwn(entorn, n.name)) throw new Error(`Variable sense estat: ${n.name}`);
      return entorn[n.name];
    case 'MemberExpression': case 'OptionalMemberExpression': {
      if (n.computed || n.property.type !== 'Identifier') throw new Error('Accés calculat no previst');
      const objecte = avalua(n.object, entorn);
      if (objecte == null) {
        if (n.optional) return undefined;
        throw new TypeError(`Lectura de ${n.property.name} sobre ${objecte}`);
      }
      return objecte[n.property.name];
    }
    case 'TemplateLiteral':
      return n.quasis.map((q, i) => q.value.cooked + (i < n.expressions.length ? String(avalua(n.expressions[i], entorn)) : '')).join('');
    case 'ConditionalExpression':
      return avalua(n.test, entorn) ? avalua(n.consequent, entorn) : avalua(n.alternate, entorn);
    case 'LogicalExpression': {
      const esquerra = avalua(n.left, entorn);
      if (n.operator === '&&') return esquerra && avalua(n.right, entorn);
      if (n.operator === '||') return esquerra || avalua(n.right, entorn);
      return esquerra ?? avalua(n.right, entorn);
    }
    case 'BinaryExpression':
      if (n.operator === '===') return avalua(n.left, entorn) === avalua(n.right, entorn);
      if (n.operator === '!==') return avalua(n.left, entorn) !== avalua(n.right, entorn);
      throw new Error(`Operador no previst: ${n.operator}`);
    case 'UnaryExpression':
      if (n.operator === '!') return !avalua(n.argument, entorn);
      throw new Error(`Operador no previst: ${n.operator}`);
    default:
      throw new Error(`Node no previst: ${n.type}`);
  }
}

function fills(n, cb) {
  for (const k of Object.keys(n)) {
    const v = n[k];
    if (Array.isArray(v)) v.forEach((x) => x && typeof x === 'object' && x.type && cb(x));
    else if (v && typeof v === 'object' && v.type) cb(v);
  }
}

function conteNode(n, tipus) {
  if (n.type === tipus) return true;
  let trobat = false;
  fills(n, (f) => { trobat = trobat || conteNode(f, tipus); });
  return trobat;
}

function literals(n, acc = []) {
  if (n.type === 'StringLiteral') acc.push(n.value);
  else if (n.type === 'TemplateElement') acc.push(n.value.cooked ?? '');
  fills(n, (f) => literals(f, acc));
  return acc;
}

/** Els className amb expressió (`{…}`, no els literals fixos) on apareix la classe `clau` com a token sencer. */
function classNamesAmb(codi, clau) {
  const ast = parse(codi, { sourceType: 'module', plugins: ['jsx'] });
  const trobats = [];
  const visita = (n) => {
    if (n.type === 'JSXAttribute' && n.name?.name === 'className' && n.value?.type === 'JSXExpressionContainer'
      && literals(n.value).some((text) => text.split(/\s+/).includes(clau))) trobats.push(n.value);
    fills(n, visita);
  };
  visita(ast.program);
  return trobats;
}

describe('V2 · classe-opaca: les classes compostes del cicle 1 són estàtiques', () => {
  const DEUTE = JSON.parse(llig('.agents/deute/.vocabulari-deute.json'));
  const identitat = (i) => `${i.regla}|${normalitza(i.fitxer)}|${i.token}`;
  const admesa = (i) => (DEUTE[i.regla]?.identitats ?? []).includes(identitat(i));
  const FITXERS = LLOCS.map((l) => l.fitxer);
  let escaneig;
  beforeAll(() => { escaneig = escaneja(); }, 120000);

  test('la porta de veres (escaneja) no hi troba cap classe opaca fora de la línia base, ni cap de les huit', () => {
    /* Sonda: la porta ha llegit el vocabulari i escaneja el JSX (hi troba deute admés). */
    expect(escaneig.vocab.size).toBeGreaterThan(1000);
    expect(escaneig.vocab.has('sdp-xat-fila--comunitat')).toBe(true);
    expect(escaneig.infraccions.some((i) => i.regla === 'classe-forastera' && admesa(i))).toBe(true);

    const opaques = escaneig.infraccions.filter((i) => i.regla === 'classe-opaca');
    const identitats = new Set(opaques.map(identitat));
    expect(OPAQUES_DEL_CICLE_1.filter((id) => identitats.has(id))).toEqual([]);
    expect(opaques.filter((i) => FITXERS.includes(normalitza(i.fitxer)) && !admesa(i))
      .map((i) => `${normalitza(i.fitxer)}:${i.linia} ${i.token}`)).toEqual([]);
  });
});

describe('Llei del Píxel: la mateixa llista de classes en tots els estats', () => {
  test.each(LLOCS)('$fitxer · $clau', ({ fitxer, clau, abans, estats }) => {
    const vius = classNamesAmb(llig(fitxer), clau);
    expect(vius, `un sol className amb ${clau}`).toHaveLength(1);
    const viu = vius[0];
    /* El remei: noms complets i estàtics, cap plantilla que talle un token. */
    expect(conteNode(viu, 'TemplateLiteral')).toBe(false);

    const vell = parseExpression(abans, { plugins: ['jsx'] });
    const eixides = new Set();
    for (const entorn of estats) {
      const esperat = avalua(vell, entorn);
      expect(avalua(viu, entorn), `${fitxer} amb ${JSON.stringify(entorn)}`).toBe(esperat);
      eixides.add(esperat);
    }
    /* La comparació no és trivial: els estats donen classes diferents, totes
       comencen per la mateixa classe base i algun estat porta la clau. */
    expect(eixides.size).toBeGreaterThanOrEqual(2);
    expect(new Set([...eixides].map((c) => c.split(' ')[0])).size).toBe(1);
    expect([...eixides].some((c) => c.split(' ').includes(clau))).toBe(true);
  });
});
