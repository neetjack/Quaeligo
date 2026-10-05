import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getSurveys = async (req: Request, res: Response) => {
  const surveys = await prisma.survey.findMany({
    where: { status: 'PUBLIC' },
    orderBy: { order: 'asc' },
    select: { id: true, slug: true, title: true, description: true }
  });
  res.json(surveys);
};

export const getSurveyDetails = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const survey = await prisma.survey.findUnique({
    where: { slug }
  });
  if (!survey) return res.status(404).json({ error: 'Survey not found' });
  if (survey.status !== 'PUBLIC') return res.status(403).json({ error: 'Survey is not public' });

  const questions = await prisma.question.findMany({
    where: { surveyId: survey.id },
    orderBy: { order: 'asc' }
  });

  const metrics = await prisma.scaleMetric.findMany({
    where: { surveyId: survey.id },
    orderBy: { order: 'asc' }
  });

    res.json({
    ...survey,
    questions: questions.map(q => ({
      id: q.id,
      type: q.type,
      title: q.title,
      content: q.content,
      options: q.options,
      order: q.order,
      audioUrlA: q.audioUrlA,
      audioUrlB: q.audioUrlB,
      audioUrlC: q.audioUrlC,
      audioUrlD: q.audioUrlD,
      audioUrlE: q.audioUrlE,
      metricGroup: q.metricGroup,
      isRandomized: q.isRandomized
    })),
    metrics
  });
};

export const submitBatchResponses = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { responses } = req.body;
  
  if (!Array.isArray(responses) || responses.length === 0 || responses.length > 500) {
    return res.status(400).json({ error: 'Invalid or excessively large payload' });
  }

  // 严格入参格式校验 (sessionId, choice 长度, questionId 正整数)
  const sessionIdRegex = /^[a-zA-Z0-9_-]{1,64}$/;
  for (const r of responses) {
    if (!r || typeof r !== 'object') {
      return res.status(400).json({ error: 'Invalid response entry' });
    }
    if (typeof r.sessionId !== 'string' || !sessionIdRegex.test(r.sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId format' });
    }
    if (!Number.isInteger(r.questionId) || r.questionId <= 0) {
      return res.status(400).json({ error: 'Invalid questionId' });
    }
    if (typeof r.choice !== 'string' || r.choice.length > 10000) {
      return res.status(400).json({ error: 'Invalid or excessively large choice data' });
    }
  }
  
  const survey = await prisma.survey.findUnique({ 
    where: { slug },
    include: { questions: { select: { id: true } } }
  });
  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  // 校验 questionId，防止越权提交 (IDOR)
  const validQuestionIds = new Set(survey.questions.map((q: any) => q.id));
  const invalidResponses = responses.filter((r: any) => !validQuestionIds.has(r.questionId));

  if (invalidResponses.length > 0) {
    return res.status(403).json({ error: 'Payload contains invalid question IDs' });
  }

  const created = await prisma.response.createMany({
    data: responses.map((r: any) => ({
      sessionId: r.sessionId,
      questionId: r.questionId,
      choice: r.choice,
      surveyId: survey.id
    }))
  });
  res.json({ success: true, count: created.count });
};

