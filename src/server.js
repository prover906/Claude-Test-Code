const config = require('./config');
const createApp = require('./app');
const { ensureSeeded } = require('./db/seed');

async function main() {
  const seeded = await ensureSeeded();
  const app = createApp();
  app.listen(config.port, () => {
    const url = `http://localhost:${config.port}`;
    console.log(`\n  ${config.siteName} is running at ${url}`);
    console.log(`  Admin dashboard: ${url}/admin\n`);
    if (seeded) {
      console.log('  Demo accounts were created:');
      console.log(`    Admin   ${config.demo.admin.email} / ${config.demo.admin.password}`);
      if (config.seedDemoData) console.log(`    Student ${config.demo.student.email} / ${config.demo.student.password}`);
      console.log('  Change these passwords (or delete the accounts) before going live.\n');
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
