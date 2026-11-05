/** Review-only email proof form. Token is an explicit in-memory prop supplied
 * by the route; this component never reads a URL, cookie, storage or clipboard.
 * onConfirma(token,password,metadata,{signal}) is wired to the neutral optional
 * email-proof capability. No effect submits a request and success never logs in.
 */
import {useEffect,useRef,useState} from 'react';
import {VERSIO_POLITICA_PRIVACITAT as VERSION,RUTA_POLITICA_PRIVACITAT} from '../../config/politicaPrivacitat.js';
export function ProvaCorreuAmbContrasenya({token,onConfirma,mode='verify-email',scopeKey='initial',requiresConsent=mode==='verify-email'}){
 const[pwd,setPwd]=useState(''),[again,setAgain]=useState(''),[accepted,setAccepted]=useState(false),[version,setVersion]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const alive=useRef(false),sending=useRef(false),controller=useRef(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 useEffect(()=>{controller.current?.abort();setPwd('');setAgain('');setAccepted(false);setVersion('');setMessage('');},[scopeKey,token,mode]);
 async function submit(event){
  event.preventDefault();if(sending.current)return;
  if(requiresConsent&&(!accepted||version!==VERSION)||pwd.length<12||pwd!==again){setMessage('Tria la contrasenya i, si es demana, accepta la versió mostrada de la política.');return;}
  const control=new AbortController();controller.current=control;sending.current=true;setBusy(true);setMessage('');
  try{
   const result=await onConfirma(token,pwd,requiresConsent?{accepta_rgpd:true,versio_politica:version}:null,{signal:control.signal});
   if(result?.login_required!==true||!(result.verified===true||result.password_changed===true))throw Error('email_proof_unconfirmed');
   if(alive.current&&!control.signal.aborted)setMessage('Contrasenya establida. Ara pots entrar amb el correu.');
  }catch(error){if(alive.current&&!control.signal.aborted)setMessage(error?.requiresReload?'Cal recarregar per comprovar el resultat.':'No s’ha confirmat la prova del correu. No s’ha tornat a enviar.');}
  finally{sending.current=false;if(controller.current===control)controller.current=null;if(alive.current){setPwd('');setAgain('');setAccepted(false);setVersion('');setBusy(false);}}
 }
 return <form aria-label={mode==='reset-password'?'Restablir contrasenya per correu':'Confirmar el correu i triar contrasenya'} onSubmit={submit}>
  <p>Tria ara la contrasenya del compte. La contrasenya d’un registre pendent anterior no s’utilitzarà.</p>
  <label>Contrasenya nova<input type="password" autoComplete="new-password" minLength={12} maxLength={256} value={pwd} disabled={busy} onChange={event=>setPwd(event.target.value)}/></label>
  <label>Confirma la contrasenya nova<input type="password" autoComplete="new-password" minLength={12} maxLength={256} value={again} disabled={busy} onChange={event=>setAgain(event.target.value)}/></label>
  {requiresConsent?<><p><a href={RUTA_POLITICA_PRIVACITAT} target="_blank" rel="noopener noreferrer">Política de privacitat · versió {VERSION}</a></p>
  <label><input type="checkbox" checked={accepted} disabled={busy} onChange={event=>{setAccepted(event.target.checked);setVersion(event.target.checked?VERSION:'');}}/>He llegit i accepte la política de privacitat mostrada, versió {VERSION}.</label></>:null}
  <button type="submit" disabled={busy}>Establir contrasenya i confirmar</button>
  {message?<p role="status">{message}</p>:null}
 </form>;
}
