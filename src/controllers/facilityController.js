const pool = require('../config/db');
const { render } = require('../core/renderer');

async function listFacilities(req, res) {
  try {
    const result = await pool.query('SELECT * FROM facilities ORDER BY id');
    render(res, 'facilities', { facilities: result.rows, editingFacility: null });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function showEditForm(req, res) {
  try {
    const id = req.params.id;
    const listResult = await pool.query('SELECT * FROM facilities ORDER BY id');
    const editResult = await pool.query('SELECT * FROM facilities WHERE id = $1', [id]);
    render(res, 'facilities', { facilities: listResult.rows, editingFacility: editResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function createFacility(req, res) {
  try {
    const { name, type, address, erp_capacity, is_divisible } = req.body;
    await pool.query(
      `INSERT INTO facilities (name, type, address, erp_capacity, is_divisible)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, type, address || null, erp_capacity, is_divisible === 'on']
    );
    res.writeHead(302, { Location: '/facilities' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function updateFacility(req, res) {
  try {
    const id = req.params.id;
    const { name, type, address, erp_capacity, is_divisible } = req.body;
    await pool.query(
      `UPDATE facilities
       SET name = $1, type = $2, address = $3, erp_capacity = $4, is_divisible = $5
       WHERE id = $6`,
      [name, type, address || null, erp_capacity, is_divisible === 'on', id]
    );
    res.writeHead(302, { Location: '/facilities' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function deleteFacility(req, res) {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM facilities WHERE id = $1', [id]);
    res.writeHead(302, { Location: '/facilities' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

module.exports = { listFacilities, showEditForm, createFacility, updateFacility, deleteFacility };