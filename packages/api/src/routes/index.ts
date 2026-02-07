import { Router } from "express";
import dashboardRouter from "./dashboard.js";
import revenueRouter from "./revenue.js";
import venturesRouter from "./ventures.js";
import holdersRouter from "./holders.js";
import rightsRouter from "./rights.js";
import methodologyRouter from "./methodology.js";
import screenerRouter from "./screener.js";

const router = Router();

router.use("/dashboard", dashboardRouter);
router.use("/revenue", revenueRouter);
router.use("/ventures", venturesRouter);
router.use("/tokens", holdersRouter);
router.use("/rights", rightsRouter);
router.use("/methodology", methodologyRouter);
router.use("/screener", screenerRouter);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
