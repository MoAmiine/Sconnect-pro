const pool = require('../config/db');

const RESIDENT_PRIORITY_BONUS = 10;

function calculatePriorityScore(isResident) {
  return isResident ? RESIDENT_PRIORITY_BONUS : 0;
}

async function addToWaitingList({ activityId, memberId, isResident }, dbClient = pool) {
  const priorityScore = calculatePriorityScore(isResident);

  const existing = await dbClient.query(
    `SELECT id, status FROM waiting_list 
     WHERE activity_id = $1 AND member_id = $2 AND status IN ('waiting', 'promoted_pending')`,
    [activityId, memberId]
  );

  if (existing.rows.length > 0) {
    throw new Error("L'adhérent est déjà inscrit sur la liste d'attente de ce cours.");
  }

  const insertResult = await dbClient.query(
    `INSERT INTO waiting_list (activity_id, member_id, priority_score, status)
     VALUES ($1, $2, $3, 'waiting')
     RETURNING id, created_at`,
    [activityId, memberId, priorityScore]
  );

  const entry = insertResult.rows[0];

  const rankResult = await dbClient.query(
    `SELECT COUNT(*) AS ahead_count
     FROM waiting_list
     WHERE activity_id = $1 
       AND status = 'waiting'
       AND (priority_score > $2 OR (priority_score = $2 AND created_at <= $3))`,
    [activityId, priorityScore, entry.created_at]
  );

  const position = parseInt(rankResult.rows[0].ahead_count, 10);

  return {
    waitingListId: entry.id,
    priorityScore,
    position
  };
}

async function expireOverduePromotions(activityId, dbClient = pool) {
  const result = await dbClient.query(
    `UPDATE waiting_list
     SET status = 'expired'
     WHERE activity_id = $1 
       AND status = 'promoted_pending' 
       AND deadline_confirmation < NOW()
     RETURNING id, member_id`,
    [activityId]
  );
  return result.rows;
}

async function promoteNextCandidate(activityId, dbClient = pool) {
  await expireOverduePromotions(activityId, dbClient);

  const nextCandidate = await dbClient.query(
    `SELECT id, member_id, priority_score
     FROM waiting_list
     WHERE activity_id = $1 AND status = 'waiting'
     ORDER BY priority_score DESC, created_at ASC
     LIMIT 1
     FOR UPDATE`,
    [activityId]
  );

  if (nextCandidate.rows.length === 0) {
    return null;
  }

  const candidateId = nextCandidate.rows[0].id;

  const updateResult = await dbClient.query(
    `UPDATE waiting_list
     SET status = 'promoted_pending',
         deadline_confirmation = NOW() + INTERVAL '48 hours'
     WHERE id = $1
     RETURNING id, member_id, status, deadline_confirmation`,
    [candidateId]
  );

  return updateResult.rows[0];
}

module.exports = {
  calculatePriorityScore,
  addToWaitingList,
  expireOverduePromotions,
  promoteNextCandidate
};