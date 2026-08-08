// pages/api/webhook.js
// Receives call data from Vapi and stores it

let calls = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      // Vapi wraps everything in "message" object
      const message = data.message || data;
      const eventType = message.type || data.type || 'unknown';
      
      // ONLY process end-of-call-report (the final event with all data)
      // Ignore status-update, call-initiated, ringing, etc.
      if (eventType !== 'end-of-call-report') {
        console.log('[Phillip] Ignoring event type:', eventType);
        return res.status(200).json({ success: true, ignored: true, type: eventType });
      }
      
      // Extract call object
      const callObj = message.call || message;
      const callId = callObj.id || callObj.call_id || data.call_id || Date.now().toString();
      
      // Extract messages array
      let messages = [];
      if (callObj.messages && Array.isArray(callObj.messages)) {
        messages = callObj.messages;
      } else if (message.messages && Array.isArray(message.messages)) {
        messages = message.messages;
      }
      
      // Build transcript
      let transcript = '';
      if (messages.length > 0) {
        transcript = messages.map(m => {
          const role = m.role === 'assistant' ? 'Phillip' : 'Caller';
          const content = m.message || m.content || m.text || m.word || '(no text)';
          return `${role}: ${content}`;
        }).join('\n');
      } else {
        transcript = callObj.transcript || callObj.transcriptXML || 'No transcript available';
      }
      
      // Extract duration - try every possible field name Vapi uses
      let duration = 0;
      if (callObj.durationMs) {
        duration = Math.round(callObj.durationMs / 1000);
      } else if (callObj.duration_ms) {
        duration = Math.round(callObj.duration_ms / 1000);
      } else if (callObj.durationSeconds) {
        duration = parseInt(callObj.durationSeconds);
      } else if (callObj.duration_seconds) {
        duration = parseInt(callObj.duration_seconds);
      } else if (callObj.duration) {
        duration = parseInt(callObj.duration);
      } else if (data.durationMs) {
        duration = Math.round(data.durationMs / 1000);
      }
      
      // Extract phone number
      let fromNumber = 'Unknown';
      if (callObj.customer?.number) {
        fromNumber = callObj.customer.number;
      } else if (callObj.from) {
        fromNumber = callObj.from;
      }
      
      let toNumber = 'Unknown';
      if (callObj.phoneNumber?.number) {
        toNumber = callObj.phoneNumber.number;
      } else if (callObj.to) {
        toNumber = callObj.to;
      }
      
      const callRecord = {
        id: callId,
        from: fromNumber,
        fromName: callObj.customer?.name || '',
        to: toNumber,
        status: callObj.status || 'completed',
        reason: callObj.endedReason || callObj.ended_reason || callObj.end_reason || 'N/A',
        startedAt: callObj.startedAt || callObj.started_at || new Date().toISOString(),
        endedAt: callObj.endedAt || callObj.ended_at || new Date().toISOString(),
        duration: duration,
        transcript: transcript,
        messageCount: messages.length,
        summary: callObj.summary || '',
        recordedAt: new Date().toISOString(),
        eventType: eventType
      };
      
      // Remove any existing call with same ID (deduplicate)
      calls = calls.filter(c => c.id !== callId);
      calls.unshift(callRecord);
      if (calls.length > 100) calls = calls.slice(0, 100);
      
      console.log('[Phillip] Call logged:', callRecord.from, '-', duration + 's -', messages.length, 'messages');
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
