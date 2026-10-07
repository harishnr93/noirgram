document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('health-form');
  const formView = document.getElementById('form-view');
  const resultsView = document.getElementById('results-view');
  const formErrorBox = document.getElementById('form-errors');
  const exportErrorBox = document.getElementById('export-errors');
  const downloadBtn = document.getElementById('download-btn');
  const startOverBtn = document.getElementById('start-over-btn');

  let currentInput = null;
  let currentResult = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const input = {
      name: document.getElementById('name').value,
      age: Number(document.getElementById('age').value),
      gender: document.getElementById('gender').value,
      heightCm: Number(document.getElementById('heightCm').value),
      weightKg: Number(document.getElementById('weightKg').value),
      activityLevel: document.getElementById('activityLevel').value,
      goal: document.getElementById('goal').value,
      healthNotes: document.getElementById('healthNotes').value,
    };

    const errors = validateInput(input);
    if (errors.length > 0) {
      showFormErrors(errors);
      return;
    }
    hideFormErrors();

    currentInput = input;
    currentResult = calculateHealthReport(input);
    renderResults(currentInput, currentResult);

    formView.hidden = true;
    resultsView.hidden = false;
    resultsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  downloadBtn.addEventListener('click', () => {
    hideExportErrors();
    try {
      exportHealthReportPdf(currentInput, currentResult);
    } catch (err) {
      showExportErrors('Could not generate the PDF: ' + err.message);
    }
  });

  startOverBtn.addEventListener('click', () => {
    currentInput = null;
    currentResult = null;
    form.reset();
    hideFormErrors();
    hideExportErrors();
    resultsView.hidden = true;
    formView.hidden = false;
    formView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function renderResults(input, result) {
    const basic = document.getElementById('results-basic');
    basic.innerHTML = '';
    appendRow(basic, 'Name', input.name);
    appendRow(basic, 'Age', `${input.age} yrs`);
    appendRow(basic, 'Gender', input.gender.charAt(0).toUpperCase() + input.gender.slice(1));
    appendRow(basic, 'Height', `${input.heightCm} cm`);
    appendRow(basic, 'Weight', `${input.weightKg} kg`);
    appendRow(basic, 'Activity Level', input.activityLevel.replace('_', ' '));
    appendRow(basic, 'Goal', GOAL_LABELS[input.goal] || input.goal);

    const mandatory = document.getElementById('results-mandatory');
    mandatory.innerHTML = '';
    appendRow(mandatory, 'BMR - Basal Metabolic Rate (kcal/day)', result.bmr, 'Mandatory');
    appendRow(mandatory, 'Maintenance Calories - TDEE (kcal/day)', result.tdee, 'Mandatory');
    appendRow(
      mandatory,
      'Target Calorie Intake (kcal/day)' + (result.calorieClamped ? ' *' : ''),
      result.targetCalories,
      'Mandatory'
    );
    appendRow(mandatory, 'Calories To Burn via Exercise (kcal/day)', result.exerciseBurnTarget, 'Mandatory');
    appendRow(mandatory, 'Steps To Walk (per day)', result.stepsToWalk, 'Mandatory');
    appendRow(mandatory, 'Protein (g/day)', result.proteinG, 'Mandatory');
    appendRow(mandatory, 'Carbohydrates (g/day)', result.carbG, 'Mandatory');
    appendRow(mandatory, 'Fat (g/day)', result.fatG, 'Mandatory');
    if (result.calorieClamped) {
      const note = document.createElement('p');
      note.className = 'results-text';
      note.textContent = '* Adjusted to a safe minimum calorie floor.';
      mandatory.appendChild(note);
    }

    const optional = document.getElementById('results-optional');
    optional.innerHTML = '';
    appendRow(optional, 'BMI - Body Mass Index', `${result.bmi} (${result.bmiCategory})`, 'Optional');
    appendRow(optional, 'Water Intake (ml/day)', result.waterMl, 'Optional');

    document.getElementById('results-training').textContent = result.trainingFocus;
    document.getElementById('results-notes').textContent =
      input.healthNotes && input.healthNotes.trim() ? input.healthNotes.trim() : 'None provided.';
  }

  function appendRow(container, label, value, flag) {
    const row = document.createElement('div');
    row.className = 'result-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'result-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'result-value';
    valueSpan.textContent = String(value);
    row.appendChild(valueSpan);

    if (flag) {
      const flagSpan = document.createElement('span');
      flagSpan.className = 'result-flag';
      flagSpan.textContent = flag;
      row.appendChild(flagSpan);
    }

    container.appendChild(row);
  }

  function showFormErrors(errors) {
    formErrorBox.innerHTML =
      '<p>Please fix the following before continuing:</p><ul>' +
      errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('') +
      '</ul>';
    formErrorBox.hidden = false;
    formErrorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideFormErrors() {
    formErrorBox.hidden = true;
    formErrorBox.innerHTML = '';
  }

  function showExportErrors(message) {
    exportErrorBox.innerHTML = `<p>${escapeHtml(message)}</p>`;
    exportErrorBox.hidden = false;
    exportErrorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideExportErrors() {
    exportErrorBox.hidden = true;
    exportErrorBox.innerHTML = '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
