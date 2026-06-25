import { supabase } from "../services/dbService.js";
import { logger } from "../observability/logger.js";

function currentSemester() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() < 6 ? 1 : 2}`;
}

export async function getStudentHistory(studentId, orgId) {
  try {
    const { data } = await supabase
      .from("student_history")
      .select("*")
      .eq("student_id", studentId)
      .eq("organization_id", orgId)
      .order("semester", { ascending: false })
      .limit(10);
    return data ?? [];
  } catch (err) {
    logger.error("studentHistory.get.error", { error: err.message });
    return [];
  }
}

export async function saveStudentSnapshot({ studentId, orgId, userId, student, objectives, strategies, evolutionNotes }) {
  const semester = currentSemester();
  try {
    const { data: existing } = await supabase
      .from("student_history")
      .select("id, peis_generated")
      .eq("student_id", studentId)
      .eq("semester", semester)
      .single();

    if (existing) {
      const { data } = await supabase
        .from("student_history")
        .update({
          snapshot: student,
          peis_generated: (existing.peis_generated ?? 0) + 1,
          objectives: objectives ?? [],
          strategies: strategies ?? [],
          evolution_notes: evolutionNotes,
        })
        .eq("id", existing.id)
        .select()
        .single();
      return data;
    }

    const { data } = await supabase
      .from("student_history")
      .insert({
        organization_id: orgId,
        student_id: studentId,
        semester,
        snapshot: student,
        peis_generated: 1,
        objectives: objectives ?? [],
        strategies: strategies ?? [],
        evolution_notes: evolutionNotes,
        created_by: userId,
      })
      .select()
      .single();
    return data;
  } catch (err) {
    logger.error("studentHistory.save.error", { error: err.message });
    return null;
  }
}

export { currentSemester };
