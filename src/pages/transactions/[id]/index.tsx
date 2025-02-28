import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';

type Transaction = {
    id: string;
    date: string;
    amount: number;
    description: string;
    debitAccount: string;
    creditAccount: string;
    memo?: string;
    createdAt: string;
    updatedAt?: string;
};

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const parsedId = Array.isArray(id) ? id[0] : id; // Ensure 'id' is a string or undefined
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 勘定科目リスト
  const accountOptions = [
    '現金', '普通預金', '売上', '売掛金', '買掛金', '仕入', 
    '旅費交通費', '通信費', '消耗品費', '水道光熱費', '家賃', '雑費'
  ];

  useEffect(() => {
    async function fetchTransaction() {
      try {
        if (!parsedId) return;
        const db = await openAccountingDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        
        const result = await store.get(parsedId);
        
        if (result) {
          // 日付をHTML date input形式に変換
          const formattedDate = new Date(result.date).toISOString().split('T')[0];
          setTransaction({
            ...result,
            date: formattedDate
          });
        } else {
          setError('取引データが見つかりませんでした');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('取引データの取得に失敗しました:', error);
        setError('データの読み込み中にエラーが発生しました');
        setIsLoading(false);
      }
    }
    
    fetchTransaction();
  }, [parsedId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransaction({
      ...transaction!,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const db = await openAccountingDB();
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      
      const updatedTransaction = {
        ...transaction!,
        date: new Date(transaction!.date).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await store.put(updatedTransaction);
      await tx.oncomplete;
      
      setIsEditing(false);
      // 日付をHTML date input形式に再変換
      setTransaction({
        ...updatedTransaction,
        date: updatedTransaction.date.split('T')[0]
      });
      setIsSubmitting(false);
    } catch (error) {
      console.error('取引の更新に失敗しました:', error);
      setError('取引の更新中にエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この取引を削除してもよろしいですか？この操作は元に戻せません。')) {
      return;
    }
    
    try {
      const db = await openAccountingDB();
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      
      await store.delete(parsedId!);
      await tx.oncomplete;
      
      router.push('/transactions');
    } catch (error) {
      console.error('取引の削除に失敗しました:', error);
      setError('取引の削除中にエラーが発生しました');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <p className="text-center py-8">データ読み込み中...</p>
        </div>
      </Layout>
    );
  }

  if (!transaction && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || '取引データが見つかりませんでした'}
          </div>
          <button
            onClick={() => router.push('/transactions')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            取引一覧に戻る
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isEditing ? '取引の編集' : '取引の詳細'}
          </h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleUpdate} className="bg-white p-6 rounded shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="date" className="block text-gray-700">日付</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={transaction!.date}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-gray-700">金額</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={transaction!.amount}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700">取引内容</label>
              <input
                type="text"
                id="description"
                name="description"
                value={transaction!.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="debitAccount" className="block text-gray-700">借方勘定</label>
              <select
                id="debitAccount"
                name="debitAccount"
                value={transaction!.debitAccount}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                {accountOptions.map((account) => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="creditAccount" className="block text-gray-700">貸方勘定</label>
              <select
                id="creditAccount"
                name="creditAccount"
                value={transaction!.creditAccount}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                {accountOptions.map((account) => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="memo" className="block text-gray-700">メモ</label>
              <textarea
                id="memo"
                name="memo"
                value={transaction!.memo || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </form>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <strong>日付:</strong> {transaction!.date}
              </div>
              <div>
                <strong>金額:</strong> {transaction!.amount}
              </div>
            </div>
            <div className="mb-4">
              <strong>取引内容:</strong> {transaction!.description}
            </div>
            <div className="mb-4">
              <strong>借方勘定:</strong> {transaction!.debitAccount}
            </div>
            <div className="mb-4">
              <strong>貸方勘定:</strong> {transaction!.creditAccount}
            </div>
            <div className="mb-4">
              <strong>メモ:</strong> {transaction!.memo || 'なし'}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
