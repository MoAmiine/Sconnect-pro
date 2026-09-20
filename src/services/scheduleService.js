const pool = require('../config/db');

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
function subZonesConflict(zoneA, zoneB) {
  if (!zoneA || zoneA === 'full' || !zoneB || zoneB === 'full') return true;
  return zoneA === zoneB;
}

async function findScheduleConflict({ facility_id, sub_zone, day_of_week, start_time, end_time, excludeActivityId }) {
  const result = await pool.query(
    `SELECT id, name, sub_zone, start_time, end_time
     FROM activities
     WHERE facility_id = $1
       AND day_of_week = $2
       AND ($3::int IS NULL OR id != $3)`,
    [facility_id, day_of_week, excludeActivityId || null]
  );

  for (const existing of result.rows) {
    const overlapsInTime = timesOverlap(start_time, end_time, existing.start_time, existing.end_time);
    const overlapsInSpace = subZonesConflict(sub_zone, existing.sub_zone);
    if (overlapsInTime && overlapsInSpace) {
      return existing;
    }
  }
  return null; 
}

async function checkErpCapacity({ facility_id, max_capacity }) {
  const result = await pool.query('SELECT erp_capacity FROM facilities WHERE id = $1', [facility_id]);
  if (result.rows.length === 0) {
    return { valid: false, reason: "Infrastructure introuvable" };
  }
  const erpCapacity = result.rows[0].erp_capacity;
  if (max_capacity > erpCapacity) {
    return { valid: false, reason: `La capacité (${max_capacity}) dépasse la jauge ERP de la salle (${erpCapacity})` };
  }
  return { valid: true };
}

module.exports = { findScheduleConflict, checkErpCapacity };