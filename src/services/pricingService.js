const NON_RESIDENT_SURCHARGE = 1.35; 
const FAMILY_DISCOUNT_2ND = 0.15;    
const FAMILY_DISCOUNT_3RD_PLUS = 0.30
const QF_THRESHOLD_LOW = 600;
const QF_THRESHOLD_MID = 900;
const QF_DISCOUNT_LOW = 0.40;
const QF_DISCOUNT_MID = 0.20;
const PASS_SPORT_DEDUCTION = 50.00;
const FLOOR_PRICE = 15.00;



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

module.exports = { computeInitialPrice, applyFamilyDiscount, applySocialDiscount, applyPassSport, computeInstallments };