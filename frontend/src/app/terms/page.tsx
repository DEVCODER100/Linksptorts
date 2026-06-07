import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/shared/Footer';
import PublicHeader from '@/components/shared/PublicHeader';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'LinkSports Terms of Service — the rules governing your use of India\'s sports networking platform.',
};

const LAST_UPDATED = '13 April 2025';
const EFFECTIVE_DATE = '13 April 2025';
const CONTACT_EMAIL = 'legal@linksports.in';

const toc = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'eligibility', label: '2. Eligibility' },
  { id: 'account', label: '3. Account Registration & Security' },
  { id: 'platform', label: '4. Platform Description' },
  { id: 'conduct', label: '5. User Conduct' },
  { id: 'content', label: '6. User-Generated Content' },
  { id: 'ip', label: '7. Intellectual Property' },
  { id: 'payments', label: '8. Payments & Fees' },
  { id: 'privacy', label: '9. Privacy' },
  { id: 'third-party', label: '10. Third-Party Links & Services' },
  { id: 'disclaimer', label: '11. Disclaimer of Warranties' },
  { id: 'liability', label: '12. Limitation of Liability' },
  { id: 'indemnity', label: '13. Indemnification' },
  { id: 'termination', label: '14. Termination' },
  { id: 'governing', label: '15. Governing Law & Disputes' },
  { id: 'changes', label: '16. Changes to These Terms' },
  { id: 'contact', label: '17. Contact Us' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Contents</p>
              <ul className="space-y-1">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block text-sm text-gray-600 hover:text-brand py-0.5 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link href="/privacy" className="text-sm text-brand hover:underline">→ Privacy Policy</Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 prose prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-[15px]
            prose-li:text-gray-600 prose-li:text-[15px]
            prose-strong:text-gray-800
            prose-a:text-brand prose-a:no-underline hover:prose-a:underline">

            {/* Hero */}
            <div className="not-prose mb-10">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <span>Legal</span>
                <span>›</span>
                <span className="text-gray-600">Terms of Service</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">Terms of Service</h1>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <span>Last updated: <strong className="text-gray-700">{LAST_UPDATED}</strong></span>
                <span>Effective: <strong className="text-gray-700">{EFFECTIVE_DATE}</strong></span>
              </div>
              <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Please read these Terms carefully before using LinkSports. By creating an account or using the platform, you agree to be bound by these Terms.
              </div>
            </div>

            {/* ── 1 ── */}
            <h2 id="acceptance">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and <strong>LinkSports Technologies Private Limited</strong> ("LinkSports", "we", "us", or "our"), governing your access to and use of the LinkSports website, mobile applications, and related services (collectively, the "Platform").
            </p>
            <p>
              By registering, logging in, or otherwise accessing the Platform, you confirm that you have read, understood, and agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, you must not use the Platform.
            </p>

            {/* ── 2 ── */}
            <h2 id="eligibility">2. Eligibility</h2>
            <p>To use LinkSports you must:</p>
            <ul>
              <li>Be at least <strong>13 years of age</strong>. Users between 13 and 18 must have verifiable parental or guardian consent.</li>
              <li>Have the legal capacity to enter into a binding contract under applicable law.</li>
              <li>Not be barred from receiving services under any applicable law.</li>
              <li>Not have had a previous LinkSports account suspended or terminated for a policy violation.</li>
            </ul>
            <p>
              By using the Platform you represent and warrant that you meet all eligibility requirements. LinkSports reserves the right to verify your eligibility at any time and to suspend or terminate accounts that do not qualify.
            </p>

            {/* ── 3 ── */}
            <h2 id="account">3. Account Registration & Security</h2>
            <h3>3.1 Registration</h3>
            <p>
              To access most Platform features you must create an account by providing accurate, current, and complete information. You agree to update your information promptly if it changes.
            </p>
            <h3>3.2 Account Types</h3>
            <p>LinkSports offers four account types:</p>
            <ul>
              <li><strong>Athlete</strong> — for sportspersons seeking trials, coaches, or opportunities.</li>
              <li><strong>Coach</strong> — for coaches, trainers, and PE teachers.</li>
              <li><strong>Professional</strong> — for sports support professionals (physiotherapists, nutritionists, sports agents, etc.).</li>
              <li><strong>Organisation</strong> — for academies, clubs, schools, federations, and other sports bodies.</li>
            </ul>
            <h3>3.3 Security</h3>
            <p>
              You are solely responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you suspect any unauthorised access. LinkSports will not be liable for any loss arising from your failure to safeguard your credentials.
            </p>
            <h3>3.4 One Account Per Person</h3>
            <p>
              Each individual may maintain only one personal account. Organisations may maintain one organisational account. Creating duplicate accounts to circumvent suspension is prohibited.
            </p>

            {/* ── 4 ── */}
            <h2 id="platform">4. Platform Description</h2>
            <p>
              LinkSports is India's sports networking platform that enables athletes, coaches, sports professionals, and organisations to connect, collaborate, and discover opportunities. Core features include:
            </p>
            <ul>
              <li>Professional sports profiles with CVs, highlight videos, and achievement records.</li>
              <li>Trial and listing discovery for sports events, academies, and selection camps.</li>
              <li>Job postings and applications for sports roles.</li>
              <li>Networking, connections, and direct messaging.</li>
              <li>CV generation for athletes and coaches.</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any feature at any time, with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.
            </p>

            {/* ── 5 ── */}
            <h2 id="conduct">5. User Conduct</h2>
            <h3>5.1 Permitted Use</h3>
            <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms.</p>
            <h3>5.2 Prohibited Activities</h3>
            <p>You must not:</p>
            <ul>
              <li>Post false, misleading, or fraudulent information, including fake credentials, fabricated achievements, or impersonation of another person or entity.</li>
              <li>Harass, threaten, bully, or discriminate against other users on the basis of caste, religion, gender, sexual orientation, disability, or any other characteristic.</li>
              <li>Use the Platform to spam, advertise unsolicited services, or send chain messages.</li>
              <li>Attempt to access, scrape, or harvest data from the Platform through automated means without our express written permission.</li>
              <li>Upload or share content that is defamatory, obscene, pornographic, or violates any law.</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform or its servers.</li>
              <li>Circumvent any access control or security mechanism on the Platform.</li>
              <li>Use the Platform to engage in any activity that constitutes match-fixing, doping promotion, or any other activity prohibited by sports governing bodies.</li>
              <li>Sell or transfer your account to another person.</li>
            </ul>
            <p>
              Violation of these prohibitions may result in immediate account suspension or termination, and may be reported to law enforcement authorities where required.
            </p>

            {/* ── 6 ── */}
            <h2 id="content">6. User-Generated Content</h2>
            <h3>6.1 Your Content</h3>
            <p>
              You retain ownership of all content you upload, post, or share on the Platform ("User Content"), including profile information, photos, videos, and messages.
            </p>
            <h3>6.2 Licence to LinkSports</h3>
            <p>
              By submitting User Content you grant LinkSports a non-exclusive, worldwide, royalty-free, sub-licensable licence to host, store, reproduce, modify (for formatting purposes), display, and distribute your User Content solely for the purpose of operating and promoting the Platform.
            </p>
            <h3>6.3 Content Standards</h3>
            <p>All User Content must be:</p>
            <ul>
              <li>Accurate and not misleading.</li>
              <li>Your own original work or content you have the right to share.</li>
              <li>Free from third-party intellectual property rights unless you have obtained the necessary permissions.</li>
              <li>Compliant with all applicable laws.</li>
            </ul>
            <h3>6.4 Content Removal</h3>
            <p>
              LinkSports reserves the right (but not the obligation) to review, remove, or disable access to any User Content that violates these Terms or is otherwise objectionable, at our sole discretion.
            </p>

            {/* ── 7 ── */}
            <h2 id="ip">7. Intellectual Property</h2>
            <p>
              The Platform, including its name, logo, design, software, databases, and all original content created by LinkSports, is the exclusive property of LinkSports Technologies Private Limited and is protected by Indian and international intellectual property laws.
            </p>
            <p>
              You may not copy, reproduce, modify, reverse-engineer, or create derivative works from any part of the Platform without our prior written consent. Nothing in these Terms grants you any right or licence to use our trademarks, trade names, or logos.
            </p>

            {/* ── 8 ── */}
            <h2 id="payments">8. Payments & Fees</h2>
            <h3>8.1 Free & Paid Features</h3>
            <p>
              Basic use of LinkSports is free. Certain premium features, promoted listings, or subscription plans may be offered at a fee as described on the Platform.
            </p>
            <h3>8.2 Payment Processing</h3>
            <p>
              Payments are processed through third-party payment gateways (currently Razorpay). By making a payment you agree to the terms and conditions of the relevant payment processor in addition to these Terms.
            </p>
            <h3>8.3 Refunds</h3>
            <p>
              Fees for trial registrations and event participation are generally non-refundable once confirmed. Subscription fees are non-refundable except where required by applicable law or in cases of technical error attributable to LinkSports. Refund requests may be submitted to <a href="mailto:support@linksports.in">support@linksports.in</a> within 7 days of the transaction.
            </p>
            <h3>8.4 Taxes</h3>
            <p>
              All listed prices are inclusive of Goods and Services Tax (GST) where applicable unless stated otherwise. You are responsible for any other taxes applicable to your use of the Platform under the laws of your jurisdiction.
            </p>

            {/* ── 9 ── */}
            <h2 id="privacy">9. Privacy</h2>
            <p>
              Your privacy is important to us. Our <Link href="/privacy">Privacy Policy</Link> explains how we collect, use, store, and share your personal data. By using the Platform you consent to our data practices as described in the Privacy Policy, which is incorporated into these Terms by reference.
            </p>

            {/* ── 10 ── */}
            <h2 id="third-party">10. Third-Party Links & Services</h2>
            <p>
              The Platform may contain links to third-party websites or integrate with third-party services (e.g., Google OAuth, payment gateways, video platforms). These third parties operate independently and have their own privacy policies and terms of service. LinkSports does not endorse and is not responsible for the content, practices, or policies of any third-party service. Your interactions with third-party services are solely between you and the third party.
            </p>

            {/* ── 11 ── */}
            <h2 id="disclaimer">11. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided on an <strong>"as is" and "as available"</strong> basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              LinkSports does not warrant that: (a) the Platform will be uninterrupted, error-free, or free of viruses; (b) the results obtained from using the Platform will be accurate or reliable; (c) any trial, job, or opportunity listed on the Platform will result in employment or selection.
            </p>

            {/* ── 12 ── */}
            <h2 id="liability">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, LinkSports and its directors, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or other intangible losses, arising out of or in connection with:
            </p>
            <ul>
              <li>Your access to or use of (or inability to access or use) the Platform.</li>
              <li>Any conduct or content of any third party on the Platform.</li>
              <li>Any User Content obtained from the Platform.</li>
              <li>Unauthorised access, use, or alteration of your transmissions or content.</li>
            </ul>
            <p>
              In no event shall our total aggregate liability to you exceed the greater of <strong>₹500 (Indian Rupees Five Hundred)</strong> or the total fees paid by you to LinkSports in the six months immediately preceding the event giving rise to the claim.
            </p>

            {/* ── 13 ── */}
            <h2 id="indemnity">13. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless LinkSports, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your access to or use of the Platform; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any third-party rights.
            </p>

            {/* ── 14 ── */}
            <h2 id="termination">14. Termination</h2>
            <h3>14.1 By You</h3>
            <p>
              You may close your account at any time by contacting us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Termination does not entitle you to any refund of fees paid.
            </p>
            <h3>14.2 By LinkSports</h3>
            <p>
              We may suspend or terminate your account immediately, without prior notice or liability, if you breach these Terms or if we determine, at our sole discretion, that your conduct is harmful to the Platform, other users, or third parties. We may also terminate accounts that have been inactive for more than 24 consecutive months.
            </p>
            <h3>14.3 Effect of Termination</h3>
            <p>
              Upon termination all rights granted to you under these Terms cease immediately. Provisions that by their nature should survive termination (including Sections 6–13 and 15) shall continue to apply.
            </p>

            {/* ── 15 ── */}
            <h2 id="governing">15. Governing Law & Disputes</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without regard to its conflict-of-law provisions.
            </p>
            <p>
              Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, the dispute shall be submitted to binding arbitration under the <strong>Arbitration and Conciliation Act, 1996</strong> (as amended), with the seat of arbitration in <strong>Vadodara, Gujarat, India</strong>. The arbitration shall be conducted in English by a sole arbitrator mutually appointed by the parties.
            </p>
            <p>
              Nothing in this clause prevents either party from seeking urgent injunctive or other equitable relief from a competent court.
            </p>

            {/* ── 16 ── */}
            <h2 id="changes">16. Changes to These Terms</h2>
            <p>
              LinkSports reserves the right to modify these Terms at any time. When we make material changes we will notify you by email (to the address associated with your account) and/or by displaying a prominent notice on the Platform at least <strong>14 days</strong> before the changes take effect. Your continued use of the Platform after the effective date of any changes constitutes your acceptance of the revised Terms.
            </p>
            <p>
              If you do not agree to the revised Terms you must stop using the Platform and, if you wish, close your account before the effective date.
            </p>

            {/* ── 17 ── */}
            <h2 id="contact">17. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <div className="not-prose mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 space-y-1.5">
              <p><strong>LinkSports Technologies Private Limited</strong></p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Support: <a href="mailto:support@linksports.in" className="text-brand hover:underline">support@linksports.in</a></p>
              <p>Website: <a href="https://linksports.in" className="text-brand hover:underline">linksports.in</a></p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
