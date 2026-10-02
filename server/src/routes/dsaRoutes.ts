import { Router } from "express";
import { preprocessDemo, trieDemo } from "../controllers/dsaController";
import { indexDemo } from "../controllers/indexController";
import { sortDemo } from "../controllers/sortController";

const router = Router();

router.get("/preprocess", preprocessDemo);
router.get("/trie", trieDemo);
router.get("/index", indexDemo);
router.get("/sort", sortDemo);

export default router;