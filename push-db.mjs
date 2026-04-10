import { execSync } from 'child_process';

const dbUrl = 'postgresql://postgres:SFL_cheer_manager@db.mtnuwkemkaxslmtbycyd.supabase.co:5432/postgres';

console.log('Running prisma db push...');
try {
  execSync('npx --yes prisma db push', {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit',
    shell: true
  });
  console.log('Done!');
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
