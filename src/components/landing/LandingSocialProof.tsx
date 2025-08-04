import React from 'react';
import Button from '../ui/Button';

const LandingSocialProof: React.FC = () => {
  return (
    <>
      {/* Problem Statement */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Have you ever spent your Sunday nights copying Canvas assignments into a productivity app?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              I did too. That's why I built ScheduleBud - because I was tired of the endless
              cycle of manually managing my college assignments and academics with Notion.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 hover:shadow-lg transition-shadow rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Missing Assignments</h3>
              <p className="text-gray-600">
                Forgot an assignment buried in Canvas notifications? 
                Realized at midnight that something was due today?
              </p>
            </div>

            <div className="text-center p-8 hover:shadow-lg transition-shadow rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Manual Data Entry</h3>
              <p className="text-gray-600">
                Spent your weekend manually copying every assignment 
                and due date from Canvas into your planner?
              </p>
            </div>

            <div className="text-center p-8 hover:shadow-lg transition-shadow rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.239 0-4.236-.906-5.672-2.372M6.343 17.657l-.707.707A1 1 0 004.222 17.95l.707-.707m-.707-8.486l.707-.707a1 1 0 011.414 1.414l-.707.707m7.072 0l.707-.707a1 1 0 011.414 1.414l-.707.707m-.707 8.486l.707.707a1 1 0 01-1.414 1.414l-.707-.707M13 13.5V16a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scattered Information</h3>
              <p className="text-gray-600">
                Tasks in your planner, grades in Canvas, study sessions 
                in your head - nothing connects?
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg text-gray-700 font-medium">
              ScheduleBud fixes these problems with student-focused tools designed by someone who lives them too.
            </p>
          </div>
        </div>
      </section>

      {/* Early Adopter Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Become a Founding Member & Help Shape the Future of ScheduleBud
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ScheduleBud is brand new, and I'm looking for a handful of students to help me build the ultimate productivity tool. As an early adopter, you'll get direct access to me, your feedback will be prioritized, and you'll get the Student Plan free for a full year.
          </p>
          <Button
            text="Request Early Access"
            variant="primary"
            size="lg"
            href="#feedback-form"
            ariaLabel="Request early access to ScheduleBud"
            className="shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            dataTestId="early-access-btn"
          />
        </div>
      </section>
    </>
  );
};

export default LandingSocialProof;