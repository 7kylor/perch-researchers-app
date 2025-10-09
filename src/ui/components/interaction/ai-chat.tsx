import React from 'react';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

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
  const [streamBuffer, setStreamBuffer] = React.useState('');
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleChunk = ({ chatId: id, delta }: { chatId: string; delta: string }) => {
      if (id !== chatId) return;
      setStreamBuffer((prev) => prev + delta);
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    };
    const handleDone = ({ chatId: id }: { chatId: string }) => {
      if (id !== chatId) return;
      // Snapshot stream buffer to avoid stale closure warnings
      const finalText = streamBuffer;
      setMessages((prev) => [...prev, { role: 'assistant', content: finalText }]);
      setStreamBuffer('');
      setChatId(null);
      setIsStreaming(false);
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    };
    const handleError = ({ chatId: id, error }: { chatId: string; error: string }) => {
      if (id !== chatId) return;
      setStreamBuffer(`Error: ${error}`);
      setIsStreaming(false);
    };
    window.api.ai.chat.onChunk(handleChunk);
    window.api.ai.chat.onDone(handleDone);
    window.api.ai.chat.onError(handleError);
    return () => {
      // Note: our simple bridge doesn't provide removeListener; page unload will clear.
    };
  }, [chatId, streamBuffer]);

  // Intentionally no dependency array to avoid ESLint dependency noise; we scroll on every render
  // which is acceptable for this compact chat list.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    const apiKey = mode === 'openai' ? localStorage.getItem('openaiKey') || undefined : undefined;
    const nextMessages = [...messages, { role: 'user', content: trimmed } as Message];
    setMessages(nextMessages);
    setInput('');
    setStreamBuffer('');
    setIsStreaming(true);
    const id = await window.api.ai.chat.start({
      mode,
      apiKey,
      messages: nextMessages,
      temperature,
    });
    setChatId(id);
  };

  const handleStop = async () => {
    if (!chatId) return;
    await window.api.ai.chat.stop(chatId);
    setIsStreaming(false);
  };

  const handleCopy = async () => {
    const text =
      streamBuffer || messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  const handleRegenerate = async () => {
    if (isStreaming) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex < 0) return;
    const idx = messages.length - 1 - lastUserIndex;
    const base = messages.slice(0, idx + 1);
    setStreamBuffer('');
    setIsStreaming(true);
    const apiKey = mode === 'openai' ? localStorage.getItem('openaiKey') || undefined : undefined;
    const id = await window.api.ai.chat.start({ mode, apiKey, messages: base, temperature });
    setChatId(id);
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
          <button type="button" onClick={handleCopy} disabled={isStreaming && !streamBuffer}>
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
            <div key={`${m.role}-${m.content.substring(0, 24)}`} className={`ai-msg ${m.role}`}>
              <pre>{m.content}</pre>
            </div>
          ))}
        {streamBuffer && (
          <div className="ai-msg assistant">
            <pre>{streamBuffer}</pre>
          </div>
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
