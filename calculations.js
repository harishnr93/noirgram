/**
 * Standard, evidence-based health/nutrition formulas.
 * BMR: Mifflin-St Jeor. TDEE: activity multiplier. Macros: g/kg protein,
 * % fat, remainder carbs. Steps: calorie-to-step approximation.
 */

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_LABELS = {
  lose: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain: 'Gain Weight',
  build_muscle: 'Build Muscle',
  improve_fitness: 'Improve Fitness / Endurance',
};

// kcal/day adjustment applied on top of TDEE, per goal.
const CALORIE_ADJUSTMENT = {
  lose: -500,
  maintain: 0,
  gain: 500,
  build_muscle: 250, // lean surplus to support muscle growth without excess fat gain
  improve_fitness: 0,
};

// grams of protein per kg body weight, per goal.
const PROTEIN_PER_KG = {
  lose: 2.0, // higher protein during a deficit helps preserve muscle
  maintain: 1.8,
  gain: 1.8,
  build_muscle: 2.2,
  improve_fitness: 1.6,
};

const EXERCISE_BURN_TARGET = {
  lose: 500,
  maintain: 400,
  gain: 300,
  build_muscle: 250, // lighter cardio load to protect recovery for resistance training
  improve_fitness: 450,
};

const TRAINING_FOCUS = {
  lose: 'Combine cardio with light resistance training, 4-5 sessions per week.',
  maintain: 'Balanced mix of cardio and strength training, 3-4 sessions per week.',
  gain: 'Resistance training with progressive overload, 3-4 sessions per week.',
  build_muscle:
    'Strength training with progressive overload, 4-5 sessions per week. Prioritize protein intake around workouts and allow rest days for recovery.',
  improve_fitness:
    'Cardio/endurance training 4-5 sessions per week, mixing steady-state and interval work.',
};

const CALORIE_FLOOR = {
  male: 1500,
  female: 1200,
  other: 1350,
};

function round(n) {
  return Math.round(n);
}

function calculateHealthReport(input) {
  const { age, heightCm, weightKg, gender, activityLevel, goal } = input;

  let bmr;
  if (gender === 'male') bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  else if (gender === 'female') bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  else bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

  let targetCalories = tdee + CALORIE_ADJUSTMENT[goal];

  const floor = CALORIE_FLOOR[gender] || CALORIE_FLOOR.other;
  let clamped = false;
  if (targetCalories < floor) {
    targetCalories = floor;
    clamped = true;
  }

  const exerciseBurnTarget = EXERCISE_BURN_TARGET[goal];
  const kcalPerStep = weightKg * 0.00045;
  const stepsToWalk = round(exerciseBurnTarget / kcalPerStep);

  const proteinG = round(weightKg * PROTEIN_PER_KG[goal]);
  const proteinKcal = proteinG * 4;
  const fatKcal = targetCalories * 0.25;
  const fatG = round(fatKcal / 9);
  const carbKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);
  const carbG = round(carbKcal / 4);

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let bmiCategory;
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi < 25) bmiCategory = 'Normal';
  else if (bmi < 30) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese';

  const waterMl = round(weightKg * 32.5);

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    targetCalories: round(targetCalories),
    calorieClamped: clamped,
    exerciseBurnTarget,
    stepsToWalk,
    proteinG,
    carbG,
    fatG,
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory,
    waterMl,
    trainingFocus: TRAINING_FOCUS[goal],
  };
}

function validateInput(input) {
  const errors = [];
  if (!input.name || !input.name.trim()) errors.push('Name is required.');
  if (!input.age || input.age <= 0 || input.age > 120) errors.push('A valid age is required.');
  if (!input.heightCm || input.heightCm <= 0 || input.heightCm > 300)
    errors.push('A valid height (cm) is required.');
  if (!input.weightKg || input.weightKg <= 0 || input.weightKg > 400)
    errors.push('A valid weight (kg) is required.');
  if (!input.gender) errors.push('Gender is required.');
  if (!input.activityLevel) errors.push('Activity level is required.');
  if (!input.goal) errors.push('Goal is required.');
  return errors;
}
