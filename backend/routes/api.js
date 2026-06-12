import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

const router = express.Router();


// Helper para responder errores
const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
};

// --- CARDS ---
router.get('/cards', async (req, res) => {
  try {
    const cards = await prisma.card.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    const mappedCards = cards.map(c => ({
      ...c,
      bank: c.name,
      last4: c.lastFour,
      type: c.type.charAt(0) + c.type.slice(1).toLowerCase()
    }));
    res.json(mappedCards);
  } catch (error) { handleError(res, error); }
});

router.post('/cards', async (req, res) => {
  try {
    const { bank, type, currency, balance, last4, color } = req.body;
    const card = await prisma.card.create({
      data: {
        name: bank || 'Tarjeta',
        type: type ? type.toUpperCase() : 'DEBIT',
        currency: currency || 'USD',
        balance: balance || 0,
        lastFour: last4 || null,
        color: color || null,
        userId: req.user.id
      }
    });
    res.json({
      ...card,
      bank: card.name,
      last4: card.lastFour,
      type: card.type.charAt(0) + card.type.slice(1).toLowerCase()
    });
  } catch (error) { handleError(res, error); }
});

router.put('/cards/:id', async (req, res) => {
  try {
    const card = await prisma.card.update({
      where: { id: req.params.id, userId: req.user.id },
      data: req.body
    });
    res.json(card);
  } catch (error) { handleError(res, error); }
});

router.delete('/cards/:id', async (req, res) => {
  try {
    // Delete movements first (due to Restrict constraint)
    await prisma.movement.deleteMany({
      where: { cardId: req.params.id, userId: req.user.id }
    });
    await prisma.card.delete({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) { handleError(res, error); }
});

// --- MOVEMENTS ---
router.get('/movements', async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      include: { card: true }
    });
    res.json(movements);
  } catch (error) { handleError(res, error); }
});

router.post('/movements', async (req, res) => {
  try {
    const { cardId, type, amount, description, date, category } = req.body;
    
    const movement = await prisma.movement.create({
      data: {
        type, amount, description, category, date: date ? new Date(date) : new Date(),
        cardId, userId: req.user.id
      }
    });

    // Update card balance
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (card) {
      const newBalance = type === 'INCOME' 
        ? Number(card.balance) + Number(amount)
        : Number(card.balance) - Number(amount);
      await prisma.card.update({
        where: { id: cardId },
        data: { balance: newBalance }
      });
    }

    res.json(movement);
  } catch (error) { handleError(res, error); }
});

// --- CLIENTS ---
router.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) { handleError(res, error); }
});

router.post('/clients', async (req, res) => {
  try {
    const { name, email, phone, address, type } = req.body;
    const client = await prisma.client.create({
      data: {
        name: name || 'Unknown',
        email: email || null,
        phone: phone || null,
        address: address || null,
        type: type || 'client',
        userId: req.user.id
      }
    });
    res.json(client);
  } catch (error) { handleError(res, error); }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id, userId: req.user.id },
      data: req.body
    });
    res.json(client);
  } catch (error) { handleError(res, error); }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) { handleError(res, error); }
});

// --- BUDGETS ---
router.get('/budgets', async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(budgets);
  } catch (error) { handleError(res, error); }
});

router.post('/budgets', async (req, res) => {
  try {
    const { category, limit, period, color } = req.body;
    const budget = await prisma.budget.create({
      data: {
        category: category || 'General',
        limit: parseFloat(limit) || 0,
        period: period || 'monthly',
        color: color || null,
        userId: req.user.id
      }
    });
    res.json({ ...budget, limit: Number(budget.limit), spent: Number(budget.spent) });
  } catch (error) { handleError(res, error); }
});

router.put('/budgets/:id', async (req, res) => {
  try {
    const budget = await prisma.budget.update({
      where: { id: req.params.id, userId: req.user.id },
      data: req.body
    });
    res.json(budget);
  } catch (error) { handleError(res, error); }
});

router.delete('/budgets/:id', async (req, res) => {
  try {
    await prisma.budget.delete({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) { handleError(res, error); }
});

// --- DOCUMENTS ---
router.get('/documents', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (error) { handleError(res, error); }
});

router.post('/documents', async (req, res) => {
  try {
    const { name, category, size, fileUrl, type, fileData } = req.body;
    let finalFileUrl = fileUrl || null;

    if (fileData) {
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const safeName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadsDir, fileName);
        
        fs.writeFileSync(filePath, buffer);
        
        // Generate public URL
        const host = req.get('host');
        const protocol = host.includes('localhost') ? 'http' : 'https';
        finalFileUrl = `${protocol}://${host}/uploads/${fileName}`;
      }
    }

    const doc = await prisma.document.create({
      data: {
        name: name || 'Untitled',
        category: category || 'General',
        type: type || null,
        size: parseInt(size) || 0,
        fileUrl: finalFileUrl,
        userId: req.user.id
      }
    });
    res.json(doc);
  } catch (error) { handleError(res, error); }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    await prisma.document.delete({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) { handleError(res, error); }
});

// --- ACTIVITY LOGS ---
router.get('/activity', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) { handleError(res, error); }
});

router.post('/activity', async (req, res) => {
  try {
    const log = await prisma.activityLog.create({
      data: { ...req.body, userId: req.user.id }
    });
    res.json(log);
  } catch (error) { handleError(res, error); }
});

// --- EXPECTED EXPENSES ---
router.get('/expected-expenses', async (req, res) => {
  try {
    const expenses = await prisma.expectedExpense.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    });
    res.json(expenses);
  } catch (error) { handleError(res, error); }
});

router.post('/expected-expenses', async (req, res) => {
  try {
    const expense = await prisma.expectedExpense.create({
      data: { ...req.body, dueDate: new Date(req.body.dueDate), userId: req.user.id }
    });
    res.json(expense);
  } catch (error) { handleError(res, error); }
});

router.delete('/expected-expenses/:id', async (req, res) => {
  try {
    await prisma.expectedExpense.delete({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) { handleError(res, error); }
});

router.put('/expected-expenses/:id/pay', async (req, res) => {
  try {
    const expense = await prisma.expectedExpense.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { status: 'paid' }
    });
    res.json(expense);
  } catch (error) { handleError(res, error); }
});

// --- RECEIVABLES ---
router.get('/receivables', async (req, res) => {
  try {
    const items = await prisma.receivable.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    });
    res.json(items);
  } catch (error) { handleError(res, error); }
});

router.post('/receivables', async (req, res) => {
  try {
    const { clientName, description, amount, dueDate, expectedDate } = req.body;
    const item = await prisma.receivable.create({
      data: {
        clientName: clientName || 'Unknown',
        description: description || '',
        amount: parseFloat(amount) || 0,
        dueDate: dueDate ? new Date(dueDate) : (expectedDate ? new Date(expectedDate) : new Date()),
        userId: req.user.id
      }
    });
    res.json(item);
  } catch (error) { handleError(res, error); }
});

router.put('/receivables/:id/collect', async (req, res) => {
  try {
    const item = await prisma.receivable.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { status: 'paid', paidDate: new Date(), cardId: req.body.cardId }
    });
    res.json(item);
  } catch (error) { handleError(res, error); }
});

// --- PAYABLES ---
router.get('/payables', async (req, res) => {
  try {
    const items = await prisma.payable.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    });
    res.json(items);
  } catch (error) { handleError(res, error); }
});

router.post('/payables', async (req, res) => {
  try {
    const { providerName, description, amount, dueDate, expectedDate } = req.body;
    const item = await prisma.payable.create({
      data: {
        providerName: providerName || 'Unknown',
        description: description || '',
        amount: parseFloat(amount) || 0,
        dueDate: dueDate ? new Date(dueDate) : (expectedDate ? new Date(expectedDate) : new Date()),
        userId: req.user.id
      }
    });
    res.json(item);
  } catch (error) { handleError(res, error); }
});

router.put('/payables/:id/pay', async (req, res) => {
  try {
    const item = await prisma.payable.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { status: 'paid', paidDate: new Date(), cardId: req.body.cardId }
    });
    res.json(item);
  } catch (error) { handleError(res, error); }
});

export default router;
