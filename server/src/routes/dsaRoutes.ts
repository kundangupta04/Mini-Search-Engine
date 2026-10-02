import { Router } from "express";
import { preprocessDemo, trieDemo } from "../controllers/dsaController";
import { indexDemo } from "../controllers/indexController";

const router = Router();

router.get("/preprocess", preprocessDemo);
router.get("/trie", trieDemo);
router.get("/index", indexDemo);

export default router;