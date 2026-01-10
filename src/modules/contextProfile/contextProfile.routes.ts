import { Router } from "express";
import { 
  getContextProfileController,
  listContextProfilesController,
} from "./contextProfile.controller.js";

const router = Router();
 
// Future question: Do we want users to create context profiles directly?
// router.post("/", createContextProfileController);
// router.post("/:contextId/clone", cloneContextProfileController);
 
router.get("/:contextId", getContextProfileController);
 
router.get("/", listContextProfilesController);

export default router;