import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Project Genesis Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-white/[0.06]">
        <nav className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🎬</span>
            <span className="font-heading font-bold gradient-text-subtle text-sm">Genesis</span>
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 11, 2026</p>

        <div className="prose-invert space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, create a project, or contact us for support. This includes your name, email address, and usage data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, to process transactions, to send you technical notices and support messages, and to respond to your requests.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect the security of your personal information. All data is encrypted in transit using TLS and at rest using AES-256 encryption.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may also object to processing, request data portability, and withdraw consent at any time. To exercise these rights, contact us at privacy@projectgenesis.ai.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at privacy@projectgenesis.ai.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
