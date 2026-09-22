const pool = require('../config/db');
const { render } = require('../core/renderer');

async function listFamilies(req, res) {
  try {
    const result = await pool.query('SELECT * FROM families ORDER BY id');
    render(res, 'families', { families: result.rows, editingFamily: null });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function showEditForm(req, res) {
  try {
    const id = req.params.id;
    const listResult = await pool.query('SELECT * FROM families ORDER BY id');
    const editResult = await pool.query('SELECT * FROM families WHERE id = $1', [id]);
    render(res, 'families', { families: listResult.rows, editingFamily: editResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function createFamily(req, res) {
  try {
    const { name, quotient_familial } = req.body;
    await pool.query(
      `INSERT INTO families (name, quotient_familial) VALUES ($1, $2)`,
      [name, quotient_familial]
    );
    res.writeHead(302, { Location: '/families' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function updateFamily(req, res) {
  try {
    const id = req.params.id;
    const { name, quotient_familial } = req.body;
    await pool.query(
      `UPDATE families SET name = $1, quotient_familial = $2 WHERE id = $3`,
      [name, quotient_familial, id]
    );
    res.writeHead(302, { Location: '/families' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function deleteFamily(req, res) {
  try {
    await pool.query('DELETE FROM families WHERE id = $1', [req.params.id]);
    res.writeHead(302, { Location: '/families' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

module.exports = { listFamilies, showEditForm, createFamily, updateFamily, deleteFamily };