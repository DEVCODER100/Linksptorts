import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/shared/Footer';
import PublicHeader from '@/components/shared/PublicHeader';
import { Mail, MessageSquare, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the LinkSports team. We\'d love to hear from you — whether it\'s a question, partnership inquiry, or feedback.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-lg text-gray-600">
            Questions, partnerships, or feedback — we&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact options */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
            <p className="text-sm text-gray-600 mb-4">
              For general enquiries, partnerships, or technical support.
            </p>
            <a
              href="mailto:support@linksports.in"
              className="inline-flex items-center gap-2 text-brand font-medium text-sm hover:underline"
            >
              support@linksports.in <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
            <p className="text-sm text-gray-600 mb-4">
              We typically respond within 24–48 hours on business days (Mon–Fri, IST).
            </p>
            <span className="text-sm text-gray-500">Mon–Fri, 9 AM – 6 PM IST</span>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-brand" />
            <h2 className="text-xl font-bold text-gray-900">Send us a Message</h2>
          </div>

          <form
            action="mailto:support@linksports.in"
            method="get"
            encType="text/plain"
            className="space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Arjun Sharma"
                  autoComplete="name"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="contact-subject"
                name="subject"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                required
              >
                <option value="">Select a topic</option>
                <option value="General Enquiry">General Enquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Partnership / Business">Partnership / Business</option>
                <option value="Report a Bug">Report a Bug</option>
                <option value="Feedback">Feedback</option>
                <option value="Account Issue">Account Issue</option>
                <option value="Content / Moderation">Content / Moderation</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                name="body"
                rows={5}
                placeholder="Describe your enquiry in detail..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              Send Message <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            This will open your email client with your message pre-filled. Alternatively, email us directly at{' '}
            <a href="mailto:support@linksports.in" className="text-brand hover:underline">support@linksports.in</a>.
          </p>
        </div>

        {/* FAQ link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Have a common question?{' '}
            <Link href="/#faq" className="text-brand font-medium hover:underline">Check our FAQ →</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
