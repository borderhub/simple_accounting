import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { openAccountingDB } from '../../lib/indexedDB';

// 取引データの型
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
}

// 請求項目の型
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
}

// 請求書の型
interface Invoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientId: string;
  items: InvoiceItem[];
  memo: string;
  subTotal: number;
  taxTotal: number;
  total: number;
  paymentTerms: string;
  bankInfo: string;
}

export default function NewInvoice() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]); // 型を明示的に指定
  const [clients, setClients] = useState([
    { id: '1', name: '株式会社サンプル', address: '東京都千代田区1-1-1', email: 'info@sample.co.jp' },
    { id: '2', name: 'テスト商事', address: '大阪府大阪市中央区2-2-2', email: 'contact@test.co.jp' },
  ]);

  const [invoice, setInvoice] = useState<Invoice>({
    invoiceNumber: `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 10 }],
    memo: '',
    subTotal: 0,
    taxTotal: 0,
    total: 0,
    paymentTerms: '請求書発行日より30日以内にお支払いください。',
    bankInfo: '〇〇銀行 △△支店 普通 1234567 カブシキガイシャ〇〇',
  });

  const [company, setCompany] = useState({
    name: '株式会社〇〇',
    address: '東京都新宿区西新宿1-1-1',
    phone: '03-1234-5678',
    email: 'info@example.com',
    website: 'www.example.com',
    taxId: '1234567890123',
  });

  useEffect(() => {
    // 取引データの取得
    async function fetchTransactions() {
      try {
        const db = await openAccountingDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        
        const allTransactions = await store.getAll();
        // 売上に関する取引のみフィルタリング
        const salesTransactions = allTransactions.filter(
          t => t.creditAccount === '売上' || t.debitAccount === '売掛金'
        );
        
        setTransactions(
            salesTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );

      } catch (error) {
        console.error('取引データの取得に失敗しました:', error);
        setError('取引データの取得に失敗しました。');
      }
    }
    
    fetchTransactions();
  }, []);

  const addInvoiceItem = () => {
    setInvoice(prevInvoice => ({
      ...prevInvoice,
      items: [
        ...prevInvoice.items,
        { description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 10 }
      ]
    }));
  };

  const removeInvoiceItem = (index: number) => {
    const newItems = [...invoice.items];
    newItems.splice(index, 1);
    
    setInvoice(prevInvoice => ({
      ...prevInvoice,
      items: newItems
    }));
    
    calculateTotals(newItems);
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...invoice.items];
    
    if (field === 'unitPrice' || field === 'quantity') {
      const numericValue = parseFloat(value) || 0;
      newItems[index][field] = numericValue;
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    } else if (field === 'taxRate') {
      const numericValue = parseFloat(value) || 0;
      newItems[index][field] = numericValue;
    } else if (field === 'description') {
      // string 型のフィールドはそのまま
      newItems[index][field] = value as string;
    }
  
    setInvoice(prevInvoice => ({
      ...prevInvoice,
      items: newItems
    }));
  
    calculateTotals(newItems);
  };  

  const calculateTotals = (items: InvoiceItem[]) => {
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = items.reduce((sum, item) => sum + (item.amount * (item.taxRate / 100)), 0);
    const total = subTotal + taxTotal;
    
    setInvoice(prev => ({
      ...prev,
      subTotal,
      taxTotal,
      total
    }));
  };

  const addItemFromTransaction = (transaction: Transaction) => {
    const newItem: InvoiceItem = {
      description: transaction.description,
      quantity: 1,
      unitPrice: transaction.amount,
      amount: transaction.amount,
      taxRate: 10
    };
    
    const newItems = [...invoice.items, newItem];
    
    setInvoice(prevInvoice => ({
      ...prevInvoice,
      items: newItems
    }));
    
    calculateTotals(newItems);
  };

  const saveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const db = await openAccountingDB();
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      
      const selectedClient = clients.find(c => c.id === invoice.clientId);
      
      const newInvoice = {
        ...invoice,
        id: `invoice-${Date.now()}`,
        type: 'invoice',
        status: 'issued',
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        createdAt: new Date(),
        client: selectedClient,
        company,
        // 'date' プロパティは削除
      };
      
      await store.add(newInvoice);
      await tx.oncomplete;
      
      router.push('/documents/history');
    } catch (error) {
      console.error('請求書の保存に失敗しました:', error);
      setError('請求書の保存中にエラーが発生しました。再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">請求書作成</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-6 bg-white p-6 rounded shadow">
          <form onSubmit={saveInvoice}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">請求書情報</h2>
                
                <div className="mb-4">
                  <label className="block mb-2 font-medium">請求書番号</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice({...invoice, invoiceNumber: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block mb-2 font-medium">発行日</label>
                  <input
                    type="date"
                    value={invoice.issueDate}
                    onChange={(e) => setInvoice({...invoice, issueDate: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block mb-2 font-medium">支払期限</label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">請求先情報</h2>
                
                <div className="mb-4">
                  <label className="block mb-2 font-medium">請求先</label>
                  <select
                    value={invoice.clientId}
                    onChange={(e) => setInvoice({...invoice, clientId: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">請求先を選択してください</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                {invoice.clientId && (
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">{clients.find(c => c.id === invoice.clientId)?.name}</p>
                    <p>{clients.find(c => c.id === invoice.clientId)?.address}</p>
                    <p>{clients.find(c => c.id === invoice.clientId)?.email}</p>
                  </div>
                )}
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mb-4">請求項目</h2>
            
            <div className="mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">内容</th>
                      <th className="p-2 text-center w-20">数量</th>
                      <th className="p-2 text-right w-32">単価</th>
                      <th className="p-2 text-right w-32">金額</th>
                      <th className="p-2 text-center w-24">税率(%)</th>
                      <th className="p-2 text-center w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="w-full p-1 border rounded"
                            placeholder="項目の説明"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                            className="w-full p-1 border rounded text-center"
                            min="1"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                            className="w-full p-1 border rounded text-right"
                            min="0"
                            required
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          {item.amount.toLocaleString()}円
                        </td>
                        <td className="p-2">
                          <select
                            value={item.taxRate}
                            onChange={(e) => updateInvoiceItem(index, 'taxRate', e.target.value)}
                            className="w-full p-1 border rounded text-center"
                          >
                            <option value="0">0%</option>
                            <option value="8">8%</option>
                            <option value="10">10%</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeInvoiceItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              削除
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="pt-2">
                        <button
                          type="button"
                          onClick={addInvoiceItem}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          + 項目を追加
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end mb-6">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b">
                  <span>小計:</span>
                  <span className="font-medium">{invoice.subTotal.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>消費税:</span>
                  <span className="font-medium">{invoice.taxTotal.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>合計:</span>
                  <span>{invoice.total.toLocaleString()}円</span>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mb-4">追加情報</h2>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">支払い条件</label>
              <textarea
                value={invoice.paymentTerms}
                onChange={(e) => setInvoice({...invoice, paymentTerms: e.target.value})}
                className="w-full p-2 border rounded"
                rows={2}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">振込先情報</label>
              <textarea
                value={invoice.bankInfo}
                onChange={(e) => setInvoice({...invoice, bankInfo: e.target.value})}
                className="w-full p-2 border rounded"
                rows={2}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">備考</label>
              <textarea
                value={invoice.memo}
                onChange={(e) => setInvoice({...invoice, memo: e.target.value})}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="請求書に関する補足情報"
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border rounded"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={isLoading || invoice.items.length === 0 || !invoice.clientId}
              >
                {isLoading ? '保存中...' : '請求書を保存'}
              </button>
            </div>
          </form>
        </div>
        
        {/* 関連する取引データ */}
        <div className="mt-8 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">関連する売上取引データ</h2>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">日付</th>
                    <th className="p-2 text-left">摘要</th>
                    <th className="p-2 text-right">金額</th>
                    <th className="p-2 text-center">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="p-2">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2 text-right">{transaction.amount.toLocaleString()}円</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => addItemFromTransaction(transaction)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          項目に追加
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>関連する取引データがありません。</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
