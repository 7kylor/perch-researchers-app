# Researchers App

A local-first Electron desktop application for academic researchers to manage, read, and analyze research papers with AI-powered features.

## Overview

Researchers App is a comprehensive knowledge management system designed specifically for academic researchers. It provides a local-first approach to paper management, allowing you to build your personal research library without relying on cloud services. The app combines traditional paper management with modern AI capabilities for enhanced research productivity.

## Key Features

###   Paper Management
- **Import Papers**: Add papers via DOI, ArXiv ID, PDF URLs, or local PDF files
- **Organize**: Create custom categories and labels using the sidebar system
- **Search**: Full-text search across your entire paper library
- **Status Tracking**: Mark papers as "to read", "reading", "read", etc.

###   PDF Reader
- **Dedicated Reader**: Open papers in a separate, focused PDF reader window
- **Annotations**: Highlight text and add notes with color coding
- **Page Navigation**: Easy page-by-page reading experience
- **Full-screen Mode**: Distraction-free reading environment

###   AI-Powered Features
- **Paper Summarization**: Get AI-generated summaries of papers
- **Question Answering**: Ask questions about specific papers or your entire library
- **Related Papers**: Discover papers similar to your current research
- **Local AI**: Uses ONNX Runtime for privacy-preserving local AI processing

###   Organization System
- **Hierarchical Sidebar**: Create folders and labels for organizing papers
- **Drag & Drop**: Organize papers by dragging them between categories
- **Custom Icons**: Personalize your organization with custom icons and colors
- **Smart Categories**: Built-in categories like "All", "Recent", "Favorites"

###   Advanced Search
- **Full-text Search**: Search across paper titles, abstracts, and content
- **Category Filtering**: Filter papers by specific categories
- **Vector Search**: Semantic search using embeddings (coming soon)
- **Search History**: Keep track of your search queries

## Technology Stack

### Frontend
- **React 19**: Modern React with latest features
- **TypeScript**: Strict typing for better code quality
- **Vite**: Fast build tool and development server
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icon library

### Backend
- **Electron**: Cross-platform desktop app framework
- **Better SQLite3**: High-performance local database
- **Drizzle ORM**: Type-safe database operations
- **SQLite VSS**: Vector similarity search extension

### AI & ML
- **ONNX Runtime**: Local AI model inference
- **Tesseract.js**: OCR capabilities for scanned papers
- **Readability.js**: Content extraction from web pages

### Development Tools
- **Vitest**: Fast unit testing
- **Playwright**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Installation

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd researchers-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

This will start:
- TypeScript compiler in watch mode
- Vite development server on port 5173
- Electron app with hot reload

### Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Package for distribution**
   ```bash
   npm run dist
   ```

The built application will be available in the `dist` folder.

## Project Structure

```
src/
├── main/                 # Electron main process
│   ├── ai/               # AI providers and RAG system
│   ├── db/               # Database schema and operations
│   ├── embeddings/       # Text embedding pipeline
│   ├── ingest/           # Paper import functionality
│   ├── ocr/              # OCR processing
│   └── main.ts           # Main process entry point
├── preload/              # Electron preload scripts
├── renderer/             # React frontend
│   ├── ui/               # UI components
│   │   ├── components/   # React components
│   │   └── sidebar/      # Sidebar store and components
│   └── main.tsx          # Frontend entry point
└── shared/               # Shared types and utilities
```

## Usage Guide

### Adding Papers

1. **Via DOI**: Enter a DOI (e.g., `10.1038/nature12373`)
2. **Via ArXiv**: Enter ArXiv ID (e.g., `2301.00001`)
3. **Via PDF URL**: Paste a direct PDF link
4. **Local PDF**: Upload a PDF file from your computer

### Organizing Papers

1. **Create Categories**: Right-click in sidebar to create folders
2. **Add Labels**: Create labels for tagging papers
3. **Drag & Drop**: Organize papers by dragging between categories
4. **Custom Icons**: Choose icons and colors for categories

### Reading Papers

1. **Open Reader**: Click on any paper to open in PDF reader
2. **Add Annotations**: Highlight text and add notes
3. **Navigate**: Use arrow keys or page controls
4. **Full-screen**: Press F11 for distraction-free reading

### AI Features

1. **Summarize**: Get AI-generated summaries of papers
2. **Ask Questions**: Query your paper library with natural language
3. **Find Related**: Discover similar papers based on content

## Configuration

### Database
The app uses SQLite for local storage. The database file is created automatically in the user data directory.

### AI Models
- **Local Models**: Uses ONNX Runtime for local inference
- **API Models**: Supports OpenAI API (requires API key)
- **Usage Limits**: Free tier has usage limits for AI features

### Themes
The app supports light and dark themes with system preference detection.

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Components**: Functional components with hooks
- **Types**: Strict typing, no `any` types allowed

### Testing

- **Unit Tests**: Vitest for component testing
- **E2E Tests**: Playwright for integration testing
- **Coverage**: Aim for high test coverage

## Releases

### Automated Releases

This project uses GitHub Actions to automatically build and release the application for multiple platforms when a new version tag is pushed.

#### Creating a Release

1. **Update Version**: Update the version in `package.json`
2. **Create Git Tag**: Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. **Automatic Build**: GitHub Actions will automatically:
   - Build for Linux (AppImage, deb, zip)
   - Build for Windows (NSIS installer, zip)
   - Build for macOS (Intel and Apple Silicon)
   - Create a GitHub release with all artifacts

#### Supported Platforms

- **Linux**: AppImage, Debian package, ZIP archive
- **Windows**: NSIS installer, ZIP archive
- **macOS**: DMG installer, ZIP archive (Intel and Apple Silicon)

#### Continuous Integration

The project includes CI workflows that run on every push and pull request:
- **Linting**: Code style and type checking
- **Testing**: Unit and E2E tests
- **Build Verification**: Ensures the app builds correctly on all platforms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Guidelines

- Use TypeScript strict mode
- Write tests for new features
- Follow existing code patterns
- Use semantic commit messages
- Keep components small and focused

## Roadmap

### Short Term
- [ ] Vector search implementation
- [ ] Advanced annotation features
- [ ] Paper export functionality
- [ ] Collaboration features

### Long Term
- [ ] Mobile companion app
- [ ] Cloud sync (optional)
- [ ] Advanced AI features
- [ ] Plugin system

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure Node.js 18+ is installed
2. **Database Issues**: Delete the database file to reset
3. **AI Features**: Check API keys and model availability
4. **Performance**: Large libraries may need optimization

### Getting Help

- Check the issues page for known problems
- Create a new issue with detailed information
- Include system information and error logs

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with Electron and React
- Uses Drizzle ORM for database operations
- AI features powered by ONNX Runtime
- Icons by Lucide React
- UI components by Radix UI

---

**Researchers App** - Empowering researchers with modern tools for knowledge management and discovery.
# Test commit to trigger release workflow
