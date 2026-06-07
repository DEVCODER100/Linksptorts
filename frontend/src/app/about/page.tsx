import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/shared/Footer';
import PublicHeader from '@/components/shared/PublicHeader';
import { Trophy, Users, Briefcase, Target, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: "Learn about LinkSports.in — India's first professional sports networking platform connecting athletes, coaches, and organizations.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About LinkSports</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            India's first professional network built exclusively for the sports ecosystem —
            connecting athletes, coaches, and organizations in one place.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              95% of grassroots athletes in India lack a digital record of their achievements.
              Talented players get overlooked not because of a lack of skill, but a lack of visibility.
              We built LinkSports to change that — giving every athlete, coach, and sports organization
              a professional digital presence and real pathways to opportunity.
            </p>
          </div>
        </section>

        {/* What we do */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What We Do</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Trophy,
                title: 'For Athletes',
                desc: 'Build a free Sports CV, apply to trials and tournaments, get discovered by academies and scouts.',
                color: 'text-emerald-600 bg-emerald-50',
              },
              {
                icon: Users,
                title: 'For Coaches',
                desc: 'Create a coaching profile, find athletes, connect with clubs and academies, and grow your career.',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Briefcase,
                title: 'For Organizations',
                desc: 'Post trials, events, and jobs. Discover talent across India. Manage applications in one dashboard.',
                color: 'text-purple-600 bg-purple-50',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Built for India's Sports Ecosystem</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <p>
              LinkSports was born from a simple belief: sports talent shouldn't be gated behind geography,
              connections, or the ability to afford physical scouting trips. Every player in every district
              deserves a shot.
            </p>
            <p>
              We support 50+ sports across India — from cricket and football to kabaddi, badminton, athletics,
              wrestling, and many more. Our platform is free for athletes and coaches, always.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gray-50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h2>
          <p className="text-gray-600 mb-4">
            Questions, partnerships, or feedback — we'd love to hear from you.
          </p>
          <a
            href="mailto:support@linksports.in"
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
          >
            support@linksports.in
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
