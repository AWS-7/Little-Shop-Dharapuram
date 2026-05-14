/**
 * Quick DB diagnostic script
 */
require('dotenv').config();
const database = require('./config/database');

async function test() {
  console.log('--- Test 1: Simple query (no params) ---');
  try {
    const r1 = await database.query('SELECT 1 as one');
    console.log('OK:', r1);
  } catch (e) {
    console.error('FAIL:', e.message);
  }

  console.log('--- Test 2: Query with boolean param ---');
  try {
    const r2 = await database.query('SELECT ? as val', [true]);
    console.log('OK:', r2);
  } catch (e) {
    console.error('FAIL:', e.message);
  }

  console.log('--- Test 3: Query with int params ---');
  try {
    const r3 = await database.query('SELECT ? as a, ? as b', [20, 0]);
    console.log('OK:', r3);
  } catch (e) {
    console.error('FAIL:', e.message);
  }

  console.log('--- Test 4: Actual count query ---');
  try {
    const r4 = await database.query('SELECT COUNT(*) as total FROM products WHERE 1=1');
    console.log('OK:', r4);
  } catch (e) {
    console.error('FAIL:', e.message);
  }

  console.log('--- Test 5: Actual count with param ---');
  try {
    const r5 = await database.query('SELECT COUNT(*) as total FROM products WHERE is_active = ?', [1]);
    console.log('OK:', r5);
  } catch (e) {
    console.error('FAIL:', e.message);
  }

  console.log('--- Test 6: Full getAllProducts style ---');
  try {
    const sql = `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE 1=1
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`;
    const r6 = await database.query(sql, [20, 0]);
    console.log('OK rows:', r6.length);
  } catch (e) {
    console.error('FAIL:', e.message);
  }

  await database.end();
  console.log('--- Done ---');
}

test();
