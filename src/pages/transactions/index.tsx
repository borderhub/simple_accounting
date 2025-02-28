import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const db = await openAccountingDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        
        const allTransactions: Transaction[] = await store.getAll();
        setTransactions(allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setIsLoading(false);
      } catch (error) {
        console.error('取引履歴の取得に失敗しました:', error);
        setIsLoading(false);
      }
    }
    
    fetchTransactions();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">取引一覧</h1>
          <Link href="/transactions/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            新規仕訳入力
          </Link>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>データ読み込み中...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">日付</th>
                  <th className="p-3 text-left">摘要</th>
                  <th className="p-3 text-right">金額</th>
                  <th className="p-3 text-left">借方科目</th>
                  <th className="p-3 text-left">貸方科目</th>
                  <th className="p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="p-3">{transaction.description}</td>
                    <td className="p-3 text-right">{transaction.amount.toLocaleString()}円</td>
                    <td className="p-3">{transaction.debitAccount}</td>
                    <td className="p-3">{transaction.creditAccount}</td>
                    <td className="p-3 text-center">
                      <Link href={`/transactions/${transaction.id}`} className="text-blue-500 hover:underline mr-2">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded shadow">
            <p className="mb-4">取引データがありません</p>
            <Link href="/transactions/new" className="text-blue-500 hover:underline">
              最初の取引を入力する
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
