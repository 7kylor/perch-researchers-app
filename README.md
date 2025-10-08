# Perch Researchers App

A powerful, local-first Electron desktop application designed for academic researchers to efficiently manage, read, and analyze research papers with integrated AI capabilities.

## Overview

**Perch Researchers App** is a comprehensive knowledge management system built specifically for academic researchers and scholars. It offers a local-first architecture that ensures your research data remains private and accessible without relying on external cloud services. The application seamlessly integrates traditional document management with cutting-edge AI features to enhance research productivity and discovery.

### Core Philosophy
- **Privacy First**: All data stored locally, no external dependencies
- **Research Focused**: Designed by researchers, for researchers
- **AI Enhanced**: Local AI processing for summaries, Q&A, and discovery
- **Cross-Platform**: Native applications for Windows, macOS, and Linux

## Key Features

### Paper Management
- **Smart Import**: Add papers via DOI, ArXiv ID, PDF URLs, or local PDF files
- **Intelligent Organization**: Create custom categories and labels with drag-and-drop functionality
- **Advanced Search**: Full-text search across titles, abstracts, and content
- **Progress Tracking**: Mark papers as "to read", "reading", "read", or create custom statuses

### PDF Reader
- **Dedicated Reader Window**: Open papers in a separate, focused PDF reader
- **Rich Annotations**: Highlight text, add notes, and color-code annotations
- **Intuitive Navigation**: Page-by-page reading with keyboard shortcuts
- **Full-screen Mode**: Distraction-free reading environment

### AI-Powered Features
- **Paper Summarization**: Get AI-generated summaries of research papers
- **Question Answering**: Ask natural language questions about specific papers or your entire library
- **Related Papers**: Discover semantically similar papers using vector embeddings
- **Local AI Processing**: Uses ONNX Runtime for privacy-preserving local inference

### Organization System
- **Hierarchical Sidebar**: Create nested folders and labels for organizing papers
- **Visual Customization**: Personalize categories with custom icons and colors
- **Smart Categories**: Built-in categories like "All", "Recent", "Favorites"
- **Bulk Operations**: Select and organize multiple papers simultaneously

### Advanced Search
- **Full-Text Search**: Search across paper titles, abstracts, authors, and content
- **Category Filtering**: Filter papers by specific categories or labels
- **Semantic Search**: Vector-based similarity search for related content
- **Search History**: Track and revisit previous search queries

## Technology Stack

### Frontend
- **React 19**: Modern React with latest features and performance optimizations
- **TypeScript**: Strict typing with comprehensive type safety
- **Vite**: Lightning-fast build tool and development server
- **Radix UI**: Accessible, customizable component primitives
- **Lucide React**: Beautiful, consistent icon library

### Backend & Desktop
- **Electron**: Cross-platform desktop application framework
- **Better SQLite3**: High-performance embedded database
- **Drizzle ORM**: Type-safe database operations and migrations
- **SQLite VSS**: Vector similarity search extension for semantic features

### AI & Machine Learning
- **ONNX Runtime**: Cross-platform ML model inference
- **Tesseract.js**: Optical character recognition for scanned documents
- **Readability.js**: Web content extraction and cleaning
- **Sentence Transformers**: Local embedding generation

### Development & Quality
- **Vitest**: Fast, modern unit testing framework
- **Playwright**: Comprehensive end-to-end testing
- **ESLint**: Advanced linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for quality enforcement

## Installation & Setup

### Prerequisites
- **Node.js 20+** (LTS recommended)
- **npm** or **yarn** package manager
- **Git** for version control

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/7kylor/perch-researchers-app.git
   cd perch-researchers-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   This will launch:
   - TypeScript compiler in watch mode
   - Vite development server on `http://localhost:5173`
   - Electron application with hot reload

### Building for Production

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Package for Distribution**
   ```bash
   npm run dist
   ```

   Built packages will be available in the `dist/` directory.

## Project Structure

```
perch-researchers-app/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── ai/                  # AI providers and RAG system
│   │   │   ├── providers.ts     # AI model providers
│   │   │   └── rag.ts           # Retrieval-augmented generation
│   │   ├── db/                  # Database layer
│   │   │   ├── schema.ts        # Database schema definitions
│   │   │   └── db.ts            # Database connection and operations
│   │   ├── embeddings/          # Text embedding pipeline
│   │   │   └── pipeline.ts      # Embedding generation and storage
│   │   ├── ingest/              # Document import system
│   │   │   ├── crossref.ts      # DOI/ArXiv metadata fetching
│   │   │   ├── importer.ts      # Document import coordination
│   │   │   ├── pdf-import.ts    # PDF processing and extraction
│   │   │   └── pdf-metadata-extractor.ts
│   │   ├── ocr/                 # OCR processing
│   │   │   └── batch.ts         # Batch OCR operations
│   │   ├── ipc.ts               # Inter-process communication
│   │   └── main.ts              # Application entry point
│   ├── preload/                 # Electron preload scripts
│   │   └── preload.ts           # Secure context bridge
│   ├── renderer/                # React frontend application
│   │   ├── ui/                  # User interface components
│   │   │   ├── components/      # Reusable UI components
│   │   │   │   ├── ActivityBar.tsx
│   │   │   │   ├── EnhancedAddPaper.tsx
│   │   │   │   ├── LibraryCard.tsx
│   │   │   │   ├── LibraryGrid.tsx
│   │   │   │   ├── PaperReader.tsx
│   │   │   │   └── SettingsPanel.tsx
│   │   │   └── sidebar/         # Sidebar functionality
│   │   │       ├── Sidebar.tsx
│   │   │       ├── SidebarTree.tsx
│   │   │       └── store.ts      # Zustand state management
│   │   └── main.tsx             # React application entry
│   ├── shared/                  # Shared utilities and types
│   │   ├── sidebar.ts           # Sidebar type definitions
│   │   └── types.ts             # Common TypeScript types
│   └── types/                   # Type definitions
│       ├── arxiv.d.ts           # ArXiv API types
│       └── mupdf.d.ts           # PDF.js type definitions
├── .github/
│   └── workflows/               # CI/CD automation
│       ├── ci.yml               # Continuous integration
│       ├── preview.yml          # Pull request previews
│       └── release.yml          # Automated releases
├── dist/                        # Built application artifacts
├── node_modules/                # Dependencies
├── scripts/                     # Build and utility scripts
└── docs/                        # Documentation (planned)
```

## 🚀 Usage Guide

### Adding Research Papers

**Multiple Import Methods:**
1. **DOI Import**: Enter a DOI (e.g., `10.1038/nature12373`)
2. **ArXiv Import**: Enter ArXiv ID (e.g., `2301.00001`)
3. **PDF URL**: Paste direct links to PDF files
4. **Local Files**: Upload PDF files from your computer
5. **Bulk Import**: Add multiple papers simultaneously

### Organizing Your Library

**Smart Organization:**
1. **Create Categories**: Right-click sidebar to create folders and subfolders
2. **Custom Labels**: Tag papers with keywords and topics
3. **Visual Customization**: Choose icons and colors for categories
4. **Bulk Operations**: Select multiple papers for batch organization
5. **Smart Collections**: Use built-in categories like "Recent", "Unread", "Favorites"

### Reading & Annotating

**Enhanced Reading Experience:**
1. **Dedicated Reader**: Click any paper to open in focused PDF reader
2. **Rich Annotations**: Highlight text, add notes, and color-code annotations
3. **Navigation Controls**: Page controls, zoom, and search within documents
4. **Keyboard Shortcuts**: Efficient navigation with keyboard commands
5. **Full-Screen Mode**: Distraction-free reading environment

### AI-Powered Research

**Intelligent Assistance:**
1. **Automatic Summarization**: Generate concise summaries of research papers
2. **Question Answering**: Ask natural language questions about papers
3. **Semantic Search**: Find related papers using content similarity
4. **Smart Recommendations**: Discover relevant papers based on your reading history

## ⚙️ Configuration

### Database Configuration
- **Storage**: SQLite database stored in user data directory
- **Performance**: Optimized for large research libraries (1000+ papers)
- **Backup**: Automatic daily backups with manual export options

### AI Model Configuration
- **Local Models**: ONNX Runtime for offline AI processing
- **API Integration**: Optional OpenAI API for enhanced features
- **Privacy Settings**: Configurable data usage for AI features

### Theme & Appearance
- **Light/Dark Themes**: Automatic system preference detection
- **Customizable UI**: Adjustable sidebar width and layout options
- **Accessibility**: High contrast mode and keyboard navigation

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:ui      # Run tests with UI

# Code Quality
npm run lint         # Lint code for issues
npm run format       # Format code with Prettier
npm run typecheck    # Check TypeScript types

# Building & Distribution
npm run pack         # Create development build
npm run dist         # Create distribution packages
```

### Code Standards

**Development Guidelines:**
- **TypeScript Strict Mode**: Enabled for maximum type safety
- **ESLint Configuration**: React, TypeScript, and accessibility rules
- **Prettier Formatting**: Consistent code style across the project
- **Component Architecture**: Functional components with custom hooks
- **State Management**: Zustand for global state, React Query for server state

**Testing Requirements:**
- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: Playwright for end-to-end workflows
- **Minimum Coverage**: 80% code coverage requirement
- **Test Categories**: Unit, integration, and accessibility tests

## 🚀 Releases & Distribution

### Automated Release Process

The project uses GitHub Actions for fully automated multi-platform releases:

#### Creating a New Release

1. **Update Version**
   ```bash
   # Update package.json version
   npm version patch|minor|major
   ```

2. **Create Release Tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Automatic Build Process**
   GitHub Actions automatically:
   - Builds for Linux (AppImage, .deb, .zip)
   - Builds for Windows (NSIS installer, .zip)
   - Builds for macOS (Intel + Apple Silicon)
   - Creates GitHub release with all artifacts

### Supported Platforms

| Platform | Formats | Architectures |
|----------|---------|---------------|
| **Linux** | AppImage, Debian (.deb), ZIP | x64 |
| **Windows** | NSIS Installer (.exe), ZIP | x64 |
| **macOS** | DMG Installer, ZIP | x64, arm64 (Apple Silicon) |

### Continuous Integration

**Automated Quality Checks:**
- **Code Linting**: ESLint and Prettier validation
- **Type Checking**: TypeScript strict mode verification
- **Unit Testing**: Vitest test suite execution
- **Build Testing**: Multi-platform build verification
- **Security Scanning**: Dependency vulnerability checks

## 🤝 Contributing

We welcome contributions from the research community! Here's how to get involved:

### Getting Started
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes with comprehensive tests
4. **Test** thoroughly across platforms
5. **Submit** a pull request

### Contribution Guidelines

**Code Standards:**
- **TypeScript Strict**: All code must pass strict type checking
- **Test Coverage**: New features require appropriate tests
- **Documentation**: Update README and inline documentation
- **Semantic Commits**: Use conventional commit format

**Pull Request Process:**
1. Ensure all tests pass
2. Update documentation as needed
3. Follow the existing code style
4. Request review from maintainers

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/new-ai-model

# Make changes and add tests
# Ensure tests pass: npm run test

# Commit with semantic message
git commit -m "feat: add support for new embedding model"

# Push and create PR
git push origin feature/new-ai-model
```

## 🗺️ Roadmap

### Short Term (v1.1 - v1.3)
- [ ] **Vector Search Enhancement**: Improved semantic search with multiple embedding models
- [ ] **Advanced Annotations**: Rich text notes, drawing tools, and annotation export
- [ ] **Paper Export**: PDF export with annotations, citation management
- [ ] **Collaboration Features**: Shared libraries and collaborative annotations

### Medium Term (v1.4 - v2.0)
- [ ] **Mobile Companion App**: iOS and Android apps for on-the-go access
- [ ] **Plugin System**: Extensible architecture for custom integrations
- [ ] **Cloud Sync**: Optional encrypted cloud synchronization
- [ ] **Advanced AI Models**: Integration with state-of-the-art language models

### Long Term Vision (v2.0+)
- [ ] **Research Network**: Connect with other researchers and share libraries
- [ ] **Citation Management**: Built-in citation tracking and bibliography generation
- [ ] **Research Metrics**: Track reading patterns and research productivity
- [ ] **Institutional Integration**: LDAP/SSO integration for university environments

## 🔧 Troubleshooting

### Common Issues

**Build Problems:**
- Ensure Node.js 20+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check available disk space for large builds

**Database Issues:**
- Database location: `~/Library/Application Support/perch-researchers-app/` (macOS)
- Reset database: Delete the `.db` file in the user data directory

**AI Features Not Working:**
- Check model download status in settings
- Verify internet connection for initial model downloads
- Check available disk space for model storage

**Performance Issues:**
- Large libraries (>1000 papers) may need optimization
- Enable database indexing in settings
- Consider archiving old papers if performance degrades

### Getting Help

- **📖 Documentation**: Check this README and inline code documentation
- **🐛 Issues**: [Create an issue](https://github.com/7kylor/perch-researchers-app/issues) with:
  - Detailed description of the problem
  - Steps to reproduce
  - System information (OS, Node.js version)
  - Relevant error logs
- **💬 Discussions**: Use GitHub Discussions for questions and feature requests

## 📄 License

**MIT License** - See [LICENSE](LICENSE) file for full details.

You are free to use, modify, and distribute this software under the terms of the MIT License. The software is provided "as is" without warranty of any kind.

## 🙏 Acknowledgments

**Built with Modern Technologies:**
- **Electron** - Cross-platform desktop applications
- **React** - User interface framework
- **TypeScript** - Type-safe JavaScript development
- **SQLite** - Embedded database engine
- **Drizzle ORM** - Database toolkit for TypeScript
- **ONNX Runtime** - Machine learning model inference
- **Radix UI** - Accessible component system
- **Lucide React** - Beautiful icon library

**AI & Research Tools:**
- **Sentence Transformers** - Text embedding models
- **Tesseract.js** - Optical character recognition
- **ArXiv API** - Research paper metadata
- **CrossRef API** - DOI and citation data

**Development Tools:**
- **Vite** - Fast build tool and dev server
- **Vitest** - Modern testing framework
- **Playwright** - End-to-end testing
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting

---

<div align="center">

**Perch Researchers App** - *Empowering researchers with intelligent, local-first knowledge management*

*Built by researchers, for researchers* 🦜📚

[⭐ Star on GitHub](https://github.com/7kylor/perch-researchers-app) • [🐛 Report Issues](https://github.com/7kylor/perch-researchers-app/issues) • [💬 Join Discussion](https://github.com/7kylor/perch-researchers-app/discussions)

</div>
