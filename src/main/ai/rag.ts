import { openDatabase } from '../db.js';
import { createAIProvider, type AIProvider } from './providers.js';

const db = openDatabase();

export class RAGSystem {
  private aiProvider: AIProvider;
  private usageCount = 0;
  private readonly maxUsage = 5; // Free tier limit

  constructor(aiType: 'openai' | 'local' = 'local', apiKey?: string) {
    this.aiProvider = createAIProvider(aiType, apiKey);
  }

  async summarizePaper(paperId: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const paper = db.prepare('select title, abstract from papers where id = ?').get(paperId) as
      | { title: string; abstract: string | null }
      | undefined;

    if (!paper) return 'Paper not found';

    const text = `${paper.title}\n\n${paper.abstract || ''}`;
    return this.aiProvider.summarize(text);
  }

  async answerQuestion(question: string, paperId?: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    let context = '';

    if (paperId) {
      // Answer based on specific paper
      const paper = db.prepare('select title, abstract from papers where id = ?').get(paperId) as
        | { title: string; abstract: string | null }
        | undefined;

      if (paper) {
        context = `${paper.title}\n\n${paper.abstract || ''}`;
      }
    } else {
      // Answer based on all papers (RAG)
      const papers = db.prepare('select title, abstract from papers').all() as Array<{
        title: string;
        abstract: string | null;
      }>;

      context = papers.map((p) => `${p.title}\n${p.abstract || ''}`).join('\n\n');
    }

    return this.aiProvider.answerQuestion(question, context);
  }

  async generateRelatedPapers(
    query: string,
  ): Promise<Array<{ paperId: string; title: string; score: number }>> {
    if (!this.canUseAI()) return [];

    // Simple similarity search using embeddings
    const papers = db.prepare('select id, title from papers').all() as Array<{
      id: string;
      title: string;
    }>;

    const queryEmbedding = await this.aiProvider.generateEmbeddings([query]);
    const _queryVector = queryEmbedding[0];

    // For now, return papers with simple text similarity
    return papers
      .map((paper) => ({
        paperId: paper.id,
        title: paper.title,
        score: this.calculateSimilarity(query, paper.title),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  async synthesizeLiteratureReview(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue, doi from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
      doi: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for synthesis';

    // Group papers by themes and topics for better synthesis
    const papersByDecade: Record<string, typeof papers> = {};
    const papersByVenue: Record<string, typeof papers> = {};

    papers.forEach((paper) => {
      // Group by decade
      const decade = paper.year ? `${Math.floor(paper.year / 10) * 10}s` : 'Unknown';
      if (!papersByDecade[decade]) papersByDecade[decade] = [];
      papersByDecade[decade].push(paper);

      // Group by venue type
      const venue = paper.venue || 'Unknown';
      if (!papersByVenue[venue]) papersByVenue[venue] = [];
      papersByVenue[venue].push(paper);
    });

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year || 'Unknown'}\nVenue: ${paper.venue || 'Unknown'}\nDOI: ${paper.doi || 'N/A'}\nAbstract: ${paper.abstract || 'No abstract available'}\n`,
      )
      .join('\n');

    const enhancedPrompt = `Synthesize a comprehensive, academic literature review from the following ${papers.length} research papers. Provide deep analysis and insights:

${context}

**ANALYSIS REQUIREMENTS:**
1. **Research Domain Overview**: Identify the core research area and its significance
2. **Thematic Analysis**: Group papers into 3-5 major research themes with representative examples
3. **Methodological Evolution**: Analyze how research methods have evolved across time periods
4. **Key Contributions**: Highlight the most influential papers and their impact
5. **Theoretical Frameworks**: Identify dominant theories and conceptual approaches
6. **Empirical Evidence**: Summarize key findings and evidence patterns
7. **Controversies & Debates**: Identify areas of methodological or theoretical disagreement
8. **Research Gaps**: Systematically identify underexplored areas and unanswered questions
9. **Future Research Directions**: Propose specific, actionable research opportunities
10. **Publication Trends**: Analyze venue quality and temporal patterns

**OUTPUT FORMAT:**
- Use formal academic language
- Include specific paper references [1], [2], etc.
- Provide concrete examples and evidence
- Be comprehensive yet concise
- End with actionable insights for researchers`;

    return this.aiProvider.answerQuestion(enhancedPrompt, context);
  }

  async extractMethodology(paperId: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const paper = db
      .prepare('select title, abstract, authors, year, venue from papers where id = ?')
      .get(paperId) as
      | {
          title: string;
          abstract: string | null;
          authors: string;
          year: number | null;
          venue: string | null;
        }
      | undefined;

    if (!paper) return 'Paper not found';

    const context = `${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year || 'Unknown'}\nVenue: ${paper.venue || 'Unknown'}\n\n${paper.abstract || ''}`;

    const enhancedPrompt = `Provide a comprehensive methodological analysis of this research paper:

**PAPER CONTEXT:**
${paper.title}
Authors: ${paper.authors}
Published: ${paper.year || 'Unknown'} in ${paper.venue || 'Unknown venue'}

**ANALYSIS FRAMEWORK:**
1. **Research Paradigm**: Identify the epistemological approach (positivist, interpretivist, critical, etc.)
2. **Study Design**: Classify the research design (experimental, quasi-experimental, observational, case study, survey, etc.)
3. **Sampling Strategy**: Analyze participant/sample selection, size, and representativeness
4. **Data Collection Methods**: Detail primary and secondary data collection techniques
5. **Analytical Methods**: Specify statistical, qualitative, or mixed-methods approaches
6. **Quality Assurance**: Evaluate reliability, validity, and trustworthiness measures
7. **Ethical Considerations**: Identify IRB/ethics approval and participant protections
8. **Methodological Innovations**: Highlight novel approaches or tools used
9. **Limitations & Constraints**: Discuss acknowledged and potential methodological weaknesses
10. **Replicability Assessment**: Evaluate the study's reproducibility potential

**OUTPUT REQUIREMENTS:**
- Use formal academic language
- Provide specific evidence from the abstract
- Assess methodological rigor and appropriateness
- Suggest improvements where applicable
- Consider disciplinary standards and best practices`;

    return this.aiProvider.answerQuestion(enhancedPrompt, context);
  }

  async identifyResearchGaps(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue, doi from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
      doi: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for gap analysis';

    // Analyze temporal and thematic patterns
    const papersByYear = papers.filter((p) => p.year).sort((a, b) => (a.year || 0) - (b.year || 0));

    const recentPapers = papersByYear.slice(-3); // Last 3 papers
    const _olderPapers = papersByYear.slice(0, -3); // All but last 3

    if (recentPapers.length === 0) {
      return 'No temporal analysis available - insufficient paper data for comparison.';
    }

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year || 'Unknown'}\nVenue: ${paper.venue || 'Unknown'}\nDOI: ${paper.doi || 'N/A'}\nAbstract: ${paper.abstract || 'No abstract available'}\n`,
      )
      .join('\n');

    const enhancedPrompt = `Conduct a systematic gap analysis of the ${papers.length} research papers provided below. Identify critical research opportunities and knowledge deficits:

${context}

**GAP ANALYSIS FRAMEWORK:**

1. **Temporal Evolution Gaps**
   - Compare recent papers [${recentPapers.map((_, i) => papers.indexOf(recentPapers[i]!) + 1).join(', ')}] with earlier work
   - Identify stalled research directions or outdated approaches

2. **Methodological Limitations**
   - Sample size and selection biases
   - Measurement instrument limitations
   - Statistical power and analytical constraints
   - Generalizability restrictions

3. **Theoretical and Conceptual Gaps**
   - Unexplored theoretical frameworks
   - Missing interdisciplinary connections
   - Underdeveloped conceptual models
   - Contradictory theoretical assumptions

4. **Empirical and Application Gaps**
   - Understudied populations or contexts
   - Real-world application limitations
   - Scale and scope restrictions
   - Implementation challenges

5. **Emerging Research Opportunities**
   - Technological advancements creating new possibilities
   - Societal changes opening new research areas
   - Methodological innovations enabling novel approaches

**PRIORITIZATION CRITERIA:**
- **Impact Potential**: Research that could significantly advance the field
- **Feasibility**: Achievable with current resources and methods
- **Novelty**: Truly original contributions vs. incremental advances
- **Practical Relevance**: Addresses real-world problems or needs

**OUTPUT STRUCTURE:**
- **Critical Gaps**: 3-5 most significant research opportunities
- **Specific Research Questions**: Concrete, answerable questions
- **Methodological Approaches**: Suggested research designs
- **Expected Contributions**: Potential impact and significance
- **Implementation Priority**: High/Medium/Low with rationale`;

    return this.aiProvider.answerQuestion(enhancedPrompt, context);
  }

  async generateResearchProposal(currentPapers: string[], gap: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue from papers where id in (' +
          currentPapers.map(() => '?').join(',') +
          ')',
      )
      .all(currentPapers) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for proposal generation';

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title} (${paper.year})\n${paper.abstract || ''}\n`,
      )
      .join('\n');

    const prompt = `Based on the identified research gap: "${gap}"

Generate a structured research proposal that addresses this gap. Use the provided papers as foundation and justification:

${context}

Structure the proposal as:
1. **Research Question**: Clear, focused question addressing the gap
2. **Background & Significance**: Why this research matters
3. **Literature Foundation**: How existing work supports this direction
4. **Proposed Methodology**: Research design and methods
5. **Expected Contributions**: What new knowledge will be created
6. **Timeline**: Realistic 6-12 month research plan
7. **Potential Challenges**: Anticipated difficulties and solutions

Make it specific, actionable, and grounded in the existing literature.`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  private canUseAI(): boolean {
    return this.usageCount < this.maxUsage;
  }

  incrementUsage(): void {
    this.usageCount++;
  }

  getUsageCount(): number {
    return this.usageCount;
  }

  // Advanced AI Research Features
  async performTopicModeling(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
    }>;

    if (papers.length === 0) return 'No papers found for topic modeling';

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title} (${paper.year})\n${paper.abstract || ''}\n`,
      )
      .join('\n');

    const prompt = `Perform topic modeling analysis on the following ${papers.length} research papers. Identify major research themes and topics:

${context}

**TOPIC MODELING TASK:**
1. **Latent Topics**: Identify 4-6 major latent research topics across all papers
2. **Topic Distribution**: Show which papers belong to which topics
3. **Topic Evolution**: Analyze how topics have changed over time
4. **Topic Relationships**: Identify connections and overlaps between topics
5. **Emerging Trends**: Highlight new or growing research directions
6. **Topic Significance**: Rank topics by importance and influence

**OUTPUT FORMAT:**
- **Topic 1: [Name]**: Description, key papers, significance
- **Topic 2: [Name]**: Description, key papers, significance
- Present as structured topic model with clear relationships`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  async extractKeyConcepts(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for concept extraction';

    const context = papers
      .map((paper, index) => `[${index + 1}] ${paper.title}\n${paper.abstract || ''}\n`)
      .join('\n');

    const prompt = `Extract and analyze key concepts from the following ${papers.length} research papers:

${context}

**CONCEPT EXTRACTION FRAMEWORK:**
1. **Core Concepts**: Identify fundamental ideas and theories
2. **Technical Terms**: Extract domain-specific terminology
3. **Methodological Concepts**: Research methods and approaches
4. **Theoretical Frameworks**: Conceptual models and paradigms
5. **Concept Relationships**: Map connections between concepts
6. **Concept Evolution**: How concepts have developed across papers
7. **Concept Hierarchy**: Organize concepts by importance and generality

**OUTPUT STRUCTURE:**
- **Primary Concepts**: Most central and influential ideas
- **Secondary Concepts**: Supporting and related concepts
- **Concept Map**: Visualizable relationships between concepts
- **Concept Definitions**: Clear explanations of key terms`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  async generateResearchQuestions(paperIds: string[], focusArea?: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for research question generation';

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year || 'Unknown'}\nVenue: ${paper.venue || 'Unknown'}\n${paper.abstract || ''}\n`,
      )
      .join('\n');

    const focusText = focusArea ? ` focusing on ${focusArea}` : '';

    const prompt = `Generate innovative research questions based on the following ${papers.length} papers${focusText}:

${context}

**RESEARCH QUESTION GENERATION:**
1. **Gap-Based Questions**: Address identified research gaps and limitations
2. **Extension Questions**: Build upon existing findings with new directions
3. **Integration Questions**: Combine insights from multiple papers
4. **Application Questions**: Apply research to new contexts or problems
5. **Methodological Questions**: Improve or innovate research approaches
6. **Theoretical Questions**: Develop or challenge existing theories

**QUESTION QUALITY CRITERIA:**
- **Specificity**: Clear, focused, and answerable questions
- **Originality**: Novel questions not directly addressed in existing papers
- **Significance**: Questions with potential for meaningful contribution
- **Feasibility**: Realistic questions given current methods and resources
- **Relevance**: Questions that advance the field or solve real problems

**OUTPUT FORMAT:**
- **Primary Questions**: 3-5 most promising research questions
- **Secondary Questions**: Additional questions for future exploration
- **Question Rationale**: Why each question is worth pursuing
- **Methodological Approach**: Suggested research design for each question`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  async analyzeResearchTrends(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for trend analysis';

    // Analyze temporal patterns
    const papersByYear: Record<number, typeof papers> = {};
    papers.forEach((paper) => {
      if (paper.year) {
        if (!papersByYear[paper.year]) papersByYear[paper.year] = [];
        (papersByYear[paper.year] as typeof papers).push(paper);
      }
    });

    const years = Object.keys(papersByYear)
      .map(Number)
      .sort((a, b) => a - b);
    const oldestYear = Math.min(...years);
    const newestYear = Math.max(...years);

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title} (${paper.year})\nVenue: ${paper.venue || 'Unknown'}\n${paper.abstract || ''}\n`,
      )
      .join('\n');

    const prompt = `Analyze research trends and patterns across ${papers.length} papers spanning ${oldestYear}-${newestYear}:

${context}

**TREND ANALYSIS FRAMEWORK:**
1. **Temporal Patterns**: Publication frequency and distribution over time
2. **Topic Evolution**: How research focus has shifted across years
3. **Methodological Trends**: Changes in research approaches and techniques
4. **Venue Patterns**: Quality and type of publication outlets over time
5. **Author Collaboration**: Patterns in co-authorship and research teams
6. **Citation Impact**: Influence and citation patterns across time periods
7. **Emerging Directions**: New research areas and declining topics
8. **Research Maturity**: How the field has developed from exploratory to mature

**TREND VISUALIZATION:**
- **Growth Areas**: Rapidly expanding research directions
- **Declining Areas**: Research topics losing attention
- **Stable Areas**: Consistent research focus over time
- **Emerging Areas**: New topics gaining traction

**PREDICTIVE INSIGHTS:**
- **Future Directions**: Likely evolution of research focus
- **Research Opportunities**: Promising areas for future investment
- **Methodological Advances**: Anticipated improvements in research approaches`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  private calculateSimilarity(query: string, text: string): number {
    // Enhanced similarity calculation using multiple factors
    const queryWords = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2),
    );
    const textWords = new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2),
    );

    const intersection = new Set([...queryWords].filter((x) => textWords.has(x)));
    const union = new Set([...queryWords, ...textWords]);

    // Jaccard similarity
    const jaccard = intersection.size / union.size;

    // Length bonus for longer, more relevant matches
    const lengthBonus = Math.min(text.length / 1000, 1.0);

    // Exact phrase matching
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const exactMatches = queryLower
      .split(' ')
      .filter((phrase) => phrase.length > 3 && textLower.includes(phrase)).length;

    const phraseBonus = Math.min(exactMatches * 0.1, 0.3);

    return Math.min(jaccard + lengthBonus * 0.2 + phraseBonus, 1.0);
  }
}

export function createRAGSystem(aiType: 'openai' | 'local' = 'local', apiKey?: string): RAGSystem {
  return new RAGSystem(aiType, apiKey);
}
