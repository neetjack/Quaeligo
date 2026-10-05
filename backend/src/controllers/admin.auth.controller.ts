import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET is missing!'); })();

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { username } });
  
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ adminId: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, username: admin.username });
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
  const { newUsername, newPassword } = req.body;
  const adminId = req.user?.adminId;

  if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

  const updateData: any = {};
  if (newUsername) updateData.username = newUsername;
  if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);
  
  await prisma.admin.update({
    where: { id: adminId },
    data: updateData
  });
  res.json({ success: true });
};
