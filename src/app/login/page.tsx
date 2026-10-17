import { redirect } from 'next/navigation';
import { getAccessSession } from '@/lib/access-session';
import LoginForm from './login-form';

export const metadata = { title: 'ログイン | 血統書管理' };

export default async function LoginPage() {
  if (await getAccessSession()) redirect('/pedigrees');
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
      <h1 className="text-xl font-bold">血統書管理</h1>
      <p className="mb-6 mt-2 text-sm text-slate-600">登録済みのメールアドレスでログインしてください。</p>
      <LoginForm />
    </div>
  </main>;
}
