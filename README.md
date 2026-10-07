# Noirgram

*noir* (French: black, the monochrome design term) + *-gram* (a written record).

**Noirgram** turns a few basic body stats into a personalized, black-and-white
health report you can download as a PDF — no install, no account, no server.

## What it does

Enter your name, age, height, weight, gender, activity level, and goal, and
Noirgram calculates:

- Daily calorie intake target
- Calories to burn through exercise
- Steps to walk per day
- Protein, carbohydrate, and fat targets (grams/day)
- BMI and recommended water intake
- A training focus recommendation tailored to your goal

Supported goals: **Lose weight**, **Maintain weight**, **Gain weight**,
**Build muscle**, and **Improve fitness / endurance**. Each goal adjusts the
calorie target, protein target, and training guidance differently — for
example, Build Muscle uses a lean calorie surplus and higher protein
(2.2 g/kg) with a strength-training focus, while Improve Fitness keeps
calories at maintenance and emphasizes cardio/endurance sessions.

Every value in the generated PDF is clearly labeled **Mandatory** or
**Optional**, so you know exactly which numbers matter most. Calculations use
standard, evidence-based formulas (Mifflin-St Jeor for BMR, activity
multipliers for TDEE, g/kg protein targets, etc.).

Every report opens with a **red caution notice** stating that the numbers are
rough reference data only — not medical advice — and that a doctor or
dietitian should be consulted for a full assessment.

The report is exported as `NoirgramReport_<YourName>.pdf`.

## Download

Noirgram is a plain static web app — just one folder, no build tools, no
dependencies. To "download" it, copy or clone this folder to your computer:

```
Noirgram/
  noirgram.html
  styles.css
  app.js
  calculations.js
  pdf.js
  pdfExport.js
```

## How to run it

1. Open the `Noirgram` folder.
2. Double-click **`noirgram.html`**.

That's it — it opens in your default browser and runs entirely on your
device. Nothing is uploaded anywhere. It works the same way on a laptop,
tablet, or phone browser.

## How to use it

1. Fill in the required fields (marked with `*`).
2. Optionally add any health conditions or dietary restrictions.
3. Click **"Submit"** to see your computed stats on screen, clearly marked
   Mandatory or Optional.
4. From there, click **"Download PDF"** to save the report, or
   **"Start Over"** to clear the form and enter a new set of details.

## Disclaimer

**Caution: this report is for reference only.** Noirgram provides rough
estimates based on standard formulas, not medical advice. Kindly visit a
doctor or dietitian for a full assessment before acting on this information.
