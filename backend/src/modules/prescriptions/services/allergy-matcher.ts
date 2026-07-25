/**
 * Server-side re-implementation of `allergyConflict()` in Tailieu/doctor.html — cross-checks a
 * medicine's active ingredient against the patient's free-text `allergies` field, plus an
 * explicit penicillin-class cross-reactivity rule (amoxicillin/ampicillin share the beta-lactam
 * ring with penicillin).
 * @param {string | null} activeIngredient Medicine's active ingredient snapshot.
 * @param {string} medicineName Medicine display name (used only for the penicillin-class check).
 * @param {string | null} patientAllergies Free-text `patients.allergies` field.
 * @returns {string | null} The matched allergy token, or null when no conflict is found.
 */
export function findAllergyConflict(
  activeIngredient: string | null,
  medicineName: string,
  patientAllergies: string | null,
): string | null {
  if (!patientAllergies?.trim()) return null;

  const allergyTokens = patientAllergies
    .split(/[,;\n]/)
    .map((token) => token.trim())
    .filter(Boolean);
  const active = (activeIngredient ?? '').toLowerCase();

  const activeFirstWord = active.split(' ')[0] ?? '';
  for (const token of allergyTokens) {
    const lowerToken = token.toLowerCase();
    if (active && (active.includes(lowerToken) || (activeFirstWord && lowerToken.includes(activeFirstWord)))) {
      return token;
    }
  }

  const hasPenicillinAllergy = allergyTokens.some((token) => token.toLowerCase().includes('penicillin'));
  if (hasPenicillinAllergy && /penicillin|amoxicillin|ampicillin/i.test(`${active} ${medicineName}`)) {
    return 'Penicillin';
  }

  return null;
}
