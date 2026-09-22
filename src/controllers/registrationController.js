const pool = require('../config/db');
const { render, renderError } = require('../core/renderer');
const pricingService = require('../services/pricingService');
const eligibilityService = require('../services/eligibilityService');

async function getActivityWithDetails(activityId) {
  const result = await pool.query(`
    SELECT a.*, f.name AS facility_name, ass.name AS association_name
    FROM activities a
    JOIN facilities f ON f.id = a.facility_id
    JOIN associations ass ON ass.id = a.association_id
    WHERE a.id = $1
  `, [activityId]);
  return result.rows[0] || null;
}

async function showActivityDetail(req, res) {
  try {
    const activity = await getActivityWithDetails(req.params.id);
    if (!activity) return renderError(res, 404, "Activité introuvable.");

    const membersResult = await pool.query('SELECT * FROM members ORDER BY last_name');
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM registrations WHERE activity_id = $1 AND status = 'confirmed'`,
      [activity.id]
    );

    render(res, 'activity-detail', {
      activity,
      members: membersResult.rows,
      confirmedCount: parseInt(countResult.rows[0].total, 10),
      error: null
    });
  } catch (err) {
    console.error(err);
    renderError(res, 500, "Impossible de charger cette activité.");
  }
}

    async function showQuote(req, res) {
  try {
    const { activity_id, member_id, payment_plan } = req.body;
    const activity = await getActivityWithDetails(activity_id);
    const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [member_id]);
    const member = memberResult.rows[0];

    if (!activity || !member) return renderError(res, 404, "Activité ou adhérent introuvable.");

    const currentYear = new Date().getFullYear();
    const memberCategory = eligibilityService.calculateAgeCategory(member.birth_date, currentYear);
    const isEligible = eligibilityService.checkAgeEligibility(memberCategory, activity.age_category);

    if (!isEligible) {
      const membersResult = await pool.query('SELECT * FROM members ORDER BY last_name');
      const countResult = await pool.query(
        `SELECT COUNT(*) AS total FROM registrations WHERE activity_id = $1 AND status = 'confirmed'`,
        [activity.id]
      );
      return render(res, 'activity-detail', {
        activity, members: membersResult.rows,
        confirmedCount: parseInt(countResult.rows[0].total, 10),
        error: `Catégorie d'âge incompatible : "${member.first_name} ${member.last_name}" est en "${memberCategory}", ce cours est réservé à "${activity.age_category}".`
      });
    }

    let familyQF = 0;
    if (member.family_id) {
      const famResult = await pool.query('SELECT quotient_familial FROM families WHERE id = $1', [member.family_id]);
      familyQF = famResult.rows.length ? parseFloat(famResult.rows[0].quotient_familial) : 0;
    }

    const quote = await pricingService.calculatePrice({
      basePrice: activity.base_price,
      isResident: member.is_resident,
      familyId: member.family_id,
      quotientFamilial: familyQF,
      hasPassSport: !!member.pass_sport_code
    });

    render(res, 'checkout', { activity, member, quote, paymentPlan: payment_plan || 'full' });
  } catch (err) {
    console.error(err);
    renderError(res, 500, "Impossible de calculer le devis.");
  }
}

async function confirmRegistration(req, res) {
  const { activity_id, member_id, payment_plan } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actRes = await client.query('SELECT * FROM activities WHERE id = $1 FOR UPDATE', [activity_id]);
    const activity = actRes.rows[0];

    const countRes = await client.query(
      `SELECT COUNT(*) AS total FROM registrations WHERE activity_id = $1 AND status = 'confirmed'`,
      [activity_id]
    );
    const currentCount = parseInt(countRes.rows[0].total, 10);

    if (currentCount >= activity.max_capacity) {
      await client.query('ROLLBACK');
      return renderError(res, 400, "Ce cours est désormais complet. (La file d'attente arrive à l'étape suivante du projet.)");
    }

    const memberRes = await client.query('SELECT * FROM members WHERE id = $1', [member_id]);
    const member = memberRes.rows[0];

    let familyQF = 0;
    if (member.family_id) {
      const famResult = await client.query('SELECT quotient_familial FROM families WHERE id = $1', [member.family_id]);
      familyQF = famResult.rows.length ? parseFloat(famResult.rows[0].quotient_familial) : 0;
    }

    const quote = await pricingService.calculatePrice({
      basePrice: activity.base_price,
      isResident: member.is_resident,
      familyId: member.family_id,
      quotientFamilial: familyQF,
      hasPassSport: !!member.pass_sport_code
    }, client);

    await client.query(
      `INSERT INTO registrations (member_id, activity_id, final_price, payment_plan, status)
       VALUES ($1, $2, $3, $4, 'confirmed')`,
      [member_id, activity_id, quote.finalPrice, payment_plan || 'full']
    );

    await client.query('COMMIT');
    res.writeHead(302, { Location: '/activities/' + activity_id });
    res.end();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    renderError(res, 500, "L'inscription n'a pas pu être enregistrée.");
  } finally {
    client.release();
  }
}

module.exports = { showActivityDetail, showQuote, confirmRegistration };