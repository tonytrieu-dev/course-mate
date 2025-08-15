import React from 'react';

const AboutSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">ℹAbout</h3>
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p><strong>ScheduleBud</strong> - Built for students, by a student.</p>
        <p>Version: 1.0.0</p>
        <p>A Notion-inspired educational productivity app</p>
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Made with ❤️ to help students stay organized and succeed in their academic journey.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;