import { Router } from "express";
import { stats, reset } from "../controllers/statsController";

const router = Router();

router.get("/", stats);
router.post("/reset", reset);

export default router;