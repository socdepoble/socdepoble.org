// @vitest-environment node
/* Finestreta · nucli · filtre previ dels documents. Ordre del Mestre,
   13-10-2026 (pla 261013_1405, front H): es decidix pel nom i les carpetes,
   abans d'obrir cap byte, i el VETAT sempre guanya. Tots els noms són
   sintètics: cap nom real de la carpeta de la Gestoria. */
import { describe, expect, test } from 'vitest';
import { dataDelNom, decidixLectura, MOTIUS, TIPUS_DOCUMENT_IDENTITAT } from './filtreDocuments.js';

const ID = (nom) => `01_Identitat_Legal/${nom}`;
const SUMA = (nom) => `03_Burocracia/SUMA/${nom}`;

describe('abast i carpetes excloses', () => {
  test('fora de 01_Identitat_Legal i de 03_Burocracia/SUMA: ometre', () => {
    for (const ruta of ['02_Factures/vida_laboral.pdf', '03_Burocracia/Ajuntament/vida_laboral.pdf', 'vida_laboral.pdf', '', null]) {
      expect(decidixLectura(ruta), String(ruta)).toMatchObject({ decisio: 'ometre', motiu: 'fora-dabast' });
    }
  });

  test('l’abast també es troba des de l’arrel de la Gestoria i amb barres invertides', () => {
    expect(decidixLectura('_gestoria_sintetica/01_Identitat_Legal/TGSS/vida_laboral.pdf').decisio).toBe('llegir');
    expect(decidixLectura('01_Identitat_Legal\\TGSS\\vida_laboral.pdf').decisio).toBe('llegir');
  });

  test('90_*, quarantena i Agència Tributària: ometre encara que el nom siga permés', () => {
    for (const ruta of [ID('90_Arxiu/vida_laboral.pdf'), ID('Quarantena/vida_laboral.pdf'), `90_arxiu_historic/${ID('vida_laboral.pdf')}`, ID('Agencia_Tributaria/vida_laboral.pdf')]) {
      expect(decidixLectura(ruta), ruta).toMatchObject({ decisio: 'ometre', motiu: 'carpeta-exclosa' });
    }
  });

  test('fitxers ocults o temporals', () => {
    expect(decidixLectura(ID('.DS_Store')).motiu).toBe('ocult');
    expect(decidixLectura(ID('~$vida_laboral.pdf')).motiu).toBe('ocult');
  });
});

describe('VETAT: sempre guanya', () => {
  test.each([
    ['salut', 'Parte_de_Baja_2025.pdf'], ['salut', 'Incapacidad_Temporal_pago_directo.pdf'], ['salut', 'resolucion_IT_2024.pdf'],
    ['salut', 'Baja_Medica.pdf'], ['salut', 'comunicat_medic.pdf'], ['salut', 'Certificado_Discapacidad.pdf'], ['salut', 'incapacitat temporal.pdf'],
    ['model-145', 'Modelo_145.pdf'], ['model-145', 'mod145_empresa.pdf'],
    ['banc', 'certificado_bancario.pdf'], ['banc', 'Titularidad_Cuenta.pdf'], ['banc', 'AvisoCC_recibo.pdf'], ['banc', 'recibos_cotizacion.pdf'],
    ['banc', 'RLC_marzo.pdf'], ['banc', 'compte_corrent.pdf'],
    ['credencials', 'contraseñas.txt'], ['credencials', 'password_sede.txt'], ['credencials', 'Clave_PIN.pdf'],
    ['renda-herencia', 'Renta_2024.pdf'], ['renda-herencia', 'declaracio renda.pdf'], ['renda-herencia', 'Herencia_documentos.pdf']
  ])('%s: «%s»', (motiu, nom) => {
    expect(decidixLectura(ID(nom))).toEqual({ decisio: 'ometre', tipus: null, organisme: null, motiu });
  });

  /* Revisió adversarial 13-10-2026, troballa ID-F2: cada vet també en valencià i en les variants habituals.
     Sense el vet, cada un d'estos noms anava a «demanar» (o a «llegir» dins de SUMA): una marca l'obria. */
  test.each([
    ['salut', 'pagament_directe.pdf'], ['salut', 'Grau_minusvalidesa.pdf'], ['salut', 'minusvalido.pdf'], ['salut', 'part_de_baixa_2025.pdf'],
    ['salut', 'baixa_laboral.pdf'], ['salut', 'baja_laboral.pdf'],
    ['model-145', 'Model_145.pdf'], ['model-145', 'model145.pdf'], ['model-145', 'M145_2025.pdf'], ['model-145', 'mod 145.pdf'],
    ['banc', 'Avís_de_càrrec_RETA.pdf'], ['banc', 'Aviso_de_cargo_IBI.pdf'], ['banc', 'avisos de càrrec.pdf'], ['banc', 'avis carrec.pdf'],
    ['banc', 'Domiciliació_rebuts.pdf'], ['banc', 'domiciliacion_IBI.pdf'], ['banc', 'recibo_domiciliado.pdf'], ['banc', 'rebut domiciliat.pdf'],
    ['banc', 'certificat_IBAN.pdf'], ['banc', 'mandato_SEPA.pdf'],
    ['credencials', 'contrasenyes.txt'], ['credencials', 'contrasenya_seu.txt'], ['credencials', 'claus_seu.txt'], ['credencials', 'clau.txt'],
    ['credencials', 'credencials_sede.pdf'], ['credencials', 'passwd.txt'],
    ['renda-herencia', 'IRPF_2024.pdf'], ['renda-herencia', 'impost_successions.pdf'], ['renda-herencia', 'Impuesto_sucesiones.pdf'],
    ['renda-herencia', 'testament.pdf'], ['renda-herencia', 'Testamento.pdf']
  ])('en valencià i en variants · %s: «%s»', (motiu, nom) => {
    expect(decidixLectura(ID(nom))).toEqual({ decisio: 'ometre', tipus: null, organisme: null, motiu });
  });

  test('ID-F2: dins de SUMA, els avisos de càrrec i les domiciliacions tampoc s’obrin', () => {
    for (const nom of ['Aviso_de_cargo_IBI.pdf', 'Avís_de_càrrec_IBI.pdf', 'domiciliacion_IBI.pdf', 'Domiciliació_IVTM.pdf']) {
      expect(decidixLectura(SUMA(nom)), nom).toEqual({ decisio: 'ometre', tipus: null, organisme: null, motiu: 'banc' });
    }
  });

  test('ID-F2: el domicili no és una domiciliació, ni «clau» dins d’una paraula és una credencial', () => {
    for (const nom of ['cambio_domicilio_fiscal.pdf', 'domicili_social.pdf', 'claustre.pdf', 'enclau.pdf']) {
      expect(decidixLectura(ID(nom)), nom).toEqual({ decisio: 'demanar', tipus: 'desconegut', organisme: null, motiu: 'nom-opac' });
    }
  });

  /* Revisió adversarial 13-10-2026, troballa ID-F6: la «base de cotització» i el «compte propi» no són banc. */
  test.each([
    ['Informe_de_bases_de_cotizacion_2024.pdf', 'informe-bases'],
    ['Informe de bases de cotització.pdf', 'informe-bases'],
    ['informe_bases_cotizacion.pdf', 'informe-bases'],
    ['Informe_de_bases_de_la_cotizacion.pdf', 'informe-bases'],
    ['Resolucion_RETA_cuenta_propia.pdf', 'reta'],
    ['Resolucion_alta_trabajadores_por_cuenta_propia_RETA.pdf', 'reta'],
    ['Resolucio_RETA_compte_propi.pdf', 'reta']
  ])('ID-F6: «%s» es llig (%s)', (nom, tipus) => {
    expect(decidixLectura(ID(nom))).toEqual({ decisio: 'llegir', tipus, organisme: 'TGSS', motiu: 'permes' });
  });

  test.each([
    'rebuts_de_cotització.pdf', 'liquidacion_cotizacion_marzo.pdf', 'cotizacion_autonomos.pdf', 'recibo_bases_de_cotizacion.pdf',
    'justificante de pago de la cotizacion.pdf', 'Informe_de_bases_y_recibo_de_cotizacion.pdf', 'pagar_las_cotizaciones.pdf',
    'cuenta_ajena.pdf', 'cuentas_propias.pdf'
  ])('ID-F6: els rebuts de cotització i els comptes continuen vetats: «%s»', (nom) => {
    expect(decidixLectura(ID(nom))).toEqual({ decisio: 'ometre', tipus: null, organisme: null, motiu: 'banc' });
  });

  test('«vida laboral» amb «mèdic» o amb «banco»: el vetat guanya', () => {
    expect(decidixLectura(ID('vida_laboral_informe_médico.pdf'))).toMatchObject({ decisio: 'ometre', motiu: 'salut' });
    expect(decidixLectura(ID('vida_laboral_banco.pdf'))).toMatchObject({ decisio: 'ometre', motiu: 'banc' });
  });

  test('una carpeta vetada veta tot el que porta dins', () => {
    expect(decidixLectura(ID('Baja_Medica/vida_laboral.pdf')).motiu).toBe('salut');
    expect(decidixLectura(ID('Renta/estatutos.pdf')).motiu).toBe('renda-herencia');
  });

  test('«Rentonar» no és «renta»: els papers de l’associació sí que es lligen', () => {
    expect(decidixLectura(ID('Rentonar/Estatutos_Rentonar.pdf'))).toMatchObject({ decisio: 'llegir', tipus: 'estatuts' });
  });

  test('signatures, enllaços, documents d’altres aplicacions i imatges', () => {
    for (const nom of ['vida_laboral.pdf.p7s', 'vida_laboral.xsig', 'sede.webloc', 'resum.pages']) expect(decidixLectura(ID(nom)).motiu, nom).toBe('format-vetat');
    for (const nom of ['dni_cara.jpg', 'escaneig.PNG', 'foto.heic']) expect(decidixLectura(ID(nom)).motiu, nom).toBe('imatge');
    expect(decidixLectura(ID('vida_laboral.docx')).motiu).toBe('format-sense-lector');
  });

  test('SEPE i LABORA: fora per defecte, «demanar» només amb ambOptIn', () => {
    expect(decidixLectura(ID('DARDE_2024.pdf'))).toMatchObject({ decisio: 'ometre', motiu: 'opt-in' });
    expect(decidixLectura(ID('autoentrevista.pdf'), { ambOptIn: true })).toMatchObject({ decisio: 'demanar', motiu: 'opt-in' });
  });

  /* Revisió adversarial 13-10-2026, troballa ID-F4: tot el que du SEPE o LABORA, en una carpeta o en el nom, i
     els papers de l'atur. Abans, «demanar» (una marca els obria) o fins i tot «llegir» (un RETA dins de SEPE). */
  test.each([
    'LABORA/certificat_demandant.pdf', 'SEPE/prestacion_desempleo.pdf', 'SEPE/Resolucion_capitalizacion_RETA.pdf', 'SERVEF/inscripcio.pdf',
    'INEM_1998.pdf', 'certificado_paro.pdf', 'prestacio_atur.pdf', 'prestacio per desocupacio.pdf', 'demandante_de_empleo.pdf',
    'demandant d’ocupació.pdf', 'Labora_cita.pdf', 'sepe.txt'
  ])('ID-F4: «%s» és fora per defecte i només es demana amb ambOptIn', (nom) => {
    expect(decidixLectura(ID(nom))).toEqual({ decisio: 'ometre', tipus: null, organisme: null, motiu: 'opt-in' });
    expect(decidixLectura(ID(nom), { ambOptIn: true })).toEqual({ decisio: 'demanar', tipus: 'desconegut', organisme: null, motiu: 'opt-in' });
  });

  test('ID-F4: «laboral» no és LABORA', () => {
    expect(decidixLectura(ID('Informe_Vida_Laboral_2025.pdf'))).toMatchObject({ decisio: 'llegir', tipus: 'vida-laboral' });
  });
});

describe('PERMÈS per paraula clau', () => {
  test.each([
    ['Informe_Vida_Laboral_2025.pdf', 'vida-laboral', 'TGSS'],
    ['informe_bases_2024.pdf', 'informe-bases', 'TGSS'],
    ['Resolucion_numero_de_afiliacion.pdf', 'resolucio-afiliacio', 'TGSS'],
    ['RETA_resolucion_alta.pdf', 'reta', 'TGSS'],
    ['resguardo RETA variacion.pdf', 'reta', 'TGSS'],
    ['Kit_Digital_bono.pdf', 'kit-digital', 'RED.ES'],
    ['Solicitud_C022_ayuda.pdf', 'kit-digital', 'RED.ES'],
    ['Alta_en_el_Registro_asociaciones.pdf', 'registre-associacions', 'REGISTRE-ASSOCIACIONS'],
    ['Certificat_Representacio.pdf', 'certificat-representacio', 'ALTRE'],
    ['Estatuts_associacio.txt', 'estatuts', 'REGISTRE-ASSOCIACIONS']
  ])('«%s» → %s', (nom, tipus, organisme) => {
    expect(decidixLectura(ID(nom))).toEqual({ decisio: 'llegir', tipus, organisme, motiu: 'permes' });
  });

  test('dins de 03_Burocracia/SUMA, les notificacions es lligen com a SUMA; els avisos de càrrec, no', () => {
    expect(decidixLectura(SUMA('notificacion_IBI.pdf'))).toEqual({ decisio: 'llegir', tipus: 'suma', organisme: 'SUMA', motiu: 'permes' });
    expect(decidixLectura(SUMA('AvisoCC_IBI.pdf'))).toMatchObject({ decisio: 'ometre', motiu: 'banc' });
  });

  /* Revisió adversarial 13-10-2026, troballa ID-F1: la carpeta SUMA ja no fa «llegir» tot el que hi ha dins. Els
     rebuts i les notificacions es lligen; un nom opac es demana; el que ja diu SUMA en el nom, també es llig. */
  test.each([
    'recibo_IBI.pdf', 'Recibos_2025.pdf', 'rebut IBI.pdf', 'Rebuts_2025.pdf', 'notificació_IVTM.pdf', 'notificacio_IBI.pdf',
    'Notificaciones_2024.pdf', 'notificacions.txt', 'SUMA_IBI_2024.pdf'
  ])('ID-F1: dins de SUMA, «%s» es llig com a SUMA', (nom) => {
    expect(decidixLectura(SUMA(nom))).toEqual({ decisio: 'llegir', tipus: 'suma', organisme: 'SUMA', motiu: 'permes' });
  });

  test.each(['scan0001.pdf', 'document.pdf', 'IBI_2024.pdf', '251003_carta.pdf', 'rebutjada.pdf'])('ID-F1: dins de SUMA, el nom opac «%s» es demana', (nom) => {
    expect(decidixLectura(SUMA(nom))).toEqual({ decisio: 'demanar', tipus: 'suma', organisme: 'SUMA', motiu: 'nom-opac' });
  });

  test('ID-F1: una carpeta amb nom de paper permés no fa «llegir» el paper opac de dins', () => {
    for (const ruta of [ID('Vida_Laboral/scan0001.pdf'), ID('TGSS/RETA/resolucion.pdf'), ID('SUMA/scan0001.pdf'), ID('recibo_IBI.pdf')]) {
      expect(decidixLectura(ruta), ruta).toEqual({ decisio: 'demanar', tipus: 'desconegut', organisme: null, motiu: 'nom-opac' });
    }
  });

  test('«reta» sense la segona paraula: demanar, amb el tipus endevinat', () => {
    expect(decidixLectura(ID('reta_2025.pdf'))).toEqual({ decisio: 'demanar', tipus: 'reta', organisme: 'TGSS', motiu: 'nom-opac' });
  });

  test('noms opacs: demanar', () => {
    for (const nom of ['scan0001.pdf', 'document.pdf', '251003_carta.pdf']) {
      expect(decidixLectura(ID(nom)), nom).toEqual({ decisio: 'demanar', tipus: 'desconegut', organisme: null, motiu: 'nom-opac' });
    }
  });
});

describe('contracte de l’eixida', () => {
  test('congelada, amb un tipus conegut i un motiu de la llista, i sense repetir el nom', () => {
    const noms = ['Informe_Vida_Laboral_2025.pdf', 'scan0001.pdf', 'Baja_Medica.pdf', 'foto.jpg'];
    for (const nom of noms) {
      const d = decidixLectura(ID(nom));
      expect(Object.isFrozen(d)).toBe(true);
      expect(Object.keys(MOTIUS)).toContain(d.motiu);
      if (d.tipus !== null) expect(TIPUS_DOCUMENT_IDENTITAT).toContain(d.tipus);
      expect(JSON.stringify(d)).not.toContain(nom.split('.')[0]);
    }
  });
});

describe('dataDelNom', () => {
  test('el prefix AAMMDD_ del nom, en ISO', () => {
    expect(dataDelNom(ID('251003_vida_laboral.pdf'))).toBe('2025-10-03');
    expect(dataDelNom('251003_1405_informe.pdf')).toBe('2025-10-03');
  });

  test('sense prefix, o amb una data que no existix: null', () => {
    expect(dataDelNom(ID('vida_laboral.pdf'))).toBeNull();
    expect(dataDelNom(ID('250231_x.pdf'))).toBeNull();
    expect(dataDelNom(null)).toBeNull();
  });
});
