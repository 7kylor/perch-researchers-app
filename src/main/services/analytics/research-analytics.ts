import { openDatabase } from '../../db.js';

const db = openDatabase();

export interface ReadingSession {
  readonly id: string;
  readonly paperId: string;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly duration?: number; // in minutes
  readonly pagesRead?: number;
  readonly annotationsCreated?: number;
  readonly status: 'active' | 'completed' | 'abandoned';
}

export interface ResearchMetrics {
  readonly totalPapers: number;
  readonly papersRead: number;
  readonly papersInProgress: number;
  readonly totalReadingTime: number; // in minutes
  readonly averageSessionTime: number; // in minutes
  readonly mostProductiveDay: string;
  readonly mostProductiveHour: number;
  readonly readingStreak: number;
  readonly favoriteTopics: readonly string[];
  readonly readingVelocity: number; // papers per week
  readonly annotationRate: number; // annotations per paper
  readonly completionRate: number; // percentage of papers fully read
}

export interface TopicAnalysis {
  readonly topic: string;
  readonly paperCount: number;
  readonly totalReadingTime: number;
  readonly averageEngagement: number;
  readonly trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ProductivityInsights {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly weeklyGoal: number;
  readonly progressToGoal: number;
  readonly recommendedFocusAreas: readonly string[];
  readonly suggestedBreakTime: number;
  readonly optimalReadingTimes: readonly number[];
}

export class ResearchAnalytics {
  async trackReadingSession(
    paperId: string,
    action: 'start' | 'end' | 'update',
    data?: Partial<ReadingSession>,
  ): Promise<void> {
    if (action === 'start') {
      // End any existing active sessions for this paper
      db.prepare(
        'update reading_sessions set endedAt = ?, status = ? where paperId = ? and status = ?',
      ).run(new Date().toISOString(), 'completed', paperId, 'active');

      // Start new session
      db.prepare(
        `
        insert into reading_sessions (id, paperId, startedAt, status)
        values (?, ?, ?, ?)
      `,
      ).run(crypto.randomUUID(), paperId, new Date().toISOString(), 'active');
    } else if (action === 'end') {
      // End the active session
      const session = db
        .prepare(
          `
        select * from reading_sessions
        where paperId = ? and status = ? order by startedAt desc limit 1
      `,
        )
        .get(paperId, 'active') as ReadingSession | undefined;

      if (session) {
        const endTime = new Date().toISOString();
        const duration = Math.round(
          (new Date(endTime).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60),
        );

        db.prepare(
          `
          update reading_sessions
          set endedAt = ?, duration = ?, status = ?
          where id = ?
        `,
        ).run(endTime, duration, 'completed', session.id);
      }
    } else if (action === 'update' && data) {
      // Update session with additional data
      db.prepare(
        `
        update reading_sessions
        set pagesRead = ?, annotationsCreated = ?, status = ?
        where paperId = ? and status = ? order by startedAt desc limit 1
      `,
      ).run(data.pagesRead, data.annotationsCreated, data.status || 'active', paperId, 'active');
    }
  }

  async getResearchMetrics(): Promise<ResearchMetrics> {
    // Get basic counts
    const totalPapers = db.prepare('select count(*) as count from papers').get() as {
      readonly count: number;
    };
    const papersRead = db
      .prepare('select count(*) as count from papers where status = ?')
      .get('read') as { readonly count: number };
    const papersInProgress = db
      .prepare('select count(*) as count from papers where status = ?')
      .get('reading') as { readonly count: number };

    // Get reading sessions data
    const sessions = db
      .prepare(
        `
      select duration, startedAt, endedAt
      from reading_sessions
      where duration is not null
      order by startedAt desc
    `,
      )
      .all() as Array<{
      readonly duration: number;
      readonly startedAt: string;
      readonly endedAt: string;
    }>;

    const totalReadingTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSessionTime = sessions.length > 0 ? totalReadingTime / sessions.length : 0;

    // Calculate reading velocity (papers per week over last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions: Array<{
      readonly duration: number;
      readonly startedAt: string;
      readonly endedAt: string;
    }> = sessions.filter(
      (s: { readonly startedAt: string }) => new Date(s.startedAt) >= thirtyDaysAgo,
    );
    const recentPapers: number = new Set(
      recentSessions.map((s: { readonly startedAt: string }) => s.startedAt.split('T')[0]),
    ).size;
    const readingVelocity: number = recentPapers > 0 ? recentPapers / 4.3 : 0; // Rough weeks calculation

    // Find most productive day and hour
    const dailyProductivity: Map<string, number> = new Map<string, number>();
    const hourlyProductivity: Map<number, number> = new Map<number, number>();

    sessions.forEach((session: { readonly duration: number; readonly startedAt: string }) => {
      const date: Date = new Date(session.startedAt);
      const dayKey: string = date.toISOString().split('T')[0] || '';
      const hour: number = date.getHours();

      dailyProductivity.set(dayKey, (dailyProductivity.get(dayKey) || 0) + (session.duration || 0));
      hourlyProductivity.set(hour, (hourlyProductivity.get(hour) ?? 0) + 1);
    });

    const mostProductiveDay: string =
      Array.from(dailyProductivity.entries()).sort(
        ([, a]: [string, number], [, b]: [string, number]) => b - a,
      )[0]?.[0] || '';

    const mostProductiveHour: number =
      Array.from(hourlyProductivity.entries()).sort(
        ([, a]: [number, number], [, b]: [number, number]) => b - a,
      )[0]?.[0] || 0;

    // Calculate reading streak
    const readingStreak = this.calculateReadingStreak();

    // Get favorite topics
    const favoriteTopics = await this.getFavoriteTopics();

    // Calculate annotation rate and completion rate
    const annotationRate = await this.getAnnotationRate();
    const completionRate = papersRead.count > 0 ? (papersRead.count / totalPapers.count) * 100 : 0;

    return {
      totalPapers: totalPapers.count,
      papersRead: papersRead.count,
      papersInProgress: papersInProgress.count,
      totalReadingTime,
      averageSessionTime,
      mostProductiveDay,
      mostProductiveHour,
      readingStreak,
      favoriteTopics,
      readingVelocity,
      annotationRate,
      completionRate,
    };
  }

  private calculateReadingStreak(): number {
    const sessions: Array<{ readonly date: string; readonly sessions: number }> = db
      .prepare(
        `
      select date(startedAt) as date, count(*) as sessions
      from reading_sessions
      where status = 'completed' and duration > 5
      group by date(startedAt)
      order by date desc
    `,
      )
      .all() as Array<{ readonly date: string; readonly sessions: number }>;

    let streak: number = 0;

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      if (!session) break;

      const sessionDate: string = session.date;
      const expectedDate: Date = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate === expectedDate.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async getFavoriteTopics(): Promise<readonly string[]> {
    const topics: Array<{ readonly venue: string; readonly count: number }> = db
      .prepare(
        `
      select venue, count(*) as count
      from papers
      where status in ('read', 'reading')
      group by venue
      order by count desc
      limit 5
    `,
      )
      .all() as Array<{ readonly venue: string; readonly count: number }>;

    return topics
      .map((t: { readonly venue: string }) => t.venue)
      .filter((venue: string): boolean => Boolean(venue));
  }

  private async getAnnotationRate(): Promise<number> {
    const papersWithAnnotations: Array<{
      readonly paperId: string;
      readonly annotationCount: number;
    }> = db
      .prepare(
        `
      select distinct paperId, count(*) as annotationCount
      from annotations
      group by paperId
    `,
      )
      .all() as Array<{ readonly paperId: string; readonly annotationCount: number }>;

    const totalPapers: { readonly count: number } = db
      .prepare('select count(*) as count from papers')
      .get() as {
      readonly count: number;
    };

    return totalPapers.count > 0 ? (papersWithAnnotations.length / totalPapers.count) * 100 : 0;
  }

  async getTopicAnalysis(): Promise<readonly TopicAnalysis[]> {
    const topics: Array<{
      readonly topic: string;
      readonly paperCount: number;
      readonly totalReadingTime: number;
      readonly averageEngagement: number;
    }> = db
      .prepare(
        `
      select
        coalesce(venue, 'General') as topic,
        count(*) as paperCount,
        sum(case when rs.duration is not null then rs.duration else 0 end) as totalReadingTime,
        avg(case when rs.duration is not null then rs.duration else 0 end) as averageEngagement
      from papers p
      left join reading_sessions rs on p.id = rs.paperId and rs.status = 'completed'
      where p.status in ('read', 'reading')
      group by coalesce(venue, 'General')
      order by paperCount desc
    `,
      )
      .all() as Array<{
      readonly topic: string;
      readonly paperCount: number;
      readonly totalReadingTime: number;
      readonly averageEngagement: number;
    }>;

    // Calculate trends (simplified - compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    return topics.map(
      (topic: {
        readonly topic: string;
        readonly paperCount: number;
        readonly totalReadingTime: number;
        readonly averageEngagement: number;
      }): TopicAnalysis => {
        const recentPapers: { readonly count: number } = db
          .prepare(
            `
        select count(*) as count
        from papers p
        left join reading_sessions rs on p.id = rs.paperId
        where coalesce(p.venue, 'General') = ? and p.status in ('read', 'reading')
        and (rs.startedAt >= ? or p.status = 'read')
      `,
          )
          .get(topic.topic, thirtyDaysAgo.toISOString()) as { readonly count: number };

        const previousPapers: { readonly count: number } = db
          .prepare(
            `
        select count(*) as count
        from papers p
        left join reading_sessions rs on p.id = rs.paperId
        where coalesce(p.venue, 'General') = ? and p.status in ('read', 'reading')
        and (rs.startedAt between ? and ? or p.status = 'read')
      `,
          )
          .get(topic.topic, sixtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()) as {
          readonly count: number;
        };

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (recentPapers.count > previousPapers.count * 1.2) trend = 'increasing';
        else if (recentPapers.count < previousPapers.count * 0.8) trend = 'decreasing';

        return {
          topic: topic.topic,
          paperCount: topic.paperCount,
          totalReadingTime: topic.totalReadingTime,
          averageEngagement: topic.averageEngagement,
          trend,
        };
      },
    );
  }

  async getProductivityInsights(): Promise<ProductivityInsights> {
    const metrics = await this.getResearchMetrics();

    // Calculate weekly goal progress (assume 5 papers per week goal)
    const weeklyGoal = 5;
    const progressToGoal = Math.min((metrics.readingVelocity / weeklyGoal) * 100, 100);

    // Suggest focus areas based on current reading patterns
    const recommendedFocusAreas = await this.getRecommendedFocusAreas();

    // Suggest break time based on session patterns
    const avgSession = metrics.averageSessionTime;
    const suggestedBreakTime = avgSession > 60 ? 10 : avgSession > 30 ? 5 : 2;

    // Find optimal reading times based on productivity data
    const optimalReadingTimes = await this.getOptimalReadingTimes();

    return {
      currentStreak: metrics.readingStreak,
      longestStreak: metrics.readingStreak, // Simplified - would need historical data
      weeklyGoal,
      progressToGoal,
      recommendedFocusAreas,
      suggestedBreakTime,
      optimalReadingTimes,
    };
  }

  private async getRecommendedFocusAreas(): Promise<string[]> {
    const recentTopics = await this.getFavoriteTopics();
    const topicAnalysis = await this.getTopicAnalysis();

    // Recommend topics with increasing trends or high engagement
    const increasingTopics = topicAnalysis
      .filter((t) => t.trend === 'increasing' && t.averageEngagement > 30)
      .map((t) => t.topic)
      .slice(0, 3);

    return increasingTopics.length > 0 ? increasingTopics : recentTopics.slice(0, 2);
  }

  private async getOptimalReadingTimes(): Promise<readonly number[]> {
    // Analyze when most productive sessions occur
    const hourlyData: Array<{
      readonly hour: string;
      readonly avgDuration: number;
      readonly sessionCount: number;
    }> = db
      .prepare(
        `
      select
        strftime('%H', startedAt) as hour,
        avg(duration) as avgDuration,
        count(*) as sessionCount
      from reading_sessions
      where duration is not null and duration > 10
      group by strftime('%H', startedAt)
      order by avgDuration desc, sessionCount desc
    `,
      )
      .all() as Array<{
      readonly hour: string;
      readonly avgDuration: number;
      readonly sessionCount: number;
    }>;

    return hourlyData
      .filter(
        (h: { readonly avgDuration: number; readonly sessionCount: number }): boolean =>
          h.avgDuration > 20 && h.sessionCount >= 3,
      )
      .map((h: { readonly hour: string }): number => parseInt(h.hour))
      .slice(0, 3);
  }

  async getReadingHistory(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<
    ReadonlyArray<{
      readonly date: string;
      readonly papersRead: number;
      readonly timeSpent: number;
      readonly annotations: number;
    }>
  > {
    const days: number = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
    const startDate: Date = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData: Array<{
      readonly date: string;
      readonly papersRead: number;
      readonly timeSpent: number;
      readonly annotations: number;
    }> = db
      .prepare(
        `
      select
        date(startedAt) as date,
        count(distinct paperId) as papersRead,
        sum(duration) as timeSpent,
        count(distinct a.id) as annotations
      from reading_sessions rs
      left join annotations a on rs.paperId = a.paperId and date(a.createdAt) = date(rs.startedAt)
      where date(rs.startedAt) >= date(?)
      group by date(rs.startedAt)
      order by date
    `,
      )
      .all(startDate.toISOString()) as Array<{
      readonly date: string;
      readonly papersRead: number;
      readonly timeSpent: number;
      readonly annotations: number;
    }>;

    return dailyData;
  }

  async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const metrics = await this.getResearchMetrics();
    const insights = await this.getProductivityInsights();
    const history = await this.getReadingHistory('year');
    const topics = await this.getTopicAnalysis();

    const data = {
      metrics,
      insights,
      history,
      topics,
      exportedAt: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Convert to CSV format
      let csv: string = 'Date,Papers Read,Time Spent (minutes),Annotations\n';
      history.forEach(
        (day: {
          readonly date: string;
          readonly papersRead: number;
          readonly timeSpent: number;
          readonly annotations: number;
        }): void => {
          csv += `${day.date},${day.papersRead},${day.timeSpent},${day.annotations}\n`;
        },
      );
      return csv;
    }

    return JSON.stringify(data, null, 2);
  }
}

export const researchAnalytics = new ResearchAnalytics();
