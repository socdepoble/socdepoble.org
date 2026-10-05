import { expect, test } from 'vitest';
import { TIPUS_MARE } from '../../data/organizations.js';
import { empresesMare } from './perfilModel.js';

/* F5 · poliment (ordre del Mestre, 261004; Marató 2230) · El diàleg de NOVA
   ORG oferix com a mare les mateixes organitzacions que el domini accepta
   (TIPUS_MARE, organizations.js). Les identitats es construïxen com les fa
   PerfilContext.jsx:326-333 (mena derivada del kind; dades = la fila del port),
   perquè la prova vigile el contracte real i no un model inventat. */
const org = (id, kind, role = 'owner') => ({
  id, mena: kind === 'group' ? 'grup' : 'empresa', nom: `Org ${id}`, dades: { id, kind, role },
});
const valors = (identitats) => empresesMare(identitats).map((opcio) => opcio.valor);

test('una associació i un ajuntament que la persona mana s’oferixen com a mare', () => {
  expect(empresesMare([org('E', 'entity'), org('A', 'city_hall')])).toEqual([
    { valor: 'E', etiqueta: 'Org E' },
    { valor: 'A', etiqueta: 'Org A' },
  ]);
});

/* Simetria amb el domini: cada kind de TIPUS_MARE, amb rol que mana, s'oferix.
   Si algú amplia o estreny TIPUS_MARE, la UI el seguix sense tocar-la. */
test.each([...TIPUS_MARE].flatMap((kind) => [[kind, 'owner'], [kind, 'admin']]))(
  'un kind de TIPUS_MARE (%s) amb rol %s s’oferix',
  (kind, role) => {
    expect(valors([org('M', kind, role)])).toEqual(['M']);
  },
);

test('un grup no s’oferix com a mare, encara que el mane', () => {
  expect(valors([org('G', 'group'), org('G2', 'group', 'admin')])).toEqual([]);
});

/* Abans, «tot el que no és grup» oferia un kind desconegut que el domini
   rebutjava després («Tria una empresa que pugues administrar»). */
test.each(['cooperativa', '', 'Company'])('un kind desconegut (%j) no s’oferix', (kind) => {
  expect(valors([org('X', kind)])).toEqual([]);
});

test('una organització que la persona no mana no s’oferix', () => {
  expect(valors([org('E', 'entity', 'member'), org('A', 'city_hall', null), org('C', 'company', 'member')])).toEqual([]);
});

test('ni la persona ni un agent IA són mare, encara que la seua fila porte un kind de mare', () => {
  expect(valors([
    { id: 'jo', mena: 'persona', nom: 'Pep', dades: { kind: 'company', role: 'owner' } },
    { id: 'ia', mena: 'agent', nom: 'IAIA', dades: { kind: 'entity', role: 'owner' } },
  ])).toEqual([]);
});

/* Reserva declarada a perfilModel.js: una fila sense kind (un port que no el
   declare) conserva el criteri d'abans, perquè cap opció desaparega per una
   dada absent. */
test('una identitat sense kind conserva el criteri d’abans (mena «empresa»)', () => {
  expect(valors([
    { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } },
    { id: 'G', mena: 'grup', nom: 'Colla', dades: { role: 'owner' } },
  ])).toEqual(['O']);
});
