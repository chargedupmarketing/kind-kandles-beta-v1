/**
 * JSON-LD Structured Data Component
 * 
 * Renders schema.org structured data for SEO rich snippets.
 * Use this component to add JSON-LD to any page.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonLdData = any;

interface JsonLdProps {
  data: JsonLdData;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

// Export for use in server components
export function JsonLdScript({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

