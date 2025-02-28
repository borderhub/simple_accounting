import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string; // ISO8601形式の文字列
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
}

export default function Home() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRecentTransactions() {
      try {
        const db = await openAccountingDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');

        const allTransactions: Transaction[] = await store.getAll();
        setRecentTransactions(
          allTransactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        );
      } catch (error) {
        console.error('取引履歴の取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecentTransactions();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">簡易会計システム</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: '簡単仕訳入力', description: '日々の取引を簡単に記録できます', href: '/transactions/new', color: 'blue' },
            { title: '帳票作成', description: '領収書・請求書を簡単に作成', href: '/documents', color: 'green' },
            { title: '財務レポート', description: '資産表・決算書・確定申告書類', href: '/reports', color: 'purple' }
          ].map(({ title, description, href, color }) => (
            <div key={href} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">{title}</h2>
              <p className="mb-4">{description}</p>
              <Link href={href} className={`inline-block bg-${color}-500 text-white px-4 py-2 rounded hover:bg-${color}-600`}>
                {title}へ
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">最近の取引</h2>
          {isLoading ? (
            <p>データ読み込み中...</p>
          ) : recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">日付</th>
                    <th className="p-2 text-left">摘要</th>
                    <th className="p-2 text-right">金額</th>
                    <th className="p-2 text-left">借方科目</th>
                    <th className="p-2 text-left">貸方科目</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="p-2">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2 text-right">{transaction.amount.toLocaleString()}円</td>
                      <td className="p-2">{transaction.debitAccount}</td>
                      <td className="p-2">{transaction.creditAccount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>取引データがありません。新しい仕訳を入力してください。</p>
          )}
          <div className="mt-4">
            <Link href="/transactions" className="text-blue-500 hover:underline">
              すべての取引を表示 →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
