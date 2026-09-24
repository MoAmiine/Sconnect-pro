const NON_RESIDENT_SURCHARGE = 1.35; 

function computeInitialPrice(basePrice, isResident) {
  const price = isResident ? basePrice : basePrice * NON_RESIDENT_SURCHARGE;
  return Math.round(price * 100) / 100;
}

module.exports = { computeInitialPrice };