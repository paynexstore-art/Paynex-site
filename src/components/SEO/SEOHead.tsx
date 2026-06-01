import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author
}: SEOHeadProps) {
  const siteTitle = 'PayNex - منصة الدفع الرقمية';
  const fullTitle = `${title} | ${siteTitle}`;
  const canonicalUrl = url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      {author && <meta name="author" content={author} />}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="UTF-8" />
      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteTitle} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:locale" content="ar_EG" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Arabic" />
      <meta name="revisit-after" content="7 days" />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'product' ? 'Product' : 'WebPage',
          name: title,
          description: description,
          url: canonicalUrl,
          ...(image && { image: image }),
          ...(author && { author: { '@type': 'Person', name: author } })
        })}
      </script>
    </Helmet>
  );
}
