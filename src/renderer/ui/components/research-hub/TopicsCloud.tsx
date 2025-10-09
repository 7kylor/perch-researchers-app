import type React from 'react';
import { Tag } from 'lucide-react';

type Topic = {
  name: string;
  count: number;
  relevance?: number;
};

type TopicsCloudProps = {
  topics: ReadonlyArray<Topic>;
};

export const TopicsCloud: React.FC<TopicsCloudProps> = ({ topics }) => {
  const maxCount = Math.max(...topics.map((t) => t.count));

  return (
    <div className="topics-cloud">
      <div className="topics-cloud-header">
        <div className="topics-cloud-icon">
          <Tag />
        </div>
        <h3 className="topics-cloud-title">Top Research Topics</h3>
      </div>

      <div className="topics-cloud-content">
        {topics.slice(0, 15).map((topic) => {
          const intensity = Math.ceil((topic.count / maxCount) * 3);
          const sizeClass =
            {
              1: 'topic-tag-small',
              2: 'topic-tag-medium',
              3: 'topic-tag-large',
            }[intensity] || 'topic-tag-small';

          return (
            <span key={topic.name} className={`topic-tag ${sizeClass}`}>
              {topic.name}
              <span className="topic-tag-count">{topic.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
