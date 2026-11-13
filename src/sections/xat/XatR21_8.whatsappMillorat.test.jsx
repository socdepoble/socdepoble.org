/**
 * XatR21_8.whatsappMillorat.test.jsx — Suite integral dels 4 pilars de T2 (R21.8):
 *   1. Barra inferior 100% neta com a WhatsApp ([+] [😊 Escriu…] [🎤 / ✈️]) i
 *      «Escriure en negreta» dins del menú del [+], amb retorn síncron de focus.
 *   2. Zero enviament de `**` buits ni pèrdua del botó de micròfon quan només hi ha `**`.
 *   3. Safata Unificada Persona vs Entitat: mai s'oculten fils `comEntitat`, es
 *      marquen amb pastilla `Building2` a la fila i a la capçalera, cap rètol
 *      intrusiu damunt del compositor, i `contactesFrequents` exclou fils d'entitat.
 *   4. Excepció de Javi Llinares (`joEsJavi === true`): buit no es fixa dalt;
 *      amb missatges reals ocupa la plaça permanent com a «Javi Llinares (Tu)».
 */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ImagePlus, Mic } from 'lucide-react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { esTextBuitOSolsMarques } from './negreta.js';
import { contactesFrequents, mapejaFil } from './missatges.js';
import {
  CLAU_FILA_DE_SOC_DE_POBLE,
  FILA_DE_RESERVA_DE_JAVI,
  FILA_DE_RESERVA_DE_LA_IAIA,
  anteposaActors,
  filPropiAmbMissatges
} from './actorsDelXat.js';
import FilaConversa, { etiquetaDeTipus } from './components/FilaConversa.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import Compositor from './components/Compositor.jsx';

vi.mock('../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({
    GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }]
  })
}));

afterEach(() => { cleanup(); });

const t = (_, alternativa) => alternativa;

describe('R21.8 · P0 «WhatsApp Clonat però Millorat»', () => {
  test('1. esTextBuitOSolsMarques detecta cadenes buides, espais i marques ** sense text real', () => {
    expect(esTextBuitOSolsMarques('')).toBe(true);
    expect(esTextBuitOSolsMarques('   ')).toBe(true);
    expect(esTextBuitOSolsMarques('**')).toBe(true);
    expect(esTextBuitOSolsMarques(' **  ** ')).toBe(true);
    expect(esTextBuitOSolsMarques('*a*')).toBe(false);
    expect(esTextBuitOSolsMarques('Hola **')).toBe(false);
  });

  test('2. amb micròfon actiu, triar «Escriure en negreta» en camp buit posa ** (*|*) i conserva «Grava àudio» sense permetre enviar ** buits', () => {
    const onEnvia = vi.fn();
    function Caixa() {
      const [valor, setValor] = useState('');
      const adjunts = {
        etiqueta: 'Adjunta',
        etiquetaMenu: 'Adjunts del xat',
        refBoto: { current: null },
        refPrimari: { current: null },
        bloquejat: false,
        opcions: [{ id: 'fotos', etiqueta: 'Fotos i vídeos', icona: ImagePlus, onTria: vi.fn() }],
        peuMenu: ['0,0 de 20 MB del xat'],
        primari: { clau: 'grava', etiqueta: 'Grava àudio', icona: Mic, onClick: vi.fn(), nomesBuit: true }
      };
      return (
        <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
          <Compositor valor={valor} onCanvia={setValor} onEnvia={() => onEnvia(valor)} t={t} adjunts={adjunts} />
        </AppGridContext.Provider>
      );
    }
    render(<Caixa />);
    expect(document.querySelector('.sdp-xat-compositor__negreta')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Adjunta' }));
    const items = screen.getAllByRole('menuitem').map((n) => n.textContent);
    expect(items).toEqual(['Fotos i vídeos', 'Escriure en negreta']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Escriure en negreta' }));

    const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
    expect(camp.value).toBe('**');
    expect([camp.selectionStart, camp.selectionEnd]).toEqual([1, 1]);
    expect(document.activeElement).toBe(camp);
    // Amb només `**`, el botó redó continua sent «Grava àudio» i Enter no envia res.
    expect(screen.getByRole('button', { name: 'Grava àudio' })).toBeTruthy();
    fireEvent.keyDown(camp, { key: 'Enter' });
    expect(onEnvia).not.toHaveBeenCalled();

    // Quan escriu text real dins de `*hola*`, el botó passa a «Envia» i ja es pot enviar.
    fireEvent.change(camp, { target: { value: '*hola*' } });
    expect(screen.getByRole('button', { name: 'Envia' })).toBeTruthy();
    fireEvent.keyDown(camp, { key: 'Enter' });
    expect(onEnvia).toHaveBeenCalledWith('*hola*');
  });

  test('3. Safata Unificada: FilaConversa i CapcaleraConversa identifiquen el canal d’entitat amb icona Building2 i contactesFrequents mai barreja canals d’entitat amb directes 1:1', () => {
    const filEntitat = mapejaFil({
      id: 'f-entitat',
      tipus: 'directe',
      titol: 'Anna Valls',
      comEntitat: true,
      entitatId: 'org-rentonar',
      entitatNom: 'El Rentonar',
      ultimText: 'Tenim oli nou?',
      ultimAl: '2026-11-12T10:00:00Z',
      altres: [{ id: 'anna', nom: 'Anna Valls', tipus: 'persona' }],
      altresNoms: ['Anna Valls']
    });
    const filPersonal = mapejaFil({
      id: 'f-personal',
      tipus: 'directe',
      titol: 'Anna Valls',
      ultimText: 'Ens veiem a la plaça!',
      ultimAl: '2026-11-12T09:00:00Z',
      altres: [{ id: 'anna', nom: 'Anna Valls', tipus: 'persona' }],
      altresNoms: ['Anna Valls']
    });

    expect(etiquetaDeTipus(filEntitat, t)).toBe('Canal de El Rentonar');

    const { container } = render(
      <MemoryRouter>
        <FilaConversa fil={filEntitat} onSelect={vi.fn()} locale="ca-ES" t={t} />
        <CapcaleraConversa fil={filEntitat} onTorna={vi.fn()} onSeleccionar={vi.fn()} t={t} />
      </MemoryRouter>
    );

    const pastillaFila = container.querySelector('.sdp-xat-fila__entitat');
    expect(pastillaFila).not.toBeNull();
    expect(pastillaFila.textContent).toBe('El Rentonar');
    expect(pastillaFila.querySelector('svg.lucide-building-2')).not.toBeNull();
    // AvatarFil es manté fill directe del botó abans de .sdp-xat-fila__cos (invariància harmònica).
    const botoFila = container.querySelector('button.sdp-xat-fila');
    expect(botoFila.children[0].classList.contains('sdp-avatar')).toBe(true);
    expect(botoFila.children[1].classList.contains('sdp-xat-fila__cos')).toBe(true);

    const subCapcalera = container.querySelector('.sdp-xat-capcalera__entitat');
    expect(subCapcalera).not.toBeNull();
    expect(within(subCapcalera).getByText('Canal de El Rentonar')).toBeTruthy();
    expect(subCapcalera.querySelector('svg.lucide-building-2')).not.toBeNull();

    // contactesFrequents tria el fil 1:1 personal (f-personal), mai el canal d'entitat encara que siga més recent!
    const frequents = contactesFrequents([filEntitat, filPersonal]);
    expect(frequents).toHaveLength(1);
    expect(frequents[0].fil_id).toBe('f-personal');
  });

  test('4. Excepció de Javi Llinares: per als veïns es mantenen els 4 actors; per a Javi no es fixa buit però puja amb missatges reals', () => {
    const poble = { clau: 'poble:torre', tipus: 'poble', delPoble: true };
    const reserves = {
      comunitat: true,
      reservaJavi: FILA_DE_RESERVA_DE_JAVI,
      reservaIAIA: FILA_DE_RESERVA_DE_LA_IAIA
    };

    const perAVei = anteposaActors([poble], { ...reserves, joEsJavi: false });
    expect(perAVei.map((f) => f.clau)).toEqual([
      CLAU_FILA_DE_SOC_DE_POBLE,
      'sdp-per-defecte:javi',
      'poble:torre',
      'sdp-per-defecte:iaia'
    ]);

    const propiBuit = { clau: 'propi-buit', tipus: 'fil', fil: mapejaFil({ id: 'propi-buit', tipus: 'directe', esPropi: true, titol: 'Javi Llinares' }) };
    expect(filPropiAmbMissatges(propiBuit.fil)).toBe(false);
    const perAJaviBuit = anteposaActors([propiBuit, FILA_DE_RESERVA_DE_JAVI, poble], { ...reserves, joEsJavi: true });
    expect(perAJaviBuit.map((f) => f.clau)).toEqual([
      CLAU_FILA_DE_SOC_DE_POBLE,
      'poble:torre',
      'sdp-per-defecte:iaia'
    ]);

    const propiPle = { clau: 'propi-ple', tipus: 'fil', fil: mapejaFil({ id: 'propi-ple', tipus: 'directe', esPropi: true, titol: 'Javi Llinares', ultimText: 'Recordatori de reg', ultimSeq: 2 }) };
    expect(filPropiAmbMissatges(propiPle.fil)).toBe(true);
    const perAJaviPle = anteposaActors([propiPle, FILA_DE_RESERVA_DE_JAVI, poble], { ...reserves, joEsJavi: true });
    expect(perAJaviPle.map((f) => f.clau)).toEqual([
      CLAU_FILA_DE_SOC_DE_POBLE,
      'propi-ple',
      'poble:torre',
      'sdp-per-defecte:iaia'
    ]);
  });
});
