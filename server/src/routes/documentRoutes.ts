import { Router } from "express";
import {
  listDocuments,
  listCategories,
  getDocument,
} from "../controllers/documentController";

const router = Router();

router.get("/", listDocuments);
// "categories" must be declared BEFORE "/:id", otherwise Express
// would treat the word "categories" as an id.
router.get("/categories", listCategories);
router.get("/:id", getDocument);

export default router;