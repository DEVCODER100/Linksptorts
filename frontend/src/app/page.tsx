import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Trophy, Users, Briefcase, Search, Star, Shield, ArrowRight, CheckCircle,
  FileText, Link2, ClipboardList, Download, UserCheck, BarChart2, Megaphone, Building2,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import Footer from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: "LinkSports.in — Build Your Free Sports CV | India's Sports Network",
  description:
    "Create your free Sports CV, find trials & tournaments, and get discovered by academies and clubs. India's first professional network for athletes, coaches & sports organizations.",
  alternates: { canonical: 'https://www.linksports.in/' },
  openGraph: {
    title: "LinkSports.in — India's Sports Professional Network",
    description: 'Build your free Sports CV. Get discovered by academies, scouts, and clubs across India.',
    url: 'https://www.linksports.in/',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#for-athletes" className="text-sm font-medium text-gray-600 hover:text-gray-900">For Athletes</Link>
            <Link href="#for-coaches" className="text-sm font-medium text-gray-600 hover:text-gray-900">For Coaches</Link>
            <Link href="#for-organizations" className="text-sm font-medium text-gray-600 hover:text-gray-900">For Organizations</Link>
            <Link href="/listings" className="text-sm font-medium text-gray-600 hover:text-gray-900">Opportunities</Link>
            <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">Jobs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2">Login</Link>
            <Link href="/auth/register" className="btn-primary text-sm">Join Free →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-white overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
                <Star className="w-4 h-4" />
                India's First Sports Professional Network
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6 text-gray-900">
                Where Sports Talent Meets{' '}
                <span className="text-brand">Real Opportunity</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Build your free Sports CV. Get discovered by academies, scouts, and clubs.
                Find trials, tournaments, and coaching jobs — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link
                  href="/auth/register?role=athlete"
                  className="flex items-center justify-center gap-2 bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  I'm an Athlete / Coach → Join Free
                </Link>
                <Link
                  href="/auth/register?role=organization"
                  className="flex items-center justify-center gap-2 bg-white border-2 border-brand text-brand font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  I'm an Organization → Register
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Free forever for athletes &amp; coaches</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Takes under 5 minutes</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 50+ sports supported</span>
              </div>
            </div>
            {/* Right — mock Sports CV preview */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden max-w-sm mx-auto">
                <div className="bg-brand px-6 py-3 flex items-center justify-between">
                  <span className="text-white text-xs font-semibold tracking-wide">SPORTS CV</span>
                  <span className="text-blue-200 text-xs">@arjun-sharma</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-brand font-bold text-base flex-shrink-0">AS</div>
                    <div>
                      <h3 className="font-bold text-gray-900">Arjun Sharma</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="bg-blue-50 text-brand text-xs font-medium px-2 py-0.5 rounded-full">Football · Midfielder</span>
                        <span className="text-gray-400 text-xs">Vadodara, Gujarat</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ v: '47', l: 'Matches' }, { v: '12', l: 'Goals' }, { v: '3', l: 'Medals' }].map(({ v, l }) => (
                      <div key={l} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-bold text-gray-900">{v}</p>
                        <p className="text-xs text-gray-400">{l}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Achievements</p>
                  <ul className="space-y-1.5 mb-4">
                    {[
                      { icon: '🥇', text: 'Gujarat State U-19 Championship 2024 — Winner' },
                      { icon: '🏆', text: 'District Level Best Player Award 2023' },
                      { icon: '⚽', text: 'Reliance Foundation League — Top Scorer' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-xs text-gray-700">
                        <span>{icon}</span><span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <Link2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-brand truncate">@arjun-sharma</span>
                    <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded">Copy</span>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="flex justify-center mt-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-full px-4 py-1.5 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Discovered by 3 academies</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-brand" />
                  <span className="text-xs font-medium text-brand">2 trial invites</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Strip */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">The Problem We're Solving</p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { value: '95%', desc: 'of grassroots athletes in India have zero digital record of their achievements' },
              { value: '80%', desc: 'higher cost of physical scouting compared to digital pre-shortlisting' },
              { value: '0', desc: 'platforms exist in India that connect athletes, coaches, and organizations in one place' },
            ].map(({ value, desc }) => (
              <div key={value} className="text-center p-8 bg-gray-800 rounded-2xl">
                <p className="text-5xl font-bold text-brand mb-3">{value}</p>
                <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Achievements live in paper certificates. Scouting happens on WhatsApp.
            Talented athletes in Tier-2 and Tier-3 cities stay invisible. We're changing that.
          </p>
        </div>
      </section>

      {/* What is LinkSports */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">LinkSports.in</span> is India's first all-in-one platform where athletes build their Sports CV,
            coaches find jobs, and organizations discover talent — across 50+ sports.
          </p>
        </div>
      </section>

      {/* For Athletes */}
      <section className="py-20 bg-gray-50" id="for-athletes">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-brand uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full mb-4">
                For Athletes & Players
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Your Achievements Deserve More Than a Paper Certificate
              </h2>
              <p className="text-gray-500 mb-8">
                Build a professional Sports CV in minutes — free, forever.
                Share one link with any scout, coach, academy, or sponsor.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: Trophy, text: 'Sports CV Builder — Achievements, tournaments, medals, stats, highlight videos — all in one profile' },
                  { icon: Link2, text: 'One Shareable Link — Send your Sports CV to scouts, academies, sponsors, selection committees' },
                  { icon: Search, text: 'Get Discovered — Academies and clubs search for athletes by sport, age, location, and achievement level' },
                  { icon: ClipboardList, text: 'Apply to Trials & Events — Find and apply to open trials, tournaments, and selection camps across India' },
                  { icon: Download, text: 'Download as PDF — Export your Sports CV as a professional PDF for offline use' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?role=athlete" className="btn-primary inline-flex items-center gap-2">
                Create Your Free Sports CV <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-gray-400 mt-3">Free forever. No credit card. No hidden fees. Under 5 minutes to set up.</p>
            </div>
            {/* Mock Sports CV Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {/* Card header */}
              <div className="bg-brand px-6 py-4 flex items-center justify-between">
                <span className="text-white text-xs font-semibold tracking-wide">SPORTS CV</span>
                <span className="text-blue-200 text-xs">@arjun-sharma</span>
              </div>
              {/* Profile */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-brand font-bold text-lg flex-shrink-0">AS</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Arjun Sharma</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="bg-blue-50 text-brand text-xs font-medium px-2 py-0.5 rounded-full">Football · Midfielder</span>
                      <span className="text-gray-400 text-xs">Vadodara, Gujarat</span>
                    </div>
                  </div>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ v: '47', l: 'Matches' }, { v: '12', l: 'Goals' }, { v: '3', l: 'Medals' }].map(({ v, l }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-gray-900">{v}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                {/* Achievements */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Achievements</p>
                <ul className="space-y-2 mb-5">
                  {[
                    { icon: '🥇', text: 'Gujarat State U-19 Championship 2024 — Winner' },
                    { icon: '🏆', text: 'District Level Best Player Award 2023' },
                    { icon: '⚽', text: 'Reliance Foundation League — Top Scorer' },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-start gap-2 text-xs text-gray-700">
                      <span>{icon}</span><span>{text}</span>
                    </li>
                  ))}
                </ul>
                {/* Shareable link */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-brand truncate">@arjun-sharma</span>
                  <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded cursor-pointer hover:bg-gray-100">Copy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Coaches */}
      <section className="py-20 bg-white" id="for-coaches">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Mock Coaching Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden order-2 md:order-1">
              <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
                <span className="text-white text-xs font-semibold tracking-wide">COACHING PROFILE</span>
                <span className="text-purple-200 text-xs">@coach-ravi</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg flex-shrink-0">RK</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Ravi Kumar</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">Football Coach</span>
                      <span className="text-gray-400 text-xs">12 yrs experience</span>
                    </div>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ v: '200+', l: 'Athletes Trained' }, { v: 'AFC D', l: 'Certification' }, { v: '8', l: 'State Titles' }].map(({ v, l }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-base font-bold text-gray-900 leading-tight">{v}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                {/* Linked athletes */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Linked Athletes</p>
                <ul className="space-y-2 mb-5">
                  {[
                    { initials: 'AS', name: 'Arjun Sharma', tag: 'Gujarat U-19 Captain' },
                    { initials: 'PR', name: 'Priya Rao', tag: 'National Camp, 2023' },
                    { initials: 'MK', name: 'Mohit Kadam', tag: 'Reliance Foundation Select' },
                  ].map(({ initials, name, tag }) => (
                    <li key={name} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">{initials}</div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{tag}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-purple-600 truncate">@coach-ravi</span>
                  <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded cursor-pointer hover:bg-gray-100">Copy</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full mb-4">
                For Coaches & PE Teachers
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Great Coaches Deserve to Be Found — Not Just Referred
              </h2>
              <p className="text-gray-500 mb-8">
                Build your coaching profile. Apply to jobs at schools, academies, and clubs.
                Let your track record speak — link to athletes you've developed.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: FileText, text: 'Coaching CV Builder — Qualifications, certifications, experience, coaching philosophy — all documented' },
                  { icon: Users, text: "Linked Athlete Profiles — Your trained athletes' success IS your track record. Link their profiles to yours." },
                  { icon: Briefcase, text: 'Sports Job Board — Find coaching positions, PE teacher openings, and trainer roles across India' },
                  { icon: Building2, text: 'Get Hired by Institutions — Schools, academies, and clubs search for verified coaches on LinkSports' },
                  { icon: BarChart2, text: 'Track Your Impact — See who views your profile and which institutions are searching for coaches like you' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?role=coach"
                className="inline-flex items-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Build Your Coaching Profile — Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Organizations */}
      <section className="py-20 bg-gray-50" id="for-organizations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-orange-600 uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full mb-4">
                For Academies, Clubs & Schools
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Stop Scouting on WhatsApp. Start Scouting on LinkSports.
              </h2>
              <p className="text-gray-500 mb-8">
                Post trials, search athletes, hire coaches — from one verified dashboard.
                Digital pre-shortlisting saves 80% compared to physical-only scouting.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: Search, text: 'Talent Search — Filter athletes by sport, age, location, achievement level, and position' },
                  { icon: Megaphone, text: 'Post Trials & Events — List your open trials and tournaments. Athletes apply with complete Sports CVs.' },
                  { icon: UserCheck, text: 'Hire Coaches — Search verified coaching profiles with real qualifications and linked athlete track records' },
                  { icon: BarChart2, text: 'Applicant Dashboard — Review applications, shortlist candidates, and export data to CSV' },
                  { icon: Shield, text: 'Verified Badge — Document-verified organizations earn trust from athletes and parents' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-orange-600" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?role=organization"
                className="inline-flex items-center gap-2 bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors"
              >
                Register Your Organization <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-gray-400 mt-3">Event and trial listings start at just ₹50. Organization registration is free.</p>
            </div>
            {/* Mock applicant management card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              <div className="bg-orange-600 px-6 py-3 flex items-center justify-between">
                <span className="text-white text-xs font-semibold tracking-wide">APPLICANT DASHBOARD</span>
                <span className="text-orange-200 text-xs">Hindustan United FC</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-900">U-29 Trial — Applicants</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">24 applied</span>
                </div>
                <div className="space-y-2.5 mb-4">
                  {[
                    { name: 'Arjun Sharma', sport: 'Football · Midfielder', status: 'Shortlisted', color: 'bg-green-100 text-green-700' },
                    { name: 'Rohit Patel', sport: 'Football · Striker', status: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
                    { name: 'Priya Nair', sport: 'Football · Defender', status: 'Shortlisted', color: 'bg-green-100 text-green-700' },
                    { name: 'Suresh Yadav', sport: 'Football · Goalkeeper', status: 'Rejected', color: 'bg-red-100 text-red-600' },
                  ].map(({ name, sport, status, color }) => (
                    <div key={name} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold flex-shrink-0">
                        {name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{sport}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{status}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  {[{ v: '8', l: 'Shortlisted' }, { v: '12', l: 'Reviewing' }, { v: '4', l: 'Rejected' }].map(({ v, l }) => (
                    <div key={l} className="text-center">
                      <p className="text-base font-bold text-gray-900">{v}</p>
                      <p className="text-xs text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Get Started in 3 Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {[
              { step: '1', emoji: '📱', title: 'Create Your Profile', desc: 'Sign up free. Choose your role — athlete, coach, or organization. Fill in your details, achievements, and upload highlights.' },
              { step: '2', emoji: '🔗', title: 'Share & Get Discovered', desc: 'Your profile gets a unique shareable link. Organizations and scouts can search and find you by sport, location, and level.' },
              { step: '3', emoji: '🎯', title: 'Find Opportunities', desc: 'Browse trials, tournaments, and jobs. Apply with one click. Your complete Sports CV is attached automatically.' },
            ].map(({ step, emoji, title, desc }) => (
              <div key={step} className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {step}
                </div>
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2">
              Join LinkSports Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything the Indian Sports Ecosystem Needs — In One Place</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Sports CV & Profiles', desc: 'Build a professional digital sports identity with achievements, media, career history, and stats. Download as PDF anytime.', color: 'bg-blue-50 text-blue-600' },
              { icon: Search, title: 'Trials & Tournaments', desc: 'Discover and apply to trials, selection camps, and tournaments across India. Never miss an opportunity again.', color: 'bg-green-50 text-green-600' },
              { icon: Briefcase, title: 'Sports Job Board', desc: 'Find coaching positions, PE teacher jobs, trainer roles, and sports management openings. One-click apply.', color: 'bg-purple-50 text-purple-600' },
              { icon: Shield, title: 'Verified Organizations', desc: 'Every academy and club is document-verified. Athletes and parents can trust who they connect with.', color: 'bg-orange-50 text-orange-600' },
              { icon: Trophy, title: 'Professional Networking', desc: 'Connect with coaches, athletes, and organizations. Build meaningful sports relationships that advance your career.', color: 'bg-red-50 text-red-600' },
              { icon: Star, title: 'Multi-Sport Platform', desc: 'Cricket, football, kabaddi, badminton, athletics, swimming, hockey, wrestling, boxing — and 40+ more sports supported.', color: 'bg-yellow-50 text-yellow-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof — Ecosystem Stats + Founder Quote */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">Built for India's Sports Ecosystem</p>
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-14 text-center">
            {[
              { value: '50+', label: 'Sports Supported' },
              { value: '10,000+', label: 'Academies Across India' },
              { value: '500,000+', label: 'Competitive Athletes in Gujarat Alone' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-brand">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <p className="text-4xl text-gray-300 leading-none mb-4">"</p>
            <p className="text-gray-700 leading-relaxed italic mb-6">
              We built LinkSports because we saw talented athletes in Tier-2 cities
              with zero digital presence — while scouts spent lakhs traveling to find
              what a search filter could show them in seconds.
            </p>
            <p className="text-sm font-semibold text-gray-900">— Sumit Bist, Founder, LinkSports.in</p>
          </div>
        </div>
      </section>

      {/* Sports Supported */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">One Platform. Every Sport. Every Level.</h2>
          <p className="text-gray-500 text-sm mb-8">
            LinkSports supports athletes and coaches at every stage of their journey.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Cricket', 'Football', 'Kabaddi', 'Badminton', 'Athletics', 'Swimming',
              'Hockey', 'Wrestling', 'Boxing', 'Table Tennis', 'Tennis', 'Volleyball',
              'Basketball', 'Handball', 'Cycling', 'Shooting', 'Archery', 'Judo',
              'Weightlifting', 'Gymnastics', 'Rowing', 'Fencing', 'Taekwondo',
              'Chess', 'Carrom', 'Kho-Kho', '+ 25 more →',
            ].map((sport) => (
              <span
                key={sport}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-brand hover:text-brand transition-colors cursor-default"
              >
                {sport}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6">From school level to professional. From local tournaments to national selection.</p>
        </div>
      </section>

      {/* Early Adopter CTA */}
      <section className="py-20 bg-brand text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Be Among the First on India's Sports Network</h2>
          <p className="text-blue-100 mb-6">LinkSports.in is just getting started — and that's exactly why now is the time to join.</p>
          <ul className="text-left space-y-3 mb-8 max-w-xl mx-auto">
            {[
              'Early athletes get the most visibility when scouts and academies come searching.',
              'Early coaches build the strongest profiles before the job board gets crowded.',
              "Early organizations get the first pick of India's emerging talent pipeline.",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-blue-100 text-sm">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="text-white font-medium mb-8">The best time to create your Sports CV was yesterday. The second best time is now.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="bg-white text-brand font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Create Free Profile →
            </Link>
            <Link href="/auth/register?role=organization" className="bg-blue-600 border border-blue-400 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-500 transition-colors">
              Register Organization →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'What is LinkSports.in?',
                a: "LinkSports.in is India's first professional networking platform built specifically for the sports ecosystem. Athletes create their Sports CV, coaches build professional profiles and find jobs, and organizations discover talent, post trials, and hire coaches — all in one place. Think of it as LinkedIn, but designed for sports professionals across 50+ disciplines.",
              },
              {
                q: 'Is it really free for athletes and coaches?',
                a: "Yes — 100% free, forever. Athletes and coaches can create profiles, build their Sports CV, apply to trials and jobs, and get discovered by organizations at no cost. We believe that access to opportunity should never be a barrier. Organizations pay a small fee (starting at ₹50) to post listings and access advanced search features.",
              },
              {
                q: 'What is a Sports CV?',
                a: 'A Sports CV is your complete digital sports identity — your achievements, tournaments, medals, playing stats, highlight videos, coaching certifications, and career history, all organized in one professional profile with a shareable link. Unlike a paper certificate or an Instagram post, a Sports CV is searchable, verifiable, and designed for scouts, academies, and employers to find you.',
              },
              {
                q: 'Which sports are supported?',
                a: "LinkSports supports 50+ sports including cricket, football, kabaddi, badminton, athletics, swimming, hockey, wrestling, boxing, table tennis, tennis, basketball, volleyball, and many more. Whether you compete at school level or professional level, there's a place for you on LinkSports.",
              },
              {
                q: 'How do organizations use LinkSports?',
                a: "Organizations — including sports academies, schools, clubs, and event organizers — can register on LinkSports to search for athletes and coaches using advanced filters (sport, age, location, achievement level), post open trials and tournaments, manage applicant pipelines, and hire verified coaching staff. It's the most efficient way to scout talent digitally before investing in physical trials.",
              },
              {
                q: "I'm a coach looking for a job. Can LinkSports help?",
                a: "Absolutely. LinkSports has a dedicated sports job board where schools, academies, and clubs post coaching positions, PE teacher openings, and trainer roles. You can create your coaching profile (with linked athlete track records), set your preferences, and apply to positions with one click. Your complete coaching CV is shared automatically.",
              },
              {
                q: 'How is LinkSports different from LinkedIn or Instagram?',
                a: 'LinkedIn is a general professional network — it doesn\'t have sport-specific features like Sports CVs, trial listings, achievement tracking, or scouting filters. Instagram is great for highlights but not searchable by scouts looking for "left-handed batsman, age 17, Gujarat." LinkSports is purpose-built for the sports ecosystem with tools that neither LinkedIn nor Instagram can offer.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 transition-colors list-none">
                  <span>{q}</span>
                  <span className="ml-4 text-gray-400 text-xl flex-shrink-0">+</span>
                </summary>
                <div className="px-5 pb-5 border-t border-gray-100">
                  <p className="pt-4 text-sm text-gray-600 leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Sports Career Starts Here</h2>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            Whether you're an athlete looking to get discovered, a coach seeking your next role,
            or an organization searching for talent — LinkSports is where it all connects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link href="/auth/register?role=athlete" className="btn-primary inline-flex items-center justify-center gap-2">
              I'm an Athlete <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register?role=coach"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              I'm a Coach <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register?role=organization"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:border-gray-300 transition-colors"
            >
              I'm an Organization <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-gray-400">Free for athletes and coaches. Always.</p>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* FAQ Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'What is LinkSports.in?', acceptedAnswer: { '@type': 'Answer', text: "LinkSports.in is India's first professional networking platform built specifically for the sports ecosystem." } },
              { '@type': 'Question', name: 'Is it really free for athletes and coaches?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — 100% free, forever. Athletes and coaches can create profiles, build their Sports CV, apply to trials and jobs, and get discovered by organizations at no cost.' } },
              { '@type': 'Question', name: 'What is a Sports CV?', acceptedAnswer: { '@type': 'Answer', text: 'A Sports CV is your complete digital sports identity — achievements, tournaments, medals, playing stats, highlight videos, coaching certifications, and career history in one professional profile with a shareable link.' } },
              { '@type': 'Question', name: 'Which sports are supported?', acceptedAnswer: { '@type': 'Answer', text: 'LinkSports supports 50+ sports including cricket, football, kabaddi, badminton, athletics, swimming, hockey, wrestling, boxing, and many more.' } },
            ],
          }),
        }}
      />
    </div>
  );
}
