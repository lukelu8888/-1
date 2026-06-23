import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

const profitAnalysisRoutes = new Hono();

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdminDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
});

function normalizeUserId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

// 保存利润分析数据
profitAnalysisRoutes.post("/make-server-880fd43b/save-profit-analysis", async (c) => {
  try {
    const analysisData = await c.req.json();
    const userId = normalizeUserId(analysisData?.userId);
    const analysisId = String(analysisData?.id || "").trim();

    if (!userId || !analysisId) {
      return c.json({ error: "Missing userId or id" }, 400);
    }

    const row = {
      user_id: userId,
      analysis_id: analysisId,
      quotation_id: String(analysisData?.quotationId || "").trim() || null,
      quotation_number: String(analysisData?.quotationNumber || "").trim() || null,
      analysis_payload: analysisData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdminDb
      .from("saved_profit_analyses")
      .upsert(row, { onConflict: "user_id,analysis_id" });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Profit analysis saved: ${userId}/${analysisId}`);
    return c.json({
      success: true,
      message: "Analysis saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving profit analysis:", error);
    return c.json({ error: "Failed to save analysis: " + error }, 500);
  }
});

// 获取用户的所有利润分析记录
profitAnalysisRoutes.get("/make-server-880fd43b/get-profit-analyses", async (c) => {
  try {
    const userId = normalizeUserId(c.req.query("userId"));

    if (!userId) {
      return c.json({ error: "Missing userId parameter" }, 400);
    }

    const { data, error } = await supabaseAdminDb
      .from("saved_profit_analyses")
      .select("analysis_payload")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const analyses = (data || []).map((row: any) => row.analysis_payload).filter(Boolean);

    console.log(`✅ Found ${analyses.length} analyses for user: ${userId}`);
    return c.json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error("❌ Error loading profit analyses:", error);
    return c.json({ error: "Failed to load analyses: " + error }, 500);
  }
});

// 删除指定的利润分析记录
profitAnalysisRoutes.delete("/make-server-880fd43b/delete-profit-analysis", async (c) => {
  try {
    const body = await c.req.json();
    const userId = normalizeUserId(body?.userId);
    const analysisId = String(body?.id || "").trim();

    if (!userId || !analysisId) {
      return c.json({ error: "Missing userId or id" }, 400);
    }

    const { error } = await supabaseAdminDb
      .from("saved_profit_analyses")
      .delete()
      .eq("user_id", userId)
      .eq("analysis_id", analysisId);

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Profit analysis deleted: ${userId}/${analysisId}`);
    return c.json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting profit analysis:", error);
    return c.json({ error: "Failed to delete analysis: " + error }, 500);
  }
});

export default profitAnalysisRoutes;
