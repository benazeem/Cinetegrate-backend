import { Router } from 'express';
import { default as authRouter } from '@modules/auth/auth.routes.js';
import { authMiddleware } from '@middleware/auth/requireAuth.js';
import { default as userRouter } from '@modules/user/user.routes.js';
import { default as projectRouter } from '@modules/project/project.routes.js';
import { default as storyRouter } from '@modules/story/story.private.routes.js';
import { default as contextProfileRouter } from '@modules/contextProfile/contextProfile.routes.js';
import { default as scenesRouter } from '@modules/scenes/scenes.private.routes.js';

import { csrfMiddleware } from '@middleware/security/requireCsrf.js';
import { requireActiveAccount } from '@middleware/security/requireActiveAccount.js';

const apiRouter = Router();

// private routes
apiRouter.use('/auth', authRouter);
apiRouter.use(authMiddleware, csrfMiddleware);
apiRouter.use('/user', userRouter);
apiRouter.use(requireActiveAccount);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/stories', storyRouter);
apiRouter.use('/context-profiles', contextProfileRouter);
apiRouter.use('/scenes', scenesRouter);

export default apiRouter;
