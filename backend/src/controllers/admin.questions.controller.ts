import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { parseNumericId } from '../utils/validation';

export const getQuestions = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const questions = await prisma.question.findMany({ 
    where: { surveyId },
    orderBy: { order: 'asc' } 
  });
  
  const questionsWithStatus = await Promise.all(questions.map(async (q) => {
    let missingFiles: string[] = [];
    let uploadedFiles: string[] = [];

    if (q.type === 'AUDIO_AB' || q.type === 'AUDIO_AB(Fixed)' || q.type === 'AUDIO_SD') {
      if (!q.audioUrlA) missingFiles.push('Audio A');
      else uploadedFiles.push(`Audio A (${q.audioUrlA.split('/').pop()})`);
      
      if (!q.audioUrlB) missingFiles.push('Audio B');
      else uploadedFiles.push(`Audio B (${q.audioUrlB.split('/').pop()})`);
    } else if (q.type === 'AUDIO_MUSHRA') {
      if (!q.audioUrlA) missingFiles.push('Audio A (Original)');
      else uploadedFiles.push(`Audio A (${q.audioUrlA.split('/').pop()})`);
      
      if (!q.audioUrlB) missingFiles.push('Audio B');
      else uploadedFiles.push(`Audio B (${q.audioUrlB.split('/').pop()})`);

      if (!q.audioUrlC) missingFiles.push('Audio C');
      else uploadedFiles.push(`Audio C (${q.audioUrlC.split('/').pop()})`);

      if (q.audioUrlD) uploadedFiles.push(`Audio D (${q.audioUrlD.split('/').pop()})`);
      if (q.audioUrlE) uploadedFiles.push(`Audio E (${q.audioUrlE.split('/').pop()})`);
    } else if (q.type === 'AGREEMENT') {
      const mdFiles = q.content.split('|').map(s => s.trim()).filter(s => s);
      for (const md of mdFiles) {
        const filePath = path.join(__dirname, '../../../uploads', md);
        try {
          await fs.promises.access(filePath);
          uploadedFiles.push(md);
        } catch {
          missingFiles.push(md);
        }
      }
    }

    return { ...q, missingFiles, uploadedFiles };
  }));

  res.json(questionsWithStatus);
};

export const createQuestion = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const { title, type, content, options, metricGroup, exportName } = req.body;
  const maxOrderQ = await prisma.question.findFirst({ orderBy: { order: 'desc' } });
  const order = maxOrderQ ? maxOrderQ.order + 1 : 0;
  
  const question = await prisma.question.create({
    data: { 
      title: title || 'New Question', 
      type: type || 'AUDIO_AB', 
      content: content || '',
      options: options || '',
      metricGroup: metricGroup || 'A',
      exportName: exportName || '',
      audioUrlA: '', 
      audioUrlB: '', 
      order,
      surveyId
    },
  });
  res.json(question);
};

export const checkFile = async (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../../../uploads', path.basename(req.params.filename as string));
  try {
    await fs.promises.access(filePath);
    res.json({ exists: true });
  } catch {
    res.json({ exists: false });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid question ID' });
  const { title, type, metricGroup, exportName, content, options, order } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (type !== undefined) updateData.type = type;
  if (metricGroup !== undefined) updateData.metricGroup = metricGroup;
  if (exportName !== undefined) updateData.exportName = exportName;
  if (content !== undefined) updateData.content = content;
  if (options !== undefined) updateData.options = options;
  if (order !== undefined) updateData.order = order;
  
  if (files) {
    if (files['audioA'] && files['audioA'][0]) {
      updateData.audioUrlA = '/uploads/' + files['audioA'][0].filename;
    }
    if (files['audioB'] && files['audioB'][0]) {
      updateData.audioUrlB = '/uploads/' + files['audioB'][0].filename;
    }
    if (files['audioC'] && files['audioC'][0]) {
      updateData.audioUrlC = '/uploads/' + files['audioC'][0].filename;
    }
    if (files['audioD'] && files['audioD'][0]) {
      updateData.audioUrlD = '/uploads/' + files['audioD'][0].filename;
    }
    if (files['audioE'] && files['audioE'][0]) {
      updateData.audioUrlE = '/uploads/' + files['audioE'][0].filename;
    }
  }
  
  if (req.body.linkAudioA) {
    updateData.audioUrlA = '/uploads/' + req.body.linkAudioA;
  }
  if (req.body.linkAudioB) {
    updateData.audioUrlB = '/uploads/' + req.body.linkAudioB;
  }
  if (req.body.linkAudioC) {
    updateData.audioUrlC = '/uploads/' + req.body.linkAudioC;
  }
  if (req.body.linkAudioD) {
    updateData.audioUrlD = '/uploads/' + req.body.linkAudioD;
  }
  if (req.body.linkAudioE) {
    updateData.audioUrlE = '/uploads/' + req.body.linkAudioE;
  }
  
  const question = await prisma.question.update({
    where: { id },
    data: updateData,
  });
  res.json(question);
};

export const uploadFixedFile = async (req: Request, res: Response) => {
  res.json({ success: true, filename: path.basename(req.params.filename as string) });
};

export const updateQuestionsOrder = async (req: Request, res: Response) => {
  const { orderedIds } = req.body; // array of IDs in new order
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Invalid payload' });

  const queries = orderedIds.map((id, index) => {
    return prisma.question.update({
      where: { id },
      data: { order: index },
    });
  });
  await prisma.$transaction(queries);
  res.json({ success: true });
};

export const deleteQuestion = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid question ID' });
  await prisma.question.delete({ where: { id } });
  res.json({ success: true });
};

export const batchImportQuestions = async (req: Request, res: Response) => {
  const surveyId = parseNumericId(req.params.surveyId);
  if (!surveyId) return res.status(400).json({ error: 'Invalid survey ID' });
  const { questions, replace } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: 'Invalid payload' });
  
  if (replace) {
    await prisma.question.deleteMany({ where: { surveyId } });
  }

  const data = questions.map((q) => {
    return {
      type: q.type || 'AUDIO_AB',
      metricGroup: q.metricGroup || 'A',
      title: q.title || '',
      audioUrlA: q.audioUrlA || '',
      audioUrlB: q.audioUrlB || '',
      audioUrlC: q.audioUrlC || '',
      audioUrlD: q.audioUrlD || '',
      audioUrlE: q.audioUrlE || '',
      content: q.content || '',
      options: q.options || '',
      order: parseInt(q.order) || 0,
      isRandomized: q.isRandomized === undefined ? true : Boolean(q.isRandomized),
      exportName: q.exportName || '',
      surveyId
    };
  });
  
  await prisma.question.createMany({ data });
  res.json({ success: true });
};
