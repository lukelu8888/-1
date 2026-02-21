import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import authRoutes from "./auth-routes.tsx";
import backupRoutes from "./backup-routes.tsx";
import emailRoutes from "./email-routes.tsx";
import profitAnalysisRoutes from "./profit-analysis-routes.tsx";
import { initializeDatabase } from "./init-database.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-880fd43b/health", (c) => {
  return c.json({ status: "ok" });
});

// 🔥 数据库初始化接口
app.post("/make-server-880fd43b/init-database", async (c) => {
  console.log('📋 收到数据库初始化请求...');
  const result = await initializeDatabase();
  return c.json(result);
});

// 🔥 认证路由
app.route('/', authRoutes);

// 🔥 备份路由
app.route('/', backupRoutes);

// 🔥 邮件路由
app.route('/', emailRoutes);

// 🔥 利润分析路由
app.route('/', profitAnalysisRoutes);

Deno.serve(app.fetch);