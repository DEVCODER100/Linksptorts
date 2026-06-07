import Link from 'next/link';
import Logo from './Logo';

const FOOTER_LINKS = [
  {
    title: 'Platform',
    links: [
      { label: 'Sports CV Builder', href: '/auth/register?role=athlete' },
      { label: 'Trials & Tournaments', href: '/listings' },
      { label: 'Sports Job Board', href: '/jobs' },
      { label: 'Search Athletes', href: '/search' },
      { label: 'Search Coaches', href: '/search?type=coach' },
    ],
  },
  {
    title: 'For You',
    links: [
      { label: 'For Athletes', href: '/auth/register?role=athlete' },
      { label: 'For Coaches & PE Teachers', href: '/auth/register?role=coach' },
      { label: 'For Academies', href: '/auth/register?role=organization' },
      { label: 'For Schools & Clubs', href: '/auth/register?role=organization' },
      { label: 'For Event Organizers', href: '/auth/register?role=organization' },
    ],
  },
  {
    title: 'Sports',
    links: [
      { label: 'Cricket', href: '/listings?sport=Cricket' },
      { label: 'Football', href: '/listings?sport=Football' },
      { label: 'Kabaddi', href: '/listings?sport=Kabaddi' },
      { label: 'Badminton', href: '/listings?sport=Badminton' },
      { label: 'All 50+ Sports →', href: '/listings' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'support@linksports.in', href: 'mailto:support@linksports.in' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="hover:opacity-90 transition-opacity mb-4 block">
              <Logo className="scale-75 origin-left" />
            </Link>
            <p className="text-xs leading-relaxed">
              India's Sports Professional Network. Where Sports Meets Opportunity.
            </p>
          </div>
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-medium mb-3 text-sm">{title}</h4>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2026 LinkSports.in. All rights reserved.</p>
          <p className="text-xs">Made with ❤️ for India's sports ecosystem</p>
        </div>
      </div>
    </footer>
  );
}
