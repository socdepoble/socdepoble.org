/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · El text d'un veí abans d'eixir a un <head> estàtic
   (text-veinal.mjs): sense caràcters de format, amb el detector de contactes del Mur públic (els vectors
   són els de la migració 2611122200 · private.mur_text_public) i la regla de suplantació de nom. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esSuplantacio, nomNormalitzat, teContacte, textVeinal} from './text-veinal.mjs';
import {esClauReservadaPerAUnAltre} from '../../src/config/metadadesDePerfil.js';

test('textVeinal: text pla sense caràcters de control ni de format (bidi, amplada zero, guionet opcional)', () => {
  assert.equal(textVeinal('Oli‮ de​ la <b>Torre</b>­'), 'Oli de la Torre');
  assert.equal(textVeinal('⁦Forn⁩‏ nou﻿'), 'Forn nou');
  assert.equal(textVeinal('línia\u0007 amb\tcontrol'), 'línia amb control');
  assert.equal(textVeinal(null), '');
  assert.equal(textVeinal('a'.repeat(400), 160).length, 160);
  assert.throws(() => textVeinal('clau sb_' + 'secret_abcdefghijklmnopqrstuvwxyz'), /possible secret/);
});

test('teContacte detecta correu, telèfon, UUID, URL amb esquema, tel:, mailto:, wa.me i t.me', () => {
  for (const text of ['Escriu a info@olidelatorre.cat', 'Truca al 965 123 456', '+34 965123456', 'Tel. (96) 512.34.56', 'https://olidelatorre.cat', 'http://exemple.org/x',
    'tel:965123456', 'mailto:hola@exemple.org', 'wa.me/34666555444', 'www.t.me/elforn', 'sdp-media://mitjans/a/b.webp', 'data:text/plain,hola',
    'id 3073b933-69fc-4c3e-80dc-b0df9c6b8391', 'El 2026-13-45 no és cap data', '5000-1000 no és cap rang', 'ISBN 978-84-376-0494-0 dolent']) {
    assert.equal(teContacte(text), true, text);
  }
});

test('teContacte no dona positiu amb dates, rangs d’anys, ISBN, preus, horaris ni un «@nom»', () => {
  for (const text of ['Oli verge extra de la serra', 'Obrim el 2026-11-13', 'Des de 1987-2026 fent oli', 'ISBN 978-84-376-0494-7', 'ISBN-10: 84-376-0494-X',
    '12.500 habitants i el 03108', 'Obert de 9 a 14 i de 17 a 20', 'CIF B12345678', '@olidelatorre a les xarxes', 'Carrer Major, 12', '', null, 42]) {
    assert.equal(teContacte(text), false, String(text));
  }
});

test('teContacte no muta el text i no té estat entre crides', () => {
  const text = 'Truca al 965 123 456 o el 2026-11-13';
  assert.equal(teContacte(text), true); assert.equal(teContacte(text), true);
  assert.equal(text, 'Truca al 965 123 456 o el 2026-11-13');
  assert.equal(teContacte('Des de 1987-2026'), false); assert.equal(teContacte('Des de 1987-2026'), false);
});

test('nomNormalitzat i esSuplantacio: el nom d’una identitat del paquet amb un id no declarat, o «Ajuntament» sense ser-ho', () => {
  assert.equal(nomNormalitzat('  Sóc  de Poble! '), 'socdepoble');
  assert.equal(nomNormalitzat('IAIA MarIA'), nomNormalitzat('iaia maria'));
  const identitats = [{nom: 'Sóc de Poble', clau: 'socdepoble'}, {nom: 'IAIA MarIA', clau: 'iaia-maria'}, {nom: 'Javi Llinares', clau: 'javillinares'}];
  const guarda = {identitats, reservadaPerAUnAltre: esClauReservadaPerAUnAltre};
  const ALTRE = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  for (const name of ['Sóc de Poble', 'SOC DE POBLE', 'Soc-de-Poble', 'IAIA MarIA', 'iaia maria', 'Javi Llinares']) assert.equal(esSuplantacio({name, id: ALTRE, kind: 'company'}, guarda), true, name);
  // La fila de veres de l'entitat pilot (el seu id és un dels que declara la llavor) no suplanta ningú.
  assert.equal(esSuplantacio({name: 'Sóc de Poble', id: 'a240e870-4aef-4d92-b138-e8b4e2f2123a', kind: 'company'}, guarda), false);
  assert.equal(esSuplantacio({name: 'Forn de la Torre', id: ALTRE, kind: 'company'}, guarda), false);
  assert.equal(esSuplantacio({name: 'Sóc de Poble Sella', id: ALTRE, kind: 'company'}, guarda), false);
  for (const name of ['Ajuntament de la Torre', 'AJUNTAMENT Vell', 'Ajuntament']) {
    assert.equal(esSuplantacio({name, id: ALTRE, kind: 'company'}, guarda), true, name);
    assert.equal(esSuplantacio({name, id: ALTRE, kind: 'city_hall'}, guarda), false, name);
  }
  assert.equal(esSuplantacio({name: '', id: ALTRE, kind: 'company'}, guarda), false);
});

/* Crítica de seguretat del lliurament R22 · El nom que es VEU. Una lletra ciríl·lica o grega que pinta com la
   llatina, o la forma d'amplada completa, fan el mateix títol a la targeta de WhatsApp de socdepoble.org i
   passaven la guarda (NFD no les plega). Els noms legítims en llatí no canvien. */
test('esSuplantacio: el nom d’una identitat o «Ajuntament» escrit amb lletres que pinten igual també suplanta', () => {
  const identitats = [{nom: 'Sóc de Poble', clau: 'socdepoble'}, {nom: 'IAIA MarIA', clau: 'iaia-maria'}];
  const guarda = {identitats, reservadaPerAUnAltre: esClauReservadaPerAUnAltre};
  const ALTRE = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  for (const name of ['Sóc de Pоble', 'Sοc de Poble', 'IAIА MarIA', 'Ｓｏｃ de Poble',
    'Аjuntament de la Torre', 'Ajuntamеnt de la Torre', 'Ａｊｕｎｔａｍｅｎｔ de la Torre']) {
    assert.equal(esSuplantacio({name, id: ALTRE, kind: 'company'}, guarda), true, JSON.stringify(name));
  }
  assert.equal(nomNormalitzat('Sóc de Pоble'), 'socdepoble');
  for (const name of ['Forn de la Torre', 'Calçats Rosa', 'Sóc de Poble Sella']) assert.equal(esSuplantacio({name, id: ALTRE, kind: 'company'}, guarda), false, name);
});
