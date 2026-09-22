const pool = require('../config/db');
const { render } = require('../core/renderer');
const eligibilityService = require('../services/eligibilityService');

async function listMembers(req, res) {
  try {
    const result = await pool.query(`
      SELECT m.*, f.name AS family_name
      FROM members m
      LEFT JOIN families f ON f.id = m.family_id
      ORDER BY m.id
    `);
    const families = await pool.query('SELECT * FROM families ORDER BY name');

    const currentYear = new Date().getFullYear();
    const membersWithCategory = result.rows.map(m => ({
      ...m,
      age_category: eligibilityService.calculateAgeCategory(m.birth_date, currentYear)
    }));

    render(res, 'members', { members: membersWithCategory, families: families.rows, editingMember: null });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function createMember(req, res) {
  try {
    const {
      family_id, first_name, last_name, birth_date,
      is_resident, medical_certificate_date, pass_sport_code, sport_type
    } = req.body;

    const medicalStatus = eligibilityService.checkMedicalCompliance(
      sport_type || '', medical_certificate_date || null
    );

    await pool.query(
      `INSERT INTO members
       (family_id, first_name, last_name, birth_date, is_resident, medical_certificate_date, pass_sport_code, medical_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        family_id || null, first_name, last_name, birth_date,
        is_resident === 'on', medical_certificate_date || null,
        pass_sport_code || null, medicalStatus
      ]
    );
    res.writeHead(302, { Location: '/members' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function deleteMember(req, res) {
  try {
    await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
    res.writeHead(302, { Location: '/members' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

module.exports = { listMembers, createMember, deleteMember };