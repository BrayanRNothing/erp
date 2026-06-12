import React from 'react';
import { Wallet, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export function Dashboard() {
  const { cards, getTotalBalance } = useFinance();
  const totalBalance = getTotalBalance();

  return (
    <div className="space-y-8">

      {/* Balance General - Liquid Glass Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Overall Total Balance</p>
            <h1 className="text-5xl font-bold text-white drop-shadow-sm">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h1>
          </div>
          <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <Wallet className="text-emerald-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Tarjetas Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          My Accounts & Cards
        </h2>

        {cards.filter(c => c.isActive !== false).length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
            <CreditCard className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No cards or accounts yet. Add one from the Finance section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.filter(c => c.isActive !== false).map((card) => (
              <div
                key={card.id}
                className="group relative rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/30 p-6 cursor-pointer overflow-hidden shadow-lg"
              >
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-400/30 transition-colors"></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <p className="text-white/60 text-xs font-semibold tracking-widest">{card.type?.toUpperCase()}</p>
                    <p className="text-white font-medium mt-1">{card.bank || card.name}</p>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-white/80 text-xs border border-white/10">
                    *{card.last4 || card.lastFour || '????'}
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-3xl font-bold text-white">
                    ${Math.abs(card.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm mt-2 flex items-center gap-1 ${card.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {card.balance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {card.balance >= 0 ? 'Positive Balance' : 'Active Debt'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
