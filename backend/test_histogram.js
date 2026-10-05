// Direct unit test of the new histogramController logic
process.chdir('C:/Users/ajayk/OneDrive/Desktop/Parallel-mini-project');

const fs   = require('fs');
const path = require('path');

const EXPECTED_BINS         = 256;
const EXPECTED_TOTAL_PIXELS = 42000 * 784; // 32,928,000

function parseHistogramCsv(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const bins  = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 2) continue;
    const pixel     = parseInt(cols[0].trim(), 10);
    const frequency = parseInt(cols[1].trim(), 10);
    if (isNaN(pixel) || isNaN(frequency)) continue;
    bins.push({ pixel, frequency });
  }
  return bins;
}

function validateHistograms(seq, par) {
  const mismatchedBins = [];
  let seqTotal = 0, parTotal = 0;
  if (seq.length !== EXPECTED_BINS || par.length !== EXPECTED_BINS)
    return { correct: false, mismatchedBins: [], seqTotal: 0, parTotal: 0 };
  for (let i = 0; i < EXPECTED_BINS; i++) {
    seqTotal += seq[i].frequency;
    parTotal += par[i].frequency;
    if (seq[i].frequency !== par[i].frequency)
      mismatchedBins.push({ pixel: seq[i].pixel, sequential: seq[i].frequency, parallel: par[i].frequency });
  }
  return {
    correct: mismatchedBins.length === 0,
    mismatchedBins,
    seqTotal,
    parTotal,
    seqTotalValid: seqTotal === EXPECTED_TOTAL_PIXELS,
    parTotalValid: parTotal === EXPECTED_TOTAL_PIXELS,
  };
}

function mostFrequent(bins) {
  return bins.reduce((best, b) => b.frequency > best.frequency ? b : best, bins[0]);
}

const seqFile = 'results/histogram_seq.csv';
const parFile = 'results/histogram_par.csv';

const sequential = parseHistogramCsv(seqFile);
const parallel   = parseHistogramCsv(parFile);
const v          = validateHistograms(sequential, parallel);
const mf         = mostFrequent(sequential);

console.log('=== HISTOGRAM CONTROLLER UNIT TEST ===\n');
console.log(`Sequential bins    : ${sequential.length} (expected ${EXPECTED_BINS})`);
console.log(`Parallel bins      : ${parallel.length} (expected ${EXPECTED_BINS})`);
console.log(`seqTotal           : ${v.seqTotal.toLocaleString()} (expected ${EXPECTED_TOTAL_PIXELS.toLocaleString()})`);
console.log(`parTotal           : ${v.parTotal.toLocaleString()} (expected ${EXPECTED_TOTAL_PIXELS.toLocaleString()})`);
console.log(`seqTotalValid      : ${v.seqTotalValid}`);
console.log(`parTotalValid      : ${v.parTotalValid}`);
console.log(`correctness        : ${v.correct ? 'PASS' : 'FAIL'}`);
console.log(`mismatchedBins     : ${v.mismatchedBins.length}`);
console.log(`mostFrequentPixel  : ${mf.pixel}`);
console.log(`mostFrequentCount  : ${mf.frequency.toLocaleString()}`);

console.log('\n--- Spot check: first 5 bins ---');
sequential.slice(0, 5).forEach((b, i) => {
  const match = parallel[i].frequency === b.frequency;
  console.log(`  Bin ${b.pixel}: seq=${b.frequency.toLocaleString()} par=${parallel[i].frequency.toLocaleString()} ${match ? '✓' : '✗'}`);
});

console.log('\n--- All 256 bins match check ---');
let allMatch = true;
for (let i = 0; i < 256; i++) {
  if (sequential[i].frequency !== parallel[i].frequency) {
    console.log(`  MISMATCH at bin ${i}: ${sequential[i].frequency} vs ${parallel[i].frequency}`);
    allMatch = false;
  }
}
if (allMatch) console.log('  All 256 bins match ✓');

console.log('\n=== RESULT ===');
console.log(`Bins       : ${sequential.length === 256 ? 'PASS' : 'FAIL'} (${sequential.length}/256)`);
console.log(`seqTotal   : ${v.seqTotalValid ? 'PASS' : 'FAIL'} (${v.seqTotal.toLocaleString()}/${EXPECTED_TOTAL_PIXELS.toLocaleString()})`);
console.log(`parTotal   : ${v.parTotalValid ? 'PASS' : 'FAIL'} (${v.parTotal.toLocaleString()}/${EXPECTED_TOTAL_PIXELS.toLocaleString()})`);
console.log(`Correctness: ${v.correct ? 'PASS' : 'FAIL'}`);
