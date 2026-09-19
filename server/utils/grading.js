// Default grading bands (spec section 38). Kept as a pure function so a
// future SystemSetting-driven override (Phase 8) can swap it in without
// touching call sites.
function calculateGrade(marksObtained, maximumMarks) {
  const percentage = (marksObtained / maximumMarks) * 100;

  let grade;
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else grade = 'F';

  return { percentage, grade };
}

module.exports = { calculateGrade };
