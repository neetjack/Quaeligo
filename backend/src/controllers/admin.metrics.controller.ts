import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { parseNumericId } from '../utils/validation';

export const getMetrics = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const metrics = await prisma.scaleMetric.findMany({
    where: { surveyId },
    orderBy: { order: 'asc' }
  });
  res.json(metrics);
};

export const batchImportMetrics = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const { metrics } = req.body;
  if (!Array.isArray(metrics)) return res.status(400).json({ error: 'Invalid payload' });
  
  const maxOrder = await prisma.scaleMetric.findFirst({ orderBy: { order: 'desc' } });
  let currentOrder = maxOrder ? maxOrder.order + 1 : 0;
  
  const queries = metrics.map((m: any) => {
    return prisma.scaleMetric.create({
      data: {
        type: m.type,
        group: m.group || 'A',
        title: m.title || null,
        leftLabel: m.leftLabel || null,
        centerLabel: m.centerLabel || null,
        rightLabel: m.rightLabel || null,
        points: m.points || 7,
        order: currentOrder++,
        surveyId
      }
    });
  });
  
  await prisma.$transaction(queries);
  res.json({ success: true });
};

export const batchUpdateMetrics = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const { metrics } = req.body;
  if (!Array.isArray(metrics)) return res.status(400).json({ error: 'Invalid payload' });

  const queries = metrics.map((m: any) => {
    const updateData: any = {};
    if (m.title !== undefined) updateData.title = m.title;
    if (m.group !== undefined) updateData.group = m.group;
    if (m.leftLabel !== undefined) updateData.leftLabel = m.leftLabel;
    if (m.centerLabel !== undefined) updateData.centerLabel = m.centerLabel;
    if (m.rightLabel !== undefined) updateData.rightLabel = m.rightLabel;
    if (m.points !== undefined) updateData.points = parseInt(m.points);
    if (m.order !== undefined) updateData.order = parseInt(m.order);

    return prisma.scaleMetric.update({
      where: { id: m.id },
      data: updateData
    });
  });

  await prisma.$transaction(queries);
  res.json({ success: true });
};

export const createMetric = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const { type, group, title, leftLabel, centerLabel, rightLabel, points, order } = req.body;
  let finalOrder = order;
  if (finalOrder === undefined) {
    const maxOrder = await prisma.scaleMetric.findFirst({ orderBy: { order: 'desc' } });
    finalOrder = maxOrder ? maxOrder.order + 1 : 0;
  }
  const metric = await prisma.scaleMetric.create({
    data: { type, group: group || 'A', title, leftLabel, centerLabel, rightLabel, points: points || 7, order: finalOrder, surveyId }
  });
  res.json(metric);
};

export const updateMetric = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid metric ID' });
  const { title, group, leftLabel, centerLabel, rightLabel, points, order } = req.body;
  
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (group !== undefined) updateData.group = group;
  if (leftLabel !== undefined) updateData.leftLabel = leftLabel;
  if (centerLabel !== undefined) updateData.centerLabel = centerLabel;
  if (rightLabel !== undefined) updateData.rightLabel = rightLabel;
  if (points !== undefined) updateData.points = parseInt(points);
  if (order !== undefined) updateData.order = parseInt(order);

  const metric = await prisma.scaleMetric.update({
    where: { id },
    data: updateData
  });
  res.json(metric);
};

export const deleteMetric = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid metric ID' });
  await prisma.scaleMetric.delete({ where: { id } });
  res.json({ success: true });
};

export const updateMetricsOrder = async (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Invalid payload' });
  
  const queries = orderedIds.map((id: number, index: number) => {
    return prisma.scaleMetric.update({
      where: { id },
      data: { order: index },
    });
  });
  await prisma.$transaction(queries);
  res.json({ success: true });
};
