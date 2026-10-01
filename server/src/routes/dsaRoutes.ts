import { Router } from "express";
import { preprocessDemo } from "../controllers/dsaController";

const router = Router();

router.get("/preprocess", preprocessDemo);
// Step 5 will add the Trie route here, and Step 6 the Inverted Index route.

export default router;