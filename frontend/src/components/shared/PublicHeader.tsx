'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="hover:opacity-90 transition-opacity flex-shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/listings" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Opportunities</Link>
          <Link href="/listings?tab=jobs" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Jobs</Link>
          <Link href="/search" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Network</Link>
          <Link href="/auth/login" className="ml-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
          <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">Join Free</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/listings" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Opportunities</Link>
            <Link href="/listings?tab=jobs" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Jobs</Link>
            <Link href="/search" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Network</Link>
            <Link href="/about" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>About</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Contact</Link>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link href="/auth/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>Login</Link>
              <Link href="/auth/register" className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-dark text-center" onClick={() => setIsOpen(false)}>Join Free</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
