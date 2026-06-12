import React, { createContext, useContext, useState, useCallback } from 'react';

const ActivityContext = createContext(null);

// IDs de íconos como strings para evitar problemas de serialización
export const ACTIVITY_TYPES = {
  MOVEMENT_ADDED:   'movement_added',
  CARD_ADDED:       'card_added',
  CARD_DELETED:     'card_deleted',
  CARD_TOGGLED:     'card_toggled',
  DOCUMENT_ADDED:   'document_added',
  DOCUMENT_DELETED: 'document_deleted',
  INVOICE_SAVED:    'invoice_saved',
  BUDGET_ADDED:     'budget_added',
  BUDGET_DELETED:   'budget_deleted',
  TRANSFER:         'transfer',
};

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState([]);

  const logActivity = useCallback(({ type, title, description }) => {
    const entry = {
      id: Date.now().toString() + Math.random(),
      type,
      title,
      description,
      timestamp: new Date(),
    };
    setActivities(prev => [entry, ...prev].slice(0, 50)); // Max 50 entradas
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, logActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivity = () => {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
};
