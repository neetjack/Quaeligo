import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { parseNumericId } from '../utils/validation';

export const getResponses = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const responses = await prisma.response.findMany({
    where: { surveyId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(responses);
};

export const clearResponses = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  await prisma.response.deleteMany({
    where: { surveyId }
  });
  // Note: we can't reset sqlite_sequence globally if we only delete for one survey
  res.json({ success: true });
};

export const resetSystem = async (req: Request, res: Response) => {
  // Delete all responses, questions, and metrics, and surveys
  await prisma.response.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.scaleMetric.deleteMany({});
  await prisma.survey.deleteMany({});
  
  // Reset SQLite autoincrement counter for tables
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='Response';`);
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='Question';`);
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='ScaleMetric';`);
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='Survey';`);
  
  // Re-insert default survey
  await prisma.survey.create({
    data: {
      id: 1,
      slug: 'default-survey',
      title: 'Default Survey',
      description: 'Auto-migrated survey from previous single-survey system',
      status: 'PUBLIC'
    }
  });
  
  // Clear uploads folder
  const uploadsDir = path.join(__dirname, '../../../uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = await fs.promises.readdir(uploadsDir);
    await Promise.all(files.map(async (file) => {
      if (file !== '.gitkeep') {
        try {
          await fs.promises.unlink(path.join(uploadsDir, file));
        } catch (e) {
          console.error(`Failed to delete file ${file}`, e);
        }
      }
    }));
  }
  
  // Reset admin credentials
  const defaultPassword = await bcrypt.hash('admin123', 10);
  const existingAdmin = await prisma.admin.findFirst();
  if (existingAdmin) {
    await prisma.admin.update({
      where: { id: existingAdmin.id },
      data: { username: 'admin', password: defaultPassword }
    });
  }
  
  res.json({ success: true });
};
