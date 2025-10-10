import React from 'react';
import { Filter, BookOpen } from 'lucide-react';
import { LibraryCard } from './LibraryCard';

type Paper = {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  source?: string;
  abstract?: string;
  status: string;
  filePath?: string;
  textHash: string;
};

type SortOption = 'recent' | 'title' | 'author' | 'year' | 'category' | 'publication_date';

type LibraryGridProps = {
  papers: Paper[];
  category: string;
  onPaperSelect: (id: string) => void;
  onRefresh?: () => void;
  onShowCitations?: (paperId: string) => void;
};

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  papers,
  category,
  onPaperSelect,
  onRefresh,
  onShowCitations,
}) => {
  const [animatedPapers, setAnimatedPapers] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortOption>('recent');
  const [showSortDropdown, setShowSortDropdown] = React.useState(false);

  // Animate new papers as they appear
  React.useEffect(() => {
    const newIds = new Set(papers.map((p) => p.id));
    const timer = setTimeout(() => {
      setAnimatedPapers(newIds);
    }, 50);
    return () => clearTimeout(timer);
  }, [papers]);

  // Filter papers based on search query
  const filteredPapers = React.useMemo(() => {
    if (!searchQuery.trim()) return papers;

    const query = searchQuery.toLowerCase();
    return papers.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        paper.authors.some((author) => author.toLowerCase().includes(query)) ||
        (paper.venue && paper.venue.toLowerCase().includes(query)) ||
        (paper.abstract && paper.abstract.toLowerCase().includes(query)),
    );
  }, [papers, searchQuery]);

  // Sort papers based on selected option
  const sortedPapers = React.useMemo(() => {
    const sorted = [...filteredPapers];

    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'author':
        return sorted.sort((a, b) => {
          const authorA = a.authors[0] || '';
          const authorB = b.authors[0] || '';
          return authorA.localeCompare(authorB);
        });
      case 'year':
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'category':
        return sorted.sort((a, b) => (a.source || '').localeCompare(b.source || ''));
      case 'publication_date':
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'recent':
      default:
        // Already sorted by addedAt in backend
        return sorted;
    }
  }, [filteredPapers, sortBy]);

  const getPaperStatus = (paper: Paper) => {
    if (paper.status === 'to_read') return 'unknown';
    if (paper.status === 'reading') return 'reading';
    if (paper.status === 'read') return 'read';
    return 'unknown';
  };

  // Calculate stagger delay for animations
  const getStaggerDelay = (index: number) => {
    const maxDelay = 0.2; // Maximum delay in seconds
    const delayIncrement = 0.02;
    return Math.min(index * delayIncrement, maxDelay);
  };

  const sortOptions = [
    { value: 'recent' as SortOption, label: 'Recently Added' },
    { value: 'title' as SortOption, label: 'Title' },
    { value: 'author' as SortOption, label: 'Author' },
    { value: 'year' as SortOption, label: 'Publication Year' },
    { value: 'category' as SortOption, label: 'Category' },
    { value: 'publication_date' as SortOption, label: 'Publication Date' },
  ];

  return (
    <div className="library-grid-container">
      {/* Library Controls */}
      <div className="library-controls">
        <div className="library-search">
          <BookOpen className="search-icon animate-pulse" size={16} />
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="library-actions">
          {/* Sort Dropdown */}
          <div className="sort-dropdown">
            <button
              type="button"
              className="sort-button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <Filter size={16} className="animate-spin" />
              <span>Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
            </button>

            {showSortDropdown && (
              <div className="sort-menu">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="library-grid library-grid-grid">
        {sortedPapers.map((paper, index) => (
          <div
            key={paper.id}
            className={`library-grid-item ${animatedPapers.has(paper.id) ? 'animated' : ''}`}
            style={{
              animationDelay: `${getStaggerDelay(index)}s`,
            }}
          >
            <LibraryCard
              id={paper.id}
              title={paper.title}
              authors={paper.authors}
              venue={paper.venue}
              year={paper.year}
              doi={paper.doi}
              abstract={paper.abstract}
              source={paper.source}
              status={getPaperStatus(paper)}
              category={category}
              isNew={index < 3}
              count={0}
              onClick={onPaperSelect}
              onRefresh={onRefresh}
              dateAdded={paper.filePath ? new Date().toISOString() : undefined}
              onShowCitations={onShowCitations}
            />
          </div>
        ))}
      </div>

      {sortedPapers.length === 0 && (
        <div className="empty-library-state">
          <p>No papers found matching your search.</p>
        </div>
      )}
    </div>
  );
};
