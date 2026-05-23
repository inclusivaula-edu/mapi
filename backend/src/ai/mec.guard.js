export function validateLesson(lesson) {
  if (!lesson) return false;

  if (typeof lesson !== "object") return false;

  if (!lesson.title || lesson.title.length < 3) return false;

  if (!lesson.explanation || lesson.explanation.length < 20) return false;

  if (!Array.isArray(lesson.activities)) return false;

  return true;
}