'use client';

export default function PedigreeError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-lg rounded border bg-white p-6">
    <h1 className="mb-3 text-lg font-bold">血統情報を開けませんでした</h1>
    <p className="mb-4">通信状態を確認して、もう一度お試しください。</p>
    <button className="action-primary" onClick={reset}>再読み込み</button>
  </div>;
}
