// pages/api/webhook.js
// Receives call data from Vapi and stores it

let calls = []; // In-memory storage (newest first)

export default function handler(req, res) {
  // Allow CORS for Vapi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;

      // Extract the conversation
      const messages = data.messages || [];
      let transcript = '';

      if (messages.length > 0) {
        transcript = messages.map(m => {
          const role = m.role === 'assistant' ? 'Phillip' : 'Caller';
          return `${role}: ${m.content || m.message || '(no text)'}`;
        }).join('\n');
      } else {
        transcript = 'No transcript available';
      }

      const callData = {
        id: data.call?.id || Date.now().toString(),
        from: data.call?.customer?.number || 'Unknown',
        fromName: data.call?.customer?.name || '',
        status: data.call?.status || 'unknown',
        reason: data.call?.endedReason || 'N/A',
        startedAt: data.call?.startedAt || new Date().toISOString(),
        endedAt: data.call?.endedAt || new Date().toISOString(),
        duration: data.call?.durationMs ? Math.round(data.call.durationMs / 1000) : 0,
        transcript: transcript,
        messageCount: messages.length,
        summary: data.call?.summary || '',
        recordedAt: new Date().toISOString()
      };

      calls.unshift(callData);
      if (calls.length > 100) calls = calls.slice(0, 100);

      console.log('[Phillip] Call logged:', callData.from, '-', messages.length, 'messages');
      return res.status(200).json({ success: true, id: callData.id });

    } catch (err) {
      console.error('[EVA] Webhook error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ calls, count: calls.length });
  }

  res.status(405).end();
}
