import { useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Documents() {
  const [documentType, setDocumentType] = useState('receipt');
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">帳票作成</h1>
        
        <div className="mb-6 bg-white p-4 rounded shadow">
          <div className="mb-4">
            <label className="block mb-2 font-medium">作成する書類の種類</label>
            <div className="flex gap-4">
              <button
                onClick={() => setDocumentType('receipt')}
                className={`px-4 py-2 rounded ${
                  documentType === 'receipt' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                領収書
              </button>
              <button
                onClick={() => setDocumentType('invoice')}
                className={`px-4 py-2 rounded ${
                  documentType === 'invoice' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                請求書
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentType === 'receipt' ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">領収書作成</h2>
                <p className="mb-4">取引データから領収書を作成します</p>
                <Link href="/documents/new-receipt" className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  領収書を作成
                </Link>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4">請求書作成</h2>
                <p className="mb-4">取引データから請求書を作成します</p>
                <Link href="/documents/new-invoice" className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  請求書を作成
                </Link>
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-semibold mb-4">過去の帳票</h2>
              <p className="mb-4">作成済みの帳票を確認・ダウンロードできます</p>
              <Link href="/documents/history" className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                帳票履歴を表示
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
