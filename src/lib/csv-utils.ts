// lib/csv-utils.ts
import { saveAs } from 'file-saver';
import { openAccountingDB } from '@/lib/indexedDB';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  memo: string;
  createdAt: string;
}

/**
 * トランザクションデータをCSV形式でエクスポートする
 */
export async function exportTransactionsToCSV(): Promise<void> {
  const db = await openAccountingDB();
  const transactions = await db.getAll('transactions');

  if (transactions.length === 0) {
    throw new Error('エクスポートするトランザクションがありません');
  }

  // CSVヘッダー行
  const headers = ['id', 'date', 'description', 'amount', 'debitAccount', 'creditAccount', 'memo', 'createdAt'];

  // CSVデータ作成
  let csvContent = headers.join(',') + '\n';

  transactions.forEach(transaction => {
    const row = [
      transaction.id,
      transaction.date,
      escapeCsvValue(transaction.description),
      transaction.amount,
      escapeCsvValue(transaction.debitAccount),
      escapeCsvValue(transaction.creditAccount),
      escapeCsvValue(transaction.memo || ''),
      transaction.createdAt
    ];
    csvContent += row.join(',') + '\n';
  });

  // Blobの作成とダウンロード
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(blob, `accounting-transactions-${timestamp}.csv`);
}

/**
 * CSV値のエスケープ処理
 * カンマやダブルクォートを含む値を適切に処理する
 */
function escapeCsvValue(value: string): string {
  if (!value) return '';

  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // 既存のダブルクォートはエスケープ
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * CSVファイルからトランザクションデータをインポートする
 */
export async function importTransactionsFromCSV(file: File): Promise<{ added: number; updated: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        if (!csvText) {
          reject(new Error('CSVファイルの読み込みに失敗しました'));
          return;
        }
        
        const result = await processCSVImport(csvText);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込み中にエラーが発生しました'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * CSVテキストを処理してデータベースにインポートする
 */
async function processCSVImport(csvText: string): Promise<{ added: number; updated: number; errors: string[] }> {
    const db = await openAccountingDB();
    const lines = csvText.split('\n');

    if (lines.length < 2) {
        throw new Error('インポートするデータがありません');
    }

    const headers = parseCSVLine(lines[0]);
    const expectedHeaders = ['id', 'date', 'description', 'amount', 'debitAccount', 'creditAccount', 'memo', 'createdAt'];

    // ヘッダーの検証
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
        throw new Error(`必須ヘッダーが不足しています: ${missingHeaders.join(', ')}`);
    }

    let added = 0;
    let updated = 0;
    const errors: string[] = [];
    const tx = db.transaction('transactions', 'readwrite');

    // ヘッダー行をスキップして処理
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
        const values = parseCSVLine(line);

        // 行の値が不足している場合はスキップ
        if (values.length < expectedHeaders.length) {
            errors.push(`行 ${i+1}: 値が不足しています`);
            continue;
        }

        const transaction: Partial<Transaction> = {};
        headers.forEach((header, index) => {
            if (header === 'amount') {
                const parsedAmount = parseFloat(values[index]);
                if (isNaN(parsedAmount)) {
                    throw new Error(`金額の形式が正しくありません: ${values[index]}`);
                }
                transaction.amount = parsedAmount;
            } else {
                (transaction as Record<string, string | undefined>)[header] = values[index];
            }
        });

        // 必須フィールドの検証
        if (!transaction.id || !transaction.date || !transaction.description || 
            transaction.amount === undefined || isNaN(transaction.amount) || 
            !transaction.debitAccount || !transaction.creditAccount) {
            throw new Error('必須フィールドが不足しています');
        }

        // データベースに既存のトランザクションを確認
        const existingTransaction = await tx.store.get(transaction.id);
        // 必須フィールドがすべて揃っていることを確認後、Transaction 型にキャスト
        const completeTransaction: Transaction = transaction as Transaction;

        if (existingTransaction) {
            await tx.store.put(completeTransaction);
            updated++;
        } else {
            await tx.store.add(completeTransaction);
            added++;
        }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
            errors.push(`行 ${i+1}: ${errorMessage}`);
        }
    }
    
    await tx.done;
    
    return { added, updated, errors };
}

/**
 * CSVの1行をパースする関数
 * カンマ区切りの値を適切に処理する（ダブルクォートで囲まれた値など）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // ダブルクォートのエスケープ処理
      if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
        current += '"';
        i++; // エスケープされたダブルクォートをスキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // カンマ区切りの処理（クォート外のみ）
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // 最後の値を追加
  result.push(current);
  
  return result;
}

/**
 * ドキュメントをCSV形式でエクスポート
 */
export async function exportDocumentsToCSV(): Promise<void> {
  const db = await openAccountingDB();
  const documents = await db.getAll('documents');
  
  if (documents.length === 0) {
    throw new Error('エクスポートするドキュメントがありません');
  }
  
  // CSVヘッダー行
  const headers = ['id', 'type', 'date'];
  
  // CSVデータ作成
  let csvContent = headers.join(',') + '\n';
  
  documents.forEach(document => {
    const row = [
      document.id,
      escapeCsvValue(document.type),
    ];
    csvContent += row.join(',') + '\n';
  });
  
  // Blobの作成とダウンロード
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(blob, `accounting-documents-${timestamp}.csv`);
}

/**
 * 設定データをCSV形式でエクスポート
 */
export async function exportSettingsToCSV(): Promise<void> {
  const db = await openAccountingDB();
  const settings = await db.getAll('settings');
  
  if (settings.length === 0) {
    throw new Error('エクスポートする設定がありません');
  }
  
  // CSVヘッダー行
  const headers = ['id', 'value'];
  
  // CSVデータ作成
  let csvContent = headers.join(',') + '\n';
  
  settings.forEach(setting => {
    const row = [
      setting.id,
      escapeCsvValue(JSON.stringify(setting.value))
    ];
    csvContent += row.join(',') + '\n';
  });
  
  // Blobの作成とダウンロード
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(blob, `accounting-settings-${timestamp}.csv`);
}

/**
 * すべてのデータを一括でエクスポート（Zipファイル化）
 */
export async function exportAllData(): Promise<void> {
  try {
    // JSZipをダイナミックインポート
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const db = await openAccountingDB();
    
    // トランザクションデータ
    const transactions = await db.getAll('transactions');
    if (transactions.length > 0) {
      const headers = ['id', 'date', 'description', 'amount', 'debitAccount', 'creditAccount', 'memo', 'createdAt'];
      let csvContent = headers.join(',') + '\n';
      
      transactions.forEach(transaction => {
        const row = [
          transaction.id,
          transaction.date,
          escapeCsvValue(transaction.description),
          transaction.amount,
          escapeCsvValue(transaction.debitAccount),
          escapeCsvValue(transaction.creditAccount),
          escapeCsvValue(transaction.memo || ''),
          transaction.createdAt
        ];
        csvContent += row.join(',') + '\n';
      });
      
      zip.file('transactions.csv', csvContent);
    }
    
    // ドキュメントデータ
    const documents = await db.getAll('documents');
    if (documents.length > 0) {
      const headers = ['id', 'type', 'date'];
      let csvContent = headers.join(',') + '\n';
      
      documents.forEach(document => {
        const row = [
          document.id,
          escapeCsvValue(document.type),
        ];
        csvContent += row.join(',') + '\n';
      });
      
      zip.file('documents.csv', csvContent);
    }
    
    // 設定データ
    const settings = await db.getAll('settings');
    if (settings.length > 0) {
      const headers = ['id', 'value'];
      let csvContent = headers.join(',') + '\n';
      
      settings.forEach(setting => {
        const row = [
          setting.id,
          escapeCsvValue(JSON.stringify(setting.value))
        ];
        csvContent += row.join(',') + '\n';
      });
      
      zip.file('settings.csv', csvContent);
    }
    
    // ZIPファイルの生成とダウンロード
    const content = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `accounting-data-backup-${timestamp}.zip`);
  } catch (error) {
    console.error('データのエクスポート中にエラーが発生しました', error);
    throw error;
  }
}

/**
 * ZIPファイルからすべてのデータをインポート
 */
export async function importAllDataFromZip(file: File): Promise<{ 
  transactions: { added: number; updated: number; errors: string[] }; 
  documents: { added: number; updated: number; errors: string[] }; 
  settings: { added: number; updated: number; errors: string[] } 
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) return;
        // JSZipをダイナミックインポート
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(e.target?.result);
        
        const result = {
          transactions: { added: 0, updated: 0, errors: [] as string[] },
          documents: { added: 0, updated: 0, errors: [] as string[] },
          settings: { added: 0, updated: 0, errors: [] as string[] }
        };
        
        // トランザクションデータの処理
        const transactionsFile = zip.file('transactions.csv');
        if (transactionsFile) {
          const csvText = await transactionsFile.async('string');
          result.transactions = await processCSVImport(csvText);
        }

        // ドキュメントデータの処理
        const documentsFile = zip.file('documents.csv');
        if (documentsFile) {
          const csvText = await documentsFile.async('string');
          result.documents = await processCSVImport(csvText);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込み中にエラーが発生しました'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
