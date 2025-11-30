/**
 * Configuration for allergy reactions and severity levels
 * Centralized list to maintain consistency across the application
 */

module.exports = {
  // Predefined reaction options (27 standard reactions)
  REACTION_OPTIONS: [
    "Acute kidney failure",
    "Altered mental state",
    "Anaphylaxis",
    "Angioedema",
    "Arthralgia",
    "Chills",
    "Cough",
    "Diarrhea",
    "Dizziness",
    "Fever",
    "Gastrointestinal irritation",
    "Headache",
    "Hives",
    "Itching",
    "Myalgia",
    "Nasal congestion",
    "Nausea",
    "Pain in injection site",
    "Palpitations",
    "Rash",
    "Respiratory distress",
    "Rhinorrhea",
    "Shortness of breath",
    "Sneezing",
    "Sore throat",
    "Swelling",
    "Vomiting"
  ],

  // Severity levels with metadata
  SEVERITY_LEVELS: [
    { id: 'mild', label: 'Mild', description: 'Minor discomfort, no intervention needed' },
    { id: 'moderate', label: 'Moderate', description: 'Requires monitoring or medication' },
    { id: 'severe', label: 'Severe', description: 'Requires immediate medical attention' },
    { id: 'fatal', label: 'Fatal', description: 'Life-threatening, requires emergency care' }
  ],

  // Allergy types
  ALLERGY_TYPES: [
    { id: 'non-drug', label: 'Non-drug allergy' },
    { id: 'drug', label: 'Drug allergy' },
    { id: 'no-known', label: 'No known allergies' }
  ],

  // Allergy status options
  ALLERGY_STATUS: [
    { id: 'active', label: 'Active' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'archived', label: 'Archived' }
  ]
};
