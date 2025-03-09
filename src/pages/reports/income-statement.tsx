// pages/reports/income-statement.tsx
import { useState, FormEvent, useEffect } from 'react';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';
import Link from 'next/link';

// トランザクションデータの型
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  memo?: string;
}

// 損益計算書項目の型
interface IncomeStatementItem {
  category: string;
  accounts: string[];
  amount: number;
  items: {
    account: string;
    amount: number;
  }[];
}

// 損益計算書データの型
interface IncomeStatement {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: IncomeStatementItem;
  expenses: IncomeStatementItem;
  operatingIncome: number;
  otherIncome: IncomeStatementItem;
  otherExpenses: IncomeStatementItem;
  netIncome: number;
}

export default function IncomeStatementPage() {
  // 日付範囲の状態
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 今年の1月1日
    endDate: new Date().toISOString().split('T')[0] // 今日
  });

  // 損益計算書データの状態
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ページ読み込み時に今年の損益計算書を取得
  useEffect(() => {
    generateIncomeStatement();
  }, []);

  // 入力変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  // フォーム送信ハンドラ
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    generateIncomeStatement();
  };

  // 損益計算書の生成
  const generateIncomeStatement = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 日付範囲の検証
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // 終了日の最後の時刻に設定

      if (startDate > endDate) {
        setError('開始日は終了日より前の日付を選択してください。');
        setIsLoading(false);
        return;
      }

      // IndexedDBからデータを取得
      const db = await openAccountingDB();
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const allTransactions = await store.getAll();

      // 日付範囲内のトランザクションをフィルタリング
      const filteredTransactions = allTransactions.filter((transaction: Transaction) => {
        const txDate = new Date(transaction.date);
        return txDate >= startDate && txDate <= endDate;
      });

      // 収益・費用のカテゴリーと科目の定義
      const revenueAccounts = ['売上', '元入金', '受取利息', 'その他収益'];
      const expenseAccounts = [
        '仕入', '旅費交通費', '通信費', '消耗品費', 
        '水道光熱費', '家賃', '雑費', '減価償却費'
      ];
      const otherIncomeAccounts = ['受取利息', 'その他収益'];
      const otherExpenseAccounts = ['支払利息', 'その他費用'];

      // 損益計算書データの初期化
      const statement: IncomeStatement = {
        period: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        revenue: {
          category: '収益',
          accounts: revenueAccounts,
          amount: 0,
          items: []
        },
        expenses: {
          category: '費用',
          accounts: expenseAccounts,
          amount: 0,
          items: []
        },
        operatingIncome: 0,
        otherIncome: {
          category: 'その他収益',
          accounts: otherIncomeAccounts,
          amount: 0,
          items: []
        },
        otherExpenses: {
          category: 'その他費用',
          accounts: otherExpenseAccounts,
          amount: 0,
          items: []
        },
        netIncome: 0
      };

      // 各科目ごとの集計データを初期化
      const accountSums: { [key: string]: number } = {};
      
      // 全科目の合計を0で初期化
      [...revenueAccounts, ...expenseAccounts, ...otherIncomeAccounts, ...otherExpenseAccounts].forEach(account => {
        accountSums[account] = 0;
      });

      // トランザクションを集計
      filteredTransactions.forEach((tx: Transaction) => {
        // 収益科目の集計
        if (revenueAccounts.includes(tx.creditAccount)) {
          accountSums[tx.creditAccount] += tx.amount;
        } else if (revenueAccounts.includes(tx.debitAccount)) {
          accountSums[tx.debitAccount] += tx.amount;
        }

        // 費用科目の集計
        if (expenseAccounts.includes(tx.debitAccount)) {
          accountSums[tx.debitAccount] += tx.amount;
        } else if (expenseAccounts.includes(tx.creditAccount)) {
          accountSums[tx.creditAccount] += tx.amount;
        }

        // その他収益科目の集計
        if (otherIncomeAccounts.includes(tx.creditAccount)) {
          accountSums[tx.creditAccount] += tx.amount;
        } else if (otherIncomeAccounts.includes(tx.debitAccount)) {
          accountSums[tx.debitAccount] += tx.amount;
        }

        // その他費用科目の集計
        if (otherExpenseAccounts.includes(tx.debitAccount)) {
          accountSums[tx.debitAccount] += tx.amount;
        } else if (otherExpenseAccounts.includes(tx.creditAccount)) {
          accountSums[tx.creditAccount] += tx.amount;
        }
      });

      // 集計結果を損益計算書に反映
      // 収益項目の集計
      revenueAccounts.forEach(account => {
        if (accountSums[account] > 0) {
          statement.revenue.items.push({
            account,
            amount: accountSums[account]
          });
          statement.revenue.amount += accountSums[account];
        }
      });

      // 費用項目の集計
      expenseAccounts.forEach(account => {
        if (accountSums[account] > 0) {
          statement.expenses.items.push({
            account,
            amount: accountSums[account]
          });
          statement.expenses.amount += accountSums[account];
        }
      });

      // その他収益項目の集計
      otherIncomeAccounts.forEach(account => {
        if (accountSums[account] > 0) {
          statement.otherIncome.items.push({
            account,
            amount: accountSums[account]
          });
          statement.otherIncome.amount += accountSums[account];
        }
      });

      // その他費用項目の集計
      otherExpenseAccounts.forEach(account => {
        if (accountSums[account] > 0) {
          statement.otherExpenses.items.push({
            account,
            amount: accountSums[account]
          });
          statement.otherExpenses.amount += accountSums[account];
        }
      });

      // 営業利益と当期純利益の計算
      statement.operatingIncome = statement.revenue.amount - statement.expenses.amount;
      statement.netIncome = statement.operatingIncome + statement.otherIncome.amount - statement.otherExpenses.amount;

      // 損益計算書データを設定
      setIncomeStatement(statement);
    } catch (err) {
      console.error('損益計算書の生成に失敗しました:', err);
      setError('損益計算書の生成中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">損益計算書</h1>
          <Link href="/reports" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            レポート一覧に戻る
          </Link>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">期間指定</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block mb-2 font-medium">開始日</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">終了日</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? '計算中...' : '損益計算書を表示'}
            </button>
          </form>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {incomeStatement && (
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                損益計算書: {new Date(incomeStatement.period.startDate).toLocaleDateString()} 〜 {new Date(incomeStatement.period.endDate).toLocaleDateString()}
              </h2>
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                印刷
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <tbody>
                  {/* 収益セクション */}
                  <tr className="bg-gray-100">
                    <th colSpan={2} className="p-3 text-left border">
                      {incomeStatement.revenue.category}
                    </th>
                    <th className="p-3 text-right border">金額</th>
                  </tr>
                  
                  {incomeStatement.revenue.items.map((item, index) => (
                    <tr key={`revenue-${index}`} className="border">
                      <td className="p-3 border" width="10%"></td>
                      <td className="p-3 border">{item.account}</td>
                      <td className="p-3 text-right border">{item.amount.toLocaleString()}円</td>
                    </tr>
                  ))}
                  
                  <tr className="font-bold">
                    <td colSpan={2} className="p-3 text-right border">収益合計</td>
                    <td className="p-3 text-right border">{incomeStatement.revenue.amount.toLocaleString()}円</td>
                  </tr>
                  
                  {/* 費用セクション */}
                  <tr className="bg-gray-100">
                    <th colSpan={2} className="p-3 text-left border">
                      {incomeStatement.expenses.category}
                    </th>
                    <th className="p-3 text-right border">金額</th>
                  </tr>
                  
                  {incomeStatement.expenses.items.map((item, index) => (
                    <tr key={`expense-${index}`} className="border">
                      <td className="p-3 border" width="10%"></td>
                      <td className="p-3 border">{item.account}</td>
                      <td className="p-3 text-right border">{item.amount.toLocaleString()}円</td>
                    </tr>
                  ))}
                  
                  <tr className="font-bold">
                    <td colSpan={2} className="p-3 text-right border">費用合計</td>
                    <td className="p-3 text-right border">{incomeStatement.expenses.amount.toLocaleString()}円</td>
                  </tr>
                  
                  {/* 営業利益 */}
                  <tr className="font-bold bg-blue-50">
                    <td colSpan={2} className="p-3 text-right border">営業利益</td>
                    <td className="p-3 text-right border">{incomeStatement.operatingIncome.toLocaleString()}円</td>
                  </tr>
                  
                  {/* その他収益セクション（項目がある場合のみ表示） */}
                  {incomeStatement.otherIncome.items.length > 0 && (
                    <>
                      <tr className="bg-gray-100">
                        <th colSpan={2} className="p-3 text-left border">
                          {incomeStatement.otherIncome.category}
                        </th>
                        <th className="p-3 text-right border">金額</th>
                      </tr>
                      
                      {incomeStatement.otherIncome.items.map((item, index) => (
                        <tr key={`otherIncome-${index}`} className="border">
                          <td className="p-3 border" width="10%"></td>
                          <td className="p-3 border">{item.account}</td>
                          <td className="p-3 text-right border">{item.amount.toLocaleString()}円</td>
                        </tr>
                      ))}
                      
                      <tr className="font-bold">
                        <td colSpan={2} className="p-3 text-right border">その他収益合計</td>
                        <td className="p-3 text-right border">{incomeStatement.otherIncome.amount.toLocaleString()}円</td>
                      </tr>
                    </>
                  )}
                  
                  {/* その他費用セクション（項目がある場合のみ表示） */}
                  {incomeStatement.otherExpenses.items.length > 0 && (
                    <>
                      <tr className="bg-gray-100">
                        <th colSpan={2} className="p-3 text-left border">
                          {incomeStatement.otherExpenses.category}
                        </th>
                        <th className="p-3 text-right border">金額</th>
                      </tr>
                      
                      {incomeStatement.otherExpenses.items.map((item, index) => (
                        <tr key={`otherExpense-${index}`} className="border">
                          <td className="p-3 border" width="10%"></td>
                          <td className="p-3 border">{item.account}</td>
                          <td className="p-3 text-right border">{item.amount.toLocaleString()}円</td>
                        </tr>
                      ))}
                      
                      <tr className="font-bold">
                        <td colSpan={2} className="p-3 text-right border">その他費用合計</td>
                        <td className="p-3 text-right border">{incomeStatement.otherExpenses.amount.toLocaleString()}円</td>
                      </tr>
                    </>
                  )}
                  
                  {/* 当期純利益 */}
                  <tr className="font-bold text-lg bg-green-50">
                    <td colSpan={2} className="p-3 text-right border">当期純利益</td>
                    <td className="p-3 text-right border">
                      <span className={incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {incomeStatement.netIncome.toLocaleString()}円
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* グラフや追加情報をここに表示することも可能 */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-3">収益構成</h3>
                <div className="space-y-2">
                  {incomeStatement.revenue.items.map((item, index) => (
                    <div key={`revenue-bar-${index}`} className="flex flex-col">
                      <div className="flex justify-between mb-1">
                        <span>{item.account}</span>
                        <span>{Math.round(item.amount / incomeStatement.revenue.amount * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.round(item.amount / incomeStatement.revenue.amount * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-3">費用構成</h3>
                <div className="space-y-2">
                  {incomeStatement.expenses.items.map((item, index) => (
                    <div key={`expense-bar-${index}`} className="flex flex-col">
                      <div className="flex justify-between mb-1">
                        <span>{item.account}</span>
                        <span>{Math.round(item.amount / incomeStatement.expenses.amount * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.round(item.amount / incomeStatement.expenses.amount * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
