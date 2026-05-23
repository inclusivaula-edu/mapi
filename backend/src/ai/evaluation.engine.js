export function evaluateLesson(lesson) {
  return {
    comprehension: lesson.explanation?.length > 100 ? "boa" : "baixa",
    engagement: lesson.activities?.length >= 2 ? "alta" : "média",
    adaptation: lesson.example ? "ok" : "fraca",
  };
}