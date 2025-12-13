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
  deleteSessionController,
  deleteAllSessionsController,
  deleteAccountController,
  updateAccountController,
} from "./user.controller.js";
import {
  deleteAllSessionsSchema,
  deleteSessionParamsSchema,
  updateAccountSchema,
  updateAvatarSchema,
  updateEmailSchema,
  updateNotificationsSchema,
  updatePasswordSchema,
  updatePrivacySettingsSchema,
  updateProfileSchema,
  validateBody,
  validateParams,
} from "@validation/user.schema.js";

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
router.patch(
  "/profile/avatar",
  validateBody(updateAvatarSchema),
  asyncHandler(updateAvatarController)
);
router.delete("/profile/avatar", asyncHandler(deleteAvatarController));
router.patch(
  "/settings/notifications",
  validateBody(updateNotificationsSchema),
  asyncHandler(updateNotificationsController)
);
router.patch(
  "/settings/privacy",
  validateBody(updatePrivacySettingsSchema),
  asyncHandler(updatePrivacySettingsController)
);
router.patch(
  "/security/password",
  validateBody(updatePasswordSchema),
  asyncHandler(updatePasswordController)
);
router.patch(
  "/security/email",
  validateBody(updateEmailSchema),
  asyncHandler(updateEmailController)
);

router.delete(
  "/sessions/:sessionId",
  validateBody(deleteAllSessionsSchema),
  asyncHandler(deleteSessionController)
);
router.delete(
  "/sessions",
  validateParams(deleteSessionParamsSchema),
  asyncHandler(deleteAllSessionsController)
);
// router.patch("/billing/plan", asyncHandler() ) to be done after payment integration

router.delete("/account", asyncHandler(deleteAccountController));
router.patch(
  "/account",
  validateBody(updateAccountSchema),
  asyncHandler(updateAccountController)
);

export default router;
