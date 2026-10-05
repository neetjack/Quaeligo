import { Request, Response } from 'express';
import { prisma } from '../config/db';
import fs from 'fs';
import path from 'path';

const fsPromises = fs.promises;
const IMPORT_DIR = path.join(__dirname, '../../surveys_to_import');
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

// Utility to check if a directory exists using async API
async function exists(fpath: string): Promise<boolean> {
  try {
    await fsPromises.access(fpath);
    return true;
  } catch {
    return false;
  }
}

export const scanLocalSurveys = async (req: Request, res: Response) => {
  try {
    if (!(await exists(IMPORT_DIR))) {
      await fsPromises.mkdir(IMPORT_DIR, { recursive: true });
    }

    const dirents = await fsPromises.readdir(IMPORT_DIR, { withFileTypes: true });
    const folders = dirents
      .filter(dirent => dirent.isDirectory() && !dirent.name.includes('_imported_'))
      .map(dirent => dirent.name);

    const validSurveys = [];

    for (const folder of folders) {
      const configPath = path.join(IMPORT_DIR, folder, 'config.json');
      if (await exists(configPath)) {
        try {
          const configContent = await fsPromises.readFile(configPath, 'utf8');
          const config = JSON.parse(configContent);
          validSurveys.push({
            folderName: folder,
            title: config.title || folder,
            slug: config.slug || '',
            questionsCount: config.questions ? config.questions.length : 0,
            metricsCount: config.metrics ? config.metrics.length : 0
          });
        } catch (e) {
          console.error(`Error parsing config.json in folder ${folder}`, e);
        }
      }
    }

    res.json({ surveys: validSurveys });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan directory' });
  }
};

export const importLocalSurvey = async (req: Request, res: Response) => {
  const { folderName, deleteAfterImport } = req.body;

  if (!folderName) {
    return res.status(400).json({ error: 'folderName is required' });
  }

  // Security: Prevent Path Traversal
  if (folderName.includes('/') || folderName.includes('\\') || folderName.includes('..')) {
    return res.status(400).json({ error: 'Invalid folder name' });
  }

  const folderPath = path.join(IMPORT_DIR, folderName);
  if (!(await exists(folderPath))) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const configPath = path.join(folderPath, 'config.json');
  if (!(await exists(configPath))) {
    return res.status(400).json({ error: 'config.json not found in folder' });
  }

  let config;
  try {
    const configContent = await fsPromises.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid config.json format' });
  }

  if (!config.title || !config.slug) {
    return res.status(400).json({ error: 'config.json must contain title and slug' });
  }

  const existing = await prisma.survey.findUnique({ where: { slug: config.slug } });
  if (existing) {
    return res.status(400).json({ error: 'Slug is already in use' });
  }

  try {
    if (!(await exists(UPLOADS_DIR))) {
      await fsPromises.mkdir(UPLOADS_DIR, { recursive: true });
    }

    const processAudioFile = async (fileName: string) => {
      if (!fileName) return "";
      const sourceFile = path.join(folderPath, fileName);
      if (await exists(sourceFile)) {
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);
        const newFileName = `${baseName}_${Date.now()}${ext}`;
        const destFile = path.join(UPLOADS_DIR, newFileName);
        await fsPromises.copyFile(sourceFile, destFile);
        return newFileName;
      }
      return fileName; // fallback
    };

    // Prepare questions with copied audio files concurrently
    const processedQuestions = [];
    if (config.questions && Array.isArray(config.questions)) {
      for (const q of config.questions) {
        const [audioUrlA, audioUrlB, audioUrlC, audioUrlD, audioUrlE] = await Promise.all([
          processAudioFile(q.audioA),
          processAudioFile(q.audioB),
          processAudioFile(q.audioC),
          processAudioFile(q.audioD),
          processAudioFile(q.audioE)
        ]);

        processedQuestions.push({
          type: q.type || "AUDIO_AB",
          metricGroup: q.metricGroup || "A",
          title: q.title || "",
          audioUrlA: audioUrlA,
          audioUrlB: audioUrlB,
          audioUrlC: audioUrlC,
          audioUrlD: audioUrlD,
          audioUrlE: audioUrlE,
          content: q.content || "",
          options: q.options || "",
          order: q.order || 0,
          isRandomized: q.isRandomized !== undefined ? q.isRandomized : true,
          exportName: q.exportName || ""
        });
      }
    }

    const processedMetrics = (config.metrics || []).map((m: any) => ({
      group: m.group || "A",
      order: m.order || 0,
      type: m.type || "basic",
      title: m.title || "",
      leftLabel: m.leftLabel || "",
      centerLabel: m.centerLabel || "",
      rightLabel: m.rightLabel || "",
      payload: typeof m.payload === 'object' ? JSON.stringify(m.payload) : (m.payload || null),
      points: m.points || 7
    }));

    // Create Survey using Prisma Nested Writes
    const result = await prisma.survey.create({
      data: {
        title: config.title,
        slug: config.slug,
        description: config.description || '',
        status: config.status || 'DRAFT',
        metrics: {
          create: processedMetrics
        },
        questions: {
          create: processedQuestions
        }
      }
    });

    if (deleteAfterImport) {
      await fsPromises.rm(folderPath, { recursive: true, force: true });
    } else {
      await fsPromises.rename(folderPath, folderPath + '_imported_' + Date.now());
    }

    res.json({ success: true, survey: result });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import survey' });
  }
};
