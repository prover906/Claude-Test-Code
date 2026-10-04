// Deletes the database and every uploaded file, then recreates the demo
// accounts and content. Usage: npm run reset  (add -- --yes to skip the prompt)
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('../config');

async function confirm() {
  if (process.argv.includes('--yes')) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question(`This deletes ${config.dbPath} and everything in ${config.uploadDir}. Continue? (y/N) `, resolve);
  });
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function main() {
  if (!(await confirm())) {
    console.log('Cancelled.');
    return;
  }
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(config.dbPath + suffix, { force: true });
  for (const dir of ['images', 'videos', 'files', 'media']) {
    fs.rmSync(path.join(config.uploadDir, dir), { recursive: true, force: true });
  }

  const { ensureSeeded } = require('./seed');
  await ensureSeeded();
  console.log('Database reset. Demo accounts:');
  console.log(`  Admin   ${config.demo.admin.email} / ${config.demo.admin.password}`);
  if (config.seedDemoData) console.log(`  Student ${config.demo.student.email} / ${config.demo.student.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
