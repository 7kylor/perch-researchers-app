import React from 'react';

type Role = 'system' | 'user' | 'assistant';
type Message = { role: Role; content: string };

type AIChatProps = {
  defaultMode?: 'openai' | 'local';
  defaultTemperature?: number;
};

export const AIChat: React.FC<AIChatProps> = ({
  defaultMode = 'local',
  defaultTemperature = 0.2,
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

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
  }, [chatId]);

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

  const handleCopy = async () => {
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

  const renderContent = (text: string) => {
    const parts = text.split('```');
    return (
      <>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <pre key={`code-${i}`} style={{ whiteSpace: 'pre-wrap' }}>
              {part}
            </pre>
          ) : (
            <p key={`txt-${i}`} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {part}
            </p>
          ),
        )}
      </>
    );
  };

  return (
    <div className="ai-chat-container">
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
