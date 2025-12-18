
import Hero from '@/components/Hero';
import About from '@/components/About';
import Team from '@/components/Team';
import Services from '@/components/Services';
import Process from '@/components/Process';
import Gallery from '@/components/Gallery';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';
import { contentService } from '@/services/contentService';

export default async function Home() {
  const [hero, services, processes, faq, gallery] = await Promise.all([
    contentService.getHero(),
    contentService.getServices(),
    contentService.getProcesses(),
    contentService.getFAQs(),
    contentService.getGallery(),
  ]);

  return (
    <>
      <Hero data={hero.data} />
      <About />
      <Team />
      <Services data={services.data} />
      <Process data={processes.data} />
      <Gallery data={gallery.data} />
      <FAQ data={faq.data} />
      <Contact />
    </>
  );
}