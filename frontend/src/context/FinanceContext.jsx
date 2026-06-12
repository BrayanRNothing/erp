import React, { createContext, useContext, useState } from 'react';
import { useActivity, ACTIVITY_TYPES } from './ActivityContext';

const FinanceContext = createContext(null);

const initialCards = [];
const initialMovements = [];
const initialExpectedExpenses = [];
const initialReceivables = [];
const initialPayables = [];
const initialClients = [];
const initialDocuments = [];
const initialBudgets = [];

export function FinanceProvider({ children }) {
  const { logActivity } = useActivity();
  const [cards, setCards] = useState(initialCards);
  const [movements, setMovements] = useState(initialMovements);
  const [expectedExpenses, setExpectedExpenses] = useState(initialExpectedExpenses);
  const [receivables, setReceivables] = useState(initialReceivables);
  const [payables, setPayables] = useState(initialPayables);
  const [clients, setClients] = useState(initialClients);
  const [documents, setDocuments] = useState(initialDocuments);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [budgetCardIds, setBudgetCardIds] = useState(initialCards.map(c => c.id));

  const toggleBudgetCard = (id) => {
    setBudgetCardIds(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const getBudgetTotalBalance = () => {
    return cards.filter(c => c.isActive !== false && budgetCardIds.includes(c.id)).reduce((acc, card) => acc + card.balance, 0);
  };

  const addBudget = (budget) => {
    setBudgets([...budgets, { ...budget, id: Date.now().toString() }]);
    logActivity({ type: ACTIVITY_TYPES.BUDGET_ADDED, title: 'Budget created', description: `Category: ${budget.category} — Limit: $${Number(budget.limit).toFixed(2)}` });
  };

  const updateBudget = (id, updates) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBudget = (id) => {
    const b = budgets.find(bgt => bgt.id === id);
    setBudgets(budgets.filter(bgt => bgt.id !== id));
    if (b) logActivity({ type: ACTIVITY_TYPES.BUDGET_DELETED, title: 'Budget deleted', description: `Category: ${b.category}` });
  };

  const addCard = (card) => {
    const newCard = { ...card, id: Date.now().toString() };
    setCards(prev => [...prev, newCard]);
    logActivity({ type: ACTIVITY_TYPES.CARD_ADDED, title: 'Card added', description: `${card.bank} **** ${card.last4 || '????'}` });
  };

  const deleteCard = (id) => {
    const card = cards.find(c => c.id === id);
    setCards(cards.filter(c => c.id !== id));
    setMovements(movements.filter(m => m.cardId !== id));
    if (card) logActivity({ type: ACTIVITY_TYPES.CARD_DELETED, title: 'Card deleted', description: `${card.bank} **** ${card.last4 || '????'}` });
  };

  const addMovement = (movement) => {
    // Validate funds for expense
    if (movement.type === 'expense') {
      const card = cards.find(c => c.id === movement.cardId);
      if (!card || card.balance < movement.amount) {
        return { success: false, error: 'Insufficient funds on the card.' };
      }
    }

    setMovements([{ ...movement, id: Date.now().toString(), date: movement.date || new Date().toISOString().split('T')[0] }, ...movements]);

    // Actualizar saldo de la tarjeta
    setCards(cards.map(c => {
      if (c.id === movement.cardId) {
        const newBalance = movement.type === 'income'
          ? c.balance + movement.amount
          : c.balance - movement.amount;
        return { ...c, balance: newBalance };
      }
      return c;
    }));

    const card = cards.find(c => c.id === movement.cardId);
    logActivity({
      type: ACTIVITY_TYPES.MOVEMENT_ADDED,
      title: movement.type === 'income' ? 'Income recorded' : 'Expense recorded',
      description: `${movement.description || movement.category} — $${Number(movement.amount).toFixed(2)} (${card?.bank ?? '?'})`
    });

    return { success: true };
  };

  // --- Expected Expenses (Cashflow Forecast) ---
  const addExpectedExpense = (expense) => {
    setExpectedExpenses([...expectedExpenses, { ...expense, id: Date.now().toString(), status: 'pending' }]);
  };

  const deleteExpectedExpense = (id) => {
    setExpectedExpenses(expectedExpenses.filter(e => e.id !== id));
  };

  const payExpectedExpense = (id, cardId) => {
    const expense = expectedExpenses.find(e => e.id === id);
    if (!expense) return { success: false, error: 'Expected expense not found.' };
    if (expense.status === 'paid') return { success: false, error: 'This expense has already been marked as paid.' };

    const res = addMovement({
      cardId,
      type: 'expense',
      amount: expense.amount,
      date: new Date().toISOString().split('T')[0],
      description: `Payment Made: ${expense.description}`,
      category: expense.category,
      status: 'completed'
    });

    if (res.success) {
      setExpectedExpenses(expectedExpenses.map(e => e.id === id ? { ...e, status: 'paid' } : e));
    }
    return res;
  };

  // --- Receivables & Payables ---
  const addReceivable = (receivable) => {
    setReceivables([{ ...receivable, id: Date.now().toString(), status: 'pending' }, ...receivables]);
  };

  const collectReceivable = (id, cardId) => {
    const receivable = receivables.find(r => r.id === id);
    if (!receivable) return { success: false, error: 'Account not found.' };

    const res = addMovement({
      cardId,
      type: 'income',
      amount: receivable.amount,
      date: new Date().toISOString().split('T')[0],
      description: `Collection: ${receivable.description}`,
      category: 'Accounts Receivable',
      status: 'completed'
    });

    if (res.success) {
      setReceivables(receivables.map(r => r.id === id ? { ...r, status: 'paid', paidDate: new Date().toISOString().split('T')[0], cardId } : r));
    }
    return res;
  };

  const addPayable = (payable) => {
    setPayables([{ ...payable, id: Date.now().toString(), status: 'pending' }, ...payables]);
  };

  const payPayable = (id, cardId) => {
    const payable = payables.find(p => p.id === id);
    if (!payable) return { success: false, error: 'Account not found.' };

    const res = addMovement({
      cardId,
      type: 'expense',
      amount: payable.amount,
      date: new Date().toISOString().split('T')[0],
      description: `Payment: ${payable.description}`,
      category: 'Accounts Payable',
      status: 'completed'
    });

    if (res.success) {
      setPayables(payables.map(p => p.id === id ? { ...p, status: 'paid', paidDate: new Date().toISOString().split('T')[0], cardId } : p));
    }
    return res;
  };

  const transferBetweenCards = (sourceId, targetId, amount, description = 'Transferencia') => {
    const sourceCard = cards.find(c => c.id === sourceId);
    if (!sourceCard || sourceCard.balance < amount) {
      return { success: false, error: 'Insufficient funds in the source card.' };
    }

    const date = new Date().toISOString().split('T')[0];

    const expenseMovement = {
      id: Date.now().toString() + '-1',
      cardId: sourceId,
      type: 'expense',
      amount,
      date,
      description: `${description} to another account`,
      category: 'Transfers',
      status: 'completed'
    };

    const incomeMovement = {
      id: Date.now().toString() + '-2',
      cardId: targetId,
      type: 'income',
      amount,
      date,
      description: `${description} from another account`,
      category: 'Transfers',
      status: 'completed'
    };

    setMovements([expenseMovement, incomeMovement, ...movements]);

    setCards(cards.map(c => {
      if (c.id === sourceId) return { ...c, balance: c.balance - amount };
      if (c.id === targetId) return { ...c, balance: c.balance + amount };
      return c;
    }));

    const src = cards.find(c => c.id === sourceId);
    const tgt = cards.find(c => c.id === targetId);
    logActivity({ type: ACTIVITY_TYPES.TRANSFER, title: 'Transfer completed', description: `$${amount.toFixed(2)} from ${src?.bank ?? '?'} to ${tgt?.bank ?? '?'}` });

    return { success: true };
  };

  const addDocument = (doc) => {
    setDocuments([{ ...doc, id: Date.now().toString() }, ...documents]);
    logActivity({ type: ACTIVITY_TYPES.DOCUMENT_ADDED, title: 'Document saved', description: doc.name });
  };

  // --- Clients & Providers ---
  const addClient = (client) => {
    setClients([{ ...client, id: Date.now().toString() }, ...clients]);
  };

  const deleteClient = (id) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const updateClient = (id, updates) => {
    setClients(clients.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteDocument = (id) => {
    const doc = documents.find(d => d.id === id);
    setDocuments(documents.filter(d => d.id !== id));
    if (doc) logActivity({ type: ACTIVITY_TYPES.DOCUMENT_DELETED, title: 'Document deleted', description: doc.name });
  };

  const updateDocument = (id, updates) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const toggleCardStatus = (id) => {
    setCards(cards.map(c => c.id === id ? { ...c, isActive: c.isActive === false ? true : false } : c));
  };

  const getTotalBalance = () => {
    return cards.filter(c => c.isActive !== false).reduce((acc, card) => acc + card.balance, 0);
  };

  return (
    <FinanceContext.Provider value={{
      cards, addCard, deleteCard, toggleCardStatus,
      movements, addMovement, transferBetweenCards,
      expectedExpenses, addExpectedExpense, payExpectedExpense, deleteExpectedExpense,
      receivables, addReceivable, collectReceivable,
      payables, addPayable, payPayable,
      documents, addDocument, deleteDocument, updateDocument,
      budgets, addBudget, updateBudget, deleteBudget,
      budgetCardIds, toggleBudgetCard, getBudgetTotalBalance,
      clients, addClient, deleteClient, updateClient,
      getTotalBalance
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
