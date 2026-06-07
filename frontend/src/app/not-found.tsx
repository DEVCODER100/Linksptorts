import Link from 'next/link';
import Logo from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-8xl font-bold text-brand mb-4">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary px-6 py-2.5">
              Go to Homepage
            </Link>
            <Link href="/listings" className="btn-secondary px-6 py-2.5">
              Browse Opportunities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
