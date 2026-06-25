import { getStudentHistory } from "../../../skills/studentHistory.js";
import { supabase } from "../../../services/dbService.js";

export default async function studentTimeline({ input, context }) {
  const studentId = context.studentId ?? input;
  if (!studentId) throw new Error("MISSING_CONTEXT: studentId é obrigatório");

  const history = await getStudentHistory(studentId, context.organizationId);

  const { data: peis } = await supabase
    .from("reports")
    .select("id, type, created_at, content")
    .eq("student_id", studentId)
    .eq("organization_id", context.organizationId)
    .eq("type", "PEI")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, topic, created_at")
    .eq("student_id", studentId)
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    studentId,
    semesters: history.map((h) => ({
      semester: h.semester,
      peis_generated: h.peis_generated,
      objectives: h.objectives,
      strategies: h.strategies,
      evolution_notes: h.evolution_notes,
      snapshot: h.snapshot,
      created_at: h.created_at,
    })),
    peis: (peis ?? []).map((p) => ({
      id: p.id,
      created_at: p.created_at,
      sections: p.content?.sections?.length ?? 0,
    })),
    lessons_count: lessons?.length ?? 0,
    recent_lessons: (lessons ?? []).slice(0, 5).map((l) => ({
      id: l.id,
      topic: l.topic,
      created_at: l.created_at,
    })),
  };
}
