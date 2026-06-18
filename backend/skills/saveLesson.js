import { logger } from "../observability/logger.js";
import { supabase } from "../services/dbService.js";
import { logUsage } from "../billing/ledger.engine.js";

export async function saveLesson(lesson, context, tokensUsed = 0) {
  const { userId, organizationId, topic, student } = context;

  const [lessonResult, usageResult] = await Promise.allSettled([
    supabase.from("lessons").insert({
      organization_id: organizationId,
      user_id:         userId,
      topic,
      bncc_code:       lesson.bncc,
      student_name:    student?.name,
      content:         lesson,
      created_at:      new Date().toISOString(),
    }),
    logUsage({ organizationId, userId, tokensUsed, model: "gpt-4o-mini", endpoint: "/ai/lesson" }),
  ]);

  if (lessonResult.status === "rejected") logger.error("saveLesson error:", lessonResult.reason?.message);
  if (usageResult.status  === "rejected") logger.error("logUsage error:",   usageResult.reason?.message);
}
