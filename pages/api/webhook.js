
webhook_code = '''// pages/api/webhook.js
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
      console.log('[Phillip] Webhook received:', JSON.stringify(data).substring(0, 200));

      // Vapi sends different event types
      const eventType = data.message?.type || data.type || 'unknown';
      const callData = data.message?.call || data.call || {};

      // Only log end-of-call-report or similar completion events
      if (eventType !== 'end-of-call-report' && eventType !== 'call-ended' && eventType !== 'status-update') {
        console.log('[Phillip] Ignoring event type:', eventType);
        return res.status(200).json({ success: true, ignored: true, type: eventType });
      }

      // Extract the conversation
      const messages = callData.messages || data.messages || [];
      let transcript = '';

      if (messages.length > 0) {
        transcript = messages.map(m => {
          const role = m.role === 'assistant' ? 'Phillip' : 'Caller';
          return `${role}: ${m.content || m.message || m.text || '(no text)'}`;
        }).join('\\n');
      } else {
        transcript = callData.transcript || data.transcript || 'No transcript available';
      }

      const callRecord = {
        id: callData.id || data.call_id || Date.now().toString(),
        from: callData.customer?.number || callData.from || data.from || 'Unknown',
        fromName: callData.customer?.name || callData.fromName || '',
        to: callData.phoneNumber?.number || callData.to || data.to || 'Unknown',
        status: callData.status || data.status || 'completed',
        reason: callData.endedReason || callData.ended_reason || data.endedReason || data.reason || 'N/A',
        startedAt: callData.startedAt || callData.started_at || data.startedAt || new Date().toISOString(),
        endedAt: callData.endedAt || callData.ended_at || data.endedAt || new Date().toISOString(),
        duration: callData.durationMs ? Math.round(callData.durationMs / 1000) : 
                  callData.duration_ms ? Math.round(callData.duration_ms / 1000) : 
                  (callData.duration || data.duration || 0),
        transcript: transcript,
        messageCount: messages.length,
        summary: callData.summary || data.summary || '',
        recordedAt: new Date().toISOString(),
        eventType: eventType
      };

      calls.unshift(callRecord);
      if (calls.length > 100) calls = calls.slice(0, 100);

      console.log('[Phillip] Call logged:', callRecord.from, '-', messages.length, 'messages -', callRecord.duration + 's');
      return res.status(200).json({ success: true, id: callRecord.id });

    } catch (err) {
      console.error('[Phillip] Webhook error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ calls, count: calls.length });
  }

  res.status(405).end();
}
'''

print(webhook_code)
