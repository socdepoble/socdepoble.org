// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaZip } from '../../utils/fulls/zip.js';
import { validaBytesDocumentXat, validaDocumentXat, MAX_DOCUMENT_BYTES } from './documents.js';
import { creaIndexCercaConversa, fusionaResultatsCerca, navegaResultatsCerca, carregaMissatgeCitat } from './cercaConversa.js';
import { hidrataConversesCompletes, exportaConversesCompletes, creaMagatzemRestauracioXat, restauraCopiaSeguretat } from './restauraCopiaSeguretat.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { pdf } from '../../../tests/helpers/contenidorsMediaR3215.js';

const enc = x => new TextEncoder().encode(x);
const U = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', F = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const mid = n => `cccccccc-cccc-4ccc-8ccc-${String(n).padStart(12, '0')}`;
const missatge = n => ({ id: mid(n), filId: F, usuariId: U, seq: n, text: `Café de l’àvia ${n}`, tipus: 'text', creatAl: '2026-11-25T02:00:00.000Z' });
const docx = ext => creaZip([{ nom: '[Content_Types].xml', dades: '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" /></Types>' }, { nom: 'word/document.xml', dades: '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Text</w:t></w:r></w:p></w:body></w:document>' }, { nom: '_rels/.rels', dades: '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships" />' }, ...ext]);
const odt = ({ prefix = 'office', scriptPrefix = 'evt', event = '', scripts = 'self', extra = [] } = {}) => {
  const mime = 'application/vnd.oasis.opendocument.text';
  const buit = scripts === 'self' ? `<${prefix}:scripts/>` : `<${prefix}:scripts> <!-- buit --> </${prefix}:scripts>`;
  const content = `<${prefix}:document-content xmlns:${prefix}="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:form="urn:oasis:names:tc:opendocument:xmlns:form:1.0" xmlns:${scriptPrefix}="urn:oasis:names:tc:opendocument:xmlns:script:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ooo="http://openoffice.org/2004/office" xmlns:dom="http://www.w3.org/2001/xml-events" ${prefix}:version="1.3">${buit}<${prefix}:body><${prefix}:text>${event}<text:p>Text &amp; dades &#xE0;</text:p></${prefix}:text></${prefix}:body></${prefix}:document-content>`;
  return creaZip([{ nom: 'mimetype', dades: mime }, { nom: 'content.xml', dades: content }, ...extra]);
};
describe('documents pels bytes', () => {
  it('admet PDF, TXT/CSV UTF8 i Office amb paquet verificat', () => {
    expect(validaBytesDocumentXat(pdf(), 'application/pdf')).toBe(true);
    for (const mime of ['text/plain', 'text/csv']) expect(validaBytesDocumentXat(enc('Nom,collita\nPepa,oliva'), mime)).toBe(true);
    expect(validaBytesDocumentXat(docx([]), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    const mime = 'application/vnd.oasis.opendocument.text';
    expect(validaBytesDocumentXat(creaZip([{ nom: 'mimetype', dades: mime }, { nom: 'content.xml', dades: '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"><office:scripts/><office:body><office:text /></office:body></office:document-content>' }]), mime)).toBe(true);
  });
  it.each(['<html>fals</html>', '<svg/onload=alert(1)>', '\ufeff  <script>alert(1)</script>', 'const a = 1;', '#!/bin/sh\necho hola', 'window.location="https://example.invalid"'])('[DEFECTE] rebutja executable disfressat: %s', text => {
    expect(() => validaBytesDocumentXat(enc(text), 'text/plain')).toThrow();
    expect(() => validaBytesDocumentXat(enc(text), 'application/pdf')).toThrow();
  });
  it('rebutja UTF8 corrupte, NUL, falsa màgia, CRC trencat, macros i mida', async () => {
    for (const bytes of [Uint8Array.of(0xff), enc('hola\0')]) expect(() => validaBytesDocumentXat(bytes, 'text/plain')).toThrow();
    expect(() => validaBytesDocumentXat(enc('PK\x03\x04'), 'application/vnd.oasis.opendocument.text')).toThrow();
    expect(() => validaBytesDocumentXat(docx([{ nom: 'word/vbaProject.bin', dades: 'macro' }]), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toThrow();
    const trencat = docx([]); trencat[60] ^= 1;
    expect(() => validaBytesDocumentXat(trencat, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toThrow();
    await expect(validaDocumentXat(new Blob([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], { type: 'text/plain' }))).rejects.toThrow();
  });
  it('[DEFECTE] rebutja PDF i Office amb HTML/script baix de les signatures', () => {
    expect(() => validaBytesDocumentXat(enc('%PDF-1.7\n<script>alert(1)</script>\n%%EOF'), 'application/pdf')).toThrow();
    expect(() => validaBytesDocumentXat(pdf({ extra: '/JavaScript (x)' }), 'application/pdf')).toThrow();
    const mime = 'application/vnd.oasis.opendocument.text';
    expect(() => validaBytesDocumentXat(creaZip([{ nom: 'mimetype', dades: mime }, { nom: 'content.xml', dades: '<html><script>1</script></html>' }]), mime)).toThrow();
    expect(() => validaBytesDocumentXat(enc('alert(1)'), 'text/plain')).toThrow();
  });
  it.each(['<img src=x onerror="alert(1)">', '<meta http-equiv="refresh" content="0;url=https://example.invalid">', '<form><input name="compte"></form>', '(()=>{alert(1)})();', '(() => alert(1))();', '(function(){alert(1)})();', '(async function prova(){return 1;})();', 'import("https://example.invalid/code.js")'])('[DEFECTE] TXT/CSV refusen markup o estructura executable: %s', text => {
    for (const mime of ['text/plain', 'text/csv']) expect(() => validaBytesDocumentXat(enc(text), mime)).toThrow();
  });
  it('TXT/CSV conserven prosa i codi citat sense executar ni prometre antivirus', () => {
    for (const text of ['Nom,Collita\nPepa,Oliva', 'La temperatura és 2 < 3 i 5 > 4.', 'La frase "x => x" és una cita.', 'El mot function es pot explicar en prosa.']) {
      expect(validaBytesDocumentXat(enc(text), 'text/plain')).toBe(true);
    }
  });
  it('Office manté body real i scripts buit amb àlies de namespaces', () => {
    const mime = 'application/vnd.oasis.opendocument.text';
    expect(validaBytesDocumentXat(odt(), mime)).toBe(true);
    expect(validaBytesDocumentXat(odt({ prefix: 'o', scripts: 'paired' }), mime)).toBe(true);
    expect(validaBytesDocumentXat(docx([]), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
  });
  it.each(['script', 'evt', 'other'])('[DEFECTE] ODT refusa event-listener real encara que el prefix siga %s', prefix => {
    const event = `<office:forms><form:form form:name="F1"><office:event-listeners><${prefix}:event-listener ${prefix}:language="ooo:script" ${prefix}:event-name="dom:load" xlink:href="vnd.sun.star.script:Standard.Module1.Main?language=Basic&amp;location=application" xlink:type="simple"/></office:event-listeners></form:form></office:forms>`;
    expect(() => validaBytesDocumentXat(odt({ scriptPrefix: prefix, event }), 'application/vnd.oasis.opendocument.text')).toThrow();
  });
  it.each(['External', '&#x45;xternal', '&#69;xternal', ['Ex&', String.fromCharCode(35), '116;ernal'].join('')])('[DEFECTE] DOCX refusa TargetMode semàntic External: %s', mode => {
    const rels = `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" Target="https://example.invalid/template.dotm" TargetMode="${mode}"/></Relationships>`;
    expect(() => validaBytesDocumentXat(docx([{ nom: 'word/_rels/settings.xml.rels', dades: rels }]), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toThrow();
  });
  it('XML refusa DTD, NCR invàlids, prefixos sense declarar i expansions repetides; admet entitats normals', () => {
    const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    for (const xml of ['<!DOCTYPE x [<!ENTITY foo "x">]><x/>', '<x value="&#0;"/>', '<x value="&#xD800;"/>', '<x value="&#x110000;"/>', '<bad:x/>', '<x value="' + '&amp;'.repeat(4097) + '"/>', '<x ' + Array.from({ length: 257 }, (_, i) => `a${i}="x"`).join(' ') + '/>']) {
      expect(() => validaBytesDocumentXat(docx([{ nom: 'word/custom.xml', dades: xml }]), mime)).toThrow();
    }
    expect(validaBytesDocumentXat(docx([{ nom: 'word/custom.xml', dades: '<x value="Text &amp; dada &#65; &#xE0;"/>' }]), mime)).toBe(true);
  });
});
describe('cerca conversa', () => {
  it('plega accents, ordena seq, desduplica i manté làpida', () => {
    expect(creaIndexCercaConversa([missatge(2), missatge(1)], { filId: F }).cerca('CAFE de l’AVIA')).toHaveLength(2);
    expect(fusionaResultatsCerca([missatge(1), missatge(2)], [{ ...missatge(1), esborratAl: 'ara' }, missatge(3)], { filId: F }).map(m => m.seq)).toEqual([2, 3]);
    expect(() => fusionaResultatsCerca([], [{ ...missatge(1), filId: U }], { filId: F })).toThrow();
    expect(fusionaResultatsCerca([{ ...missatge(1), text: 'edició nova', editatAl: '2026-11-25T03:00:00Z' }], [missatge(1)], { filId: F })[0].text).toBe('edició nova');
    expect(() => fusionaResultatsCerca([missatge(1)], [{ ...missatge(1), seq: 2 }], { filId: F })).toThrow(/divergent/);
  });
  it('navega amb retorn circular, 0/0 i cita antiga amb autorització', async () => {
    expect(navegaResultatsCerca([]).actual).toBe(0);
    expect(navegaResultatsCerca([missatge(1), missatge(2)], { idActual: mid(1), direccio: -1 }).actual).toBe(2);
    expect((await carregaMissatgeCitat(mid(99), { filId: F, carregaPerId: async () => missatge(99) })).seq).toBe(99);
    await expect(carregaMissatgeCitat(mid(99), { filId: F, carregaPerId: async () => ({ ...missatge(99), filId: U }) })).rejects.toThrow();
  });
});
describe('còpia completa i restauració IndexedDB', () => {
  const base = { fils: [{ id: F, tipus: 'directe' }], usuariId: U, tenantId: F, contrasenya: 'Una contrasenya de prova', cripto: webcrypto, comprovaAmbit: () => {} };
  const carregaPagina = async (_fil, { abansDeSeq, limit }) => Array.from({ length: 205 }, (_, i) => missatge(i + 1)).filter(m => abansDeSeq === null || m.seq < abansDeSeq).slice(-limit);
  it('hidrata 205 missatges en 3 pàgines; mai només els50 de la UI', async () => {
    const resultat = await hidrataConversesCompletes({ ...base, carregaPagina });
    expect(resultat.missatges).toHaveLength(205);
    expect(resultat.missatges[0].seq).toBe(1);
    await expect(hidrataConversesCompletes({ ...base, carregaPagina: async () => Array.from({ length: 100 }, (_, i) => missatge(i + 1)) })).rejects.toThrow(/cursor/);
    await expect(hidrataConversesCompletes({ ...base, carregaPagina, maxPagines: 1 })).rejects.toThrow(/parcial/);
    await expect(exportaConversesCompletes({ ...base, carregaPagina, desDeSeqPerFil: { [F]: 1 } })).rejects.toThrow(/tall parcial/);
  });
  it('[DEFECTE] una completa nova lleva text antic i no ressuscita una làpida', async () => {
    const idb = creaIdbFalsEstructurat(); const magatzem = creaMagatzemRestauracioXat({ ...base, indexedDB: idb });
    const copiaA = await exportaConversesCompletes({ ...base, carregaPagina: async () => [missatge(1)] });
    const copiaB = await exportaConversesCompletes({ ...base, carregaPagina: async () => [{ ...missatge(1), text: '', esborratAl: '2026-11-25T03:00:00.000Z' }] });
    const options = { magatzem, contrasenya: base.contrasenya, cripto: webcrypto, comprovaAmbit: base.comprovaAmbit };
    await restauraCopiaSeguretat(copiaA.text, options); await restauraCopiaSeguretat(copiaB.text, options); await restauraCopiaSeguretat(copiaA.text, options);
    expect((await magatzem.llegix()).missatges[mid(1)]).toMatchObject({ text: '', esborratAl: '2026-11-25T03:00:00.000Z' });
  });
  it('xifra600k, restaura idempotent, rebutja corrupció/compte i falla quota atòmicament', async () => {
    const idb = creaIdbFalsEstructurat();
    const magatzem = creaMagatzemRestauracioXat({ ...base, indexedDB: idb });
    const copia = await exportaConversesCompletes({ ...base, carregaPagina });
    expect(JSON.parse(copia.text).capcalera.kdf.iteracions).toBe(600_000);
    const options = { magatzem, contrasenya: base.contrasenya, cripto: webcrypto, comprovaAmbit: base.comprovaAmbit };
    expect((await restauraCopiaSeguretat(copia.text, options)).missatges).toBe(205);
    expect((await restauraCopiaSeguretat(copia.text, options)).idempotent).toBe(true);
    const snapshot = await magatzem.llegix();
    const mal = JSON.parse(copia.text); mal.xifrat = (mal.xifrat[0] === 'A' ? 'B' : 'A') + mal.xifrat.slice(1);
    await expect(restauraCopiaSeguretat(JSON.stringify(mal), options)).rejects.toThrow();
    await expect(restauraCopiaSeguretat(copia.text, { ...options, contrasenya: 'incorrecta' })).rejects.toThrow();
    expect(await magatzem.llegix()).toEqual(snapshot);
    const altre = creaMagatzemRestauracioXat({ usuariId: F, tenantId: F, indexedDB: idb });
    await expect(restauraCopiaSeguretat(copia.text, { ...options, magatzem: altre })).rejects.toThrow();
    expect((await altre.llegix()).copies).toEqual({});
    const omplit = creaIdbFalsEstructurat(); omplit.omplit = true;
    const ple = creaMagatzemRestauracioXat({ ...base, indexedDB: omplit });
    await expect(restauraCopiaSeguretat(copia.text, { ...options, magatzem: ple })).rejects.toThrow();
    expect((await ple.llegix()).missatges).toEqual({});
  });
  it('[DEFECTE] guarda obligatòria i canvi de compte després del carregador avorten abans d’exportar', async () => {
    await expect(hidrataConversesCompletes({ ...base, carregaPagina, comprovaAmbit: undefined })).rejects.toMatchObject({ codi: 'SDP_BACKUP_RESTAURACIO_AVORTADA' });
    let actiu = true;
    await expect(hidrataConversesCompletes({ ...base, comprovaAmbit: () => { if (!actiu) throw new DOMException('Compte canviat', 'AbortError'); }, carregaPagina: async () => { actiu = false; return [missatge(1)]; } })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
