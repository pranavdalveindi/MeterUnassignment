'use client'

import { useState } from 'react'
import styles from './page.module.css'

type ResultState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string; meter: { meterId: string; assignedHouseholdId: string | null; isAssigned: boolean; updatedAt: string } }
  | { status: 'error'; error: string }

export default function Home() {
  const [hhid, setHhid] = useState('')
  const [meterId, setMeterId] = useState('')
  const [result, setResult] = useState<ResultState>({ status: 'idle' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hhid.trim() || !meterId.trim()) return

    setResult({ status: 'loading' })

    try {
      const res = await fetch('/api/unassign-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hhid: hhid.trim(), meterId: meterId.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ status: 'success', message: data.message, meter: data.meter })
      } else {
        setResult({ status: 'error', error: data.error })
      }
    } catch {
      setResult({ status: 'error', error: 'Network error — could not reach the server.' })
    }
  }

  const handleReset = () => {
    setResult({ status: 'idle' })
    setHhid('')
    setMeterId('')
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.badge}>SYS</div>
          <span className={styles.headerTitle}>METER MANAGEMENT CONSOLE</span>
          <div className={styles.statusDot} />
        </div>
      </header>

      {/* Center panel */}
      <div className={styles.center}>
        <div className={styles.card}>
          {/* Card header */}
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className={styles.cardTitle}>UNASSIGN METER</h1>
              <p className={styles.cardSubtitle}>Remove meter-to-household binding from the database</p>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="hhid">
                <span className={styles.labelTag}>01</span>
                HOUSEHOLD ID (HHID)
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>HH</span>
                <input
                  id="hhid"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. HH1038"
                  value={hhid}
                  onChange={(e) => setHhid(e.target.value)}
                  disabled={result.status === 'loading'}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="meterId">
                <span className={styles.labelTag}>02</span>
                METER ID
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>IM</span>
                <input
                  id="meterId"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. IM000138"
                  value={meterId}
                  onChange={(e) => setMeterId(e.target.value)}
                  disabled={result.status === 'loading'}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={result.status === 'loading' || !hhid.trim() || !meterId.trim()}
            >
              {result.status === 'loading' ? (
                <>
                  <span className={styles.spinner} />
                  EXECUTING QUERY...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 10 4 15 9 20" />
                    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                  </svg>
                  EXECUTE UNASSIGN
                </>
              )}
            </button>
          </form>

          {/* Result panel */}
          {result.status === 'success' && (
            <div className={styles.resultSuccess}>
              <div className={styles.resultHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                OPERATION SUCCESSFUL
              </div>
              <p className={styles.resultMsg}>{result.message}</p>
              <div className={styles.resultTable}>
                <div className={styles.resultRow}>
                  <span className={styles.resultKey}>meter_id</span>
                  <span className={styles.resultVal}>{result.meter.meterId}</span>
                </div>
                <div className={styles.resultRow}>
                  <span className={styles.resultKey}>assigned_household_id</span>
                  <span className={styles.resultVal}>{result.meter.assignedHouseholdId ?? 'NULL'}</span>
                </div>
                <div className={styles.resultRow}>
                  <span className={styles.resultKey}>is_assigned</span>
                  <span className={styles.resultVal}>{String(result.meter.isAssigned)}</span>
                </div>
                <div className={styles.resultRow}>
                  <span className={styles.resultKey}>updated_at</span>
                  <span className={styles.resultVal}>{new Date(result.meter.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <button className={styles.resetBtn} onClick={handleReset}>
                ← NEW OPERATION
              </button>
            </div>
          )}

          {result.status === 'error' && (
            <div className={styles.resultError}>
              <div className={styles.resultHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                OPERATION FAILED
              </div>
              <p className={styles.resultMsg}>{result.error}</p>
              <button className={styles.resetBtn} onClick={handleReset}>
                ← TRY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className={styles.footer}>
          <span>Targets: <code>households</code>, <code>meters</code>, <code>meter_assignments</code></span>
          <span className={styles.footerDot}>·</span>
          <span>Action: DELETE + UPDATE</span>
        </div>
      </div>
    </main>
  )
}
