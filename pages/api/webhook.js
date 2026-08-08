// pages/api/webhook.js
// Receives call data from Vapi and stores it

let calls = [];

// Detect system prompts (not real caller messages)
function isSystemPrompt(text) {
  if (!text) return true;
  const t = text.toLowerCase();
  const junk = [
    'you are phillip', 'you\'re phillip', 'john\'s personal assistant',
    'your main job is', 'critical voice rules', 'recruiters & job',
    'friends & family', 'spam & scammers', 'automated business machine',
    'corporate answering service', 'speak naturally, casually',
    'do not give long', 'match the casual energy', 'drawn-out paragraphs'
  ];
  return junk.some(m => t.includes(m));
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const data = req.body;
      const message = data.message || data;
      const eventType = message.type || data.type || 'unknown';

      // Only process final end-of-call-report
      if (eventType !== 'end-of-call-report') {
        return res.status(200).json({ success: true, ignored: true });
      }

      const callObj = message.call || message;
      const callId = callObj.id || Date.now().toString();

      // Get all messages
      let allMessages = [];
      if (callObj.messages && Array.isArray(callObj.messages)) {
        allMessages = callObj.messages;
      }

      // Get Vapi's AI summary
      const vapiSummary = callObj.summary || '';

      // Extract ONLY real caller messages
      let callerLines = [];
      for (const m of allMessages) {
        const role = (m.role || '').toLowerCase();
        const content = (m.message || m.content || m.text || '').trim();

        // Skip system, assistant, empty, and system-prompt-looking messages
        if (role === 'system' || role === 'assistant' || !content || isSystemPrompt(content)) {
          continue;
        }
        callerLines.push(content);
      }

      // If no clean messages found, try parsing raw transcript
      let callerMessage = '';
      if (callerLines.length > 0) {
        callerMessage = callerLines.join('\n\n');
      } else {
        const raw = callObj.transcript || '';
        const lines = raw.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith('caller:')) {
            const msg = trimmed.replace(/^caller:\s*/i, '').trim();
            if (msg && !isSystemPrompt(msg)) callerLines.push(msg);
          }
        }
        callerMessage = callerLines.join('\n\n') || vapiSummary || 'No message from caller';
      }

      // Duration
      let duration = 0;
      if (callObj.durationMs) duration = Math.round(callObj.durationMs / 1000);
      else if (callObj.duration) duration = parseInt(callObj.duration);

      // Phone number
      let fromNumber = callObj.customer?.number || callObj.from || 'Unknown';

      const callRecord = {
        id: callId,
        from: fromNumber,
        fromName: callObj.customer?.name || '',
        status: 'completed',
        reason: callObj.endedReason || 'N/A',
        duration: duration,
        callerMessage: callerMessage,
        vapiSummary: vapiSummary,
        recordedAt: new Date().toISOString()
      };

      calls = calls.filter(c => c.id !== callId);
      calls.unshift(callRecord);
      if (calls.length > 100) calls = calls.slice(0, 100);

      return res.status(200).json({ success: true, id: callRecord.id });

    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ calls, count: calls.length });
  }

  res.status(405).end();
}
