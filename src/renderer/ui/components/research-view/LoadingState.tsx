import React from 'react';
import { Search, Database, Brain, CheckCircle } from 'lucide-react';

export const LoadingState: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      icon: Search,
      title: 'Analyzing Query',
      description: 'Understanding your research intent...',
    },
    {
      icon: Database,
      title: 'Searching Databases',
      description: 'Querying arXiv, PubMed, CrossRef, and more...',
    },
    {
      icon: Brain,
      title: 'AI Enhancement',
      description: 'Applying semantic understanding for better results...',
    },
    {
      icon: CheckCircle,
      title: 'Finalizing Results',
      description: 'Preparing your personalized results...',
    },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="research-loading-state">
      <div className="loading-animation">
        <div className="loading-spinner">
          <CurrentIcon />
        </div>
        <div className="loading-pulse" />
      </div>

      <div className="loading-content">
        <h3>{steps[currentStep].title}</h3>
        <p>{steps[currentStep].description}</p>
      </div>

      <div className="loading-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
