import React from 'react';
import {
  BookOpen,
  Clock,
  Edit,
  Trash2,
  Layers,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { ContextMenu } from './ContextMenu';

type Category = {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  lastUsed?: number;
  usageCount?: number;
  group?: string;
};

type CategoryGroup = {
  id: string;
  name: string;
  categories: Category[];
  isExpanded: boolean;
  count: number;
};

type LibrarySidebarProps = {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  isCollapsed: boolean;
};

// Categories will be loaded from localStorage and managed by user

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  selectedCategory,
  onCategorySelect,
  isCollapsed,
}) => {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = React.useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = React.useState<CategoryGroup[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'grid' | 'compact'>('list');
  const [groupBy, setGroupBy] = React.useState<'alphabetical' | 'usage' | 'recent' | 'none'>(
    'alphabetical',
  );
  const [showSearch, setShowSearch] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    isOpen: boolean;
    x: number;
    y: number;
    categoryId: string | null;
  }>({ isOpen: false, x: 0, y: 0, categoryId: null });
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);
  const [virtualScroll, setVirtualScroll] = React.useState(true);
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  const [showSmartSuggestions, setShowSmartSuggestions] = React.useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false);

  const sidebarRef = React.useRef<HTMLElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const categoryListRef = React.useRef<HTMLUListElement | null>(null);

  // Load categories from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('categories');
    if (saved) {
      try {
        const savedCategories = JSON.parse(saved);
        // Enhance categories with usage data
        const enhancedCategories = savedCategories.map((cat: Category) => ({
          ...cat,
          lastUsed: cat.lastUsed || 0,
          usageCount: cat.usageCount || 0,
        }));
        setCategories(enhancedCategories);
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
      }
    }
  }, []);

  // Filter and group categories
  React.useEffect(() => {
    let filtered = categories;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredCategories(filtered);

    // Group categories based on groupBy setting
    if (groupBy === 'none') {
      setCategoryGroups([]);
    } else {
      const groups: CategoryGroup[] = [];

      if (groupBy === 'alphabetical') {
        const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        const grouped = sorted.reduce(
          (acc, category) => {
            const firstLetter = category.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
              acc[firstLetter] = [];
            }
            acc[firstLetter].push(category);
            return acc;
          },
          {} as Record<string, Category[]>,
        );

        Object.entries(grouped).forEach(([letter, cats]) => {
          groups.push({
            id: `group-${letter}`,
            name: letter,
            categories: cats,
            isExpanded: true,
            count: cats.length,
          });
        });
      } else if (groupBy === 'usage') {
        const sorted = [...filtered].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        const highUsage = sorted.filter((cat) => (cat.usageCount || 0) > 5);
        const mediumUsage = sorted.filter(
          (cat) => (cat.usageCount || 0) <= 5 && (cat.usageCount || 0) > 0,
        );
        const noUsage = sorted.filter((cat) => (cat.usageCount || 0) === 0);

        if (highUsage.length > 0) {
          groups.push({
            id: 'group-frequent',
            name: 'Frequently Used',
            categories: highUsage,
            isExpanded: true,
            count: highUsage.length,
          });
        }
        if (mediumUsage.length > 0) {
          groups.push({
            id: 'group-medium',
            name: 'Sometimes Used',
            categories: mediumUsage,
            isExpanded: true,
            count: mediumUsage.length,
          });
        }
        if (noUsage.length > 0) {
          groups.push({
            id: 'group-unused',
            name: 'Never Used',
            categories: noUsage,
            isExpanded: false,
            count: noUsage.length,
          });
        }
      } else if (groupBy === 'recent') {
        const sorted = [...filtered].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        const recent = sorted.slice(0, 10);
        const older = sorted.slice(10);

        if (recent.length > 0) {
          groups.push({
            id: 'group-recent',
            name: 'Recently Used',
            categories: recent,
            isExpanded: true,
            count: recent.length,
          });
        }
        if (older.length > 0) {
          groups.push({
            id: 'group-older',
            name: 'Older Categories',
            categories: older,
            isExpanded: false,
            count: older.length,
          });
        }
      }

      setCategoryGroups(groups);
    }
  }, [categories, searchQuery, groupBy]);

  const handleCategoryLongPress = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      categoryId,
    });
  };

  const saveCategoriesToStorage = (updatedCategories: Category[]) => {
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const updateCategoryUsage = (categoryId: string) => {
    const now = Date.now();
    const updatedCategories = categories.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          lastUsed: now,
          usageCount: (category.usageCount || 0) + 1,
        };
      }
      return category;
    });
    saveCategoriesToStorage(updatedCategories);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setCategoryGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group,
      ),
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  // Virtual scrolling logic
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 50 });

  React.useEffect(() => {
    if (!categoryListRef.current || !virtualScroll) return;

    const handleScroll = () => {
      const container = categoryListRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const itemHeight = viewMode === 'compact' ? 32 : viewMode === 'grid' ? 60 : 44;
      const visibleCount = Math.ceil(container.clientHeight / itemHeight);

      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(start + visibleCount + 10, filteredCategories.length);

      setVisibleRange({ start, end });
    };

    const container = categoryListRef.current;
    handleScroll();
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, [filteredCategories.length, viewMode, virtualScroll]);

  const visibleCategories = React.useMemo(() => {
    if (!virtualScroll) return filteredCategories;
    return filteredCategories.slice(visibleRange.start, visibleRange.end);
  }, [filteredCategories, visibleRange, virtualScroll]);

  // Detect when categories exceed available space and need scroll indicator
  React.useEffect(() => {
    if (!categoryListRef.current) {
      setShowScrollIndicator(false);
      return;
    }

    const checkScrollPosition = () => {
      const container = categoryListRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Calculate if we need to show scroll indicator
      const hasOverflow = scrollHeight > clientHeight;
      const isScrolledFromTop = scrollTop > 10; // Small buffer from top
      const isNotAtBottom = scrollTop + clientHeight < scrollHeight - 50; // Not near bottom

      // Show indicator if: has overflow, not at top, and not at bottom
      setShowScrollIndicator(hasOverflow && isScrolledFromTop && isNotAtBottom);
    };

    const container = categoryListRef.current;
    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);

    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [filteredCategories.length]);

  // Bulk operations
  const handleCategorySelect = (categoryId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (isSelected) {
      newSelected.add(categoryId);
    } else {
      newSelected.delete(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCategories.size === filteredCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(filteredCategories.map((c) => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCategories.size === 0) return;

    if (window.confirm(`Delete ${selectedCategories.size} selected categories?`)) {
      const updatedCategories = categories.filter((cat) => !selectedCategories.has(cat.id));
      saveCategoriesToStorage(updatedCategories);
      setSelectedCategories(new Set());
    }
  };

  const handleBulkRename = () => {
    if (selectedCategories.size === 0) return;

    const newName = prompt('Enter new name for selected categories:');
    if (newName?.trim()) {
      const updatedCategories = categories.map((cat) =>
        selectedCategories.has(cat.id) ? { ...cat, name: newName.trim() } : cat,
      );
      saveCategoriesToStorage(updatedCategories);
      setSelectedCategories(new Set());
    }
  };

  // Smart suggestions
  const smartSuggestions = React.useMemo(() => {
    const suggestions: string[] = [];
    const categoryNames = categories.map((c) => c.name.toLowerCase());

    // Common academic categories
    const commonCategories = [
      'Machine Learning',
      'Deep Learning',
      'Computer Vision',
      'Natural Language Processing',
      'Data Science',
      'Artificial Intelligence',
      'Robotics',
      'Bioinformatics',
      'Computer Graphics',
      'Software Engineering',
      'Database Systems',
      'Network Security',
      'Algorithms',
      'Theory of Computation',
      'Human-Computer Interaction',
      'Distributed Systems',
      'Operating Systems',
      'Computer Architecture',
    ];

    commonCategories.forEach((suggestion) => {
      if (!categoryNames.includes(suggestion.toLowerCase()) && suggestions.length < 5) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }, [categories]);

  const addSmartSuggestion = (suggestion: string) => {
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: suggestion,
      count: 0,
      icon: <Layers className="h-3 w-3" />,
      color: '#6b7280',
      lastUsed: Date.now(),
      usageCount: 1,
    };
    const updatedCategories = [...categories, newCategory];
    saveCategoriesToStorage(updatedCategories);
    setShowSmartSuggestions(false);
  };

  const handleAddCategory = () => {
    const categoryName = prompt('Enter category name:');
    if (categoryName?.trim()) {
      const newCategory: Category = {
        id: `category-${Date.now()}`,
        name: categoryName.trim(),
        count: 0,
        icon: <Layers className="h-3 w-3" />,
        color: '#6b7280',
        lastUsed: Date.now(),
        usageCount: 1,
      };
      const updatedCategories = [...categories, newCategory];
      saveCategoriesToStorage(updatedCategories);
    }
  };

  const handleCategoryRename = (categoryId: string) => {
    const newName = prompt('Enter new category name:');
    if (newName?.trim()) {
      const updatedCategories = categories.map((category) =>
        category.id === categoryId ? { ...category, name: newName.trim() } : category,
      );
      saveCategoriesToStorage(updatedCategories);
    }
    setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null });
  };

  const handleCategoryDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const updatedCategories = categories.filter((category) => category.id !== categoryId);
      saveCategoriesToStorage(updatedCategories);
    }
    setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null });
  };

  const contextMenuItems = contextMenu.categoryId
    ? [
        {
          label: 'Rename',
          icon: <Edit className="h-3 w-3" />,
          onClick: () => handleCategoryRename(contextMenu.categoryId as string),
        },
        {
          label: 'Delete',
          icon: <Trash2 className="h-3 w-3" />,
          onClick: () => handleCategoryDelete(contextMenu.categoryId as string),
          danger: true,
        },
      ]
    : [];

  const renderCategoryItem = (category: Category, _isInGroup = false) => {
    const isSelected = selectedCategories.has(category.id);

    return (
      <li key={category.id}>
        <div className={`category-item-wrapper ${isSelected ? 'selected' : ''}`}>
          {selectedCategories.size > 0 && !isCollapsed && (
            <input
              type="checkbox"
              className="category-checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleCategorySelect(category.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            type="button"
            className={`sidebar-item ${selectedCategory === category.id ? 'selected' : ''} ${
              viewMode === 'compact' ? 'compact' : ''
            } ${viewMode === 'grid' ? 'grid-item' : ''}`}
            aria-current={selectedCategory === category.id ? 'page' : undefined}
            onClick={(e) => {
              if (selectedCategories.size > 0) {
                e.preventDefault();
                handleCategorySelect(category.id, !isSelected);
              } else {
                onCategorySelect(category.id);
                updateCategoryUsage(category.id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCategoryLongPress(e, category.id);
            }}
            onMouseDown={(e) => {
              const timer = setTimeout(() => {
                handleCategoryLongPress(e, category.id);
              }, 500);

              const handleMouseUp = () => {
                clearTimeout(timer);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <span className="item-icon" style={{ color: category.color }} aria-hidden="true">
              {typeof category.icon === 'string' ? category.icon : category.icon}
            </span>
            <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>{category.name}</span>
            {!isCollapsed && (
              <span className={`item-count ${viewMode === 'compact' ? 'compact-count' : ''}`}>
                {category.count}
              </span>
            )}
          </button>
        </div>
      </li>
    );
  };

  return (
    <nav
      className={`library-sidebar ${isCollapsed ? 'collapsed' : ''} view-mode-${viewMode}`}
      aria-label="Library sidebar"
      ref={sidebarRef as React.RefObject<HTMLElement>}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const root = sidebarRef.current;
        if (!root) return;
        const focusable = Array.from(
          root.querySelectorAll<HTMLButtonElement>('li > button.sidebar-item:not(.hidden)'),
        );
        if (focusable.length === 0) return;
        const currentIndex = focusable.findIndex((el) => el === document.activeElement);
        let nextIndex = currentIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % focusable.length;
        } else if (e.key === 'ArrowUp') {
          nextIndex =
            currentIndex === -1
              ? focusable.length - 1
              : (currentIndex - 1 + focusable.length) % focusable.length;
        }
        const next = focusable[nextIndex];
        if (next) {
          e.preventDefault();
          next.focus();
        }
      }}
    >
      <div className="sidebar-grid">
        {/* Library Section */}
        <div className="sidebar-section library-section">
          <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Library</h3>
          <ul className={`section-items ${viewMode === 'grid' ? 'grid-view' : ''}`}>
            <li>
              <button
                type="button"
                className={`sidebar-item ${selectedCategory === 'all' ? 'selected' : ''}`}
                aria-current={selectedCategory === 'all' ? 'page' : undefined}
                onClick={() => onCategorySelect('all')}
              >
                <span className="item-icon" aria-hidden="true">
                  <BookOpen className="h-3 w-3" />
                </span>
                <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>All Papers</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sidebar-item ${selectedCategory === 'recent' ? 'selected' : ''}`}
                aria-current={selectedCategory === 'recent' ? 'page' : undefined}
                onClick={() => onCategorySelect('recent')}
              >
                <span className="item-icon" aria-hidden="true">
                  <Clock className="h-3 w-3" />
                </span>
                <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>Recent</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Categories Section */}
        <div className="sidebar-section categories-section">
          <div className={`section-title ${isCollapsed ? 'hidden' : ''}`} style={{ flexShrink: 0 }}>
            <span>
              Categories {filteredCategories.length > 0 && `(${filteredCategories.length})`}
            </span>
            {!isCollapsed && (
              <div className="category-title-actions">
                {selectedCategories.size > 0 && (
                  <div className="bulk-actions">
                    <span className="selected-count">{selectedCategories.size} selected</span>
                    <button
                      type="button"
                      className="bulk-action-btn"
                      onClick={handleSelectAll}
                      title={
                        selectedCategories.size === filteredCategories.length
                          ? 'Deselect all'
                          : 'Select all'
                      }
                    >
                      {selectedCategories.size === filteredCategories.length
                        ? 'Deselect'
                        : 'Select All'}
                    </button>
                    <button
                      type="button"
                      className="bulk-action-btn"
                      onClick={handleBulkRename}
                      title="Rename selected categories"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="bulk-action-btn danger"
                      onClick={handleBulkDelete}
                      title="Delete selected categories"
                    >
                      Delete
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="category-menu-btn"
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  title="Category management"
                  aria-label="Category management"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="add-category-title-btn"
                  onClick={handleAddCategory}
                  title="Add new category"
                  aria-label="Add category"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Categories Scrollable Container */}
          <div className="categories-scroll-container">
            {/* Category Management Menu */}
            {showCategoryMenu && !isCollapsed && (
              <div className="category-management-menu">
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowSmartSuggestions(!showSmartSuggestions);
                    setShowCategoryMenu(false);
                  }}
                >
                  Smart Suggestions
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setVirtualScroll(!virtualScroll);
                    setShowCategoryMenu(false);
                  }}
                >
                  {virtualScroll ? 'Disable' : 'Enable'} Virtual Scroll
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    // Export categories logic
                    const dataStr = JSON.stringify(categories, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'categories.json';
                    link.click();
                    URL.revokeObjectURL(url);
                    setShowCategoryMenu(false);
                  }}
                >
                  Export Categories
                </button>
              </div>
            )}

            {/* Smart Suggestions */}
            {showSmartSuggestions && !isCollapsed && (
              <div className="smart-suggestions">
                <div className="suggestions-header">
                  <span>Suggested Categories</span>
                  <button
                    type="button"
                    className="close-suggestions"
                    onClick={() => setShowSmartSuggestions(false)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="suggestions-list">
                  {smartSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion-item"
                      onClick={() => addSmartSuggestion(suggestion)}
                    >
                      <Layers className="h-3 w-3" />
                      <span>{suggestion}</span>
                      <Plus className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Controls Section (when shown) */}
            {!isCollapsed && (showSearch || categories.length > 10) && (
              <div className="search-controls-section">
                <div className="search-controls">
                  <div className="search-container">
                    <button
                      type="button"
                      className="search-toggle-btn"
                      onClick={handleSearchToggle}
                      title={showSearch ? 'Hide search' : 'Search categories'}
                      aria-label={showSearch ? 'Hide search' : 'Search categories'}
                    >
                      {showSearch ? <X className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                    </button>
                    {showSearch && (
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            clearSearch();
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="view-controls">
                    <div className="view-mode-buttons">
                      <button
                        type="button"
                        className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List view"
                        aria-label="List view"
                      >
                        <List className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={`view-mode-btn ${viewMode === 'compact' ? 'active' : ''}`}
                        onClick={() => setViewMode('compact')}
                        title="Compact view"
                        aria-label="Compact view"
                      >
                        <Filter className="h-3 w-3" />
                      </button>
                    </div>

                    <select
                      className="group-by-select"
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                      title="Group categories by"
                    >
                      <option value="none">No Grouping</option>
                      <option value="alphabetical">Alphabetical</option>
                      <option value="usage">By Usage</option>
                      <option value="recent">Recently Used</option>
                    </select>

                    <button
                      type="button"
                      className={`view-mode-btn ${virtualScroll ? 'active' : ''}`}
                      onClick={() => setVirtualScroll(!virtualScroll)}
                      title={
                        virtualScroll ? 'Disable virtual scrolling' : 'Enable virtual scrolling'
                      }
                      aria-label={
                        virtualScroll ? 'Disable virtual scrolling' : 'Enable virtual scrolling'
                      }
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories List */}
            <div className="categories-list-wrapper">
              {groupBy === 'none' ? (
                <ul
                  ref={categoryListRef}
                  className={`section-items ${viewMode === 'grid' ? 'grid-view' : ''} ${virtualScroll ? 'virtual-scroll' : ''}`}
                  style={
                    virtualScroll
                      ? {
                          height: `${Math.min(filteredCategories.length * (viewMode === 'compact' ? 32 : viewMode === 'grid' ? 60 : 44), 400)}px`,
                          overflowY: filteredCategories.length > 50 ? 'auto' : 'visible',
                        }
                      : {}
                  }
                >
                  {virtualScroll ? (
                    <>
                      <div
                        style={{
                          height: `${visibleRange.start * (viewMode === 'compact' ? 32 : viewMode === 'grid' ? 60 : 44)}px`,
                        }}
                      />
                      {visibleCategories.map((category) => renderCategoryItem(category))}
                      <div
                        style={{
                          height: `${(filteredCategories.length - visibleRange.end) * (viewMode === 'compact' ? 32 : viewMode === 'grid' ? 60 : 44)}px`,
                        }}
                      />
                    </>
                  ) : (
                    filteredCategories.map((category) => renderCategoryItem(category))
                  )}
                </ul>
              ) : (
                <div className="category-groups">
                  {categoryGroups.map((group) => (
                    <div key={group.id} className="category-group">
                      <button
                        type="button"
                        className={`group-header ${group.isExpanded ? 'expanded' : 'collapsed'}`}
                        onClick={() => handleGroupToggle(group.id)}
                      >
                        <span className="group-icon">
                          {group.isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </span>
                        <span className="group-name">
                          {group.name} ({group.count})
                        </span>
                      </button>
                      {group.isExpanded && (
                        <ul className={`group-items ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                          {group.categories.map((category) => renderCategoryItem(category, true))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scroll Indicator and Fade Effect */}
            {showScrollIndicator && filteredCategories.length > 10 && (
              <>
                {/* Fade Effect */}
                <div className="categories-fade-overlay" />

                {/* Scroll Indicator */}
                <div className="categories-scroll-indicator">
                  <div className="scroll-indicator-content">
                    <span className="scroll-indicator-text">Scroll for more categories</span>
                    <div className="scroll-indicator-arrow">
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className={`sidebar-footer ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          type="button"
          className={`sidebar-item sidebar-account-btn ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => {
            console.log('Account clicked - open modal');
          }}
        >
          <div className="sidebar-avatar" aria-hidden="true">
            JD
          </div>
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>John Doe</span>
        </button>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null })}
        items={contextMenuItems}
      />
    </nav>
  );
};
