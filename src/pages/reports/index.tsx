// pages/reports/index.tsx
import { useState, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { openAccountingDB } from '@/lib/indexedDB';

// レポートの種類を定義する型
type ReportType = 'all' | 'income' | 'expense' | 'tax';

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

// レポートフォームの入力データ型
interface ReportFormData {
  startDate: string;
  endDate: string;
  reportType: ReportType;
}

// レポート集計データの型
interface ReportSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}

export default function Reports() {
  // レポートフォームの状態管理
  const [formData, setFormData] = useState<ReportFormData>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'all'
  });

  // レポート結果の状態管理
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);

  // 入力フォームの変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'reportType' ? value as ReportType : value
    });
  };

  // レポート作成のサブミットハンドラ
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShowReport(false);

    try {
      // 日付範囲の検証
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      endDate.setHours(23, 59, 59, 999); // 終了日の最後の時刻に設定

      if (startDate > endDate) {
        alert('開始日は終了日より前の日付を選択してください。');
        setIsLoading(false);
        return;
      }

      // IndexedDBからデータを取得
      const db = await openAccountingDB();
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const allTransactions = await store.getAll();

      // 日付範囲内のトランザクションをフィルタリング
      let filteredTransactions = allTransactions.filter((transaction: Transaction) => {
        const txDate = new Date(transaction.date);
        return txDate >= startDate && txDate <= endDate;
      });

      // レポートタイプに基づいてさらにフィルタリング
      if (formData.reportType === 'income') {
        filteredTransactions = filteredTransactions.filter((tx: Transaction) => 
          tx.debitAccount === '売上' || tx.creditAccount === '売上' ||
          tx.debitAccount === '元入金' || tx.creditAccount === '元入金'
        );
      } else if (formData.reportType === 'expense') {
        filteredTransactions = filteredTransactions.filter((tx: Transaction) => 
          tx.debitAccount === '仕入' || 
          tx.debitAccount === '旅費交通費' || 
          tx.debitAccount === '通信費' || 
          tx.debitAccount === '消耗品費' || 
          tx.debitAccount === '水道光熱費' || 
          tx.debitAccount === '家賃' || 
          tx.debitAccount === '雑費'
        );
      } else if (formData.reportType === 'tax') {
        // 税金関連の取引（この例では簡易的に実装）
        filteredTransactions = filteredTransactions.filter((tx: Transaction) => 
          tx.description.includes('税') || 
          tx.memo?.includes('税')
        );
      }

      // 集計データの計算
      const calculatedSummary: ReportSummary = {
        totalTransactions: filteredTransactions.length,
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0
      };

      // 経費科目のリスト
      const expenseAccounts = [
        '仕入', '旅費交通費', '通信費', '消耗品費',
        '水道光熱費', '家賃', '雑費'
      ];

      filteredTransactions.forEach((tx: Transaction) => {
        // 収入の計算 - 売上科目を含む取引を収入として計算
        if (
          tx.debitAccount === '売上' || tx.creditAccount === '売上' ||
          tx.debitAccount === '元入金' || tx.creditAccount === '元入金'
        ) {
          calculatedSummary.totalIncome += tx.amount;
        }

        // 支出の計算 - 経費科目を含む取引を支出として計算
        if (expenseAccounts.includes(tx.debitAccount) || expenseAccounts.includes(tx.creditAccount)) {
          calculatedSummary.totalExpense += tx.amount;
        }
      });

      // 収支計算
      calculatedSummary.netAmount = calculatedSummary.totalIncome - calculatedSummary.totalExpense;

      // 結果を状態に設定
      setReportData(filteredTransactions);
      setSummary(calculatedSummary);
      setShowReport(true);
    } catch (error) {
      console.error('レポートデータの取得に失敗しました:', error);
      alert('レポートの生成中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">財務レポート</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">資産表</h2>
            <p className="mb-4">現在の資産・負債状況を確認できます</p>
            <Link href="/reports/balance-sheet" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              資産表を表示
            </Link>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">損益計算書</h2>
            <p className="mb-4">特定期間の収益・費用を確認できます</p>
            <Link href="/reports/income-statement" className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              損益計算書を表示
            </Link>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">確定申告</h2>
            <p className="mb-4">確定申告に必要な情報を確認できます</p>
            <Link href="" className="inline-block bg-purple-200 text-white px-4 py-2 rounded hover:bg-purple-200">
              確定申告データを表示
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">期間指定レポート</h2>
          <p className="mb-4">特定期間のデータを集計したレポートを作成します</p>
          
          <form className="mb-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium">開始日</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">終了日</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">レポートの種類</label>
              <select 
                name="reportType"
                value={formData.reportType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="all">全取引履歴</option>
                <option value="income">収益レポート</option>
                <option value="expense">経費レポート</option>
                <option value="tax">税金レポート</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? 'レポート生成中...' : 'レポート作成'}
            </button>
          </form>
        </div>
        
        {/* レポート結果表示エリア */}
        {showReport && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">
              レポート結果: {formData.startDate} 〜 {formData.endDate}
              {formData.reportType !== 'all' && ` (${
                formData.reportType === 'income' ? '収益' : 
                formData.reportType === 'expense' ? '経費' : '税金'
              })`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">取引件数</p>
                <p className="text-xl font-bold">{summary.totalTransactions}件</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">総収入</p>
                <p className="text-xl font-bold text-green-600">{summary.totalIncome.toLocaleString()}円</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-gray-600">総支出</p>
                <p className="text-xl font-bold text-red-600">{summary.totalExpense.toLocaleString()}円</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-gray-600">収支</p>
                <p className={`text-xl font-bold ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.netAmount.toLocaleString()}円
                </p>
              </div>
            </div>
            
            {reportData.length > 0 ? (
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
                    {reportData.map((transaction) => (
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
              <p className="text-center py-4">該当期間のデータはありません。</p>
            )}
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
              >
                印刷
              </button>
              <button 
                onClick={() => {
                  // CSVダウンロード機能
                  const headers = ['日付', '摘要', '金額', '借方科目', '貸方科目'];
                  const csvData = reportData.map(tx => [
                    new Date(tx.date).toLocaleDateString(),
                    tx.description,
                    tx.amount,
                    tx.debitAccount,
                    tx.creditAccount
                  ]);
                  
                  let csvContent = headers.join(',') + '\n';
                  csvData.forEach(row => {
                    csvContent += row.join(',') + '\n';
                  });
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('hidden', '');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `report-${formData.startDate}-to-${formData.endDate}.csv`);
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                CSVダウンロード
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
