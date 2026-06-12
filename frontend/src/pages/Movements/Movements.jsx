import React, { useState } from 'react';
import { ArrowRightLeft, CheckCircle2, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export function Movements() {
  const { cards, addMovement } = useFinance();
  const activeCards = cards.filter(c => c.isActive !== false);

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    cardId: '',
    category: 'General'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cardId) {
      alert('You must select a card or account.');
      return;
    }
    const result = addMovement({
      ...formData,
      amount: parseFloat(formData.amount),
    });
    if (result?.success === false) {
      alert(result.error);
      return;
    }
    setFormData({ type: 'expense', amount: '', description: '', cardId: '', category: 'General' });
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="glass-panel p-8 rounded-3xl">
        
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
            <ArrowRightLeft className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Record Movement</h2>
            <p className="text-white/60 text-sm">Income, purchases or operational expenses</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Tipo de Movimiento */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'income'})}
              className={`p-4 rounded-2xl border transition-all ${
                formData.type === 'income' 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              + Income
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'expense'})}
              className={`p-4 rounded-2xl border transition-all ${
                formData.type === 'expense' 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              - Expense / Purchase
            </button>
          </div>

          {/* Tarjeta Destino/Origen */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Card / Account <span className="text-rose-400">*</span>
            </label>
            {activeCards.length === 0 ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/40 text-sm">
                <CreditCard className="w-4 h-4" />
                No cards available. Add one from the Finance section first.
              </div>
            ) : (
              <select
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [&>option]:bg-gray-800"
                value={formData.cardId}
                onChange={(e) => setFormData({...formData, cardId: e.target.value})}
              >
                <option value="" disabled>-- Select a card --</option>
                {activeCards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.bank || card.name} {card.last4 ? `(*${card.last4})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Monto y Descripción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="e.g. Internet payment"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={activeCards.length === 0}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <CheckCircle2 className="w-5 h-5" />
            Record Movement
          </button>
        </form>
      </div>
    </div>
  );
}

