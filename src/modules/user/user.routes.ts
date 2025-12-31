import { Router } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { csrfMiddleware } from "@middleware/security/requireCsrf.js";
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
  deactivateAccountController,
} from "./user.controller.js";
import {
  deleteAllSessionsSchema,
  deleteSessionParamsSchema,
  updateEmailSchema,
  updateNotificationsSchema,
  updatePasswordSchema,
  updatePrivacySettingsSchema,
  updateProfileSchema,
} from "@validation/user.schema.js";
import { validateBody } from "@validation/validateBody.js";
import { validateParams } from "@validation/validateParams.js";
import { avatarUpload } from "@middleware/avatarUpload.js";
import { requireActiveAccount } from "@middleware/security/accountStatusMiddleware.js";

const router = Router();

router.patch("/account/reactivate", asyncHandler(deleteAccountController));

router.use(requireActiveAccount);
router.get("/profile", asyncHandler(getProfileController));
router.get("/settings", asyncHandler(getSettingsController));
router.get("/security", asyncHandler(getSecurityController));
router.get("/sessions", asyncHandler(getSessionsController));
router.get("/billing", asyncHandler(getBillingController));

router.use(csrfMiddleware);
router.patch(
  "/profile",
  validateBody(updateProfileSchema),
  asyncHandler(updateProfileController)
);
router.patch(
  "/profile/avatar",
  avatarUpload,
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
  validateParams(deleteSessionParamsSchema),
  asyncHandler(deleteSessionController)
);
router.delete(
  "/sessions",
  validateBody(deleteAllSessionsSchema),
  asyncHandler(deleteAllSessionsController)
);
// router.patch("/billing/plan", asyncHandler() ) to be done after payment integration

router.patch("/account/deactivate", asyncHandler(deactivateAccountController));
router.delete("/account/delete", asyncHandler(deleteAccountController));

export default router;
