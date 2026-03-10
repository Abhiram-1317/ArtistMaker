// JSON-LD Structured Data for SEO

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Project Genesis",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://projectgenesis.ai",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://projectgenesis.ai"}/icons/icon-512.png`,
    description:
      "AI-powered cinematic movie generation platform. Transform your creative vision into production-quality films.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@projectgenesis.ai",
      contactType: "customer service",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function VideoObjectJsonLd({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl,
    uploadDate,
    ...(duration && { duration }),
    ...(contentUrl && { contentUrl }),
    publisher: {
      "@type": "Organization",
      name: "Project Genesis",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://projectgenesis.ai"}/icons/icon-512.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://projectgenesis.ai";

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Project Genesis",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://projectgenesis.ai",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available. Pro and Enterprise plans for advanced features.",
    },
    description:
      "Create cinematic AI-powered movies. Write your story, let AI generate stunning visuals, and share with the world.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
