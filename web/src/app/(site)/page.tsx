
import Hero from '@/components/Hero';
import About from '@/components/About';
import Team from '@/components/Team';
import Services from '@/components/Services';
import Process from '@/components/Process';
import Gallery from '@/components/Gallery';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';
import { contentService } from '@/services/contentService';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Use Promise.allSettled for About to prevent whole page crashing if about is missing?
  // Or just Promise.all. The seed script guarantees it presumably.
  const [hero, services, processes, faq, gallery, about] = await Promise.all([
    contentService.getHero(),
    contentService.getServices(),
    contentService.getProcesses(),
    contentService.getFAQs(),
    contentService.getGallery(),
    contentService.getAbout().catch(() => ({ data: null })), // Handle potential 404 gracefully initially
  ]);

  return (
    <>
      <Hero data={hero.data} />
      <About data={about?.data as any} />
      <Team />
      <Services data={services.data} />
      <Process data={processes.data} />
      <Gallery data={gallery.data} />
      <FAQ data={faq.data} />
      <Contact />
    </>
  );
}