import Link from 'next/link';

export default function PedigreesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Cat Pedigree System</h1>
        <nav className="space-x-4">
          <Link href="/pedigrees" className="text-blue-600 hover:underline">List & Search</Link>
          <Link href="/pedigrees/new" className="text-blue-600 hover:underline">New Registration</Link>
        </nav>
      </header>
      <main className="flex-grow p-6 flex flex-col">
        {children}
      </main>
    </div>
  );
}
