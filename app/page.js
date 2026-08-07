'use client'

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
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', letterSpacing: -0.5 }}>
          John Call <span style={{ color: '#ff6b00' }}>Tracker</span>
        </h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>EVA Voice Call Dashboard</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Calls" value={totalCalls} />
        <StatCard label="Total Minutes" value={Math.round(totalDuration / 60)} />
        <StatCard label="Avg Duration" value={`${avgDuration}s`} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'completed', 'in-progress', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: '1px solid #2a2a2a',
              background: filter === f ? '#ff6b00' : '#141414',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: '0.2s'
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading calls...
        </div>
      ) : filteredCalls.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: '#141414', borderRadius: 16, border: '1px solid #2a2a2a'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
          <p style={{ color: '#888', fontSize: 15 }}>No calls yet.</p>
          <p style={{ color: '#666', fontSize: 13 }}>When EVA makes or receives a call, it will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredCalls.map((call, i) => (
            <div
              key={call.id || i}
              onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)}
              style={{
                background: '#141414',
                border: '1px solid #2a2a2a',
                borderRadius: 14,
                padding: 16,
                cursor: 'pointer',
                transition: '0.2s',
                borderLeft: call.status === 'completed' ? '3px solid #00c853' : call.status === 'failed' ? '3px solid #ff1744' : '3px solid #ff6b00'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {call.from || 'Unknown Caller'}
                  </div>
                  <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                    {formatTime(call.timestamp)} • {formatDuration(call.duration)}
                  </div>
                </div>
                <StatusBadge status={call.status} />
              </div>
              
              {selectedCall?.id === call.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #2a2a2a' }}>
                  {call.transcript && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 600 }}>TRANSCRIPT</div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#ccc' }}>{call.transcript}</div>
                    </div>
                  )}
                  {call.summary && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 600 }}>SUMMARY</div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#ccc' }}>{call.summary}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                    Call ID: {call.id}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '20px 0', color: '#444', fontSize: 12 }}>
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
      borderRadius: 14,
      padding: 16,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#ff6b00' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    completed: '#00c853',
    'in-progress': '#ff6b00',
    failed: '#ff1744',
    ended: '#888'
  }
  const color = colors[status] || '#888'
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 12,
      background: color + '20',
      color: color,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase'
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
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
