import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyComplaint } from '../src/services/classifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEPARTMENTS = ['Plumbing', 'Electrical', 'Wi-Fi', 'Mess', 'Academic', 'Other'];

function runEvaluation() {
  const testDataPath = path.resolve(__dirname, '../data/test_dataset.json');

  if (!fs.existsSync(testDataPath)) {
    console.error(`Error: Test dataset not found at ${testDataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(testDataPath, 'utf-8');
  const testCases = JSON.parse(rawData);

  console.log('================================================================');
  console.log('   CampusResolve AI — Rule-Based Classifier Evaluation');
  console.log('   Target: Lovely Professional University (LPU), Phagwara Campus');
  console.log('================================================================\n');

  let correctCount = 0;
  const incorrectCases = [];

  // Initialize confusion matrix: [actual][predicted]
  const confusionMatrix = {};
  const perDeptStats = {};

  for (const dept of DEPARTMENTS) {
    confusionMatrix[dept] = {};
    for (const pred of DEPARTMENTS) {
      confusionMatrix[dept][pred] = 0;
    }
    perDeptStats[dept] = { total: 0, correct: 0 };
  }

  // Run predictions (Do not expose expected label to classifier)
  for (const item of testCases) {
    const { id, text, expectedDepartment, language, type } = item;

    // Call classifier with text only
    const prediction = classifyComplaint(text);
    const predictedDept = prediction.department;

    // Track statistics
    perDeptStats[expectedDepartment].total++;
    confusionMatrix[expectedDepartment][predictedDept]++;

    if (predictedDept === expectedDepartment) {
      correctCount++;
      perDeptStats[expectedDepartment].correct++;
    } else {
      incorrectCases.push({
        id,
        text,
        language,
        type,
        expected: expectedDepartment,
        predicted: predictedDept,
        matchedRules: prediction.matchDetails.matchedRules,
        allScores: prediction.matchDetails.allScores,
      });
    }
  }

  const total = testCases.length;
  const incorrectCount = total - correctCount;
  const overallAccuracy = ((correctCount / total) * 100).toFixed(2);

  // 1. Overall Summary
  console.log('--- 1. OVERALL EVALUATION SUMMARY ---');
  console.log(`Total Test Complaints   : ${total}`);
  console.log(`Correct Classifications : ${correctCount}`);
  console.log(`Incorrect Classifications : ${incorrectCount}`);
  console.log(`Overall Accuracy        : ${overallAccuracy}%\n`);

  // 2. Per-Department Breakdown
  console.log('--- 2. PER-DEPARTMENT ACCURACY ---');
  console.log('Department   | Total | Correct | Accuracy');
  console.log('-------------|-------|---------|---------');
  for (const dept of DEPARTMENTS) {
    const { total: deptTotal, correct: deptCorrect } = perDeptStats[dept];
    const deptAcc = deptTotal > 0 ? ((deptCorrect / deptTotal) * 100).toFixed(1) : '0.0';
    console.log(
      `${dept.padEnd(12)} | ${String(deptTotal).padStart(5)} | ${String(deptCorrect).padStart(7)} | ${deptAcc.padStart(6)}%`
    );
  }
  console.log('');

  // 3. Confusion Matrix Table
  console.log('--- 3. CONFUSION MATRIX (Rows: Actual, Columns: Predicted) ---');
  const header = 'Actual \\ Pred | ' + DEPARTMENTS.map((d) => d.slice(0, 7).padEnd(7)).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const actual of DEPARTMENTS) {
    const row = DEPARTMENTS.map((pred) => String(confusionMatrix[actual][pred]).padEnd(7)).join(' | ');
    console.log(`${actual.slice(0, 13).padEnd(13)} | ${row}`);
  }
  console.log('');

  // 4. Misclassified Complaints Analysis
  console.log(`--- 4. DETAILED MISCLASSIFICATION REVIEW (${incorrectCases.length} Cases) ---`);
  if (incorrectCases.length === 0) {
    console.log('None! All test complaints were classified correctly.');
  } else {
    incorrectCases.forEach((item, index) => {
      console.log(`\n[Misclassification #${index + 1}] ID: ${item.id}`);
      console.log(`Text        : "${item.text}"`);
      console.log(`Language    : ${item.language} | Difficulty: ${item.type}`);
      console.log(`Expected    : ${item.expected}`);
      console.log(`Predicted   : ${item.predicted}`);
      console.log(`Active Cues : ${JSON.stringify(item.matchedRules)}`);
    });
  }

  console.log('\n================================================================');
  console.log('                  Evaluation Run Complete');
  console.log('================================================================');

  return {
    total,
    correctCount,
    incorrectCount,
    overallAccuracy,
    perDeptStats,
    confusionMatrix,
    incorrectCases,
  };
}

runEvaluation();
