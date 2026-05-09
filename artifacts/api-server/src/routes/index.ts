import { Router } from "express";
import healthRouter from "./health.js";
import sessionsRouter from "./sessions.js";
import dashboardRouter from "./dashboard.js";

const router = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use(dashboardRouter);

export default router;
