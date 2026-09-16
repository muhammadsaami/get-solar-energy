import AmbientBackground from '../components/landing/AmbientBackground'
import ScrollProgress from '../components/landing/ScrollProgress'
import SiteHeader from '../components/landing/SiteHeader'
import HeroScene from '../components/landing/HeroScene'
import EstimateCalculator from '../components/landing/EstimateCalculator'
import RoofSuitabilityScene from '../components/landing/RoofSuitabilityScene'
import InstallationScene from '../components/landing/InstallationScene'
import TechnologyScene from '../components/landing/TechnologyScene'
import SavingsScene from '../components/landing/SavingsScene'
import LifestyleGallery from '../components/landing/LifestyleGallery'
import FinalCtaScene from '../components/landing/FinalCtaScene'
import SiteFooter from '../components/landing/SiteFooter'

export default function Landing() {
  return (
    <>
      <AmbientBackground />
      <ScrollProgress />
      <SiteHeader />
      <main>
        <HeroScene />
        <EstimateCalculator />
        <RoofSuitabilityScene />
        <InstallationScene />
        <TechnologyScene />
        <SavingsScene />
        <LifestyleGallery />
        <FinalCtaScene />
      </main>
      <SiteFooter />
    </>
  )
}
