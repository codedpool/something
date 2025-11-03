import FeaturesSectionDemo from '@/components/features-section-demo-3'
import Hero from './components/Hero'
import { Testimonials } from './components/Testimonials'
import { CallToAction } from './components/CallToAction.jsx'
import { Footer } from './components/Footer';


export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturesSectionDemo />
      <Testimonials />
      <CallToAction />
      <Footer />
    </main>
  )
}
