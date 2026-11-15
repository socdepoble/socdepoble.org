import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('R28 Android: retenció de producció, tall, executor tardà i restes amb època capturada',t=>{
 const candidates=[...(process.env.JAVA_HOME?[path.join(process.env.JAVA_HOME,'bin/javac')]:[]),'/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/javac','javac'];
 const compiler=candidates.find(c=>spawnSync(c,['-version'],{encoding:'utf8'}).status===0);
 if(!compiler){t.skip('JDK absent: no certifica Android');return;}
 const java=compiler==='javac'?'java':path.join(path.dirname(compiler),'java');
 const source=fs.readFileSync(new URL('../android/app/src/main/java/org/socdepoble/app/CompartirNatiuPlugin.java',import.meta.url),'utf8');
 const start=source.indexOf('static final class RetencioSessio<T> {');
 assert.ok(start>=0,'Helper real de producció absent');
 let balance=0,end=-1;for(let i=source.indexOf('{',start);i<source.length;i++){if(source[i]==='{')balance++;else if(source[i]==='}'&&--balance===0){end=i+1;break;}}
 assert.ok(end>start);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r28-java-'));
 try{
  const probe='import java.util.*; import java.util.function.*; import java.util.concurrent.atomic.AtomicLong;\npublic class NativeRetentionProbe {\n'+source.slice(start,end)+`\n
  public static void main(String[] args) {
    AtomicLong epoch = new AtomicLong(0);
    List<String> emitted = new ArrayList<>(), discarded = new ArrayList<>();
    RetencioSessio<String> gate = new RetencioSessio<>(epoch::get, discarded::add);
    gate.publica("retained-old", 0, false, emitted::add);
    epoch.incrementAndGet(); gate.buida(); gate.drena(emitted::add);
    assert emitted.isEmpty() : "retenció anterior al tall";
    assert !discarded.contains("retained-old") : "el tall ha de buidar, no ajornar la retenció";
    gate.publica("queued-before-cut", 0, true, emitted::add);
    assert discarded.contains("queued-before-cut") : "comprovació dins executor";
    gate.publica("new", 1, true, emitted::add);
    assert emitted.equals(List.of("new")) : "entrada nova amb oient";
    emitted.clear();
    gate.publica("restored-epoch1", 1, false, emitted::add);
    epoch.incrementAndGet(); gate.drena(emitted::add);
    assert emitted.isEmpty() && discarded.contains("restored-epoch1") : "restes amb època original";
    gate.publica("retained-new", 2, false, emitted::add);
    gate.drena(emitted::add); gate.drena(emitted::add);
    assert emitted.equals(List.of("retained-new")) : "arrencada en fred sense duplicació";
    for (int i=0;i<1000;i++) {
      long old = epoch.get(); epoch.incrementAndGet(); gate.buida();
      gate.publica("old-"+i, old, true, emitted::add);
    }
    assert emitted.equals(List.of("retained-new")) : "1000 talls/executors antics";
    System.out.println("R28 Android: retention/cut/executor/restored/fresh/1000: PASS");
  }
}\n`;
  const file=path.join(dir,'NativeRetentionProbe.java');fs.writeFileSync(file,probe);
  const built=spawnSync(compiler,['-encoding','UTF-8','-d',dir,file],{encoding:'utf8',timeout:30000});
  assert.equal(built.status,0,built.stderr||String(built.error));
  const ran=spawnSync(java,['-ea','-cp',dir,'NativeRetentionProbe'],{encoding:'utf8',timeout:10000});
  assert.equal(ran.status,0,ran.stderr||String(ran.error));assert.match(ran.stdout,/1000: PASS/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
