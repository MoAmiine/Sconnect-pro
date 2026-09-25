const pool = require('../config/db');
const { render, renderError } = require('../core/renderer');

async function showDashboard(req, res) {
  try {
    const statsQuery = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM facilities) AS total_facilities,
        (SELECT COUNT(*) FROM associations) AS total_associations,
        (SELECT COUNT(*) FROM activities) AS total_activities,
        (SELECT COUNT(*) FROM members) AS total_members,
        (SELECT COUNT(*) FROM families) AS total_families,
        (SELECT COUNT(*) FROM registrations WHERE status = 'confirmed') AS total_registrations,
        (SELECT COALESCE(SUM(final_price), 0) FROM registrations WHERE status = 'confirmed') AS total_revenue,
        (SELECT COALESCE(SUM(max_capacity), 0) FROM activities) AS total_capacity,
        (SELECT COUNT(*) FROM waiting_list WHERE status IN ('waiting', 'promoted_pending')) AS total_waiting
    `);

    const topActivitiesQuery = await pool.query(`
      SELECT 
        a.id, 
        a.name, 
        a.sport_type,
        a.max_capacity,
        f.name AS facility_name,
        COUNT(r.id) FILTER (WHERE r.status = 'confirmed') AS confirmed_count
      FROM activities a
      JOIN facilities f ON f.id = a.facility_id
      LEFT JOIN registrations r ON r.activity_id = a.id
      GROUP BY a.id, a.name, a.sport_type, a.max_capacity, f.name
      ORDER BY confirmed_count DESC
      LIMIT 4
    `);

    const row = statsQuery.rows[0];
    const totalCapacity = parseInt(row.total_capacity, 10);
    const totalRegistrations = parseInt(row.total_registrations, 10);
    const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    render(res, 'dashboard', {
      title: 'Tableau de bord métropolitain',
      stats: {
        totalFacilities: parseInt(row.total_facilities, 10),
        totalAssociations: parseInt(row.total_associations, 10),
        totalActivities: parseInt(row.total_activities, 10),
        totalMembers: parseInt(row.total_members, 10),
        totalFamilies: parseInt(row.total_families, 10),
        totalRegistrations,
        totalRevenue: parseFloat(row.total_revenue),
        totalWaiting: parseInt(row.total_waiting, 10),
        fillRate
      },
      topActivities: topActivitiesQuery.rows
    });
  } catch (err) {
    console.error("Erreur showDashboard:", err);
    renderError(res, 500, "Impossible de charger les indicateurs analytiques.");
  }
}

module.exports = { showDashboard };