import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const ddl = await readFile(new URL('../prisma/EXTRA_CONSTRAINTS.sql', import.meta.url), 'utf8');
  await pool.query(ddl);
  console.log('SQL-only constraints applied successfully.');
} catch (error) { console.error('Failed to apply constraints:', error); process.exitCode = 1; }
finally { await pool.end(); }
