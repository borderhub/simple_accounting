import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Transaction {
    date: string;
    description: string;
    amount: number | '';
    debitAccount: string;
    creditAccount: string;
    memo: string;
    createdAt?: string;
}

interface AccountingDB extends DBSchema {
  transactions: {
    key: string;
    value: {
      id: string;
      date: string;
      description: string;
      amount: number;
      debitAccount: string;
      creditAccount: string;
      createdAt: string;
    };
    indexes: { date: string; debitAccount: string; creditAccount: string };
  };
  documents: {
    key: string;
    value: { id: string; type: string; };
    indexes: { type: string; date: string };
  };
  settings: {
    key: string;
    value: { id: string; value: unknown };
  };
}

export async function openAccountingDB(): Promise<IDBPDatabase<AccountingDB>> {
  return openDB<AccountingDB>('AccountingAppDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('debitAccount', 'debitAccount');
        store.createIndex('creditAccount', 'creditAccount');
      }

      if (!db.objectStoreNames.contains('documents')) {
        const store = db.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('type', 'type');
        store.createIndex('date', 'date');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
}
