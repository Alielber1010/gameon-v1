"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, MapPin, Lock, Eye, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import ReactMarkdown from "react-markdown"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface PrivacyPolicySection {
  title: string
  icon: string
  content: string
  order: number
}

const iconMap: Record<string, typeof FileText> = {
  FileText,
  MapPin,
  Lock,
  Eye,
  Shield,
}

export default function PrivacyPolicyPage() {
  const [sections, setSections] = useState<PrivacyPolicySection[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [activeSection, setActiveSection] = useState<string>("")
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  useEffect(() => {
    fetchPolicy()
  }, [])

  // Set up intersection observer to highlight active section
  useEffect(() => {
    if (sections.length === 0) return

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    sections.forEach((section) => {
      const id = `section-${section.order}`
      const element = sectionRefs.current[id]
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [sections])

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      const offset = 100 // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const fetchPolicy = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/privacy-policy')
      const data = await response.json()

      if (data.success) {
        // Sort sections by order
        const sortedSections = [...data.policy.sections].sort((a: PrivacyPolicySection, b: PrivacyPolicySection) => a.order - b.order)
        setSections(sortedSections)
        
        if (data.policy.lastUpdated) {
          const date = new Date(data.policy.lastUpdated)
          setLastUpdated(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
        } else {
          setLastUpdated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
        }
      }
    } catch (error) {
      console.error('Error fetching policy:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600 mb-4" />
          <p className="text-gray-600">Loading privacy policy...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 lg:max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 sm:mb-6">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Back to Login</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16">
              <Logo variant="full" theme="green" className="w-full h-auto" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Last updated: {lastUpdated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Privacy policy content is being loaded...</p>
              </div>
            ) : (
              sections.map((section, index) => {
                const IconComponent = iconMap[section.icon] || FileText
                const isLocationSection = section.title.toLowerCase().includes('location')
                const isThirdPartySection = section.title.toLowerCase().includes('third-party') || section.title.toLowerCase().includes('sharing')
                
                const sectionId = `section-${section.order}`
                
                return (
                  <section 
                    id={sectionId}
                    ref={(el) => {
                      sectionRefs.current[sectionId] = el
                    }}
                    key={section._id || section.id || index} 
                    className={`space-y-3 sm:space-y-4 scroll-mt-24 ${index > 0 ? 'border-t pt-6 sm:pt-8' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{section.title}</h2>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-2 ml-4 mb-3">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 ml-4 mb-3">{children}</ol>,
                              li: ({ children }) => <li>{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {section.content}
                          </ReactMarkdown>
                        </div>
                        {/* Special highlighting for important sections */}
                        {isLocationSection && (
                          <div className="mt-3 bg-green-50 border-l-4 border-green-600 p-3 sm:p-4 rounded">
                            <p className="text-sm sm:text-base text-gray-700">
                              <strong className="text-green-800">Important:</strong> We do <strong>NOT</strong> share your location data with any third parties, 
                              advertisers, or external services. Your location information is stored securely and used only within the GameOn platform 
                              to provide you with location-based features.
                            </p>
                          </div>
                        )}
                        {isThirdPartySection && (
                          <div className="mt-3 bg-green-50 border-l-4 border-green-600 p-3 sm:p-4 rounded">
                            <p className="text-sm sm:text-base text-gray-700">
                              <strong className="text-green-800">We do NOT sell, rent, or share your personal information or location data with third parties.</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )
              })
            )}

            {/* Footer */}
            <div className="border-t pt-6 sm:pt-8 mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  By using GameOn, you agree to this Privacy Policy.
                </p>
                <Link href="/login">
                  <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Navigation Sidebar */}
          {sections.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">On this page</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-8rem)]">
                      <nav className="p-4 space-y-1">
                        {sections.map((section) => {
                          const sectionId = `section-${section.order}`
                          const isActive = activeSection === sectionId
                          
                          return (
                            <button
                              key={sectionId}
                              onClick={() => scrollToSection(sectionId)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors min-h-[44px] sm:min-h-0",
                                "hover:bg-green-50 hover:text-green-700",
                                isActive
                                  ? "bg-green-100 text-green-700 font-medium border-l-2 border-green-600"
                                  : "text-gray-600"
                              )}
                            >
                              {section.title}
                            </button>
                          )
                        })}
                      </nav>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
