import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Project Genesis Terms of Service — rules governing use of our platform.",
};

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 11, 2026</p>

        <div className="prose-invert space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Project Genesis, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>Project Genesis is an AI-powered cinematic movie generation platform that enables users to create, edit, and share AI-generated films.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. User Accounts</h2>
            <p>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account and keep your information up to date.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Content Ownership</h2>
            <p>You retain ownership of the creative content you generate using our platform. By publishing content publicly, you grant Project Genesis a non-exclusive license to display and distribute it within the platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You may not use the service to generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or objectionable. We reserve the right to remove content that violates these terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Payments and Subscriptions</h2>
            <p>Certain features require payment. All payments are processed securely through Stripe. Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except as required by law.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>Project Genesis is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
            <p>For questions about these Terms, contact us at legal@projectgenesis.ai.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
