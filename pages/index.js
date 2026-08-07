import { useState, useEffect } from 'react'

export default function Home() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchCalls()
    const interval = setInterval(fetchCalls, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCalls() {
    try {
      const res = await fetch('/api/webhook')
      const data = await res.json()
      setCalls(data.calls || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = filter === 'all' ? calls : calls.filter(c => c.status === filter)

  const totalCalls = calls.length
  const totalDuration = calls.reduce((sum, c) => sum + (parseInt(c.duration) || 0), 0)
  const totalMessages = calls.reduce((sum, c) => sum + (parseInt(c.messageCount) || 0), 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px', letterSpacing: -1 }}>
          John Call <span style={{ color: '#ff6b00' }}>Tracker</span>
        </h1>
        <p style={{ color: '#888', fontSize: 15, margin: 0 }}>EVA Voice Call Dashboard</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Calls" value={totalCalls} />
        <StatCard label="Total Minutes" value={Math.round(totalDuration / 60)} />
        <StatCard label="Avg Duration" value={totalCalls > 0 ? `${Math.round(totalDuration / totalCalls)}s` : '0s'} />
        <StatCard label="Messages" value={totalMessages} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'completed', 'in-progress', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 20px',
              borderRadius: 24,
              border: '1px solid #2a2a2a',
              background: filter === f ? '#ff6b00' : '#141414',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Call List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <p>Loading calls...</p>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 80,
          background: '#141414', borderRadius: 20, border: '1px solid #2a2a2a'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📞</div>
          <p style={{ color: '#888', fontSize: 16, marginBottom: 8 }}>No calls yet.</p>
          <p style={{ color: '#555', fontSize: 14 }}>When EVA makes or receives a call, it will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredCalls.map((call) => (
            <div
              key={call.id}
              onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)}
              style={{
                background: '#141414',
                border: '1px solid #2a2a2a',
                borderRadius: 16,
                padding: 18,
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: call.status === 'completed' ? '4px solid #00c853' : call.status === 'failed' ? '4px solid #ff1744' : '4px solid #ff6b00'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {call.fromName ? `${call.fromName} (${call.from})` : call.from}
                  </div>
                  <div style={{ color: '#888', fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>{formatTime(call.recordedAt)}</span>
                    <span>•</span>
                    <span>{formatDuration(call.duration)}</span>
                    <span>•</span>
                    <span>{call.messageCount} messages</span>
                  </div>
                </div>
                <StatusBadge status={call.status} />
              </div>
              
              {selectedCall?.id === call.id && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #2a2a2a' }}>
                  {call.summary && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: '#ff6b00', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Summary</div>
                      <div style={{ fontSize: 15, lineHeight: 1.6, color: '#ddd' }}>{call.summary}</div>
                    </div>
                  )}
                  {call.transcript && call.transcript !== 'No transcript available' && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: '#ff6b00', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Transcript</div>
                      <div style={{ 
                        fontSize: 14, lineHeight: 1.7, color: '#bbb', 
                        background: '#0a0a0a', padding: 16, borderRadius: 10,
                        border: '1px solid #222', whiteSpace: 'pre-wrap', fontFamily: 'monospace'
                      }}>
                        {call.transcript}
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#444', fontFamily: 'monospace', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>ID: {call.id}</span>
                    <span>Reason: {call.reason}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '30px 0 10px', color: '#333', fontSize: 12 }}>
        Auto-refreshes every 5 seconds • john-call-tracker
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{
      background: '#141414',
      border: '1px solid #2a2a2a',
      borderRadius: 16,
      padding: 20,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#ff6b00' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    completed: '#00c853',
    'in-progress': '#ff6b00',
    failed: '#ff1744',
    ended: '#888',
    unknown: '#666'
  }
  const color = colors[status] || '#888'
  return (
    <span style={{
      padding: '5px 12px',
      borderRadius: 14,
      background: color + '18',
      color: color,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      whiteSpace: 'nowrap'
    }}>
      {status || 'unknown'}
    </span>
  )
}

function formatTime(iso) {
  if (!iso) return 'Just now'
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(sec) {
  const s = parseInt(sec) || 0
  if (s === 0) return '0s'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}
