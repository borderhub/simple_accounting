// components/DataExportImport.tsx
import React, { useState } from 'react';
import { 
  exportTransactionsToCSV, 
  exportDocumentsToCSV, 
  exportSettingsToCSV, 
  exportAllData,
  importTransactionsFromCSV,
  importAllDataFromZip
} from '@/lib/csv-utils';

interface ImportResult {
  added: number;
  updated: number;
  errors: string[];
}

interface AllImportResult {
  transactions: ImportResult;
  documents: ImportResult;
  settings: ImportResult;
}

const DataExportImport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [allImportResult, setAllImportResult] = useState<AllImportResult | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importType, setImportType] = useState<'transactions' | 'all'>('transactions');

  // エクスポート処理
  const handleExport = async (type: 'transactions' | 'documents' | 'settings' | 'all') => {
    setIsExporting(true);
    try {
      switch (type) {
        case 'transactions':
          await exportTransactionsToCSV();
          break;
        case 'documents':
          await exportDocumentsToCSV();
          break;
        case 'settings':
          await exportSettingsToCSV();
          break;
        case 'all':
          await exportAllData();
          break;
      }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        console.error('エクスポートエラー:', error);
        alert(`エクスポート中にエラーが発生しました: ${errorMessage}`);
    } finally {
        setIsExporting(false);
    }
  };

  // インポートファイル選択処理
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    setAllImportResult(null);
    setImportErrors([]);

    try {
      if (importType === 'transactions' && file.name.endsWith('.csv')) {
        const result = await importTransactionsFromCSV(file);
        setImportResult(result);
        setImportErrors(result.errors);
      } else if (importType === 'all' && file.name.endsWith('.zip')) {
        const result = await importAllDataFromZip(file);
        setAllImportResult(result);
        
        // エラーを集約
        const allErrors = [
          ...result.transactions.errors.map(err => `[取引] ${err}`),
          ...result.documents.errors.map(err => `[書類] ${err}`),
          ...result.settings.errors.map(err => `[設定] ${err}`)
        ];
        setImportErrors(allErrors);
      } else {
        throw new Error('不適切なファイル形式です。トランザクションはCSV、一括インポートはZIPファイルを選択してください。');
      }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        console.error('インポートエラー:', error);
        setImportErrors([`ファイル処理中にエラーが発生しました: ${errorMessage}`]);
    } finally {
      setIsImporting(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">データのエクスポート/インポート</h2>
      
      {/* エクスポートセクション */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">データエクスポート</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('transactions')}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            取引データ
          </button>
          <button
            onClick={() => handleExport('documents')}
            disabled={true}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            書類データ
          </button>
          <button
            onClick={() => handleExport('all')}
            disabled={true}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            全データ (ZIP)
          </button>
        </div>
        {isExporting && <p className="mt-3 text-blue-600">エクスポート処理中...</p>}
      </div>

      {/* インポートセクション */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">データインポート</h3>
        
        <div className="mb-4">
          <div className="flex gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="importType"
                value="transactions"
                checked={importType === 'transactions'}
                onChange={() => setImportType('transactions')}
                className="mr-2"
              />
              取引データのみ (CSV)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="importType"
                value="all"
                checked={importType === 'all'}
                onChange={() => setImportType('all')}
                className="mr-2"
              />
              全データ (ZIP)
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <label
              htmlFor="importFile"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer disabled:opacity-50"
            >
              ファイルを選択
              <input
                type="file"
                id="importFile"
                onChange={handleFileSelect}
                accept={importType === 'transactions' ? ".csv" : ".zip"}
                disabled={isImporting}
                className="hidden"
              />
            </label>
            <span className="text-gray-600">
              {importType === 'transactions' ? '*.csv ファイル' : '*.zip ファイル'}を選択してください
            </span>
          </div>
        </div>

        {isImporting && <p className="mt-3 text-blue-600">インポート処理中...</p>}

        {/* インポート結果表示 */}
        {importResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold mb-2">インポート結果:</h4>
            <p>新規追加: <span className="font-medium">{importResult.added}</span> 件</p>
            <p>更新: <span className="font-medium">{importResult.updated}</span> 件</p>
            {importResult.errors.length > 0 && (
              <p>エラー: <span className="font-medium text-red-600">{importResult.errors.length}</span> 件</p>
            )}
          </div>
        )}

        {allImportResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold mb-2">一括インポート結果:</h4>

            <div className="mb-2">
              <p className="font-medium">取引データ:</p>
              <p className="ml-4">新規追加: {allImportResult.transactions.added} 件, 更新: {allImportResult.transactions.updated} 件</p>
            </div>

            <div className="mb-2">
              <p className="font-medium">書類データ:</p>
              <p className="ml-4">新規追加: {allImportResult.documents.added} 件, 更新: {allImportResult.documents.updated} 件</p>
            </div>

            <div className="mb-2">
              <p className="font-medium">設定データ:</p>
              <p className="ml-4">新規追加: {allImportResult.settings.added} 件, 更新: {allImportResult.settings.updated} 件</p>
            </div>

            {(allImportResult.transactions.errors.length > 0 || 
              allImportResult.documents.errors.length > 0 || 
              allImportResult.settings.errors.length > 0) && (
              <p className="text-red-600">
                エラー: 合計 {allImportResult.transactions.errors.length + 
                            allImportResult.documents.errors.length + 
                            allImportResult.settings.errors.length} 件
              </p>
            )}
          </div>
        )}

        {/* エラー表示 */}
        {importErrors.length > 0 && (
          <div className="mt-4">
            <h4 className="font-bold text-red-600 mb-2">エラーログ:</h4>
            <div className="max-h-60 overflow-y-auto p-3 bg-red-50 border border-red-200 rounded-lg">
              <ul className="list-disc pl-4">
                {importErrors.map((error, index) => (
                  <li key={index} className="text-red-700 mb-1">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExportImport;
