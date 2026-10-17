import { requirePedigreeAccess } from '@/lib/access-session';
import { logout } from '@/actions/authActions';

export default async function PedigreesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePedigreeAccess();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <header className="app-header flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 md:px-6">
        <a href="/pedigrees" className="text-lg font-bold">血統書管理</a>
        <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="主な操作">
          <a href="/pedigrees" className="text-blue-700 hover:underline">一覧・検索</a>
          <a href="/pedigrees/new" className="text-blue-700 hover:underline">新規登録</a>
          <span className="hidden text-xs text-gray-500 lg:inline">{session.email}</span>
          <form action={logout}><button className="text-gray-600 hover:underline">ログアウト</button></form>
        </nav>
      </header>
      <main className="app-main flex flex-grow flex-col p-3 md:p-6">
        {children}
      </main>
    </div>
  );
}
