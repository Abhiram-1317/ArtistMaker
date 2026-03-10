import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Project Genesis Cookie Policy — how we use cookies and similar technologies.",
};

export default function CookiePolicy() {
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
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 11, 2026</p>

        <div className="prose-invert space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences and login sessions.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Essential Cookies</h2>
            <p>These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as logging in or filling out forms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Analytics Cookies</h2>
            <p>We use analytics cookies to understand how visitors interact with our website. This data helps us improve our services. All analytics data is anonymized.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Managing Cookies</h2>
            <p>You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of our website.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Contact</h2>
            <p>For questions about our cookie practices, contact us at privacy@projectgenesis.ai.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
