import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const profitAnalysisRoutes = new Hono();

// 🔥 保存利润分析数据
profitAnalysisRoutes.post("/make-server-880fd43b/save-profit-analysis", async (c) => {
  try {
    const analysisData = await c.req.json();
    const { userId, id, timestamp } = analysisData;

    if (!userId || !id) {
      return c.json({ error: "Missing userId or id" }, 400);
    }

    // 保存到KV存储，key格式：profit_analysis_{userId}_{id}
    const key = `profit_analysis_${userId}_${id}`;
    await kv.set(key, analysisData);

    console.log(`✅ Profit analysis saved: ${key}`);
    return c.json({ 
      success: true, 
      message: "Analysis saved successfully",
      key 
    });
  } catch (error) {
    console.error("❌ Error saving profit analysis:", error);
    return c.json({ error: "Failed to save analysis: " + error }, 500);
  }
});

// 🔥 获取用户的所有利润分析记录
profitAnalysisRoutes.get("/make-server-880fd43b/get-profit-analyses", async (c) => {
  try {
    const userId = c.req.query("userId");

    if (!userId) {
      return c.json({ error: "Missing userId parameter" }, 400);
    }

    // 使用getByPrefix获取该用户的所有分析
    const prefix = `profit_analysis_${userId}_`;
    const analyses = await kv.getByPrefix(prefix);

    // 按时间倒序排序
    const sortedAnalyses = analyses.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    console.log(`✅ Found ${sortedAnalyses.length} analyses for user: ${userId}`);
    return c.json({ 
      success: true, 
      count: sortedAnalyses.length,
      analyses: sortedAnalyses 
    });
  } catch (error) {
    console.error("❌ Error loading profit analyses:", error);
    return c.json({ error: "Failed to load analyses: " + error }, 500);
  }
});

// 🔥 删除指定的利润分析记录
profitAnalysisRoutes.delete("/make-server-880fd43b/delete-profit-analysis", async (c) => {
  try {
    const { userId, id } = await c.req.json();

    if (!userId || !id) {
      return c.json({ error: "Missing userId or id" }, 400);
    }

    const key = `profit_analysis_${userId}_${id}`;
    await kv.del(key);

    console.log(`✅ Profit analysis deleted: ${key}`);
    return c.json({ 
      success: true, 
      message: "Analysis deleted successfully" 
    });
  } catch (error) {
    console.error("❌ Error deleting profit analysis:", error);
    return c.json({ error: "Failed to delete analysis: " + error }, 500);
  }
});

export default profitAnalysisRoutes;
