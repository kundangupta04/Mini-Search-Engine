import { Router } from "express";
import { preprocessDemo, trieDemo } from "../controllers/dsaController";

const router = Router();

router.get("/preprocess", preprocessDemo);
router.get("/trie", trieDemo);
// Step 6 will add the Inverted Index route here.

export default router;