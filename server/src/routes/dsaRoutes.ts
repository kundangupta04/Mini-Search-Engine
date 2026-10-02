import { Router } from "express";
import { preprocessDemo, trieDemo } from "../controllers/dsaController";
import { indexDemo } from "../controllers/indexController";
import { sortDemo } from "../controllers/sortController";
import { pipelineDemo } from "../controllers/pipelineController";

const router = Router();

router.get("/preprocess", preprocessDemo);
router.get("/trie", trieDemo);
router.get("/index", indexDemo);
router.get("/sort", sortDemo);
router.get("/pipeline", pipelineDemo);

export default router;