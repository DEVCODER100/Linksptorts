import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/shared/Footer';
import PublicHeader from '@/components/shared/PublicHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'LinkSports Privacy Policy — how we collect, use, and protect your personal data.',
};

const LAST_UPDATED = '13 April 2025';
const EFFECTIVE_DATE = '13 April 2025';
const CONTACT_EMAIL = 'privacy@linksports.in';

const toc = [
  { id: 'overview', label: '1. Overview' },
  { id: 'data-collected', label: '2. Data We Collect' },
  { id: 'how-we-use', label: '3. How We Use Your Data' },
  { id: 'sharing', label: '4. Data Sharing' },
  { id: 'visibility', label: '5. Profile Visibility Controls' },
  { id: 'cookies', label: '6. Cookies & Tracking' },
  { id: 'storage', label: '7. Data Storage & Security' },
  { id: 'retention', label: '8. Data Retention' },
  { id: 'minors', label: '9. Children\'s Privacy' },
  { id: 'rights', label: '10. Your Rights' },
  { id: 'transfers', label: '11. International Transfers' },
  { id: 'changes', label: '12. Changes to This Policy' },
  { id: 'contact', label: '13. Contact & Grievance Officer' },
];

export default function PrivacyPage() {
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
                <Link href="/terms" className="text-sm text-brand hover:underline">→ Terms of Service</Link>
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
                <span className="text-gray-600">Privacy Policy</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">Privacy Policy</h1>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <span>Last updated: <strong className="text-gray-700">{LAST_UPDATED}</strong></span>
                <span>Effective: <strong className="text-gray-700">{EFFECTIVE_DATE}</strong></span>
              </div>
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                Your privacy matters. This policy explains exactly what personal data we collect, why we collect it, how we use and protect it, and the choices you have.
              </div>
            </div>

            {/* ── 1 ── */}
            <h2 id="overview">1. Overview</h2>
            <p>
              <strong>LinkSports Technologies Private Limited</strong> ("LinkSports", "we", "us", or "our") operates the LinkSports platform — India's sports networking service — accessible at <a href="https://linksports.in">linksports.in</a> and through our mobile applications (collectively, the "Platform").
            </p>
            <p>
              This Privacy Policy describes how we collect, use, disclose, and safeguard the personal information of users ("you") in accordance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, and applicable data protection principles.
            </p>
            <p>
              By using the Platform you consent to the data practices described in this policy. If you do not agree, please discontinue use of the Platform.
            </p>

            {/* ── 2 ── */}
            <h2 id="data-collected">2. Data We Collect</h2>
            <h3>2.1 Information You Provide Directly</h3>
            <ul>
              <li><strong>Account data:</strong> Full name, email address, phone number, password (stored as a one-way hash), account type (athlete / coach / professional / organisation).</li>
              <li><strong>Profile data:</strong> Date of birth, gender, location (city, state, country), profile photo, sport(s), position, physical stats (height, weight), education history, career history, achievements, certifications, and any other content you add to your profile.</li>
              <li><strong>Media:</strong> Photos and videos you upload or link (e.g., YouTube, Instagram highlights).</li>
              <li><strong>Communication data:</strong> Messages you send to other users through the Platform's messaging feature.</li>
              <li><strong>Application data:</strong> Information you submit when applying for jobs, trials, or listings.</li>
              <li><strong>Payment data:</strong> Transaction records for paid features. Full card details are processed exclusively by our payment processor (Razorpay) and are <em>not</em> stored on our servers.</li>
              <li><strong>Support data:</strong> Information you provide when contacting our support team.</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Log data:</strong> IP address, browser type and version, operating system, referring URLs, pages visited, and timestamps.</li>
              <li><strong>Device data:</strong> Device type, unique device identifiers, and mobile network information.</li>
              <li><strong>Usage data:</strong> Features used, searches made, profiles viewed, and interactions (connections, reactions, follows).</li>
              <li><strong>Cookies and similar technologies:</strong> See Section 6 for details.</li>
            </ul>

            <h3>2.3 Information from Third Parties</h3>
            <ul>
              <li><strong>Google OAuth:</strong> If you sign in with Google we receive your name, email address, and profile picture from Google, subject to Google's own privacy policy.</li>
              <li><strong>Social links:</strong> Publicly accessible information from social media profiles you link (Instagram, YouTube, Twitter/X, LinkedIn).</li>
              <li><strong>Referrals:</strong> If another user connects you to the Platform, we may receive limited information to facilitate that connection.</li>
            </ul>

            {/* ── 3 ── */}
            <h2 id="how-we-use">3. How We Use Your Data</h2>
            <p>We use the personal data we collect for the following purposes:</p>
            <ul>
              <li><strong>Account creation and authentication</strong> — to create, verify, and secure your account.</li>
              <li><strong>Service delivery</strong> — to provide Platform features including profile display, search and discovery, messaging, job/trial applications, and CV generation.</li>
              <li><strong>Personalisation</strong> — to tailor content, search results, and recommendations to your role, sport, and location.</li>
              <li><strong>Communications</strong> — to send account-related emails (OTP verification, password reset, application updates, connection notifications). We will not send marketing emails without your explicit consent.</li>
              <li><strong>Safety and compliance</strong> — to detect and prevent fraud, abuse, spam, and other prohibited activities; to enforce our Terms of Service; and to comply with legal obligations.</li>
              <li><strong>Analytics and improvement</strong> — to understand how the Platform is used and to improve features, performance, and user experience. Analytics data is aggregated and anonymised where possible.</li>
              <li><strong>Payment processing</strong> — to facilitate and record transactions for paid features.</li>
              <li><strong>Legal purposes</strong> — to respond to legal processes, protect our rights, and resolve disputes.</li>
            </ul>
            <p>
              We rely on the following legal bases: <strong>contractual necessity</strong> (providing the service you signed up for), <strong>legitimate interests</strong> (platform security, fraud prevention, analytics), <strong>consent</strong> (marketing communications), and <strong>legal obligation</strong>.
            </p>

            {/* ── 4 ── */}
            <h2 id="sharing">4. Data Sharing</h2>
            <p>We do <strong>not</strong> sell your personal data. We may share your data only in the following circumstances:</p>
            <h3>4.1 With Other Users</h3>
            <p>
              Profile information is shared with other Platform users according to your visibility settings (see Section 5). Your name, profile photo, and sport are always visible to logged-in users. Sensitive fields (email, phone, date of birth) are visible only to users you have connected with, unless you choose to make them public.
            </p>
            <h3>4.2 With Service Providers</h3>
            <p>We engage trusted service providers who process data on our behalf under strict confidentiality obligations. These include:</p>
            <ul>
              <li><strong>Cloud hosting</strong> (server infrastructure and database storage).</li>
              <li><strong>Payment processing</strong> — Razorpay for transaction handling.</li>
              <li><strong>Email delivery</strong> — for transactional emails (OTP, notifications).</li>
              <li><strong>Analytics</strong> — aggregated, anonymised usage analytics.</li>
            </ul>
            <h3>4.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of all or part of our business assets, your personal data may be transferred to the acquiring entity. We will notify you before your personal data is transferred and becomes subject to a different privacy policy.
            </p>
            <h3>4.4 Legal Requirements</h3>
            <p>
              We may disclose your personal data if required to do so by law, or in response to a valid court order, government request, or to protect the rights, property, or safety of LinkSports, our users, or the public.
            </p>

            {/* ── 5 ── */}
            <h2 id="visibility">5. Profile Visibility Controls</h2>
            <p>
              You control who can see your profile and what information is visible. LinkSports offers three visibility settings accessible from your profile settings:
            </p>
            <ul>
              <li><strong>Public</strong> — your full profile (excluding sensitive contact details) is visible to all users and, where indexed, to search engines.</li>
              <li><strong>Connections only</strong> — full profile is visible only to users you are connected with. Others see only your name, photo, and sport.</li>
              <li><strong>Private</strong> — your profile is hidden from all other users. Only you can view it.</li>
            </ul>
            <p>
              CV downloads by other users are also governed by role-based permission rules described in our Terms. Organisations may download athlete and coach CVs in accordance with those rules.
            </p>

            {/* ── 6 ── */}
            <h2 id="cookies">6. Cookies & Tracking</h2>
            <h3>6.1 What We Use</h3>
            <ul>
              <li><strong>Essential cookies</strong> — required for authentication (session tokens, CSRF protection). Cannot be disabled without breaking the service.</li>
              <li><strong>Preference cookies</strong> — remember settings such as language and display preferences.</li>
              <li><strong>Analytics cookies</strong> — help us understand how the Platform is used (e.g., page visits, feature usage). We use anonymised data only.</li>
            </ul>
            <h3>6.2 Your Choices</h3>
            <p>
              You can configure your browser to refuse or delete cookies. Note that disabling essential cookies may prevent you from logging in or using core Platform features. Third-party cookies (e.g., Google OAuth) are governed by the respective third party's cookie policy.
            </p>
            <h3>6.3 Local Storage</h3>
            <p>
              We store your authentication token in your browser's <code>localStorage</code> to keep you signed in across sessions. You can clear this at any time by logging out.
            </p>

            {/* ── 7 ── */}
            <h2 id="storage">7. Data Storage & Security</h2>
            <p>
              Your data is stored on servers located in India. We implement industry-standard technical and organisational security measures to protect your personal data against unauthorised access, loss, destruction, or alteration, including:
            </p>
            <ul>
              <li>Passwords stored as bcrypt hashes (never in plain text).</li>
              <li>HTTPS / TLS encryption for all data in transit.</li>
              <li>HTTP-only, Secure, SameSite cookies for authentication tokens.</li>
              <li>Access controls limiting data access to authorised personnel only.</li>
              <li>Regular security reviews.</li>
            </ul>
            <p>
              Despite our efforts, no system is perfectly secure. In the event of a data breach that poses a high risk to your rights and freedoms, we will notify you and, where required by law, the relevant authorities, without undue delay.
            </p>

            {/* ── 8 ── */}
            <h2 id="retention">8. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the Platform's services. Specifically:
            </p>
            <ul>
              <li><strong>Account and profile data</strong> — retained for the lifetime of your account, and for up to 90 days after account deletion to allow you to recover your account if deleted by mistake.</li>
              <li><strong>Messages</strong> — retained for 12 months from the date of sending, then automatically deleted.</li>
              <li><strong>Payment records</strong> — retained for 7 years as required under Indian accounting and tax laws.</li>
              <li><strong>Log data</strong> — retained for up to 6 months and then deleted.</li>
              <li><strong>Deleted content</strong> — user-deleted profile content is removed from active storage within 30 days, though it may remain in encrypted backups for up to 90 additional days.</li>
            </ul>

            {/* ── 9 ── */}
            <h2 id="minors">9. Children's Privacy</h2>
            <p>
              LinkSports is not intended for children under the age of 13. We do not knowingly collect personal data from children under 13. If you believe we have inadvertently collected data from a child under 13, please contact us immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will delete the data promptly.
            </p>
            <p>
              Users between 13 and 18 must have parental or guardian consent. Parents or guardians who believe their minor child has registered without consent may request account deletion by writing to us.
            </p>

            {/* ── 10 ── */}
            <h2 id="rights">10. Your Rights</h2>
            <p>
              Subject to applicable law, you have the following rights regarding your personal data:
            </p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — update or correct inaccurate or incomplete data. Most data can be corrected directly from your profile settings.</li>
              <li><strong>Deletion</strong> — request deletion of your account and personal data. We will honour deletion requests within 30 days, subject to data we are legally required to retain.</li>
              <li><strong>Portability</strong> — request your profile data in a machine-readable format (CSV/JSON).</li>
              <li><strong>Withdrawal of consent</strong> — where processing is based on consent (e.g., marketing emails), withdraw consent at any time without affecting the lawfulness of processing prior to withdrawal.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests where you believe your rights and interests override those interests.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject line "Privacy Request". We will respond within <strong>30 days</strong>. We may request proof of identity before acting on your request.
            </p>

            {/* ── 11 ── */}
            <h2 id="transfers">11. International Transfers</h2>
            <p>
              Your data is primarily stored and processed in India. However, some of our service providers (e.g., email delivery, analytics) may process data outside India. Where such transfers occur, we ensure adequate contractual protections are in place consistent with applicable data protection laws.
            </p>

            {/* ── 12 ── */}
            <h2 id="changes">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes we will notify you by email and/or by posting a prominent notice on the Platform at least <strong>14 days</strong> before the changes take effect. The "Last updated" date at the top of this page will always reflect the most recent revision.
            </p>
            <p>
              Your continued use of the Platform after the effective date of the revised policy constitutes your acceptance of the changes. If you do not agree to the revised policy, please stop using the Platform and request account deletion.
            </p>

            {/* ── 13 ── */}
            <h2 id="contact">13. Contact & Grievance Officer</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the IT Rules, 2011, the name and contact details of our Grievance Officer are:
            </p>
            <div className="not-prose mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 space-y-1.5">
              <p><strong>Grievance Officer — LinkSports Technologies Private Limited</strong></p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">{CONTACT_EMAIL}</a></p>
              <p>General support: <a href="mailto:support@linksports.in" className="text-brand hover:underline">support@linksports.in</a></p>
              <p>Website: <a href="https://linksports.in" className="text-brand hover:underline">linksports.in</a></p>
              <p className="text-gray-500 text-xs pt-2">Complaints are acknowledged within 48 hours and resolved within 30 days of receipt.</p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
