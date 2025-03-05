import React from 'react';
import { NextPage } from 'next';
import Layout from '@/components/Layout';
import DataExportImport from '@/components/DataExportImport';

const DataManagementPage: NextPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">データ管理</h1>

        <div className="mb-6">
          <p className="mb-4">
            このページでは、会計データのバックアップとリストアが行えます。
            定期的なバックアップをお勧めします。
          </p>
        </div>

        <DataExportImport />
      </div>
    </Layout>
  );
};

export default DataManagementPage;
