const NON_RESIDENT_SURCHARGE = 1.35; 
const FAMILY_DISCOUNT_2ND = 0.15;      // -15% sur la 2e inscription du foyer
const FAMILY_DISCOUNT_3RD_PLUS = 0.30



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


module.exports = { computeInitialPrice , applyFamilyDiscount  };