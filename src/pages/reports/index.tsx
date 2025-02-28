import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Reports() {
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
            <Link href="/reports/tax-report" className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              確定申告データを表示
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">期間指定レポート</h2>
          <p className="mb-4">特定期間のデータを集計したレポートを作成します</p>
          
          <form className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium">開始日</label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">終了日</label>
                <input
                  type="date"
                  name="endDate"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">レポートの種類</label>
              <select className="w-full p-2 border rounded">
                <option value="all">全取引履歴</option>
                <option value="income">収益レポート</option>
                <option value="expense">経費レポート</option>
                <option value="tax">税金レポート</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              レポート作成
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
