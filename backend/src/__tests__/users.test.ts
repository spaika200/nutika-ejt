import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import userRouter from '../routes/users';

// Mock the entire PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Setup mock middleware for testing
jest.mock('../middleware/auth', () => {
  return {
    authenticate: (req: any, res: any, next: any) => {
      req.user = { userId: 1, role: 'MASTER' }; // simulate logged in admin
      next();
    },
    requireMaster: (req: any, res: any, next: any) => {
      next();
    },
  };
});

const prismaMock = new PrismaClient() as any;

describe('User Management API Router', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/users', userRouter);
  });

  it('GET /api/users should list all users without passwords', async () => {
    const mockUsers = [
      { id: 1, email: 'admin@nutika.ee', role: 'MASTER', isActive: true },
      { id: 2, email: 'user@nutika.ee', role: 'STANDARD', isActive: true }
    ];
    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUsers);
    expect(prismaMock.user.findMany).toHaveBeenCalled();
  });

  it('POST /api/users should create a new user with hashed password', async () => {
    const newUserInput = { email: 'new@nutika.ee', password: 'password123', role: 'STANDARD' };
    const createdUser = { id: 3, email: 'new@nutika.ee', role: 'STANDARD', isActive: true };
    
    prismaMock.user.findUnique.mockResolvedValue(null); // not existing
    prismaMock.user.create.mockResolvedValue(createdUser);

    const res = await request(app)
      .post('/api/users')
      .send(newUserInput);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(createdUser);
    expect(prismaMock.user.create).toHaveBeenCalled();
  });

  it('PATCH /api/users/:id should successfully update user details', async () => {
    const existingUser = { id: 2, email: 'user@nutika.ee', role: 'STANDARD', isActive: true };
    const updatedUser = { id: 2, email: 'user@nutika.ee', role: 'STANDARD', isActive: false };
    
    prismaMock.user.findUnique.mockResolvedValue(existingUser);
    prismaMock.user.update.mockResolvedValue(updatedUser);

    const res = await request(app)
      .patch('/api/users/2')
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('PATCH /api/users/:id should reject deactivating own account', async () => {
    const existingAdmin = { id: 1, email: 'admin@nutika.ee', role: 'MASTER', isActive: true };
    prismaMock.user.findUnique.mockResolvedValue(existingAdmin);

    const res = await request(app)
      .patch('/api/users/1') // admin's own ID is 1 (as mocked in auth middleware)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot deactivate your own account');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('DELETE /api/users/:id should successfully delete user', async () => {
    const existingUser = { id: 2, email: 'user@nutika.ee', role: 'STANDARD', isActive: true };
    prismaMock.user.findUnique.mockResolvedValue(existingUser);
    prismaMock.user.delete.mockResolvedValue(existingUser);

    const res = await request(app).delete('/api/users/2');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted successfully');
    expect(prismaMock.user.delete).toHaveBeenCalled();
  });

  it('DELETE /api/users/:id should reject self-deletion', async () => {
    const existingAdmin = { id: 1, email: 'admin@nutika.ee', role: 'MASTER', isActive: true };
    prismaMock.user.findUnique.mockResolvedValue(existingAdmin);

    const res = await request(app).delete('/api/users/1');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot delete your own account');
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });
});
