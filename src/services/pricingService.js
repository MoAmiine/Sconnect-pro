const NON_RESIDENT_SURCHARGE = 1.35; 
const FAMILY_DISCOUNT_2ND = 0.15;    
const FAMILY_DISCOUNT_3RD_PLUS = 0.30
const QF_THRESHOLD_LOW = 600;
const QF_THRESHOLD_MID = 900;
const QF_DISCOUNT_LOW = 0.40;
const QF_DISCOUNT_MID = 0.20;
const PASS_SPORT_DEDUCTION = 50.00;
const FLOOR_PRICE = 15.00;
const pool = require('../config/db');




function computeInitialPrice(basePrice, isResident) {
  const price = isResident ? basePrice : basePrice * NON_RESIDENT_SURCHARGE;
  return Math.round(price * 100) / 100;
}


function applyFamilyDiscount(price, familyRegistrationRank) {
    let rate = 0;
    if (familyRegistrationRank === 1) rate = FAMILY_DISCOUNT_2ND;
    else if (familyRegistrationRank >= 2) rate = FAMILY_DISCOUNT_3RD_PLUS;
    
    const discounted = price * (1 - rate);
    return { price: Math.round(discounted * 100) / 100, rate };
}

function applySocialDiscount(price, quotientFamilial) {
  let rate = 0;
  if (quotientFamilial < QF_THRESHOLD_LOW) rate = QF_DISCOUNT_LOW;
  else if (quotientFamilial <= QF_THRESHOLD_MID) rate = QF_DISCOUNT_MID;

  const discounted = price * (1 - rate);
  return { price: Math.round(discounted * 100) / 100, rate };
}

function applyPassSport(price, hasPassSport) {
  let result = hasPassSport ? price - PASS_SPORT_DEDUCTION : price;
  if (result < FLOOR_PRICE) result = FLOOR_PRICE;
  return Math.round(result * 100) / 100;
}

function computeInstallments(finalPrice) {
  const installment2 = Math.round(finalPrice * 0.30 * 100) / 100;
  const installment3 = Math.round(finalPrice * 0.30 * 100) / 100;
  const installment1 = Math.round((finalPrice - installment2 - installment3) * 100) / 100;
  return [installment1, installment2, installment3];
}

async function getFamilyRegistrationRank(familyId, dbClient = pool) {
  if (!familyId) return 0;
  const result = await dbClient.query(
    `SELECT COUNT(*) AS total
     FROM registrations r
     JOIN members m ON m.id = r.member_id
     WHERE m.family_id = $1 AND r.status = 'confirmed'
       AND date_part('year', r.created_at) = date_part('year', CURRENT_DATE)`,
    [familyId]
  );
  return parseInt(result.rows[0].total, 10);
}

async function calculatePrice({ basePrice, isResident, familyId, quotientFamilial, hasPassSport }, dbClient = pool) {
  const step1 = computeInitialPrice(parseFloat(basePrice), isResident);

  const rank = await getFamilyRegistrationRank(familyId, dbClient);
  const step2 = applyFamilyDiscount(step1, rank);

  const step3 = applySocialDiscount(step2.price, parseFloat(quotientFamilial));

  const finalPrice = applyPassSport(step3.price, hasPassSport);

  return {
    basePrice: parseFloat(basePrice),
    initialPrice: step1,
    familyDiscountRate: step2.rate,
    afterFamilyDiscount: step2.price,
    socialDiscountRate: step3.rate,
    afterSocialDiscount: step3.price,
    passSportApplied: hasPassSport,
    finalPrice,
    installments: computeInstallments(finalPrice)
  };
}

module.exports = {computeInitialPrice, applyFamilyDiscount, applySocialDiscount, applyPassSport, computeInstallments, getFamilyRegistrationRank, calculatePrice};