const pool = require('../config/db');
const { render } = require('../core/renderer');
const scheduleService = require('../services/scheduleService');

async function listActivities(req, res) {
  try {
    const activities = await pool.query(`
      SELECT a.*, f.name AS facility_name, ass.name AS association_name
      FROM activities a
      JOIN facilities f ON f.id = a.facility_id
      JOIN associations ass ON ass.id = a.association_id
      ORDER BY a.id
    `);
    const facilities = await pool.query('SELECT * FROM facilities ORDER BY name');
    const associations = await pool.query('SELECT * FROM associations ORDER BY name');
    render(res, 'activities', {
      activities: activities.rows,
      facilities: facilities.rows,
      associations: associations.rows,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

async function createActivity(req, res) {
  try {
    const {
      name, association_id, facility_id, sub_zone, sport_type,
      day_of_week, start_time, end_time, base_price, max_capacity, age_category
    } = req.body;

    const capacityCheck = await scheduleService.checkErpCapacity({
      facility_id, max_capacity: parseInt(max_capacity, 10)
    });
    if (!capacityCheck.valid) {
      return sendConflictError(res, capacityCheck.reason);
    }

    const conflict = await scheduleService.findScheduleConflict({
      facility_id, sub_zone: sub_zone || null,
      day_of_week: parseInt(day_of_week, 10), start_time, end_time
    });
    if (conflict) {
      return sendConflictError(res, `Conflit horaire avec l'activité déjà planifiée : "${conflict.name}" (${conflict.start_time}-${conflict.end_time})`);
    }

    await pool.query(
      `INSERT INTO activities
       (name, association_id, facility_id, sub_zone, sport_type, day_of_week, start_time, end_time, base_price, max_capacity, age_category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [name, association_id, facility_id, sub_zone || null, sport_type,
       day_of_week, start_time, end_time, base_price, max_capacity, age_category]
    );
    res.writeHead(302, { Location: '/activities' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}


async function sendConflictError(res, message) {
  const activities = await pool.query(`
    SELECT a.*, f.name AS facility_name, ass.name AS association_name
    FROM activities a
    JOIN facilities f ON f.id = a.facility_id
    JOIN associations ass ON ass.id = a.association_id
    ORDER BY a.id
  `);
  const facilities = await pool.query('SELECT * FROM facilities ORDER BY name');
  const associations = await pool.query('SELECT * FROM associations ORDER BY name');
  res.statusCode = 400; 
  render(res, 'activities', {
    activities: activities.rows,
    facilities: facilities.rows,
    associations: associations.rows,
    error: message
  });
}

async function deleteActivity(req, res) {
  try {
    await pool.query('DELETE FROM activities WHERE id = $1', [req.params.id]);
    res.writeHead(302, { Location: '/activities' });
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur');
  }
}

module.exports = { listActivities, createActivity, deleteActivity };