/**
 * tooling/mocks/sollutiaBackend.js
 * 
 * Mock d'exemple per demostrar i validar el contracte de la Llei de l'Enxufabilitat
 * (Fase 1 de configuració + Fase 2 de segellat) aplicant el Model B Estricte.
 */

export function simulaInjeccioSollutia() {
  if (typeof window === 'undefined' || !window.SocDePoble) {
    console.error('L\'API global SocDePoble no està exposada!');
    return false;
  }
  
  const { configura, arrenca, estat } = window.SocDePoble;
  
  console.log('Estat abans d\'injectar:', estat());
  
  try {
    const resultat = configura({ auth: { issuer: 'https://v2.sollutia.com' } });
    console.log('Resultat configuració:', resultat);
  } catch(e) {
    console.error('Error configurant:', e.message);
  }
  
  console.log('Estat després de configurar (abans del segellat):', estat());
  
  // Forçar el segellat cridant arrenca() com un simulador de host actiu
  arrenca();
  console.log('Estat després de arrenca() (hauria d\'estar segellat):', estat());
  
  // Per comprovar si salta l'error Model B:
  try {
     window.SocDePoble.configura({ backend: {} });
  } catch (e) {
     console.log('Protecció comprovada:', e.message);
  }

  return true;
}
