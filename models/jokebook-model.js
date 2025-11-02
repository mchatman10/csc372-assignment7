const { pool } = require('../db.js');

async function getCategories() {
  const { rows } = await pool.query('SELECT name FROM categories ORDER BY name');
  return rows.map(r => r.name);
}

async function getCategoryIdByName(name) {
  const { rows } = await pool.query(
    'SELECT id FROM categories WHERE lower(name)=lower($1)',
    [name]
  );
  return rows[0]?.id ?? null;
}

async function createCategory(name) {
  const { rows } = await pool.query(
    `INSERT INTO categories(name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
     RETURNING id`,
    [name]
  );
  return rows[0].id;
}

async function getJokes(name, limit) {
  const sql = `
    SELECT j.id, j.setup, j.delivery
    FROM jokes j
    JOIN categories c ON c.id = j.category_id
    WHERE lower(c.name) = lower($1)
    ORDER BY j.id
    ${limit ? 'LIMIT $2' : ''}
  `;
  const params = limit ? [name, limit] : [name];
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getRandomJoke() {
  const { rows } = await pool.query(
    `SELECT j.id, c.name AS category, j.setup, j.delivery
     FROM jokes j JOIN categories c ON c.id=j.category_id
     ORDER BY random() LIMIT 1`
  );
  return rows[0] ?? null;
}

async function addJoke({ category, setup, delivery }) {
  const cid = await createCategory(category);
  const { rows } = await pool.query(
    `INSERT INTO jokes(category_id, setup, delivery)
     VALUES ($1, $2, $3)
     RETURNING id, setup, delivery`,
    [cid, setup, delivery]
  );
  return rows[0];
}

async function insertJokes(category, jokes) {
  const cid = await createCategory(category);
  const values = [];
  const params = [];
  jokes.forEach(({ setup, delivery }, i) => {
    params.push(cid, setup, delivery);
    values.push(`($${3 * i + 1}, $${3 * i + 2}, $${3 * i + 3})`);
  });
  if (!values.length) return [];
  const { rows } = await pool.query(
    `INSERT INTO jokes(category_id, setup, delivery)
     VALUES ${values.join(', ')}
     RETURNING id, setup, delivery`,
    params
  );
  return rows;
}

module.exports = {
  getCategories,
  getCategoryIdByName,
  createCategory,
  getJokes,
  getRandomJoke,
  addJoke,
  insertJokes
};
