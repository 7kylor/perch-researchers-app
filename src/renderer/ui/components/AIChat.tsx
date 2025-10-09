import React from 'react';
import { PaperSelector } from './PaperSelector';
import type { Paper } from '../../../shared/types';

type Role = 'system' | 'user' | 'assistant';
type Message = { role: Role; content: string };

type AIChatProps = {
  defaultMode?: 'openai' | 'local';
  defaultTemperature?: number;
  selectedPapers?: string[];
  onPapersChange?: (papers: string[]) => void;
  availablePapers?: Paper[];
};

export const AIChat: React.FC<AIChatProps> = ({
  defaultMode = 'local',
  defaultTemperature = 0.2,
  selectedPapers = [],
  onPapersChange,
  availablePapers = [],
}) => {
  const [mode, setMode] = React.useState<'openai' | 'local'>(defaultMode);
  const [temperature, setTemperature] = React.useState<number>(defaultTemperature);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);

  const streamBufferRef = React.useRef('');
  const endRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToEnd = React.useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    const onChunk = ({ chatId: id, delta }: { chatId: string; delta: string }) => {
      if (id !== chatId) return;
      streamBufferRef.current += delta;
      scrollToEnd();
    };
    const onDone = ({ chatId: id }: { chatId: string }) => {
      if (id !== chatId) return;
      const finalText = streamBufferRef.current;
      setMessages((prev) => [...prev, { role: 'assistant', content: finalText }]);
      streamBufferRef.current = '';
      setChatId(null);
      setIsStreaming(false);
      scrollToEnd();
    };
    const onError = ({ chatId: id, error }: { chatId: string; error: string }) => {
      if (id !== chatId) return;
      streamBufferRef.current = `Error: ${error}`;
      setIsStreaming(false);
    };
    window.api.ai.chat.onChunk(onChunk);
    window.api.ai.chat.onDone(onDone);
    window.api.ai.chat.onError(onError);
  }, [chatId, scrollToEnd]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    const apiKey = mode === 'openai' ? localStorage.getItem('openaiKey') || undefined : undefined;
    const nextMessages = [...messages, { role: 'user', content: trimmed } as Message];
    setMessages(nextMessages);
    setInput('');
    streamBufferRef.current = '';
    setIsStreaming(true);
    const id = await window.api.ai.chat.start({
      mode,
      apiKey,
      messages: nextMessages,
      temperature,
    });
    setChatId(id);
    scrollToEnd();
  };

  const handleStop = async () => {
    if (!chatId) return;
    await window.api.ai.chat.stop(chatId);
    setIsStreaming(false);
  };

  const handleCopy = async (): Promise<void> => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    const text = streamBufferRef.current || lastAssistant?.content || '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  const handleRegenerate = async () => {
    if (isStreaming) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx < 0) return;
    const idx = messages.length - 1 - lastUserIdx;
    const base = messages.slice(0, idx + 1);
    streamBufferRef.current = '';
    setIsStreaming(true);
    const apiKey = mode === 'openai' ? localStorage.getItem('openaiKey') || undefined : undefined;
    const id = await window.api.ai.chat.start({ mode, apiKey, messages: base, temperature });
    setChatId(id);
  };

  const handleAdvancedFeature = async (feature: 'review' | 'methodology' | 'gaps' | 'proposal') => {
    if (isStreaming) return;

    try {
      let result: string = '';
      let userMessage = '';

      switch (feature) {
        case 'review':
          if (selectedPapers.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'Please select papers first to synthesize a literature review.',
              },
            ]);
            return;
          }
          userMessage = `Synthesize a literature review from ${selectedPapers.length} selected papers`;
          result = await window.api.ai['synthesize-review'](selectedPapers);
          break;
        case 'methodology':
          if (selectedPapers.length === 0) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: 'Please select a paper first to extract methodology.' },
            ]);
            return;
          }
          userMessage = `Extract methodology from selected paper`;
          result = await window.api.ai['extract-methodology'](selectedPapers[0]);
          break;
        case 'gaps':
          if (selectedPapers.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'Please select papers first to identify research gaps.',
              },
            ]);
            return;
          }
          userMessage = `Identify research gaps from ${selectedPapers.length} selected papers`;
          result = await window.api.ai['identify-gaps'](selectedPapers);
          break;
        case 'proposal': {
          if (selectedPapers.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content:
                  'Please select papers first and identify gaps to generate a research proposal.',
              },
            ]);
            return;
          }
          const gaps = await window.api.ai['identify-gaps'](selectedPapers);
          if (!gaps.includes('research gaps') && !gaps.includes('gaps')) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content:
                  'No clear research gaps identified. Please try with different papers or identify gaps manually first.',
              },
            ]);
            return;
          }
          userMessage = `Generate research proposal based on identified gaps`;
          result = await window.api.ai['generate-proposal'](
            selectedPapers,
            'Identified research gaps from literature',
          );
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: result },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split('```');
    return (
      <>
        {parts.map((part, i) => {
          const key = `${i}-${part.slice(0, 16)}`;
          return i % 2 === 1 ? (
            <pre key={`code-${key}`} style={{ whiteSpace: 'pre-wrap' }}>
              {part}
            </pre>
          ) : (
            <p key={`txt-${key}`} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {part}
            </p>
          );
        })}
      </>
    );
  };

  return (
    <div className="ai-chat-container">
      {availablePapers.length > 0 && onPapersChange && (
        <PaperSelector
          papers={availablePapers}
          selectedPapers={selectedPapers}
          onSelectionChange={onPapersChange}
          maxSelections={10}
        />
      )}
      <div className="ai-chat-header">
        <select value={mode} onChange={(e) => setMode(e.target.value as 'openai' | 'local')}>
          <option value="local">Local (llama.cpp)</option>
          <option value="openai">OpenAI</option>
        </select>
        <input
          type="number"
          step="0.1"
          min={0}
          max={2}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          style={{ width: 80 }}
        />
        <div className="ai-chat-actions">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isStreaming && !streamBufferRef.current}
          >
            Copy
          </button>
          <button type="button" onClick={handleRegenerate} disabled={isStreaming}>
            Regenerate
          </button>
          <button type="button" onClick={handleStop} disabled={!isStreaming}>
            Stop
          </button>
        </div>
        {selectedPapers && selectedPapers.length > 0 && (
          <div className="ai-advanced-actions">
            <button
              type="button"
              onClick={() => handleAdvancedFeature('review')}
              disabled={isStreaming}
              title="Synthesize literature review from selected papers"
            >
              Literature Review
            </button>
            <button
              type="button"
              onClick={() => handleAdvancedFeature('methodology')}
              disabled={isStreaming}
              title="Extract methodology from selected paper"
            >
              Extract Methodology
            </button>
            <button
              type="button"
              onClick={() => handleAdvancedFeature('gaps')}
              disabled={isStreaming}
              title="Identify research gaps from selected papers"
            >
              Research Gaps
            </button>
            <button
              type="button"
              onClick={() => handleAdvancedFeature('proposal')}
              disabled={isStreaming}
              title="Generate research proposal based on gaps"
            >
              Research Proposal
            </button>
          </div>
        )}
      </div>

      <div className="ai-chat-messages">
        {messages
          .filter((m) => m.role !== 'system')
          .map((m) => (
            <div key={`${m.role}-${m.content.slice(0, 24)}`} className={`ai-msg ${m.role}`}>
              {renderContent(m.content)}
            </div>
          ))}
        {streamBufferRef.current && (
          <div className="ai-msg assistant">{renderContent(streamBufferRef.current)}</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="ai-chat-input">
        <textarea
          value={input}
          placeholder="Message..."
          onChange={(e) => setInput(e.target.value)}
          rows={2}
        />
        <button type="button" onClick={handleSend} disabled={isStreaming}>
          Send
        </button>
      </div>
    </div>
  );
};
