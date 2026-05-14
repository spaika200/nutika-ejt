import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'MASTER' ? 'MASTER' : 'STANDARD';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    logger.error('Registration error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, role: user.role, email: user.email });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
