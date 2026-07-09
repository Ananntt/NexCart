import { Navbar } from '@/components/navbar/navbar'
import { Hero } from '@/components/hero/hero'
import { QuickCategories } from '@/components/categories/quick-categories'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <QuickCategories />
      </main>
    </div>
  )
}
