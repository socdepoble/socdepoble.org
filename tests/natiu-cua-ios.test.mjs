import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('R28: executa la barrera Swift real, retenció llarga i carrera publicar/tallar',t=>{
 if(process.platform!=='darwin'){t.skip('La prova Swift nativa requerix macOS/Xcode');return;}
 const available=spawnSync('/usr/bin/xcrun',['--find','swiftc'],{encoding:'utf8'});
 if(available.status!==0){t.skip('Swift no disponible');return;}
 const sdk=spawnSync('/usr/bin/xcrun',['--sdk','macosx','--show-sdk-path'],{encoding:'utf8'});
 assert.equal(sdk.status,0,'Cal SDK macOS per executar el helper Foundation');
 const source=fs.readFileSync(new URL('../ios/App/App/CompartirNatiuPlugin.swift',import.meta.url),'utf8');
 const start=source.indexOf('private final class BarreraSessioCompartit {');
 const end=source.indexOf('/// Receptor del menú',start);
 assert.ok(start>=0&&end>start,'Cal provar el helper de producció, no una còpia manual');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r28-swift-'));
 try{
  const file=path.join(directory,'Barrera.swift'),binary=path.join(directory,'barrera');
  fs.writeFileSync(file,'import Foundation\n'+source.slice(start,end)+`\n
private func prova() {
let gate = BarreraSessioCompartit()
let antiga = gate.prenEntrada(araMs: 1000)
assert(antiga.rebutMs == 1000)
var retained: [String] = []
assert(gate.siVigent(antiga) { retained.append("privat") })
let ack = gate.talla { retained.removeAll() }
assert(ack == antiga.generacio + 1)
assert(retained.isEmpty)
assert(!gate.esVigent(antiga))
// Encara que passen més de cinc minuts, no es pot tornar a retenir el vell.
assert(!gate.siVigent(antiga) { retained.append("vell després de 5min") })
let nova = gate.prenEntrada(araMs: 900000)
assert(gate.siVigent(nova) { retained.append("nou") })
assert(retained == ["nou"])
gate.talla { retained.removeAll() }
gate.talla { retained.removeAll() }
assert(!gate.siVigent(nova) { assertionFailure("època anterior") })
let carrera = BarreraSessioCompartit()
let abans = carrera.prenEntrada(araMs: 0)
var tallat = false
var filtrats = 0
DispatchQueue.concurrentPerform(iterations: 1001) { i in
    if i == 500 { carrera.talla { tallat = true } }
    else { carrera.siVigent(abans) { if tallat { filtrats += 1 } } }
}
assert(filtrats == 0)
assert(!carrera.esVigent(abans))
print("R28 Swift: captura, cua antiga, retenció>5min, talls repetits, nova entrada i 1000 carreres: PASS")
}
prova()
`);
  const built=spawnSync(available.stdout.trim(),['-sdk',sdk.stdout.trim(),'-target',`${process.arch==='arm64'?'arm64':'x86_64'}-apple-macosx13.0`,'-swift-version','5','-module-cache-path',path.join(directory,'module-cache'),file,'-o',binary],{encoding:'utf8',timeout:60000});
  assert.equal(built.status,0,built.stderr||String(built.error));
  const ran=spawnSync(binary,[],{encoding:'utf8',timeout:10000});
  assert.equal(ran.status,0,ran.stderr||String(ran.error));
  assert.match(ran.stdout,/1000 carreres: PASS/);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
