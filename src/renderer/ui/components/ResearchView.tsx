import React from 'react';
import { SearchProvider } from './research-view/SearchProvider';
import { ResearchContainer } from './research-view/ResearchContainer';

export const ResearchView: React.FC = () => {
  return (
    <SearchProvider>
      <ResearchContainer />
    </SearchProvider>
  );
};
