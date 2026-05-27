import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireMaster, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all users (Master only)
router.get('/', authenticate, requireMaster, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { email: 'asc' }
    });
    res.json(users);
  } catch (error) {
    logger.error('Failed to fetch users', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Master only)
router.post('/', authenticate, requireMaster, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, isActive } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'MASTER' ? 'MASTER' : 'STANDARD';
    const activeStatus = isActive !== undefined ? Boolean(isActive) : true;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
        isActive: activeStatus
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    logger.info('User created by administrator', { administratorId: req.user!.userId, newUserId: user.id });
    res.status(201).json(user);
  } catch (error) {
    logger.error('Failed to create user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit user (Master only)
router.patch('/:id', authenticate, requireMaster, async (req: AuthRequest, res: Response) => {
  try {
    const userIdToEdit = parseInt(req.params.id);
    const currentUserId = req.user!.userId;
    const { email, role, isActive, password } = req.body;

    const userToEdit = await prisma.user.findUnique({ where: { id: userIdToEdit } });
    if (!userToEdit) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Safety checks: Prevent self-deactivation or self-demotion
    if (userIdToEdit === currentUserId) {
      if (isActive === false) {
        return res.status(400).json({ error: 'You cannot deactivate your own account' });
      }
      if (role === 'STANDARD') {
        return res.status(400).json({ error: 'You cannot demote yourself to STANDARD role' });
      }
    }

    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role === 'MASTER' ? 'MASTER' : 'STANDARD';
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userIdToEdit },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info('User updated by administrator', { administratorId: currentUserId, targetUserId: userIdToEdit });
    res.json(updated);
  } catch (error) {
    logger.error('Failed to update user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Master only)
router.delete('/:id', authenticate, requireMaster, async (req: AuthRequest, res: Response) => {
  try {
    const userIdToDelete = parseInt(req.params.id);
    const currentUserId = req.user!.userId;

    const userToDelete = await prisma.user.findUnique({ where: { id: userIdToDelete } });
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Safety check: Prevent self-deletion
    if (userIdToDelete === currentUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: userIdToDelete } });

    logger.info('User deleted by administrator', { administratorId: currentUserId, deletedUserId: userIdToDelete });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
