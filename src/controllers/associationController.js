const pool = require('../config/db');
const { render } = require('../core/renderer');

async function listAssociations(req, res) {
  try {
    const result = await pool.query('SELECT * FROM associations ORDER BY id');
    render(res, 'associations', { associations: result.rows, editingAssociation: null });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function showEditForm(req, res) {
  try {
    const id = req.params.id;
    const listResult = await pool.query('SELECT * FROM associations ORDER BY id');
    const editResult = await pool.query('SELECT * FROM associations WHERE id = $1', [id]);
    render(res, 'associations', { associations: listResult.rows, editingAssociation: editResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function createAssociation(req, res) {
  try {
    const { name, contact_email, contact_phone } = req.body;
    await pool.query(
      `INSERT INTO associations (name, contact_email, contact_phone) VALUES ($1, $2, $3)`,
      [name, contact_email || null, contact_phone || null]
    );
    res.writeHead(302, { Location: '/associations' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function updateAssociation(req, res) {
  try {
    const id = req.params.id;
    const { name, contact_email, contact_phone } = req.body;
    await pool.query(
      `UPDATE associations SET name = $1, contact_email = $2, contact_phone = $3 WHERE id = $4`,
      [name, contact_email || null, contact_phone || null, id]
    );
    res.writeHead(302, { Location: '/associations' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function deleteAssociation(req, res) {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM associations WHERE id = $1', [id]);
    res.writeHead(302, { Location: '/associations' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

module.exports = { listAssociations, showEditForm, createAssociation, updateAssociation, deleteAssociation };