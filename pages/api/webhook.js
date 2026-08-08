// pages/api/webhook.js
// Receives call data from Vapi and stores it

let calls = [];
let lastDebugPayload = null;

// Only filter the exact system prompt
function isJunk(text) {
  if (!text) return true;
  const t = text.toLowerCase();
  return t.includes('you are phillip') && t.includes('john\'s personal assistant');
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const data = req.body;
      lastDebugPayload = data;

      const message = data.message || data;
      const eventType = message.type || data.type || 'unknown';

      if (eventType !== 'end-of-call-report') {
        return res.status(200).json({ success: true, ignored: true });
      }

      const callObj = message.call || message;
      const callId = callObj.id || Date.now().toString();

      // Get messages array
      let allMessages = [];
      if (callObj.messages && Array.isArray(callObj.messages)) {
        allMessages = callObj.messages;
      } else if (message.messages && Array.isArray(message.messages)) {
        allMessages = message.messages;
      }

      let callerLines = [];

      // Strategy 1: Parse messages array
      for (const m of allMessages) {
        const role = (m.role || '').toLowerCase();
        const content = (m.message || m.content || m.text || m.word || m.transcript || '').trim();

        if (!content) continue;
        if (isJunk(content)) continue;
        if (role === 'system') continue;
        if (role === 'assistant' || role === 'bot') continue;

        // Everything else = caller
        callerLines.push(content);
      }

      // Strategy 2: Parse transcript string
      let transcript = callObj.transcript || callObj.transcriptXML || data.transcript || '';
      if (callerLines.length === 0 && transcript) {
        const lines = transcript.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.toLowerCase().startsWith('caller:')) {
            const msg = trimmed.replace(/^caller:\s*/i, '').trim();
            if (msg && !isJunk(msg)) callerLines.push(msg);
          }
        }
      }

      // Strategy 3: Vapi summary
      const vapiSummary = callObj.summary || data.summary || '';

      // Build final message
      let callerMessage = '';
      if (callerLines.length > 0) {
        callerMessage = callerLines.join('\n\n');
      } else if (vapiSummary) {
        callerMessage = vapiSummary;
      } else if (transcript) {
        callerMessage = transcript;
      } else {
        callerMessage = 'No message captured';
      }

      // Duration
      let duration = 0;
      if (callObj.durationMs) duration = Math.round(callObj.durationMs / 1000);
      else if (callObj.duration) duration = parseInt(callObj.duration);

      // Phone
      let fromNumber = callObj.customer?.number || callObj.from || data.from || 'Unknown';

      const callRecord = {
        id: callId,
        from: fromNumber,
        fromName: callObj.customer?.name || '',
        status: 'completed',
        reason: callObj.endedReason || 'N/A',
        duration: duration,
        callerMessage: callerMessage,
        vapiSummary: vapiSummary,
        transcript: transcript,
        recordedAt: new Date().toISOString()
      };

      calls = calls.filter(c => c.id !== callId);
      calls.unshift(callRecord);
      if (calls.length > 100) calls = calls.slice(0, 100);

      console.log('[Phillip] Logged:', fromNumber, '| Lines:', callerLines.length);
      return res.status(200).json({ success: true, id: callRecord.id });

    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      calls, 
      count: calls.length,
      debug: lastDebugPayload
    });
  }

  res.status(405).end();
}
