import React from 'react';
import Button from '../ui/Button';

interface LandingPricingProps {
  onGetStarted: () => void;
  trackEvent: (eventName: string, properties?: any) => void;
}

const LandingPricing: React.FC<LandingPricingProps> = ({ onGetStarted, trackEvent }) => {
  const checkIcon = (
    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const crossIcon = (
    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Simple, student-friendly pricing
          </h2>
          <p className="text-xl text-gray-600">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <p className="text-gray-600">Perfect for getting started</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Basic task management</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Canvas calendar sync</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">5 AI queries per day</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Basic grade tracking</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Basic file storage</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Cross-platform sync</span>
              </li>
            </ul>

            <Button
              text="Start Free"
              onClick={() => {
                trackEvent('get_started_clicked', { location: 'pricing', plan: 'free' });
                onGetStarted();
              }}
              variant="secondary"
              className="w-full"
              ariaLabel="Start with ScheduleBud free plan"
              dataTestId="free-plan-btn"
            />
          </div>

          {/* Student Plan */}
          <div className="bg-blue-50 rounded-2xl p-8 border-4 border-blue-300 relative shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Student</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $5<span className="text-lg text-gray-600">/month</span>
              </div>
              <p className="text-blue-600 font-medium">Unlock unlimited AI and Canvas features for just $5/month</p>
              <p className="text-sm text-blue-600 mt-2">Try Student free for 7 days</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Everything in Free</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">50 AI queries per day</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Advanced study analytics</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Email notifications</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Enhanced file storage (1GB)</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Custom task types & colors</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Priority support</span>
              </li>
            </ul>

            <Button
              text="Try Student Free"
              onClick={() => {
                trackEvent('get_started_clicked', { location: 'pricing', plan: 'student' });
                onGetStarted();
              }}
              variant="primary"
              className="w-full"
              ariaLabel="Start Student plan free trial"
              dataTestId="student-plan-btn"
            />
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Compare Plans</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-blue-600">Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 text-gray-700">Task Management</td>
                  <td className="text-center py-3 px-4">{checkIcon}</td>
                  <td className="text-center py-3 px-4">{checkIcon}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">AI Queries per Day</td>
                  <td className="text-center py-3 px-4 text-gray-600">5</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-medium">50</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">File Storage</td>
                  <td className="text-center py-3 px-4 text-gray-600">Basic</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-medium">1GB</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Email Notifications</td>
                  <td className="text-center py-3 px-4">{crossIcon}</td>
                  <td className="text-center py-3 px-4">{checkIcon}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Study Analytics</td>
                  <td className="text-center py-3 px-4 text-gray-600">Basic</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-medium">Advanced</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Priority Support</td>
                  <td className="text-center py-3 px-4">{crossIcon}</td>
                  <td className="text-center py-3 px-4">{checkIcon}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-8">
          7-day free trial • Cancel anytime • Student discounts available
        </p>
      </div>
    </section>
  );
};

export default LandingPricing;