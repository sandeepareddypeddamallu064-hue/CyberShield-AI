import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CheckCircle2,
  ChevronDown, CircleAlert, Clock3, Command, Download, FileText, Fingerprint,
  Gauge, LayoutDashboard, LifeBuoy, LockKeyhole, Menu, Network, Search,
  Shield, ShieldAlert, ShieldCheck, Siren, SlidersHorizontal, Sparkles,
  Terminal, X, Zap
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell
} from 'recharts';

const initialAlerts = [
  { id:'CS-1048', time:'12:42:18', type:'Brute Force Attempt', source:'185.220.101.42', target:'Auth Gateway', severity:'Critical', score:96, status:'Investigating', detail:'Repeated failed authentication attempts against the SSH gateway from a single external source.', action:'Temporarily block the source IP, enforce MFA, and review authentication logs for successful sessions.' },
  { id:'CS-1047', time:'12:39:52', type:'Port Scan', source:'45.83.64.12', target:'API Server', severity:'High', score:82, status:'New', detail:'Sequential connection attempts across multiple ports suggest reconnaissance activity.', action:'Apply rate limiting, review exposed services, and restrict unnecessary inbound ports.' },
  { id:'CS-1046', time:'12:36:09', type:'Unusual Data Transfer', source:'10.0.4.28', target:'External Host', severity:'High', score:78, status:'Investigating', detail:'Outbound traffic volume is above the illustrative baseline for this host.', action:'Validate the business purpose, inspect endpoint activity, and temporarily limit outbound transfers if unauthorized.' },
  { id:'CS-1045', time:'12:31:44', type:'Suspicious Login', source:'103.18.22.91', target:'Admin Portal', severity:'Medium', score:61, status:'New', detail:'Login from an unfamiliar source followed several failed attempts.', action:'Verify the account owner, revoke suspicious sessions, and reset credentials if compromise is confirmed.' },
  { id:'CS-1044', time:'12:27:03', type:'Malware Signature Match', source:'10.0.2.17', target:'Workstation-17', severity:'Critical', score:93, status:'Contained', detail:'A simulated endpoint event matches a known-malware signature pattern.', action:'Isolate the endpoint from the network and submit the artifact to the approved security analysis workflow.' },
  { id:'CS-1043', time:'12:19:37', type:'Policy Violation', source:'10.0.1.55', target:'File Server', severity:'Low', score:24, status:'Resolved', detail:'A simulated access event does not match the example access policy.', action:'Confirm the user role and update access policy only if the request is approved.' },
  { id:'CS-1042', time:'12:14:21', type:'DNS Anomaly', source:'10.0.8.11', target:'DNS Resolver', severity:'Medium', score:54, status:'New', detail:'The sample log contains an unusual DNS request pattern.', action:'Review DNS query history and block the domain only after validating threat intelligence.' }
];
const API_URL = 'http://127.0.0.1:8000';

function convertBackendEvent(event) {
  const severity = ['Critical', 'High', 'Medium', 'Low'].includes(
    event.severity
  )
    ? event.severity
    : 'Medium';

  const scoreMap = {
    Critical: 95,
    High: 80,
    Medium: 55,
    Low: 25,
  };

  return {
    id: `API-${event.id}`,
    time: event.timestamp
      ? new Date(event.timestamp).toLocaleTimeString()
      : 'Unknown',
    type: event.event_type,
    source: event.source_ip,
    target: 'Unknown target',
    severity,
    score: event.risk_score ?? scoreMap[severity],
    status: 'New',
    detail: event.description,
    action:
      'Review the event details and related logs. Verify whether this activity is authorized before taking action.',
  };
}
const activity = [
  {time:'08:00', critical:2, high:5, medium:9}, {time:'09:00', critical:3, high:7, medium:8},
  {time:'10:00', critical:1, high:6, medium:12}, {time:'11:00', critical:5, high:8, medium:10},
  {time:'12:00', critical:4, high:11, medium:7}, {time:'13:00', critical:7, high:9, medium:13},
  {time:'14:00', critical:4, high:6, medium:8}
];
const severityData = [{name:'Critical',value:2,color:'#fb7185'},{name:'High',value:2,color:'#fb923c'},{name:'Medium',value:2,color:'#facc15'},{name:'Low',value:1,color:'#34d399'}];

function Logo({small=false}) {
  return <div className="brand-mark"><span className="brand-icon"><Shield size={small?18:22}/></span>{!small && <span>CyberShield <b>AI</b></span>}</div>;
}
function Badge({children, tone=''}) { return <span className={`badge ${tone || String(children).toLowerCase()}`}>{children}</span>; }

function Landing() {
  const nav = useNavigate();
  return <div className="landing">
    <header className="site-header">
      <Link to="/" className="brand-link"><Logo /></Link>
      <nav><a href="#problem">The Problem</a><a href="#solution">Solution</a><a href="#features">Features</a></nav>
      <button className="button button-outline header-cta" onClick={()=>nav('/console')}><Terminal size={16}/> Console <ArrowRight size={15}/></button>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot"/> SECURITY OPERATIONS, REIMAGINED</div>
          <h1>Real-Time AI-Powered<br/><span>Cyber Threat Detection</span><br/>&amp; Intelligent Response</h1>
          <p>CyberShield AI helps security teams review suspicious activity, understand risk, and prioritize incident response from one clear console.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={()=>nav('/console')}>Launch Security Console <ArrowRight size={17}/></button>
            <a className="text-link" href="#features">Explore features <ArrowDownRight size={16}/></a>
          </div>
          <div className="hero-footnote"><ShieldCheck size={16}/> Demo environment <span className="dot-separator"/> Simulated security events</div>
        </div>
        <div className="hero-visual">
          <div className="visual-top"><span><span className="live-dot"/> SECURITY OVERVIEW</span><span className="visual-tag">DEMO DATA</span></div>
          <div className="visual-score"><div><span className="muted-label">RISK INDEX</span><strong>72<span>/100</span></strong><small><ArrowUpRight size={13}/> Elevated activity</small></div><div className="score-ring"><span>72</span></div></div>
          <div className="mini-chart">
            <div className="chart-caption"><span>Threat activity</span><span>Last 7 hours</span></div>
            <svg viewBox="0 0 440 120" role="img" aria-label="Illustrative threat activity chart"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity=".26"/><stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/></linearGradient></defs><path d="M0 92 C25 85 32 80 60 88 S90 61 120 70 S155 38 180 57 S220 65 250 35 S290 51 315 42 S355 15 380 30 S410 20 440 10 L440 120 L0 120 Z" fill="url(#areaFill)"/><path d="M0 92 C25 85 32 80 60 88 S90 61 120 70 S155 38 180 57 S220 65 250 35 S290 51 315 42 S355 15 380 30 S410 20 440 10" fill="none" stroke="#22d3ee" strokeWidth="2.5"/></svg>
          </div>
          <div className="visual-alerts"><div className="visual-alert-head">Recent detections <span>View all <ArrowRight size={12}/></span></div>
            <div className="visual-alert"><span className="alert-icon critical"><Siren size={15}/></span><div><b>Brute force attempt</b><small>Auth Gateway · 12:42</small></div><Badge>Critical</Badge></div>
            <div className="visual-alert"><span className="alert-icon high"><Network size={15}/></span><div><b>Port scan detected</b><small>API Server · 12:39</small></div><Badge>High</Badge></div>
          </div>
          <div className="visual-bottom"><span><span className="pulse-dot"/> Example console preview</span><span>Not connected to live traffic</span></div>
        </div>
        <div className="hero-glow"/>
      </section>
      <section className="trust-strip"><span>BUILT FOR SECURITY WORKFLOWS</span><div><ShieldCheck size={17}/> Detection</div><div><Gauge size={17}/> Risk prioritization</div><div><Fingerprint size={17}/> Incident investigation</div><div><Zap size={17}/> Response guidance</div></section>
      <section id="problem" className="content-section">
        <div className="section-heading"><div className="eyebrow">THE CHALLENGE</div><h2>Security teams need <span>signal, not noise.</span></h2><p>Fragmented alerts and unclear priorities can slow down incident triage.</p></div>
        <div className="problem-grid">
          <article className="info-card"><span className="card-icon"><Bell/></span><h3>Alert Fatigue</h3><p>High volumes of alerts make it harder to identify the events that need immediate attention.</p></article>
          <article className="info-card"><span className="card-icon"><Clock3/></span><h3>Delayed Investigation</h3><p>Analysts need context and a clear starting point to investigate suspicious activity efficiently.</p></article>
          <article className="info-card"><span className="card-icon"><Network/></span><h3>Siloed Events</h3><p>Individual logs can hide a broader pattern when they are reviewed without shared context.</p></article>
        </div>
      </section>
      <section id="solution" className="solution-section">
        <div className="solution-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="core-shield"><ShieldCheck size={58}/></div><div className="orbit-node node-one"><Activity/></div><div className="orbit-node node-two"><LockKeyhole/></div><div className="orbit-node node-three"><CircleAlert/></div></div>
        <div className="solution-copy"><div className="eyebrow">THE CYBERSHIELD APPROACH</div><h2>From raw events to <span>clear next steps.</span></h2><p>Bring example security events into a single workflow. Review severity, inspect the context, and use defensive recommendations to guide your response.</p>
          <ul className="check-list"><li><CheckCircle2/> Review suspicious activity in one place</li><li><CheckCircle2/> Prioritize events with risk scores</li><li><CheckCircle2/> Investigate alerts with useful context</li><li><CheckCircle2/> Follow guided mitigation recommendations</li></ul>
          <button className="button button-primary" onClick={()=>nav('/console')}>Explore the console <ArrowRight size={17}/></button>
        </div>
      </section>
      <section id="features" className="content-section feature-section">
        <div className="section-heading"><div className="eyebrow">KEY FEATURES</div><h2>A focused workspace for <span>threat response.</span></h2></div>
        <div className="feature-grid">
          <article className="feature-card"><Activity/><h3>Threat Activity Overview</h3><p>Review illustrative event trends and see where attention may be needed.</p></article>
          <article className="feature-card"><Gauge/><h3>Severity &amp; Risk Scoring</h3><p>Use consistent severity labels and risk scores to sort a demo alert queue.</p></article>
          <article className="feature-card"><Search/><h3>Incident Investigation</h3><p>Open an alert to inspect its source, target, explanation, and response guidance.</p></article>
          <article className="feature-card"><ShieldCheck/><h3>Guided Response</h3><p>See defensive next steps and track the demo incident status.</p></article>
        </div>
      </section>
      <section className="bottom-cta"><div><div className="eyebrow">CYBERSHIELD AI</div><h2>Make the next security decision clearer.</h2><p>Explore the interactive demo console with simulated events.</p></div><button className="button button-primary" onClick={()=>nav('/console')}>Open Demo Console <ArrowRight size={17}/></button></section>
    </main>
    <footer className="site-footer"><Logo/><span>© 2026 CyberShield AI · Educational demo</span><span>Simulated data only</span></footer>
  </div>;
}

function ConsolePage() {
  const [alerts,setAlerts] = useState(initialAlerts);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState('');
  const [query,setQuery] = useState('');
  const [severity,setSeverity] = useState('All');
  const [statusFilter,setStatusFilter] = useState('All');
  const [selectedId,setSelectedId] = useState('CS-1048');
  const [mobileNav,setMobileNav] = useState(false);
  const [toast,setToast] = useState('');
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const loadPredictionHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const response = await fetch(`${API_URL}/api/predictions?limit=100`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `Could not load prediction history (${response.status}).`);
      }
      setPredictionHistory(Array.isArray(data.predictions) ? data.predictions : []);
    } catch (error) {
      setHistoryError(error.message || 'Could not load prediction history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPredictionHistory();
  }, [loadPredictionHistory]);

  const runMLPrediction = async () => {
    setMlLoading(true);
    setMlError('');
    setMlResult(null);

    try {
      // This endpoint returns a saved CIC-IDS2017 sample payload from the backend.
      const payloadResponse = await fetch(`${API_URL}/api/test-payload`);
      const payload = await payloadResponse.json();

      if (!payloadResponse.ok) {
        throw new Error(
          typeof payload.detail === 'string'
            ? payload.detail
            : 'Could not load the saved test sample.'
        );
      }

      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.detail === 'string'
            ? result.detail
            : result.detail?.message || 'ML prediction request failed.'
        );
      }

      setMlResult(result);
      // Refresh the persistent SQLite prediction history after each prediction.
      await loadPredictionHistory();

      // Record the prediction in the backend event queue so it appears
      // in Security Alerts. This is a saved dataset sample, not live traffic.
      const eventResponse = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: `ML Dataset Sample: ${result.prediction}`,
          source_ip: 'Saved CIC-IDS2017 sample',
          description: `Random Forest classified a saved CIC-IDS2017 PortScan sample as ${result.prediction} with ${result.confidence}% model confidence. This is a dataset test, not live network traffic.`,
          severity: result.severity,
        }),
      });

      const eventData = await eventResponse.json();
      if (!eventResponse.ok) {
        throw new Error(
          typeof eventData.detail === 'string'
            ? eventData.detail
            : 'Prediction succeeded, but the alert could not be saved.'
        );
      }

      if (eventData.event?.id != null) {
        setSelectedId(`API-${eventData.event.id}`);
      }
      setToast('ML prediction added to Security Alerts');
      setTimeout(() => setToast(''), 2500);
    } catch (error) {
      setMlError(error.message || 'Could not run ML prediction.');
    } finally {
      setMlLoading(false);
    }
  };

  const loadBackendEvents = useCallback(async () => {
  try {
    const response = await fetch(`${API_URL}/api/events`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const backendAlerts = (data.events || []).map(convertBackendEvent);

    setAlerts((currentAlerts) => {
      const demoAlerts = currentAlerts.filter(
        (alert) => !String(alert.id).startsWith('API-')
      );

      return [...backendAlerts, ...demoAlerts];
    });

    setApiConnected(true);
    setApiError('');
  } catch (error) {
    setApiConnected(false);
    setApiError('Cannot connect to the backend. Check whether FastAPI is running.');
  }
}, []);

useEffect(() => {
  loadBackendEvents();

  const timer = setInterval(loadBackendEvents, 3000);

  return () => clearInterval(timer);
}, [loadBackendEvents]);
  const selected = alerts.find(a=>a.id===selectedId) || alerts[0];
  const filtered = useMemo(()=>alerts.filter(a=>(severity==='All'||a.severity===severity)&&(statusFilter==='All'||a.status===statusFilter)&&(`${a.id} ${a.type} ${a.source} ${a.target} ${a.status}`.toLowerCase().includes(query.toLowerCase()))),[alerts,severity,statusFilter,query]);
  const updateStatus=(id,status)=>setAlerts(prev=>prev.map(a=>a.id===id?{...a,status}:a));
  const exportCsv=()=>{
    const rows=[['ID','Time','Type','Source','Target','Severity','Risk score','Status'],...filtered.map(a=>[a.id,a.time,a.type,a.source,a.target,a.severity,a.score,a.status])];
    const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download='cybershield-demo-alerts.csv'; link.click(); URL.revokeObjectURL(url);
    setToast('CSV exported'); setTimeout(()=>setToast(''),2200);
  };
  const resetDemo=()=>{setAlerts(initialAlerts);setSelectedId('CS-1048');setSeverity('All');setStatusFilter('All');setQuery('');setToast('Demo data reset');setTimeout(()=>setToast(''),2200);};
  return <div className="console-layout">
    <aside className={`sidebar ${mobileNav?'show-mobile':''}`}>
      <Link to="/" className="brand-link"><Logo/></Link>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <div className="workspace"><div className="workspace-avatar">CS</div><div><b>Security Operations</b><small>Demo workspace</small></div><ChevronDown size={14}/></div>
      <div className="nav-label">MONITOR</div>
      <button className="side-link active"><LayoutDashboard size={17}/> Overview</button>
      <button className="side-link" onClick={()=>document.getElementById('alerts-table')?.scrollIntoView({behavior:'smooth'})}><ShieldAlert size={17}/> Threat alerts <span className="nav-count">{alerts.filter(a=>a.status!=='Resolved').length}</span></button>
      <button className="side-link" onClick={()=>document.getElementById('investigation')?.scrollIntoView({behavior:'smooth'})}><FileText size={17}/> Investigation</button>
      <div className="nav-label">SYSTEM</div>
      <button className="side-link" onClick={()=>setToast('Settings are not configured in this demo.')}><SlidersHorizontal size={17}/> Settings</button>
      <div className="sidebar-bottom"><div className="secure-box"><span className="pulse-dot"/><div><b>Demo environment</b><small>No live network connected</small></div></div><button className="side-link" onClick={()=>setToast('This is a frontend demo; no support service is connected.')}><LifeBuoy size={17}/> Help &amp; support</button><Link to="/" className="back-link">← Back to homepage</Link></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileNav(false)} />}
    <main className="console-main">
      <header className="console-topbar"><button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav?<X/>:<Menu/>}</button><div className="breadcrumbs">CyberShield AI <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="demo-pill"><span className="pulse-dot"/> DEMO DATA</span><button className="icon-button" aria-label="Notifications" onClick={()=>setToast('No new demo notifications.')}><Bell size={18}/></button><div className="user-avatar">B</div></div></header>
      <div className="console-content">
        <div className="page-title-row"><div><div className="eyebrow">SECURITY CONSOLE</div><h1>Threat overview</h1><p>Monitor the sample event queue and investigate suspicious activity.</p></div><div className="page-actions"><button className="button button-outline" onClick={resetDemo}>Reset demo</button><button className="button button-primary" onClick={exportCsv}><Download size={16}/> Export CSV</button></div></div>
        <div
  style={{
    marginBottom: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${apiConnected ? '#34d399' : '#fb923c'}`,
    color: apiConnected ? '#34d399' : '#fb923c',
  }}
>
  <strong>
    {apiConnected
      ? '● BACKEND CONNECTED'
      : '● BACKEND DISCONNECTED'}
  </strong>

  <div style={{ marginTop: '5px', fontSize: '13px' }}>
    {apiError ||
      'Checking security events from the backend every 3 seconds.'}
  </div>
</div>
        <div className="demo-notice"><CircleAlert size={17}/><div><b>Demo data — not live monitoring</b><span>The alert queue includes illustrative events. The ML test below predicts a saved CIC-IDS2017 dataset sample; no live network traffic is captured.</span></div></div>
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-top"><span>Total alerts</span><span className="kpi-icon cyan"><Activity size={17}/></span></div><strong>{alerts.length}</strong><small><span className="trend-neutral">Sample queue</span> · all event types</small></div>
          <div className="kpi-card"><div className="kpi-top"><span>Critical threats</span><span className="kpi-icon rose"><Siren size={17}/></span></div><strong>{alerts.filter(a=>a.severity==='Critical'&&a.status!=='Resolved').length}</strong><small>Requires priority review</small></div>
          <div className="kpi-card"><div className="kpi-top"><span>Under investigation</span><span className="kpi-icon orange"><Search size={17}/></span></div><strong>{alerts.filter(a=>a.status==='Investigating').length}</strong><small>Demo incident status</small></div>
          <div className="kpi-card"><div className="kpi-top"><span>Resolved / contained</span><span className="kpi-icon green"><ShieldCheck size={17}/></span></div><strong>{alerts.filter(a=>['Resolved','Contained'].includes(a.status)).length}</strong><small>Updated in this browser session</small></div>
        </div>

        <section className="panel" style={{ marginBottom: '20px', padding: '22px' }}>
          <div className="panel-heading">
            <div>
              <h2>Machine Learning Threat Detection</h2>
              <p>Run the trained Random Forest model on a saved CIC-IDS2017 PortScan sample.</p>
            </div>
            <span className="range-tag">RANDOM FOREST</span>
          </div>

          <button
            className="button button-primary"
            onClick={runMLPrediction}
            disabled={mlLoading}
          >
            {mlLoading ? 'Analyzing sample...' : 'Run ML Prediction'}
          </button>

          {mlError && (
            <div role="alert" style={{ marginTop: '16px', color: '#fb7185' }}>
              <b>Prediction error:</b> {mlError}
              <p style={{ marginTop: '6px', fontSize: '13px' }}>
                Check that the FastAPI backend is running and the
                <code> /api/test-payload </code> endpoint is configured.
              </p>
            </div>
          )}

          {mlResult && (
            <div
              style={{
                marginTop: '20px',
                padding: '18px',
                borderRadius: '12px',
                border: `1px solid ${mlResult.is_attack ? '#fb923c' : '#34d399'}`,
                background: '#0b1624',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="muted-label">MODEL PREDICTION</div>
                  <h2 style={{ margin: '6px 0', color: mlResult.is_attack ? '#fb923c' : '#34d399' }}>
                    {mlResult.prediction}
                  </h2>
                </div>
                <Badge tone={mlResult.is_attack ? 'high' : 'low'}>
                  {mlResult.severity}
                </Badge>
              </div>
              <div className="incident-meta" style={{ marginTop: '16px' }}>
                <div><span>Confidence</span><b>{mlResult.confidence}%</b></div>
                <div><span>Risk score</span><b>{mlResult.risk_score}/100</b></div>
                <div><span>Model</span><b>{mlResult.model}</b></div>
                <div><span>Sample type</span><b>CIC-IDS2017 PortScan sample</b></div>
              </div>
              <p style={{ marginTop: '14px', color: '#9aabc0', fontSize: '13px' }}>
                This result applies to the saved dataset sample only. It is not a live network detection or a guarantee of real-world accuracy.
              </p>
            </div>
          )}
        </section>

        <section className="panel" style={{ marginBottom: '20px', padding: '22px' }} id="prediction-history">
          <div className="panel-heading" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2>Prediction History</h2>
              <p>Previous Random Forest predictions saved by the backend.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="range-tag">{predictionHistory.length} records</span>
              <button className="button button-outline" onClick={loadPredictionHistory} disabled={historyLoading}>
                {historyLoading ? 'Refreshing...' : 'Refresh history'}
              </button>
            </div>
          </div>

          {historyError && (
            <div role="alert" style={{ color: '#fb7185', marginBottom: '12px' }}>
              <b>History error:</b> {historyError}
            </div>
          )}

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                  <th>Risk score</th>
                  <th>Model</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {predictionHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="mono">#{item.id}</td>
                    <td>
                      <Badge tone={item.is_attack ? 'high' : 'low'}>
                        {item.prediction}
                      </Badge>
                    </td>
                    <td>{item.confidence}%</td>
                    <td><Badge>{item.severity}</Badge></td>
                    <td>
                      <div className="risk-cell">
                        <div className="risk-track">
                          <span style={{
                            width: `${Math.max(0, Math.min(100, Number(item.risk_score) || 0))}%`,
                            background: item.risk_score >= 85 ? '#fb7185' : item.risk_score >= 65 ? '#fb923c' : item.risk_score >= 40 ? '#facc15' : '#34d399'
                          }} />
                        </div>
                        <b>{item.risk_score}/100</b>
                      </div>
                    </td>
                    <td>{item.model}</td>
                    <td className="mono time-cell">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!historyLoading && !historyError && predictionHistory.length === 0 && (
              <div className="empty-state">
                <Clock3 size={22} />
                <b>No predictions yet</b>
                <span>Run an ML prediction to create the first history record.</span>
              </div>
            )}
          </div>
          <p style={{ marginTop: '12px', color: '#9aabc0', fontSize: '12px' }}>
            History is read from the backend database. Results are based on saved dataset samples, not live network traffic.
          </p>
        </section>

        <div className="charts-grid">
          <section className="panel activity-panel"><div className="panel-heading"><div><h2>Threat activity</h2><p>Illustrative event volume by severity</p></div><span className="range-tag">7-hour sample</span></div>
            <div className="chart-legend"><span><i className="legend-dot dot-critical"/> Critical</span><span><i className="legend-dot dot-high"/> High</span><span><i className="legend-dot dot-medium"/> Medium</span></div>
            <div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity} margin={{top:10,right:6,left:-22,bottom:0}}><defs><linearGradient id="criticalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={0.24}/><stop offset="100%" stopColor="#fb7185" stopOpacity={0}/></linearGradient><linearGradient id="highFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb923c" stopOpacity={0.18}/><stop offset="100%" stopColor="#fb923c" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#243246" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="time" tick={{fill:'#8292a8',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#8292a8',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#101c2b',border:'1px solid #2a3b50',borderRadius:10,color:'#e8f0fa'}}/><Area type="monotone" dataKey="medium" name="Medium" stroke="#facc15" fill="transparent" strokeWidth={2}/><Area type="monotone" dataKey="high" name="High" stroke="#fb923c" fill="url(#highFill)" strokeWidth={2}/><Area type="monotone" dataKey="critical" name="Critical" stroke="#fb7185" fill="url(#criticalFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
          </section>
          <section className="panel severity-panel"><div className="panel-heading"><div><h2>Severity distribution</h2><p>Current demo alert queue</p></div></div><div className="severity-content"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severityData.map(s=>({...s,value:alerts.filter(a=>a.severity===s.name).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={74} paddingAngle={4} stroke="none">{severityData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{background:'#101c2b',border:'1px solid #2a3b50',borderRadius:10,color:'#e8f0fa'}}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{alerts.length}</strong><small>alerts</small></div></div><div className="severity-legend">{severityData.map(s=><div key={s.name}><span><i style={{background:s.color}}/>{s.name}</span><b>{alerts.filter(a=>a.severity===s.name).length}</b></div>)}</div></div></section>
        </div>
        <section className="panel alerts-panel" id="alerts-table"><div className="panel-heading alerts-heading"><div><h2>Security alerts</h2><p>Search, filter, and select an alert to investigate.</p></div><span className="result-count">{filtered.length} results</span></div>
          <div className="table-controls"><label className="search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ID, attack, IP, target..."/></label><label className="select-wrap"><span>Severity</span><select value={severity} onChange={e=>setSeverity(e.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label><label className="select-wrap"><span>Status</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All</option><option>New</option><option>Investigating</option><option>Contained</option><option>Resolved</option></select></label></div>
          <div className="table-scroll"><table><thead><tr><th>Alert / type</th><th>Source</th><th>Severity</th><th>Risk score</th><th>Status</th><th>Time</th></tr></thead><tbody>{filtered.map(a=><tr key={a.id} onClick={()=>setSelectedId(a.id)} className={selectedId===a.id?'selected-row':''} tabIndex="0" onKeyDown={e=>{if(e.key==='Enter')setSelectedId(a.id)}}><td><div className="alert-cell"><span className={`table-alert-icon ${a.severity.toLowerCase()}`}><ShieldAlert size={15}/></span><div><b>{a.type}</b><small>{a.id} · {a.target}</small></div></div></td><td className="mono">{a.source}</td><td><Badge>{a.severity}</Badge></td><td><div className="risk-cell"><div className="risk-track"><span style={{width:`${a.score}%`,background:a.score>=85?'#fb7185':a.score>=65?'#fb923c':a.score>=40?'#facc15':'#34d399'}}/></div><b>{a.score}</b></div></td><td><Badge tone={`status-${a.status.toLowerCase()}`}>{a.status}</Badge></td><td className="mono time-cell">{a.time}</td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state"><Search size={22}/><b>No alerts found</b><span>Try changing the search or filters.</span></div>}</div>
        </section>
        <section className="panel investigation-panel" id="investigation"><div className="panel-heading"><div><div className="eyebrow">ALERT DETAILS · {selected.id}</div><h2>Incident investigation</h2><p>Review the selected simulated event and its suggested next steps.</p></div><Badge>{selected.severity}</Badge></div>
          <div className="investigation-grid"><div className="incident-summary"><div className="incident-title"><span className={`table-alert-icon ${selected.severity.toLowerCase()}`}><ShieldAlert size={19}/></span><div><h3>{selected.type}</h3><span>{selected.id} · {selected.time}</span></div></div><p>{selected.detail}</p><div className="incident-meta"><div><span>Source</span><b className="mono">{selected.source}</b></div><div><span>Target</span><b>{selected.target}</b></div><div><span>Risk score</span><b className="risk-number">{selected.score}/100</b></div><div><span>Current status</span><b>{selected.status}</b></div></div></div>
            <div className="recommendation-box"><div className="recommendation-title"><Sparkles size={17}/><b>Recommended mitigation</b><span>Guidance</span></div><p>{selected.action}</p><div className="recommendation-warning"><LockKeyhole size={15}/> Recommendations are guidance only. No action is executed on your system.</div><label className="status-control">Update demo status<select value={selected.status} onChange={e=>updateStatus(selected.id,e.target.value)}><option>New</option><option>Investigating</option><option>Contained</option><option>Resolved</option></select></label></div></div>
        </section>
        <footer className="console-footer"><span><Command size={14}/> CyberShield AI</span><span>Educational prototype · Simulated data only</span><span>© 2026</span></footer>
      </div>
    </main>
    {toast&&<div className="toast" role="status"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

export default function App() {
  return <Routes><Route path="/" element={<Landing/>}/><Route path="/console" element={<ConsolePage/>}/><Route path="*" element={<NotFound/>}/></Routes>;
}
function NotFound(){return <div className="not-found"><Logo/><h1>Page not found</h1><p>This page does not exist in the demo.</p><Link className="button button-primary" to="/">Back to homepage</Link></div>;}