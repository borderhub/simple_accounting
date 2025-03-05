import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  
  const navItems: NavItem[] = [
    { href: '/', label: 'ホーム' },
    { href: '/transactions', label: '仕訳入力' },
    { href: '/documents', label: '帳票作成' },
    { href: '/reports', label: '財務レポート' },
    { href: '/data-management', label: 'データ管理' },
    // TODO: 内容決まるまで一旦非表示
    // { href: '/settings', label: '設定' }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>簡易会計システム</title>
        <meta name="description" content="簡易会計・確定申告支援システム" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="bg-white shadow">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              簡易会計システム
            </Link>
            
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={`${
                        router.pathname === item.href 
                          ? 'text-blue-500 font-medium' 
                          : 'text-gray-600 hover:text-blue-500'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <button className="md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow py-6">
        {children}
      </main>
      
      <footer className="bg-white shadow-inner mt-auto">
        <div className="container mx-auto p-4 text-center text-gray-600">
          <p>&copy; 2025 簡易会計システム</p>
        </div>
      </footer>
    </div>
  );
}
