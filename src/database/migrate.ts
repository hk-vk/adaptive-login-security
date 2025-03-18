import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
}

async function getExecutedMigrations(): Promise<string[]> {
  const query = 'SELECT name FROM migrations ORDER BY id ASC';
  const result = await pool.query(query);
  return result.rows.map(row => row.name);
}

async function executeMigration(fileName: string, content: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Execute the migration
    await client.query(content);
    
    // Record the migration
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [fileName]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Executed migration: ${fileName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function migrate() {
  try {
    // Create migrations table if it doesn't exist
    await createMigrationsTable();

    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Get all migration files
    const migrationFiles = fs
      .readdirSync(path.join(__dirname, 'migrations'))
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Execute migrations that haven't been run yet
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        const filePath = path.join(__dirname, 'migrations', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        await executeMigration(file, content);
      }
    }

    console.log('✨ All migrations have been executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error executing migrations:', error);
    process.exit(1);
  }
}

// Run migrations
migrate(); 