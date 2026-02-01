import { notFound } from 'next/navigation';
import EventFormSubmission from '@/components/EventFormSubmission';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/event-forms/${slug}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return {
        title: 'Form Not Found',
      };
    }

    const { form } = await response.json();

    return {
      title: `${form.title} | My Kind Kandles & Boutique`,
      description: form.description || 'Complete this form',
    };
  } catch (error) {
    return {
      title: 'Event Form',
    };
  }
}

export default async function EventFormPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/event-forms/${slug}`,
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      notFound();
    }

    const { form } = await response.json();

    return <EventFormSubmission form={form} />;
  } catch (error) {
    console.error('Error loading form:', error);
    notFound();
  }
}
