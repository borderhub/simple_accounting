import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { openAccountingDB } from '@/lib/indexedDB';

// 勘定科目の分類定義
type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// 勘定科目の型定義
interface Account {
  name: string;
  category: AccountCategory;
  isDebit: boolean; // true: 借方増加、false: 貸方増加
}

// 取引データの型定義
interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  memo?: string;
  createdAt: Date;
}

// 勘定科目の残高を表す型定義
interface AccountBalance {
  account: string;
  category: AccountCategory;
  balance: number;
}

// バランスシートのセクションを表す型定義
interface BalanceSheetSection {
  title: string;
  accounts: AccountBalance[];
  total: number;
}

// 勘定科目マスターデータ
const accountMaster: Record<string, Account> = {
  '現金': { name: '現金', category: 'asset', isDebit: true },
  '普通預金': { name: '普通預金', category: 'asset', isDebit: true },
  '売掛金': { name: '売掛金', category: 'asset', isDebit: true },
  '商品': { name: '商品', category: 'asset', isDebit: true },
  '固定資産': { name: '固定資産', category: 'asset', isDebit: true },
  '買掛金': { name: '買掛金', category: 'liability', isDebit: false },
  '借入金': { name: '借入金', category: 'liability', isDebit: false },
  '未払金': { name: '未払金', category: 'liability', isDebit: false },
  '未払費用': { name: '未払費用', category: 'liability', isDebit: false },
  '資本金': { name: '資本金', category: 'equity', isDebit: false },
  '元入金': { name: '元入金', category: 'equity', isDebit: false },
  '利益剰余金': { name: '利益剰余金', category: 'equity', isDebit: false },
  '売上': { name: '売上', category: 'revenue', isDebit: false },
  '仕入': { name: '仕入', category: 'expense', isDebit: true },
  '給料': { name: '給料', category: 'expense', isDebit: true },
  '家賃': { name: '家賃', category: 'expense', isDebit: true },
  '水道光熱費': { name: '水道光熱費', category: 'expense', isDebit: true },
  '通信費': { name: '通信費', category: 'expense', isDebit: true },
  '旅費交通費': { name: '旅費交通費', category: 'expense', isDebit: true },
  '消耗品費': { name: '消耗品費', category: 'expense', isDebit: true },
  '雑費': { name: '雑費', category: 'expense', isDebit: true }
};

const BalanceSheet: React.FC = () => {
  const router = useRouter();
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [balanceSheet, setBalanceSheet] = useState<{
    assets: BalanceSheetSection;
    liabilities: BalanceSheetSection;
    equity: BalanceSheetSection;
  }>({
    assets: { title: '資産の部', accounts: [], total: 0 },
    liabilities: { title: '負債の部', accounts: [], total: 0 },
    equity: { title: '純資産の部', accounts: [], total: 0 }
  });
  
  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);
  
  const fetchBalanceSheet = async () => {
    setIsLoading(true);
    try {
      const db = await openAccountingDB();
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      
      // 指定日付までの取引データを取得
      const allTransactions = await store.getAll();
      const filteredTransactions = allTransactions
        .filter((transaction) => {
            const txDate = new Date(transaction.date); // transaction.date を Date 型にキャスト
            const compareDate = new Date(asOfDate); // 比較対象の日付
            compareDate.setHours(23, 59, 59, 999); // 指定日の終わり
            return txDate <= compareDate;
        })
        .map((transaction) => {
            // 各 transaction の date と createdAt を Date 型に変換
            const txDate = new Date(transaction.date);
            const txCreatedAt = new Date(transaction.createdAt); // createdAt が存在する場合のみ変換

            return {
            ...transaction,
            date: txDate, // Date 型に変換された日付
            createdAt: txCreatedAt, // Date 型に変換された createdAt
            };
        });

      // 勘定科目ごとの残高を計算
      const accountBalances = calculateAccountBalances(filteredTransactions);
      
      // バランスシートの各セクションに割り当て
      const assets: AccountBalance[] = [];
      const liabilities: AccountBalance[] = [];
      const equity: AccountBalance[] = [];
      
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      
      // 収益・費用科目は純資産（利益剰余金）に集約
      let netIncome = 0;
      
      for (const balance of accountBalances) {
        if (balance.category === 'asset') {
          assets.push(balance);
          totalAssets += balance.balance;
        } else if (balance.category === 'liability') {
          liabilities.push(balance);
          totalLiabilities += balance.balance;
        } else if (balance.category === 'equity') {
          equity.push(balance);
          totalEquity += balance.balance;
        } else if (balance.category === 'revenue') {
          netIncome += balance.balance;
        } else if (balance.category === 'expense') {
          netIncome -= balance.balance;
        }
      }
      
      // 当期利益を純資産に追加
      if (netIncome !== 0) {
        equity.push({
          account: '当期純利益',
          category: 'equity',
          balance: netIncome
        });
        totalEquity += netIncome;
      }
      
      setBalanceSheet({
        assets: {
          title: '資産の部',
          accounts: assets,
          total: totalAssets
        },
        liabilities: {
          title: '負債の部',
          accounts: liabilities,
          total: totalLiabilities
        },
        equity: {
          title: '純資産の部',
          accounts: equity,
          total: totalEquity
        }
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('バランスシートの作成に失敗しました:', error);
      setIsLoading(false);
    }
  };
  
  const calculateAccountBalances = (transactions: Transaction[]): AccountBalance[] => {
    const balances: Record<string, number> = {};
    
    // 全ての取引を処理
    for (const tx of transactions) {
      // 借方側の処理
      if (!balances[tx.debitAccount]) {
        balances[tx.debitAccount] = 0;
      }
      
      // 勘定科目の性質に基づいて残高を調整
      const debitAccount = accountMaster[tx.debitAccount];
      if (debitAccount) {
        if (debitAccount.isDebit) {
          // 借方増加の科目（資産・費用）
          balances[tx.debitAccount] += tx.amount;
        } else {
          // 借方減少の科目（負債・純資産・収益）
          balances[tx.debitAccount] -= tx.amount;
        }
      }
      
      // 貸方側の処理
      if (!balances[tx.creditAccount]) {
        balances[tx.creditAccount] = 0;
      }
      
      // 勘定科目の性質に基づいて残高を調整
      const creditAccount = accountMaster[tx.creditAccount];
      if (creditAccount) {
        if (creditAccount.isDebit) {
          // 貸方減少の科目（資産・費用）
          balances[tx.creditAccount] -= tx.amount;
        } else {
          // 貸方増加の科目（負債・純資産・収益）
          balances[tx.creditAccount] += tx.amount;
        }
      }
    }
    
    // 残高を配列に変換
    const accountBalances: AccountBalance[] = [];
    for (const [accountName, balance] of Object.entries(balances)) {
      if (balance !== 0 && accountMaster[accountName]) {
        accountBalances.push({
          account: accountName,
          category: accountMaster[accountName].category,
          balance: balance
        });
      }
    }
    
    return accountBalances;
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAsOfDate(e.target.value);
  };
  
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
  };
  
  const renderBalanceSheetSection = (section: BalanceSheetSection) => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">科目</th>
                <th className="p-3 text-right">金額</th>
              </tr>
            </thead>
            <tbody>
              {section.accounts.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3">{item.account}</td>
                  <td className="p-3 text-right">{formatCurrency(item.balance)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="p-3">合計</td>
                <td className="p-3 text-right">{formatCurrency(section.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">貸借対照表（B/S）</h1>
          <div className="flex items-center">
            <span className="mr-2">基準日:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={handleDateChange}
              className="p-2 border rounded"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>データ読み込み中...</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded shadow mb-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">貸借対照表</h2>
                <p className="text-gray-600">{new Date(asOfDate).toLocaleDateString('ja-JP')}現在</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderBalanceSheetSection(balanceSheet.assets)}
                </div>
                <div>
                  {renderBalanceSheetSection(balanceSheet.liabilities)}
                  {renderBalanceSheetSection(balanceSheet.equity)}
                  
                  <div className="mt-6 bg-gray-100 p-3 rounded">
                    <div className="flex justify-between font-bold">
                      <span>資産合計</span>
                      <span>{formatCurrency(balanceSheet.assets.total)}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2">
                      <span>負債・純資産合計</span>
                      <span>{formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <button
                onClick={() => router.push('/reports')}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                レポート一覧に戻る
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                印刷・PDF保存
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default BalanceSheet;
