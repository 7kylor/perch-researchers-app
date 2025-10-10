import type React from 'react';

export const MoreTools: React.FC = () => {
  const uploadAndExtract = async () => {
    const res = await window.api.dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (res.canceled || res.filePaths.length === 0) return;
    for (const f of res.filePaths) {
      try {
        const id = await window.api.ingest.pdf(f);
         
        console.log('Imported PDF as paper', id);
      } catch (e) {
         
        console.error('Failed to import', f, e);
      }
    }
  };

  const chatWithPapers = async () => {
    // Light quick action: start chat with an empty session; the UI will let users add context
    await window.api.ai.chat.start({
      mode: 'openai',
      messages: [{ role: 'system', content: 'You are a helpful research assistant.' }],
      temperature: 0.2,
    });
  };

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <button type="button" onClick={uploadAndExtract} className="btn btn-default">
        Upload and extract
      </button>
      <button type="button" onClick={chatWithPapers} className="btn btn-default">
        Chat with papers
      </button>
    </div>
  );
};
