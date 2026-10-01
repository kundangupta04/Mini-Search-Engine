import { Router } from "express";
import { suggest } from "../controllers/suggestionController";

const router = Router();

router.get("/", suggest);

export default router;