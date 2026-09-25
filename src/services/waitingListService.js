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

module.exports = {
  calculatePriorityScore,
  addToWaitingList
};