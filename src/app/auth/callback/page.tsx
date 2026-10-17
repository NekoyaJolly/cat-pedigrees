'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeLinkLogin } from '@/actions/authActions';

export default function LoginCallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get('access_token');
    // 確認用トークンを履歴に残さず、サーバーで本人確認する。
    window.history.replaceState(null, '', '/auth/callback');
    if (!token) { setError('メールのリンクが無効です。ログインメールを送り直してください。'); return; }
    void completeLinkLogin(token).then(result => {
      if (result.ok) { router.replace('/pedigrees'); router.refresh(); }
      else setError(result.message);
    }).catch(() => setError('通信を確認して、ログインからやり直してください。'));
  }, [router]);
  return <main className="mx-auto max-w-lg p-8">
    <h1 className="mb-4 text-xl font-bold">ログインの確認</h1>
    {error ? <><p role="alert">{error}</p><a className="mt-4 inline-block text-blue-700 underline" href="/login">ログインに戻る</a></> : <p role="status">確認しています…</p>}
  </main>;
}
