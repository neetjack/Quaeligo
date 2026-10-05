import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { parseNumericId } from '../utils/validation';

export const getAdminSurveys = async (req: Request, res: Response) => {
  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(surveys);
};

export const createSurvey = async (req: Request, res: Response) => {
  const { title, slug, description, welcomeText, status } = req.body;
  
  if (!title || !slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  const existing = await prisma.survey.findUnique({ where: { slug } });
  if (existing) {
    return res.status(400).json({ error: 'Slug is already in use' });
  }

  const survey = await prisma.survey.create({
    data: {
      title,
      slug,
      description: description || '',
      welcomeText: welcomeText || '',
      status: status || 'DRAFT'
    }
  });

  res.json(survey);
};

export const updateSurvey = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid survey ID' });
  const { title, slug, description, welcomeText, status } = req.body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (slug !== undefined) data.slug = slug;
  if (description !== undefined) data.description = description;
  if (welcomeText !== undefined) data.welcomeText = welcomeText;
  if (status !== undefined) data.status = status;

  if (slug) {
    const existing = await prisma.survey.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: 'Slug is already in use' });
    }
  }

  try {
    const survey = await prisma.survey.update({
      where: { id },
      data
    });
    res.json(survey);
  } catch (error) {
    res.status(404).json({ error: 'Survey not found' });
  }
};


export const updateSurveysOrder = async (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Invalid payload' });

  const queries = orderedIds.map((id, index) => {
    return prisma.survey.update({
      where: { id },
      data: { order: index },
    });
  });
  await prisma.$transaction(queries);
  res.json({ success: true });
};

export const deleteSurvey = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid survey ID' });
  try {
    await prisma.survey.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Survey not found' });
  }
};


export const duplicateSurvey = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid survey ID' });
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: true,
      metrics: true
    }
  });

  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  // Generate unique slug
  let newSlug = survey.slug + '-copy';
  let counter = 1;
  while (await prisma.survey.findUnique({ where: { slug: newSlug } })) {
    newSlug = survey.slug + '-copy-' + counter;
    counter++;
  }

  const newSurvey = await prisma.survey.create({
    data: {
      title: survey.title + ' (Copy)',
      slug: newSlug,
      description: survey.description,
      status: 'DRAFT',
      questions: {
        create: survey.questions.map(q => {
          const { id, surveyId, createdAt, updatedAt, ...rest } = q as any;
          return rest;
        })
      },
      metrics: {
        create: survey.metrics.map(m => {
          const { id, surveyId, ...rest } = m as any;
          return rest;
        })
      }
    }
  });

  res.json(newSurvey);
};
