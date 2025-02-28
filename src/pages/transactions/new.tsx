import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  memo: string;
}

export default function NewTransaction() {
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    debitAccount: '',
    creditAccount: '',
    memo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const accountOptions: string[] = [
    '現金', '普通預金', '売上', '売掛金', '買掛金', '仕入',
    '旅費交通費', '通信費', '消耗品費', '水道光熱費', '家賃', '雑費'
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransaction(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
  
    try {
      const db = await openAccountingDB();
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
  
      const newTransaction = {
        ...transaction,
        date: transaction.date, // すでに `string` 型なので変換不要
        createdAt: new Date().toISOString(), // ISO文字列に変換
        id: Date.now().toString()
      };
  
      await store.add(newTransaction);
      await tx.done;
  
      router.push('/transactions');
    } catch (error) {
      console.error('取引の保存に失敗しました:', error);
      setError('取引の保存中にエラーが発生しました。再試行してください。');
      setIsSubmitting(false);
    }
  };
  

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">新規仕訳入力</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-medium">日付</label>
              <input
                type="date"
                name="date"
                value={transaction.date}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">金額</label>
              <input
                type="number"
                name="amount"
                value={transaction.amount}
                onChange={handleChange}
                required
                min="0"
                className="w-full p-2 border rounded"
                placeholder="例: 10000"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">摘要</label>
            <input
              type="text"
              name="description"
              value={transaction.description}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
              placeholder="例: 文房具購入"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-medium">借方科目</label>
              <select
                name="debitAccount"
                value={transaction.debitAccount}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">科目を選択</option>
                {accountOptions.map(account => (
                  <option key={`debit-${account}`} value={account}>{account}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-medium">貸方科目</label>
              <select
                name="creditAccount"
                value={transaction.creditAccount}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">科目を選択</option>
                {accountOptions.map(account => (
                  <option key={`credit-${account}`} value={account}>{account}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">備考</label>
            <textarea
              name="memo"
              value={transaction.memo}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="補足情報があれば入力してください"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
