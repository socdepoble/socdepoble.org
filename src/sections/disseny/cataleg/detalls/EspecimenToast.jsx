import { Especimen } from '../Especimen.jsx';
import { Accions, Boto } from '../../../../components/PedraSeca/index.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';

export default function EspecimenToast() {
    const { showToast } = useToast();
return (
    <Especimen id="toast" nom="showToast (avís efímer)" fitxer="src/components/universal/AvisadorEfimer.jsx"
        descripcio="Confirmació que no demana acció. Si cal actuar, és una Alerta en línia o un Dialeg."
        contracte={[['showToast(missatge, tipus, durada)', "string, 'success'|'error'|…, ms", '3000', 'Crida imperativa.']]}
        fes={['«Nota desada».']} noFacis={['Errors que cal corregir en un toast que desapareix.']}>
      {/* IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · El botó, dins d'Accions. */}
      <Accions>
        <Boto onClick={() => showToast('Nota desada', 'success')}>Mostrar un avís efímer</Boto>
      </Accions>
    </Especimen>
  );
}
