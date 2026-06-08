import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author,
  publishedAt,
  modifiedAt,
  breadcrumbs,
}: SEOHeadProps) {
  const siteTitle = 'Qastly قسطلي - حلول التقسيط الذكي';
  const fullTitle = `${title} | ${siteTitle}`;
  const canonicalUrl = url;
  const defaultImage = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=630&fit=crop&auto=format';
  const ogImage = image || defaultImage;

  // Auto-generate keywords if not provided
  const autoKeywords = keywords.length > 0
    ? keywords
    : [
        'تقسيط', 'Qastly', 'قسطلي', 'تمويل', 'قسط شهري', 'شراء بالتقسيط',
        'موبايلات بالتقسيط', 'أجهزة منزلية بالتقسيط', 'بدون فوائد', '0 مقدم',
      ];

  // JSON-LD: Organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Qastly قسطلي',
    alternateName: 'Qastly Installments',
    url: 'https://qastly.com',
    logo: 'https://qastly.com/src/assets/qastly-logo.png',
    sameAs: [
      'https://facebook.com/qastly',
      'https://instagram.com/qastly',
      'https://twitter.com/qastly',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+20-100-000-0000',
      contactType: 'customer service',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
  };

  // JSON-LD: WebSite (with search action)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Qastly قسطلي',
    url: 'https://qastly.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://qastly.com/products?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  } : null;

  // JSON-LD: WebPage / Article / Product
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebPage',
    name: title,
    description: description,
    url: canonicalUrl,
    image: ogImage,
    ...(author && { author: { '@type': 'Person', name: author } }),
    ...(publishedAt && { datePublished: publishedAt }),
    ...(modifiedAt && { dateModified: modifiedAt }),
    ...(type === 'product' && { brand: { '@type': 'Brand', name: 'Qastly' } }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const schemas = [
    organizationSchema,
    websiteSchema,
    pageSchema,
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={autoKeywords.join(', ')} />
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
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ar_EG" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="language" content="Arabic" />
      <meta name="revisit-after" content="7 days" />
      <meta name="googlebot" content="index, follow" />
      <meta name="google" content="notranslate" />
      <meta name="format-detection" content="telephone=no" />

      {/* Geo / Region */}
      <meta name="geo.region" content="EG" />
      <meta name="geo.country" content="Egypt" />
      <meta name="geo.placename" content="Cairo, Egypt" />

      {/* Schema.org Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/**
 * Auto-generate SEO meta for a product page.
 */
export function ProductSEOHead({ product, url }: {
  product: { nameAr: string; nameEn: string; descriptionAr?: string; descriptionEn?: string; price?: number; imageUrl?: string; brand?: string; categoryAr?: string };
  url: string;
}) {
  const title = product.nameAr || product.nameEn;
  const description = product.descriptionAr || product.descriptionEn || `اشتري ${product.nameAr} بالتقسيط بدون فوائد مع قسطلي — ${product.categoryAr || 'إلكترونيات'}`;
  const keywords = [
    product.nameAr,
    product.nameEn,
    product.brand,
    product.categoryAr,
    'تقسيط', 'قسط شهري', 'Qastly', 'بدون فوائد',
  ].filter(Boolean) as string[];

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      image={product.imageUrl}
      url={url}
      type="product"
      breadcrumbs={[
        { name: 'الرئيسية', url: 'https://qastly.com/' },
        { name: product.categoryAr || 'المنتجات', url: 'https://qastly.com/products' },
        { name: product.nameAr || 'تفاصيل المنتج', url: url },
      ]}
    />
  );
}
