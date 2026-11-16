import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JAVA = 'android/app/src/main/java/org/socdepoble/app/';
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

test('R31 Android: plugin separat registrat abans del pont, mateix SDK i cap fallback al fals ACK', () => {
  const main = read(JAVA + 'MainActivity.java');
  const registre = main.indexOf('registerPlugin(CiclePushNatiuPlugin.class);');
  assert.ok(registre >= 0);
  assert.ok(registre < main.indexOf('super.onCreate(savedInstanceState);'));
  assert.match(read(JAVA + 'CiclePushNatiuPlugin.java'), /@CapacitorPlugin\(name = "CiclePushNatiu"\)/);
  const gradle = read('android/app/build.gradle');
  assert.match(gradle, /compileOnly "com\.google\.firebase:firebase-messaging:\$\{rootProject\.ext\.has\('firebaseMessagingVersion'\)/);
  const sdk = read('node_modules/@capacitor/push-notifications/android/build.gradle');
  assert.match(sdk, /firebaseMessagingVersion.*'25\.0\.1'/);
  assert.match(gradle, /: '25\.0\.1'\}"/);
  const legacy = read('node_modules/@capacitor/push-notifications/android/src/main/java/com/capacitorjs/plugins/pushnotifications/PushNotificationsPlugin.java');
  assert.match(legacy, /deleteToken\(\);\s*call\.resolve\(\);/);
  assert.doesNotMatch(read(JAVA + 'CiclePushNatiuPlugin.java'), /System\.(?:out|err)|Logger\.|Log\./);
});

// Compila el fitxer Java de producció sencer; els dobles només representen
// les APIs externes. Les Tasks controlades separen l'ACK del PluginCall de
// l'efecte tardà de Firebase i executen cues entre instàncies diferents.
const STUBS = {
  'com/getcapacitor/Plugin.java': 'package com.getcapacitor; public class Plugin {}',
  'com/getcapacitor/JSObject.java': 'package com.getcapacitor; public class JSObject extends java.util.HashMap<String,Object> {}',
  'com/getcapacitor/PluginMethod.java': 'package com.getcapacitor; @java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME) public @interface PluginMethod {}',
  'com/getcapacitor/annotation/CapacitorPlugin.java': 'package com.getcapacitor.annotation; @java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME) public @interface CapacitorPlugin { String name(); }',
  'com/getcapacitor/PluginCall.java': `package com.getcapacitor;
public class PluginCall {
 public boolean resolved, rejected; public String code; public JSObject data; public Runnable onResolve;
 public void resolve() { resolved=true; if(onResolve!=null) onResolve.run(); }
 public void resolve(JSObject value) { data=value; resolve(); }
 public void reject(String message,String value) { rejected=true; code=value; }
}`,
  'com/google/android/gms/tasks/OnCompleteListener.java': 'package com.google.android.gms.tasks; public interface OnCompleteListener<T> { void onComplete(Task<T> task); }',
  'com/google/android/gms/tasks/Task.java': `package com.google.android.gms.tasks;
import java.util.*; import java.util.concurrent.Executor;
public class Task<T> {
 private boolean complete, success; private T value;
 private final List<Runnable> listeners=new ArrayList<>(); public boolean rejectObserver;
 public boolean isSuccessful(){return complete&&success;}
 public T getResult(){return value;}
 public Task<T> addOnCompleteListener(Executor executor,OnCompleteListener<T> listener){
  if(rejectObserver)throw new IllegalStateException("observer unavailable");
  Runnable action=()->executor.execute(()->listener.onComplete(this));
  if(complete)action.run();else listeners.add(action);return this;
 }
 public void finish(T result){complete=true;success=true;value=result;fire();}
 public void fail(){complete=true;success=false;fire();}
 public void cancel(){complete=true;success=false;fire();}
 private void fire(){for(Runnable r:List.copyOf(listeners))r.run();listeners.clear();}
}`,
  'com/google/firebase/messaging/FirebaseMessaging.java': `package com.google.firebase.messaging;
import java.util.*; import com.google.android.gms.tasks.Task;
public class FirebaseMessaging {
 public static final FirebaseMessaging INSTANCE=new FirebaseMessaging();
 public static final List<String> starts=new ArrayList<>();
 public static final Queue<Task<String>> gets=new ArrayDeque<>();
 public static final Queue<Task<Void>> deletes=new ArrayDeque<>();
 public static boolean autoInit, failStart;
 public static FirebaseMessaging getInstance(){if(failStart){failStart=false;throw new IllegalStateException("synthetic");}return INSTANCE;}
 public void setAutoInitEnabled(boolean value){autoInit=value;}
 public Task<String> getToken(){assert autoInit;starts.add("get");return gets.remove();}
 public Task<Void> deleteToken(){assert !autoInit:"delete requires auto-init disabled";starts.add("delete");return deletes.remove();}
}`,
  'NativePushTaskProbe.java': `import org.socdepoble.app.CiclePushNatiuPlugin;
import com.getcapacitor.*; import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging; import java.util.*;
public class NativePushTaskProbe {
 static PluginCall call(){return new PluginCall();}
 static Task<String> get(){Task<String> t=new Task<>();FirebaseMessaging.gets.add(t);return t;}
 static Task<Void> del(){Task<Void> t=new Task<>();FirebaseMessaging.deletes.add(t);return t;}
 static void empty(){FirebaseMessaging.starts.clear();assert FirebaseMessaging.gets.isEmpty();assert FirebaseMessaging.deletes.isEmpty();}
 public static void main(String[]args){
  CiclePushNatiuPlugin first=new CiclePushNatiuPlugin(),recreated=new CiclePushNatiuPlugin();
  Task<String> getA=get(),getB=get();Task<Void> deleteA=del();
  PluginCall a=call(),logout=call(),b=call();
  first.register(a);first.unregister(logout);recreated.register(b);
  assert FirebaseMessaging.starts.equals(List.of("get"));assert !a.resolved&&!logout.resolved&&!b.resolved;
  getA.finish("token-A");assert a.resolved&&a.data.get("value").equals("token-A");
  assert FirebaseMessaging.starts.equals(List.of("get","delete"));assert !logout.resolved&&!b.resolved;
  // A JS timeout or a recreated Activity does not complete this native Task.
  assert !FirebaseMessaging.autoInit;assert !b.resolved;
  deleteA.finish(null);assert logout.resolved&&!b.resolved;
  assert FirebaseMessaging.starts.equals(List.of("get","delete","get"));
  getB.finish("token-B");assert b.resolved&&b.data.get("value").equals("token-B");empty();

  // Failure is a completion, so retries may progress; a pending retry still
  // blocks a new account until its real deleteToken Task finishes.
  Task<Void> bad=del(),retry=del();Task<String> fresh=get();
  PluginCall failed=call(),retryCall=call(),freshCall=call();
  first.unregister(failed);recreated.unregister(retryCall);recreated.register(freshCall);
  assert FirebaseMessaging.starts.equals(List.of("delete"));assert !failed.rejected;
  bad.fail();assert failed.rejected&&failed.code.equals("SDP_PUSH_TASK_FAILED");
  assert FirebaseMessaging.starts.equals(List.of("delete","delete"));assert !freshCall.resolved;
  retry.finish(null);assert retryCall.resolved&&FirebaseMessaging.starts.equals(List.of("delete","delete","get"));
  fresh.finish("fresh");assert freshCall.resolved;empty();

  Task<String> cancelled=get(),afterCancel=get();PluginCall cc=call(),ac=call();
  first.register(cc);recreated.register(ac);cancelled.cancel();
  assert cc.rejected&&cc.code.equals("SDP_PUSH_TASK_FAILED");
  afterCancel.finish("after-cancel");assert ac.resolved;empty();

  // Reserve the queue before a synchronously completed Task or reentrant
  // PluginCall callback can enqueue a second operation.
  Task<String> sync=get();sync.finish("sync");Task<Void> syncDelete=del();
  PluginCall syncCall=call(),syncLogout=call();
  syncCall.onResolve=()->{recreated.unregister(syncLogout);assert FirebaseMessaging.starts.equals(List.of("get"));};
  first.register(syncCall);assert FirebaseMessaging.starts.equals(List.of("get","delete"));
  assert !syncLogout.resolved;syncDelete.finish(null);assert syncLogout.resolved;empty();

  FirebaseMessaging.failStart=true;PluginCall startFailed=call();first.register(startFailed);
  assert startFailed.rejected&&startFailed.code.equals("SDP_PUSH_TASK_START");
  Task<String> recovery=get();PluginCall recovered=call();recreated.register(recovered);
  recovery.finish("recovered");assert recovered.resolved;empty();

  Task<String> blank=get();PluginCall blankCall=call();first.register(blankCall);blank.finish("");
  assert blankCall.rejected&&blankCall.code.equals("SDP_PUSH_TOKEN_EMPTY");empty();

  // A Task whose observer cannot be installed is uncertain, not finished.
  // Never release the native queue based on the rejected PluginCall alone.
  Task<Void> uncertain=del();uncertain.rejectObserver=true;Task<String> blocked=get();
  PluginCall u=call(),held=call();first.unregister(u);recreated.register(held);
  assert u.rejected&&u.code.equals("SDP_PUSH_TASK_OBSERVER");assert FirebaseMessaging.starts.equals(List.of("delete"));
  uncertain.finish(null);assert !held.resolved&&!held.rejected;assert FirebaseMessaging.gets.contains(blocked);
  System.out.println("R31 Android Task: pending/get/delete/recreation/failure/retry/cancel/sync/reentry/start/empty/uncertain: PASS");
 }
}`
};

test('R31 Android: Java de producció espera la Task, serialitza get/delete i sobreviu a recreació/rebuig/reintent', t => {
  const candidates = [...(process.env.JAVA_HOME ? [path.join(process.env.JAVA_HOME, 'bin/javac')] : []), '/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/javac', 'javac'];
  const compiler = candidates.find(command => spawnSync(command, ['-version'], { encoding: 'utf8' }).status === 0);
  if (!compiler) { t.skip('JDK absent: no certifica el contracte Android'); return; }
  const java = compiler === 'javac' ? 'java' : path.join(path.dirname(compiler), 'java');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r31-android-task-'));
  try {
    const sources = { ...STUBS, 'org/socdepoble/app/CiclePushNatiuPlugin.java': read(JAVA + 'CiclePushNatiuPlugin.java') };
    const files = Object.entries(sources).map(([name, content]) => {
      const file = path.join(dir, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); return file;
    });
    const compiled = spawnSync(compiler, ['-encoding', 'UTF-8', '-d', dir, ...files], { encoding: 'utf8', timeout: 30000 });
    assert.equal(compiled.status, 0, compiled.stderr || String(compiled.error));
    const ran = spawnSync(java, ['-ea', '-cp', dir, 'NativePushTaskProbe'], { encoding: 'utf8', timeout: 10000 });
    assert.equal(ran.status, 0, ran.stderr || String(ran.error));
    assert.match(ran.stdout, /uncertain: PASS/);
    t.diagnostic(ran.stdout.trim());
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
