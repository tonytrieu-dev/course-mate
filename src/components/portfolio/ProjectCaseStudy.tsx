import React from 'react';
import PortfolioLayout from './PortfolioLayout';

const ProjectCaseStudy: React.FC = () => {
  return (
    <PortfolioLayout 
      title="ScheduleBud: A Micro-SaaS Case Study" 
      description="Technical Deep Dive"
    >
      <div className="space-y-12">
        {/* Problem Statement */}
        <section className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🚨 The Problem</h2>
          
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="text-lg font-semibold text-red-700 dark:text-red-300">
              The average student wastes approximately 5-10 hours per quarter on manual data entry and academic organization.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Canvas Integration Pain Points:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Manual copying of assignments from Canvas to personal calendars</li>
                  <li>• Inconsistent calendar export formats across universities</li>
                  <li>• No automatic sync when professors update deadlines</li>
                  <li>• Poor mobile experience for Canvas calendar views</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Syllabus Management Issues:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• PDF syllabi scattered across different platforms</li>
                  <li>• Manual extraction of assignment dates and details</li>
                  <li>• No way to search through syllabus content</li>
                  <li>• Lost syllabi when semester ends</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Overview */}
        <section className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">✅ The Solution</h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            ScheduleBud automates academic workflows through intelligent integration, AI-powered processing, and seamless synchronization.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Canvas Auto-Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically imports and syncs Canvas assignments with intelligent duplicate detection and real-time updates.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Syllabus Parser</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Google Gemini AI extracts assignments, dates, and details from PDF syllabi with 95%+ accuracy.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Document Q&A</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with course materials using AI embeddings for instant answers about assignments and policies.
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🛠️ Technical Architecture</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Frontend</h3>
              <div className="space-y-2">
                <span className="block px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">React 18</span>
                <span className="block px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">TypeScript</span>
                <span className="block px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">Tailwind CSS</span>
                <span className="block px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">Webpack</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Backend</h3>
              <div className="space-y-2">
                <span className="block px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">Supabase</span>
                <span className="block px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">PostgreSQL</span>
                <span className="block px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">Edge Functions</span>
                <span className="block px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">Row Level Security</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">AI & APIs</h3>
              <div className="space-y-2">
                <span className="block px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm">Google Gemini Flash 2.5</span>
                <span className="block px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm">Vector Embeddings</span>
                <span className="block px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm">PDF.js</span>
                <span className="block px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm">ICS Parser</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">DevOps</h3>
              <div className="space-y-2">
                <span className="block px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm">GitHub Actions</span>
                <span className="block px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm">Playwright E2E</span>
                <span className="block px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm">ESLint + TypeScript</span>
                <span className="block px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm">Automated Backups</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Deep Dive */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">🔍 Feature Implementation Deep Dive</h2>
          
          <div className="space-y-8">
            {/* Canvas Integration */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📅 Canvas Calendar Integration
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Technical Implementation:</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Custom ICS parser with malformed data correction</li>
                    <li>• Multi-proxy CORS handling (3-tier fallback system)</li>
                    <li>• UID-based duplicate detection and prevention</li>
                    <li>• Real-time sync with bi-directional data flow</li>
                    <li>• Course code to user-friendly name mapping</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Key Challenges Solved:</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Inconsistent Canvas ICS formats across universities</li>
                    <li>• CORS restrictions requiring proxy solutions</li>
                    <li>• Handling malformed calendar data gracefully</li>
                    <li>• Automatic task type inference from event descriptions</li>
                    <li>• Conflict resolution for overlapping assignments</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* AI Syllabus Parser */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🤖 Smart Syllabus Upload System
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">AI Pipeline:</h4>
                  <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                    <li>PDF text extraction using PDF.js</li>
                    <li>Google Gemini AI analysis with custom prompts</li>
                    <li>Course detection and automatic class assignment</li>
                    <li>Assignment extraction with date parsing</li>
                    <li>Task type classification and priority assignment</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Enhanced Features (Jan 2025):</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Intelligent class assignment similar to Canvas import</li>
                    <li>• Multi-course syllabus support</li>
                    <li>• Automatic class creation when courses detected</li>
                    <li>• 100% lab parsing success rate improvement</li>
                    <li>• Universal syllabus format compatibility</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Document Q&A */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                💬 AI-Powered Document Q&A
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Vector Search Implementation:</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Document chunking and embedding generation</li>
                    <li>• PostgreSQL pgvector for similarity search</li>
                    <li>• Context-aware response generation</li>
                    <li>• Auto-embedding pipeline with duplicate prevention</li>
                    <li>• Real-time chat interface with message history</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Recent Optimizations (Aug 2025):</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Fixed duplicate metadata elimination</li>
                    <li>• Enhanced auto-embedding logic optimization</li>
                    <li>• Comprehensive duplicate prevention system</li>
                    <li>• Performance improvements reducing overhead</li>
                    <li>• Database function fixes for document search</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Challenges */}
        <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🎯 Technical Challenges & Solutions</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-yellow-500 pl-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Challenge: Handling Inconsistent Canvas ICS Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Different universities use varying Canvas configurations, resulting in malformed or inconsistent ICS calendar exports.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Solution: Engineered a resilient multi-proxy fallback system with flexible parsing that normalizes data 
                across different Canvas instances, achieving 99%+ import success rate.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Challenge: Production-Grade Disaster Recovery
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Supabase free tier offers no automatic backups, creating significant risk for production data.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Solution: Implemented enterprise-grade disaster recovery with Cloudflare R2 integration, automated 
                GitHub Actions workflows, and 24/7 monitoring achieving &lt;2hr RTO and &lt;24hr RPO at $0/month cost.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Challenge: Cross-Browser Scrollbar Compatibility
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Calendar day cells needed hover-only scrollbars that work identically across Chrome, Firefox, Safari, Edge, and Brave.
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Solution: Developed pure CSS dual-implementation approach supporting both WebKit and Firefox engines, 
                eliminating JavaScript dependencies while maintaining perfect cross-browser behavior.
              </p>
            </div>
          </div>
        </section>

        {/* Development Journey */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">🚀 Development Journey</h2>
          
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur">
            <p className="text-indigo-100 leading-relaxed text-lg">
              Solo-built from concept to production over 8 months, including market research, technical architecture, 
              full-stack development, AI integration, testing, deployment, and ongoing maintenance. 
              Demonstrates end-to-end product development capabilities and technical leadership in building 
              a production-ready micro-SaaS application with modern web technologies and AI integration.
            </p>
          </div>
          
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-indigo-200">Technical Achievements</h3>
              <ul className="text-indigo-100 space-y-1 text-sm">
                <li>• Production-ready full-stack application with modern architecture</li>
                <li>• Advanced AI integration with document processing and chat capabilities</li>
                <li>• Robust Canvas LMS integration with multi-university compatibility</li>
                <li>• Enterprise-grade disaster recovery and monitoring systems</li>
              </ul>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-indigo-200">Product Development</h3>
              <ul className="text-indigo-100 space-y-1 text-sm">
                <li>• Complete product lifecycle from ideation to deployment</li>
                <li>• User research and competitive analysis</li>
                <li>• Iterative development with continuous user feedback</li>
                <li>• Comprehensive testing and quality assurance processes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Dive Deeper?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Explore the live application or examine the complete source code to see these implementations in action.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Live Demo
            </a>
            
            <a
              href="https://github.com/tonytrieu-dev/schedule-bud"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              See the Code on GitHub
            </a>
          </div>
        </section>
      </div>
    </PortfolioLayout>
  );
};

export default ProjectCaseStudy;