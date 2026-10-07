/**
 * Builds the black & white Health Report PDF from validated input + computed
 * results, and triggers the browser download. Depends on pdf.js (PDFDoc).
 */

const COL_LABEL_X = 55;
const COL_VALUE_X = 360;
const COL_FLAG_X = 460;
const CONTENT_RIGHT = PAGE_W - 50;

function sanitizeFilename(name) {
  return name.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_') || 'User';
}

function sectionHeader(doc, title) {
  doc.ensureSpace(40);
  doc.rect(50, doc.y - 4, CONTENT_RIGHT - 50, 18, [0, 0, 0]);
  doc.text(COL_LABEL_X, doc.y, title, { font: 'F2', size: 11, color: [1, 1, 1] });
  doc.y -= 30;
}

function row(doc, label, value, flag) {
  doc.ensureSpace(16);
  doc.text(COL_LABEL_X, doc.y, label, { font: 'F1', size: 10 });
  doc.text(COL_VALUE_X, doc.y, value, { font: 'F1', size: 10 });
  if (flag) doc.text(COL_FLAG_X, doc.y, flag, { font: 'F2', size: 8 });
  doc.y -= 16;
}

const CAUTION_RED = [0.8, 0, 0];

function cautionBox(doc) {
  doc.ensureSpace(70);
  const boxTop = doc.y;
  const boxHeight = 58;
  const x1 = 50;
  const x2 = CONTENT_RIGHT;

  doc.line(x1, boxTop, x2, boxTop, 1.5, CAUTION_RED);
  doc.line(x1, boxTop - boxHeight, x2, boxTop - boxHeight, 1.5, CAUTION_RED);
  doc.line(x1, boxTop, x1, boxTop - boxHeight, 1.5, CAUTION_RED);
  doc.line(x2, boxTop, x2, boxTop - boxHeight, 1.5, CAUTION_RED);

  doc.text(x1 + 10, boxTop - 17, 'CAUTION: This report is for reference only.', {
    font: 'F2',
    size: 11,
    color: CAUTION_RED,
  });
  doc.text(x1 + 10, boxTop - 32, 'Kindly visit a doctor or dietitian for more details.', {
    font: 'F1',
    size: 9,
    color: CAUTION_RED,
  });
  doc.text(x1 + 10, boxTop - 46, 'We only provide rough reference data, not medical advice.', {
    font: 'F1',
    size: 9,
    color: CAUTION_RED,
  });

  doc.y = boxTop - boxHeight - 15;
}

function wrapText(str, maxChars) {
  const words = str.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function exportHealthReportPdf(input, result) {
  const doc = new PDFDoc();

  doc.rect(0, doc.pageHeight - 70, PAGE_W, 70, [0, 0, 0]);
  doc.text(50, doc.pageHeight - 45, 'NOIRGRAM - HEALTH REPORT', { font: 'F2', size: 22, color: [1, 1, 1] });
  const today = new Date().toISOString().slice(0, 10);
  doc.text(50, doc.pageHeight - 62, `Generated ${today} for ${input.name}`, {
    font: 'F1',
    size: 10,
    color: [1, 1, 1],
  });
  doc.y = doc.pageHeight - 100;

  cautionBox(doc);

  const basicRows = [
    ['Name', input.name],
    ['Age', `${input.age} yrs`],
    ['Gender', input.gender.charAt(0).toUpperCase() + input.gender.slice(1)],
    ['Height', `${input.heightCm} cm`],
    ['Weight', `${input.weightKg} kg`],
    ['Activity Level', input.activityLevel.replace('_', ' ')],
    ['Goal', GOAL_LABELS[input.goal] || input.goal],
  ];
  for (const [label, val] of basicRows) {
    doc.ensureSpace(16);
    doc.text(COL_LABEL_X, doc.y, `${label}:`, { font: 'F2', size: 10 });
    doc.text(180, doc.y, val, { font: 'F1', size: 10 });
    doc.y -= 16;
  }

  doc.ensureSpace(10);
  doc.line(50, doc.y, CONTENT_RIGHT, doc.y);
  doc.y -= 25;

  sectionHeader(doc, 'DAILY TARGETS (MANDATORY)');
  row(doc, 'BMR - Basal Metabolic Rate (kcal/day)', String(result.bmr), 'Mandatory');
  row(doc, 'Maintenance Calories - TDEE (kcal/day)', String(result.tdee), 'Mandatory');
  row(
    doc,
    'Target Calorie Intake (kcal/day)' + (result.calorieClamped ? ' *' : ''),
    String(result.targetCalories),
    'Mandatory'
  );
  row(doc, 'Calories To Burn via Exercise (kcal/day)', String(result.exerciseBurnTarget), 'Mandatory');
  row(doc, 'Steps To Walk (per day)', String(result.stepsToWalk), 'Mandatory');
  row(doc, 'Protein (g/day)', String(result.proteinG), 'Mandatory');
  row(doc, 'Carbohydrates (g/day)', String(result.carbG), 'Mandatory');
  row(doc, 'Fat (g/day)', String(result.fatG), 'Mandatory');
  row(doc, 'Fibre (g/day)', String(result.fibreG), 'Mandatory');
  if (result.calorieClamped) {
    doc.ensureSpace(14);
    doc.text(COL_LABEL_X, doc.y, '* Adjusted to a safe minimum calorie floor.', { font: 'F1', size: 8 });
    doc.y -= 18;
  }

  doc.y -= 6;
  sectionHeader(doc, 'SUPPLEMENTARY (OPTIONAL)');
  row(doc, 'BMI - Body Mass Index', `${result.bmi} (${result.bmiCategory})`, 'Optional');
  row(doc, 'Water Intake (ml/day)', String(result.waterMl), 'Optional');

  doc.y -= 6;
  sectionHeader(doc, 'VITAMINS & MINERALS (RECOMMENDED DAILY)');
  row(doc, 'Vitamin A (mcg RAE/day)',   String(result.vitaminA_mcg),   'RDA');
  row(doc, 'Vitamin C (mg/day)',         String(result.vitaminC_mg),    'RDA');
  row(doc, 'Vitamin D (mcg/day)',        String(result.vitaminD_mcg),   'RDA');
  row(doc, 'Vitamin E (mg/day)',         String(result.vitaminE_mg),    'RDA');
  row(doc, 'Vitamin B6 (mg/day)',        String(result.vitaminB6_mg),   'RDA');
  row(doc, 'Vitamin B12 (mcg/day)',      String(result.vitaminB12_mcg), 'RDA');
  row(doc, 'Folate / B9 (mcg DFE/day)', String(result.folate_mcg),     'RDA');
  row(doc, 'Calcium (mg/day)',           String(result.calcium_mg),     'RDA');
  row(doc, 'Iron (mg/day)',              String(result.iron_mg),        'RDA');
  row(doc, 'Magnesium (mg/day)',         String(result.magnesium_mg),   'RDA');
  row(doc, 'Zinc (mg/day)',              String(result.zinc_mg),        'RDA');
  row(doc, 'Potassium (mg/day)',         String(result.potassium_mg),   'RDA');

  doc.y -= 10;
  doc.ensureSpace(30);
  doc.text(COL_LABEL_X, doc.y, 'Training Focus (Optional):', { font: 'F2', size: 9 });
  doc.y -= 14;
  for (const line of wrapText(result.trainingFocus, 95)) {
    doc.ensureSpace(13);
    doc.text(COL_LABEL_X, doc.y, line, { font: 'F1', size: 9 });
    doc.y -= 13;
  }

  doc.y -= 10;
  doc.ensureSpace(30);
  doc.text(COL_LABEL_X, doc.y, 'Health Notes / Dietary Restrictions (Optional):', { font: 'F2', size: 9 });
  doc.y -= 14;
  const notes = input.healthNotes && input.healthNotes.trim() ? input.healthNotes.trim() : 'None provided.';
  for (const line of wrapText(notes, 95)) {
    doc.ensureSpace(13);
    doc.text(COL_LABEL_X, doc.y, line, { font: 'F1', size: 9 });
    doc.y -= 13;
  }

  doc.y -= 12;
  doc.ensureSpace(60);
  doc.line(50, doc.y, CONTENT_RIGHT, doc.y);
  doc.y -= 15;
  doc.text(
    COL_LABEL_X,
    doc.y,
    'Mandatory parameters are required for a safe, accurate daily target. Optional parameters are supplementary.',
    { font: 'F1', size: 8 }
  );
  doc.y -= 13;
  doc.text(
    COL_LABEL_X,
    doc.y,
    'Disclaimer: Estimates based on the Mifflin-St Jeor equation and standard activity factors, for',
    { font: 'F1', size: 8 }
  );
  doc.y -= 11;
  doc.text(
    COL_LABEL_X,
    doc.y,
    'informational purposes only. Consult a healthcare professional before starting any diet or exercise plan.',
    { font: 'F1', size: 8 }
  );

  const filename = `NoirgramReport_${sanitizeFilename(input.name)}.pdf`;
  doc.download(filename);
}
