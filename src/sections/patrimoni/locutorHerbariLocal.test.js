import{afterEach,expect,test,vi}from'vitest';
import{creaLocutorHerbariLocal}from'./locutorHerbariLocal.js';
afterEach(()=>vi.unstubAllGlobals());
class Missatge{constructor(text){this.text=text;}}
test('R22 només parla amb veu local explícita, privat:true i zero fetch',async()=>{
 const local={lang:'ca-ES',localService:true},remota={lang:'ca-ES',localService:false};const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
 const sintesi={getVoices:()=>[remota,local],speak:vi.fn(u=>queueMicrotask(()=>u.onend())),cancel:vi.fn()};
 const locutor=creaLocutorHerbariLocal({sintesi,ClasseMissatge:Missatge});expect(locutor.disponible('ca')).toBe(true);
 await locutor.parla('Nom documental',{privat:true,llengua:'ca'});
 expect(sintesi.speak.mock.calls[0][0].voice).toBe(local);expect(fetch).not.toHaveBeenCalled();
 await expect(locutor.parla('Privat',{privat:false})).rejects.toThrow('nomes-veu-local-privada');expect(sintesi.speak).toHaveBeenCalledOnce();
});
test('R22 veus remotes, no marcades o API absent no activen cap reserva',async()=>{
 for(const voices of [[],[{lang:'ca-ES',localService:false}],[{lang:'ca-ES'}]]){
  const speak=vi.fn(),locutor=creaLocutorHerbariLocal({sintesi:{getVoices:()=>voices,speak,cancel:vi.fn()},ClasseMissatge:Missatge});
  expect(locutor.disponible('ca')).toBe(false);await expect(locutor.parla('No ix')).rejects.toThrow('veu-local-absent');expect(speak).not.toHaveBeenCalled();
 }
 expect(creaLocutorHerbariLocal({sintesi:null,ClasseMissatge:null}).disponible('ca')).toBe(false);
});
test('R22 aturar resol la lectura pendent i no es queda en estat ocupat',async()=>{
 const cancel=vi.fn(),locutor=creaLocutorHerbariLocal({sintesi:{getVoices:()=>[{lang:'ca',localService:true}],speak:vi.fn(),cancel},ClasseMissatge:Missatge});
 const op=locutor.parla('Text');locutor.atura();await op;expect(cancel).toHaveBeenCalledOnce();
});
