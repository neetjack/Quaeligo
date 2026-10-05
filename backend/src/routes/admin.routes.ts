import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { upload, uploadFixed } from '../config/multer';

import { 
  getQuestions, 
  createQuestion, 
  checkFile, 
  updateQuestion, 
  uploadFixedFile, 
  updateQuestionsOrder, 
  deleteQuestion, 
  batchImportQuestions 
} from '../controllers/admin.questions.controller';

import { 
  getMetrics,
  batchImportMetrics, 
  batchUpdateMetrics,
  createMetric, 
  updateMetric, 
  deleteMetric, 
  updateMetricsOrder 
} from '../controllers/admin.metrics.controller';

import { 
  getResponses, 
  clearResponses, 
  resetSystem 
} from '../controllers/admin.system.controller';

const router = Router();

// Surveys
import {
  getAdminSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  duplicateSurvey,
  updateSurveysOrder
} from '../controllers/admin.surveys.controller';

import {
  scanLocalSurveys,
  importLocalSurvey
} from '../controllers/admin.import.controller';

router.get('/surveys/scan-local', asyncHandler(scanLocalSurveys));
router.post('/surveys/import-local', asyncHandler(importLocalSurvey));

router.put('/surveys/order', asyncHandler(updateSurveysOrder));
router.get('/surveys', asyncHandler(getAdminSurveys));
router.post('/surveys', asyncHandler(createSurvey));
router.put('/surveys/:id', asyncHandler(updateSurvey));
router.delete('/surveys/:id', asyncHandler(deleteSurvey));
router.post('/surveys/:id/duplicate', asyncHandler(duplicateSurvey));

// Questions
router.get('/surveys/:surveyId/questions', asyncHandler(getQuestions));
router.post('/surveys/:surveyId/questions', asyncHandler(createQuestion));
router.put('/surveys/:surveyId/questions/order', asyncHandler(updateQuestionsOrder));
router.put('/surveys/:surveyId/questions/:id', upload.fields([{ name: 'audioA', maxCount: 1 }, { name: 'audioB', maxCount: 1 }, { name: 'audioC', maxCount: 1 }, { name: 'audioD', maxCount: 1 }, { name: 'audioE', maxCount: 1 }]), asyncHandler(updateQuestion));
router.delete('/surveys/:surveyId/questions/:id', asyncHandler(deleteQuestion));
router.post('/surveys/:surveyId/questions/batch', asyncHandler(batchImportQuestions));

// Metrics
router.get('/surveys/:surveyId/metrics', asyncHandler(getMetrics));
router.post('/surveys/:surveyId/metrics/batch', asyncHandler(batchImportMetrics));
router.put('/surveys/:surveyId/metrics/batch', asyncHandler(batchUpdateMetrics));
router.post('/surveys/:surveyId/metrics', asyncHandler(createMetric));
router.put('/surveys/:surveyId/metrics/order', asyncHandler(updateMetricsOrder));
router.put('/surveys/:surveyId/metrics/:id', asyncHandler(updateMetric));
router.delete('/surveys/:surveyId/metrics/:id', asyncHandler(deleteMetric));

// System / Responses
router.get('/surveys/:surveyId/responses', asyncHandler(getResponses));
router.delete('/surveys/:surveyId/responses', asyncHandler(clearResponses));

// Keep these global endpoints for compatibility / utilities
router.get('/check-file/:filename', asyncHandler(checkFile));
router.post('/upload-file/:filename', uploadFixed.single('file'), asyncHandler(uploadFixedFile));
router.delete('/reset', asyncHandler(resetSystem));

export default router;
