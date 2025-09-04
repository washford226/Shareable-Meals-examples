import Link from "next/link";
import Image from "next/image";
import BetaTestingSection from "@/components/BetaTestingSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://shareablemeals.com',
  },
};

export default function Home() {
  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Beta Now Available • iOS: Late August-Early September, Android: September
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Smart Meal Planning</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Powered by AI
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-base text-gray-600 sm:text-lg md:text-xl leading-relaxed">
              Create meals with AI, track macros with advanced nutrition data, plan on a calendar, and compete in weekly challenges. 
              <span className="block mt-2 text-blue-600 font-medium">iOS: Late August to Early September • Android: September</span>
            </p>
            <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10">
              <div className="rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <Link
                  href="/features"
                  className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 md:py-4 md:text-lg md:px-10"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Explore Features
                </Link>
              </div>
              <div className="mt-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/about"
                  className="w-full flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transform hover:scale-105 transition-all duration-200 md:py-4 md:text-lg md:px-10"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Testing Section */}
      <BetaTestingSection />

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
              Everything you need for smart meal planning
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
              AI-powered nutrition tracking, meal planning, and community challenges
            </p>
            <div className="mt-6 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center group">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">AI Meal Creation</h3>
                <p className="mt-4 text-base text-gray-600 leading-relaxed px-4">
                  Create meals manually, with AI assistance, or from website URLs. Get accurate macros using our comprehensive nutrition database.
                </p>
                <div className="mt-6 flex justify-center">
                  <a 
                    href="https://openai.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <span className="mr-2">Powered by</span>
                    <Image
                      src="/openai-logo.svg"
                      alt="Powered by OpenAI"
                      width={60}
                      height={20}
                    />
                  </a>
                </div>
              </div>

              <div className="text-center group">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">Smart Calendar Planning</h3>
                <p className="mt-4 text-base text-gray-600 leading-relaxed px-4">
                  Plan meals on a calendar and track combined macros for the day, week, or month. Generate shopping lists automatically.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">OpenAI Meal Scanning & Pantry</h3>
                <p className="mt-4 text-base text-gray-600 leading-relaxed px-4">
                  Scan meals for instant macro analysis using OpenAI's advanced image recognition. Scan your pantry to auto-add ingredients and let AI create meals from what you have.
                </p>
                <div className="mt-6 flex justify-center">
                  <a 
                    href="https://openai.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <span className="mr-2">Powered by</span>
                    <Image
                      src="/openai-logo.svg"
                      alt="Powered by OpenAI"
                      width={60}
                      height={20}
                    />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center group">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">Discover & Share</h3>
                <p className="mt-4 text-base text-gray-600 leading-relaxed px-4">
                  Browse community meals, copy recipes, leave reviews, and filter by dietary preferences and macros.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">Weekly Challenges</h3>
                <p className="mt-4 text-base text-gray-600 leading-relaxed px-4">
                  Compete in themed challenges like "4-ingredient meals" or "10-minute desserts". Submit and vote for the best creations.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-gray-900">Macro Tracking</h3>
                <p className="mt-4 text-base text-gray-600 leading-relaxed px-4">
                  Precise protein, carbs, fats, and calorie tracking powered by advanced AI nutrition analysis.
                </p>
                <div className="mt-6 flex justify-center">
                  <a 
                    href="https://openai.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <span className="mr-2">Powered by</span>
                    <Image
                      src="/openai-logo.svg"
                      alt="Powered by OpenAI"
                      width={60}
                      height={20}
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Powered by Industry-Leading Nutrition Technology
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8">
              <div className="flex-1 max-w-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Advanced AI Technology</h3>
                <p className="text-gray-600 leading-relaxed">
                  We leverage OpenAI's cutting-edge technology to provide you with the most accurate meal scanning, nutrition analysis, and intelligent recipe creation available.
                </p>
                <div className="mt-6 space-y-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Advanced computer vision for meal scanning
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Intelligent recipe and meal creation
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    State-of-the-art natural language processing
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <a 
                  href="https://openai.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block hover:scale-105 transition-transform duration-200"
                >
                  <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all">
                    <Image
                      src="/openai-logo.svg"
                      alt="Powered by OpenAI"
                      width={150}
                      height={50}
                      className="mx-auto"
                    />
                    <p className="mt-3 text-sm text-gray-600 font-medium">
                      Learn More →
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-center">
            <span className="block">Ready to transform your meal planning?</span>
            <span className="block text-blue-200">iOS: Late August-Early September • Android: September</span>
          </h2>
        </div>
      </section>
    </div>
  );
}
