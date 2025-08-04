import React from 'react';
import { getAppName, getAppDescription } from '../utils/buildConfig';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  title, 
  description, 
  image = '/api/placeholder/1200/630', 
  url = 'https://schedulebudapp.com' 
}) => {
  const siteTitle = title ? `${title} | ${getAppName()}` : `${getAppName()} - ${getAppDescription()}`;
  const siteDescription = description || getAppDescription();

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content="student planner, canvas integration, task management, study analytics, ai study assistant, college productivity, academic planner" />
      <meta name="author" content="ScheduleBud" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={getAppName()} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={siteDescription} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:creator" content="@schedulebud" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={getAppName()} />

      {/* Analytics Scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Google Analytics placeholder
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // gtag('config', 'GA_TRACKING_ID'); // Replace with actual tracking ID
            
            // Custom analytics tracking
            window.schedulebudAnalytics = {
              track: function(event, properties) {
                if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                  console.log('Analytics Event:', event, properties);
                }
                // Add your analytics service integration here
                // Examples: Mixpanel, Amplitude, Segment, etc.
              }
            };
          `
        }}
      />
    </>
  );
};

export default SEOHead;