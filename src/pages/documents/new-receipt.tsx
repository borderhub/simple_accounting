import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';

type Item = {
    description: string;
    amount: number;
    quantity: number;
    total: number;
};

type Receipt = {
    items: Item[];
    amount: number;
};

export default function NewReceipt() {
  const router = useRouter();
  const { transaction: transactionId } = router.query;

  const [receipt, setReceipt] = useState({
    title: '領収書',
    receiptNumber: `R-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    issuedTo: '',
    amount: 0, // Change amount to a number
    paymentMethod: '現金',
    description: '',
    items: [{ description: '', amount: 0, quantity: 1, total: 0 }],
    tax: 10,
    companyName: '株式会社サンプル',
    companyAddress: '東京都渋谷区渋谷1-1-1',
    companyPhone: '03-1234-5678',
    companyEmail: 'info@example.com',
    bankInfo: '三菱UFJ銀行 渋谷支店 普通 1234567',
    memo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 取引データがある場合、そのデータを読み込む
  useEffect(() => {
    async function fetchTransaction() {
      try {
        if (!transactionId || Array.isArray(transactionId)) return; // Handle potential array type for transactionId
        const db = await openAccountingDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        
        const result = await store.get(transactionId);

        if (result) {
          // 取引データから領収書データを設定
          setReceipt({
            ...receipt,
            date: new Date(result.date).toISOString().split('T')[0],
            amount: Number(result.amount), // Ensure amount is treated as a number
            description: result.description,
            items: [{ 
              description: result.description, 
              amount: Number(result.amount), // Ensure amount is a number
              quantity: 1, 
              total: Number(result.amount) // Ensure total is a number
            }]
          });
        }
      } catch (error) {
        console.error('取引データの取得に失敗しました:', error);
      }
    }

    fetchTransaction();
  }, [transactionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReceipt({
      ...receipt,
      [name]: name === 'amount' || name === 'tax' ? (value === '' ? 0 : Number(value)) : value
    });
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const updatedItems = [...receipt.items];
    const indexUpdatedItems = updatedItems[index];
    if (field === 'amount' || field === 'quantity') {
      value = value === '' ? 0 : Number(value); // Ensure values are treated as numbers

      indexUpdatedItems[field] = value;
  
      // 金額と数量から合計を計算
      if (typeof indexUpdatedItems.amount === 'number' && typeof indexUpdatedItems.quantity === 'number') {
        indexUpdatedItems.total = indexUpdatedItems.amount * indexUpdatedItems.quantity;
      }
    } else if (field === 'description') {
        // 'description' は文字列なのでそのまま設定
        indexUpdatedItems[field] = value as string;
    }
  
    // すべての項目の合計金額を計算
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  
    setReceipt({
      ...receipt,
      items: updatedItems,
      amount: totalAmount
    });
  };

  const addItem = () => {
    setReceipt({
      ...receipt,
      items: [...receipt.items, { description: '', amount: 0, quantity: 1, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (receipt.items.length <= 1) return;

    const updatedItems = receipt.items.filter((_, i) => i !== index);

    // すべての項目の合計金額を再計算
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

    setReceipt({
      ...receipt,
      items: updatedItems,
      amount: totalAmount
    });
  };

  const calculateTax = () => {
    return Math.round(receipt.amount * (receipt.tax / 100));
  };

  const calculateTotal = () => {
    return receipt.amount + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const db = await openAccountingDB();
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');

      const newReceipt = {
        ...receipt,
        id: `receipt-${Date.now()}`,
        type: 'receipt',
        date: new Date(receipt.date).toISOString(),
        createdAt: new Date(),
        totalAmount: calculateTotal(),
        taxAmount: calculateTax(),
        transactionId: transactionId || null
      };

      await store.add(newReceipt);
      await tx.oncomplete;

      router.push(`/documents/${newReceipt.id}`);
    } catch (error) {
      console.error('領収書の保存に失敗しました:', error);
      setError('領収書の保存中にエラーが発生しました。再試行してください。');
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    // プレビュー表示の処理（モーダルなど）
    // 実際の実装では、モーダルやプレビューページを表示
    alert('この機能はまだ実装されていません。');
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">領収書の作成</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">タイトル</label>
              <input
                type="text"
                name="title"
                value={receipt.title}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">領収書番号</label>
              <input
                type="text"
                name="receiptNumber"
                value={receipt.receiptNumber}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">発行日</label>
              <input
                type="date"
                name="date"
                value={receipt.date}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">宛先</label>
            <input
              type="text"
              name="issuedTo"
              value={receipt.issuedTo}
              onChange={handleChange}
              required
              placeholder="会社名または個人名"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">明細項目</h3>
            {receipt.items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-end gap-2 mb-2 p-2 border rounded">
                <div className="w-full md:w-5/12">
                  <label className="block text-sm mb-1">摘要</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="w-full md:w-2/12">
                  <label className="block text-sm mb-1">単価</label>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    className="w-full p-2 border rounded"
                    min="0"
                    required
                  />
                </div>
                
                <div className="w-full md:w-1/12">
                  <label className="block text-sm mb-1">数量</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full p-2 border rounded"
                    min="1"
                    required
                  />
                </div>
                
                <div className="w-full md:w-2/12">
                  <label className="block text-sm mb-1">小計</label>
                  <input
                    type="text"
                    value={typeof item.total === 'number' ? item.total.toLocaleString() : ''}
                    className="w-full p-2 border rounded bg-gray-100"
                    readOnly
                  />
                </div>
                
                <div className="w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 bg-red-50 text-red-500 rounded border border-red-200 hover:bg-red-100"
                    disabled={receipt.items.length <= 1}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addItem}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200"
            >
              + 項目を追加
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium">お支払い方法</label>
              <select
                name="paymentMethod"
                value={receipt.paymentMethod}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="現金">現金</option>
                <option value="銀行振込">銀行振込</option>
                <option value="クレジットカード">クレジットカード</option>
                <option value="電子マネー">電子マネー</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-medium">消費税率 (%)</label>
              <input
                type="number"
                name="tax"
                value={receipt.tax}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between mb-2">
                <span>小計:</span>
                <span>{typeof receipt.amount === 'number' ? receipt.amount.toLocaleString() : 0}円</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>消費税({receipt.tax}%):</span>
                <span>{calculateTax().toLocaleString()}円</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>合計金額:</span>
                <span>{calculateTotal().toLocaleString()}円</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium">会社名</label>
              <input
                type="text"
                name="companyName"
                value={receipt.companyName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">住所</label>
              <input
                type="text"
                name="companyAddress"
                value={receipt.companyAddress}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">電話番号</label>
              <input
                type="text"
                name="companyPhone"
                value={receipt.companyPhone}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">メールアドレス</label>
              <input
                type="email"
                name="companyEmail"
                value={receipt.companyEmail}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">銀行情報</label>
              <input
                type="text"
                name="bankInfo"
                value={receipt.bankInfo}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">備考</label>
            <textarea
              name="memo"
              value={receipt.memo}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="その他の情報や注意事項など"
            ></textarea>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePreview}
                className="px-4 py-2 border bg-gray-100 rounded hover:bg-gray-200"
                disabled={isSubmitting}
              >
                プレビュー
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
