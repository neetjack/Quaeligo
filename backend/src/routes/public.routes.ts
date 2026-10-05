import { Router } from 'express';
import { getSurveys, getSurveyDetails, submitBatchResponses } from '../controllers/public.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { submitLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.get('/surveys', asyncHandler(getSurveys));
router.get('/surveys/:slug', asyncHandler(getSurveyDetails));
router.post('/surveys/:slug/responses/batch', submitLimiter, asyncHandler(submitBatchResponses));

export default router;
