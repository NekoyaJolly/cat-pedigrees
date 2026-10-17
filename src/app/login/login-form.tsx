'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { requestLoginEmail, verifyLoginCode } from '@/actions/authActions';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    startTransition(async () => {
      try {
        const result = await requestLoginEmail(email);
        if (result.ok) setSent(true); else setError(result.message);
      } catch { setError('通信を確認して、もう一度お試しください。'); }
    });
  }
  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    startTransition(async () => {
      try {
        const result = await verifyLoginCode(email, code);
        if (result.ok) { router.replace('/pedigrees'); router.refresh(); }
        else setError(result.message);
      } catch { setError('ログインできませんでした。もう一度お試しください。'); }
    });
  }
  return <div>
    <form onSubmit={send} className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="login-email">メールアドレス</label>
      <input id="login-email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded border border-slate-400 p-3" value={email} onChange={event => { setEmail(event.target.value); setSent(false); setError(''); }} disabled={pending} />
      <button className="action-primary w-full" disabled={pending}>{pending ? '確認しています…' : sent ? 'ログインメールを送り直す' : 'ログインメールを送る'}</button>
    </form>
    {sent ? <div role="status" className="mt-5 text-sm">
      <p>届いたメールのリンクを開いてください。確認コードが記載されている場合は、こちらにも入力できます。</p>
      <form onSubmit={verify} className="mt-4 space-y-3">
        <label className="block font-medium" htmlFor="login-code">確認コード</label>
        <input id="login-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,10}" maxLength={10} className="w-full rounded border border-slate-400 p-3" value={code} onChange={event => setCode(event.target.value)} disabled={pending} />
        <button className="action-primary w-full" disabled={pending}>ログイン</button>
      </form>
    </div> : null}
    {error ? <p role="alert" className="mt-4 text-sm text-red-800">{error}</p> : null}
  </div>;
}
