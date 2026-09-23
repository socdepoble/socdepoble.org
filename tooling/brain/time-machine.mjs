#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import os from 'os';

const CERVELLS_DIR = '.agents/cervells';
const SKILLS_LINK = '.agents/skills';
const SITJA_DIR = path.join(os.homedir(), '.sitja-cervell');

function ensureDirs() {
  if (!fs.existsSync(CERVELLS_DIR)) fs.mkdirSync(CERVELLS_DIR, { recursive: true });
  if (!fs.existsSync(SITJA_DIR)) fs.mkdirSync(SITJA_DIR, { recursive: true });
}

function getFilesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(res));
    } else {
      files.push(res);
    }
  }
  return files;
}

function getTreeHash(dirPath) {
  const files = getFilesRecursively(dirPath).sort();
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    if (!file) continue;
    const content = fs.readFileSync(file);
    hash.update(file.replace(dirPath, ''));
    hash.update(content);
  }
  return hash.digest('hex');
}

function init() {
  ensureDirs();
  let stat;
  try {
    stat = fs.lstatSync(SKILLS_LINK);
  } catch {
    /* ignore */
  }
  
  if (stat && stat.isSymbolicLink()) {
    console.log("Ja està inicialitzat amb symlink.");
    return;
  }
  
  if (stat && stat.isDirectory()) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = path.join(CERVELLS_DIR, `inicial_${timestamp}`);
    fs.renameSync(SKILLS_LINK, targetDir);
    
    // Create symlink
    const tempLink = `${SKILLS_LINK}.tmp`;
    fs.symlinkSync(path.relative('.agents', targetDir), tempLink, 'dir');
    fs.renameSync(tempLink, SKILLS_LINK);
    console.log(`Inicialitzat. ${SKILLS_LINK} apunta a ${targetDir}`);
    
    snapshot();
  } else {
    console.error(`${SKILLS_LINK} no existeix o no és un directori.`);
    process.exit(1);
  }
}

function snapshot() {
  ensureDirs();
  const currentTarget = fs.readlinkSync(SKILLS_LINK);
  const fullPath = path.resolve('.agents', currentTarget);
  
  const hash = getTreeHash(fullPath);
  const tarName = `${hash}.tar.gz`;
  const tarPath = path.join(SITJA_DIR, tarName);
  
  if (!fs.existsSync(tarPath)) {
    execFileSync('tar', ['-czf', tarPath, '-C', path.dirname(fullPath), path.basename(fullPath)]);
    console.log(`Snapshot creat: ${tarPath}`);
  } else {
    console.log(`Snapshot ja existeix: ${tarPath}`);
  }
  
  fs.writeFileSync('SEGELL.lock', hash);
  console.log(`SEGELL.lock actualitzat amb: ${hash}`);
}

function restore(hash) {
  ensureDirs();
  const tarPath = path.join(SITJA_DIR, `${hash}.tar.gz`);
  if (!fs.existsSync(tarPath)) {
    console.error(`Error: Snapshot ${hash} no trobat a ${SITJA_DIR}`);
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDirName = `restore_${timestamp}_${hash.substring(0, 6)}`;
  const targetDir = path.join(CERVELLS_DIR, targetDirName);
  fs.mkdirSync(targetDir, { recursive: true });
  
  const tempExtract = path.join(CERVELLS_DIR, `extract_${timestamp}`);
  fs.mkdirSync(tempExtract);
  execFileSync('tar', ['-xzf', tarPath, '-C', tempExtract]);
  
  const extractedFolders = fs.readdirSync(tempExtract);
  if (extractedFolders.length !== 1) {
    console.error("Format de tar inesperat.");
    process.exit(1);
  }
  
  fs.renameSync(path.join(tempExtract, extractedFolders[0]), targetDir);
  fs.rmdirSync(tempExtract);
  
  const tempLink = `${SKILLS_LINK}.tmp`;
  fs.symlinkSync(path.relative('.agents', targetDir), tempLink, 'dir');
  fs.renameSync(tempLink, SKILLS_LINK);
  
  fs.writeFileSync('SEGELL.lock', hash);
  console.log(`Restaurat a ${hash}. Symlink actualitzat atòmicament.`);
}

const command = process.argv[2];
if (command === 'init') init();
else if (command === 'snapshot') snapshot();
else if (command === 'restore') restore(process.argv[3]);
else {
  console.log("Usage: node tooling/brain/time-machine.mjs [init|snapshot|restore <hash>]");
}
