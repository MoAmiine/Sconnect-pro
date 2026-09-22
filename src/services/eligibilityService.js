const AGE_CATEGORIES = [
  { max: 6,  label: 'eveil' },
  { min: 7,  max: 8,  label: 'poussin' },
  { min: 9,  max: 10, label: 'benjamin' },
  { min: 11, max: 12, label: 'minime' },
  { min: 13, max: 14, label: 'cadet' },
  { min: 15, max: 17, label: 'junior' },
  { min: 18, max: 39, label: 'senior' },
  { min: 40, label: 'veteran' }
];

const AT_RISK_SPORTS = ['boxe', 'plongée sous-marine', 'plongee sous-marine', 'rugby'];

function calculateAgeCategory(birthDate, seasonYear) {
  const birthYear = new Date(birthDate).getFullYear();
  const ageAtDec31 = seasonYear - birthYear;

  const match = AGE_CATEGORIES.find(cat => {
    const aboveMin = cat.min === undefined || ageAtDec31 >= cat.min;
    const belowMax = cat.max === undefined || ageAtDec31 <= cat.max;
    return aboveMin && belowMax;
  });

  return match ? match.label : 'senior';
}

function checkAgeEligibility(memberAgeCategory, activityAgeCategory) {
  if (activityAgeCategory === 'tous_publics') return true;
  return memberAgeCategory === activityAgeCategory;
}

function checkMedicalCompliance(sportType, medicalCertificateDate) {
  if (!medicalCertificateDate) return 'medical_non_compliant';

  const isAtRisk = AT_RISK_SPORTS.includes(sportType.trim().toLowerCase());
  const validityYears = isAtRisk ? 1 : 3;

  const certDate = new Date(medicalCertificateDate);
  const expiryDate = new Date(certDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

  return expiryDate >= new Date() ? 'compliant' : 'medical_non_compliant';
}

module.exports = { calculateAgeCategory, checkAgeEligibility, checkMedicalCompliance };