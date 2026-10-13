import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/pool.js'

const schemaPath = fileURLToPath(new URL('../sql/schema.sql', import.meta.url))

try {
  const schema = await readFile(schemaPath, 'utf8')
  await pool.query(schema)
  console.log('Creative Brief PostgreSQL schema is up to date.')
} catch (error) {
  console.error('Unable to initialize the Creative Brief PostgreSQL schema.', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
