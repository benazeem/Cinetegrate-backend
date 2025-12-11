import { Router } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { requireAuth as auth } from "@middleware/auth/requireAuth.js";
import { requireCsrf as csrf } from "@middleware/auth/requireCsrf.js";
import {
  deleteAvatarController,
  getBillingController,
  getProfileController,
  getSecurityController,
  getSessionsController,
  getSettingsController,
  updateAvatarController,
  updateProfileController,
  updateNotificationsController,
  updatePrivacySettingsController,
  updatePasswordController,
  updateEmailController,
  verifyEmailController,
  deleteSessionController,
  deleteAllSessionsController,
  deleteAccountController,
  updateAccountController
} from "./user.controller.js";
import { updateProfileSchema, validateBody } from "@validation/user.schema.js";

const router = Router();

router.use(auth);
router.get("/profile", asyncHandler(getProfileController));
router.get("/settings", asyncHandler(getSettingsController));
router.get("/security", asyncHandler(getSecurityController));
router.get("/sessions", asyncHandler(getSessionsController));
router.get("/billing", asyncHandler(getBillingController));

router.use(csrf);
router.patch(
  "/profile",
  validateBody(updateProfileSchema),
  asyncHandler(updateProfileController)
);
router.patch("/profile/avatar", asyncHandler(updateAvatarController));
router.delete("/profile/avatar", asyncHandler(deleteAvatarController));
router.patch(
  "/settings/notifications",
  asyncHandler(updateNotificationsController)
);
router.patch(
  "/settings/privacy",
  asyncHandler(updatePrivacySettingsController)
);
router.patch("/security/password", asyncHandler(updatePasswordController));
router.patch("/security/email", asyncHandler(updateEmailController));
router.post("/security/email/verify", asyncHandler(verifyEmailController));

router.delete("/sessions/:sessionId", asyncHandler(deleteSessionController));
router.delete("/sessions", asyncHandler(deleteAllSessionsController));
// router.patch("/billing/plan", asyncHandler() ) to be done after payment integration

router.delete("/account", asyncHandler(deleteAccountController) )
router.patch("/account", asyncHandler(updateAccountController) )

export default router;
