import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { 
  BarChart2, Home, Upload, History, Bookmark, LayoutTemplate, 
  HelpCircle, BookOpen, Settings, Search, Sun, Moon, Plus, FileSpreadsheet, 
  CheckCircle2, TrendingUp, PieChart, AlertTriangle, Users,
  CheckCircle, Loader2, Send, Download, Share2, Save, Edit2, Trash2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './index.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [threadId, setThreadId] = useState(() => {
    const saved = localStorage.getItem('excelmind_threads')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length > 0) return parsed[0].id
    }
    return crypto.randomUUID()
  })
  const [filePath, setFilePath] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [appState, setAppState] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [matchingThreadIds, setMatchingThreadIds] = useState(null)
  
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])
  
  // Track threads (chats)
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem('excelmind_threads')
    if (saved) return JSON.parse(saved)
    return [{id: threadId, name: 'New Analysis'}]
  })
  
  // Save threads to localStorage
  useEffect(() => {
    localStorage.setItem('excelmind_threads', JSON.stringify(threads))
  }, [threads])
  
  // Track agent progress
  const [agentProgress, setAgentProgress] = useState({
    inspector: 'pending',
    planner: 'pending',
    coder: 'pending',
    visualizer: 'pending',
    insight: 'pending'
  })

  // Search threads via backend API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingThreadIds(null)
      return
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        const threadIds = threads.map(t => t.id)
        const response = await axios.post('http://localhost:8000/api/search', {
          query: searchQuery,
          thread_ids: threadIds
        })
        setMatchingThreadIds(response.data.matching_threads)
      } catch (error) {
        console.error("Failed to search threads", error)
      }
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery, threads])

  const fetchState = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/state/${threadId}`)
      setAppState(response.data)
    } catch (error) {
      console.error("Failed to fetch state", error)
    }
  }

  useEffect(() => {
    if (currentScreen === 'workspace') {
      fetchState()
    }
  }, [currentScreen, threadId])

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <BarChart2 size={24} />
          <span>ExcelMind AI</span>
        </div>

        <button className="new-analysis-btn" onClick={() => {
          const newId = crypto.randomUUID()
          setThreadId(newId)
          setThreads([{id: newId, name: 'New Analysis'}, ...threads])
          setFilePath(null)
          setAppState(null)
          setCurrentScreen('upload')
        }}>
          <Plus size={18} />
          New Analysis
        </button>

        <div className="nav-links" style={{marginTop: 24}}>
          <div className="search-bar" style={{margin: '0 12px 12px 12px', background: 'var(--surface-color)', padding: '6px 12px'}}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{fontSize: '0.85rem'}}
            />
          </div>
          <div style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, padding: '0 12px', textTransform: 'uppercase'}}>Recent Chats</div>
          {threads.filter(t => 
            matchingThreadIds === null ? 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) : 
            (matchingThreadIds.includes(t.id) || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map(t => (
            <div 
              key={t.id} 
              className={`nav-item ${threadId === t.id && currentScreen === 'workspace' ? 'active' : ''}`} 
              onClick={() => {
                if (threadId !== t.id || currentScreen !== 'workspace') {
                  setAppState(null)
                  setThreadId(t.id)
                  setCurrentScreen('workspace')
                }
              }}
              style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px', overflow: 'hidden'}}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap'}}>
                <FileSpreadsheet size={18} style={{flexShrink: 0}} /> 
                <span style={{textOverflow: 'ellipsis', overflow: 'hidden'}}>{t.name}</span>
              </div>
              
              <div style={{display: 'flex', gap: '4px', flexShrink: 0}}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    const newName = prompt("Rename chat:", t.name)
                    if (newName) setThreads(threads.map(th => th.id === t.id ? {...th, name: newName} : th))
                  }}
                  style={{background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', opacity: 0.7}}
                  title="Rename"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm("Delete this chat?")) {
                      const newThreads = threads.filter(th => th.id !== t.id)
                      setThreads(newThreads)
                      if (threadId === t.id && newThreads.length > 0) {
                         setAppState(null)
                         setThreadId(newThreads[0].id)
                         setCurrentScreen('workspace')
                      } else if (newThreads.length === 0) {
                         const newId = crypto.randomUUID()
                         setThreadId(newId)
                         setThreads([{id: newId, name: 'New Analysis'}])
                         setAppState(null)
                         setCurrentScreen('upload')
                      }
                    }
                  }}
                  style={{background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', opacity: 0.7}}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="agent-status-panel">
          <div className="agent-status-title">Multi-Agent Intelligence</div>
          <div className="agent-list">
            <div className="agent-item">
              <div className="agent-dot dot-router"></div> Router
            </div>
            <div className="agent-item">
              <div className={`agent-dot ${agentProgress.inspector === 'progress' ? 'animate-pulse' : ''}`} style={{backgroundColor: agentProgress.inspector === 'completed' ? 'var(--primary)' : 'var(--agent-inspector)'}}></div> Data Inspector
            </div>
            <div className="agent-item">
              <div className={`agent-dot ${agentProgress.planner === 'progress' ? 'animate-pulse' : ''}`} style={{backgroundColor: agentProgress.planner === 'completed' ? 'var(--primary)' : 'var(--agent-planner)'}}></div> Planner
            </div>
            <div className="agent-item">
              <div className={`agent-dot ${agentProgress.coder === 'progress' ? 'animate-pulse' : ''}`} style={{backgroundColor: agentProgress.coder === 'completed' ? 'var(--primary)' : 'var(--agent-coder)'}}></div> Coding Agent
            </div>
            <div className="agent-item">
              <div className={`agent-dot ${agentProgress.insight === 'progress' ? 'animate-pulse' : ''}`} style={{backgroundColor: agentProgress.insight === 'completed' ? 'var(--primary)' : 'var(--agent-insight)'}}></div> Insight Agent
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar" style={{justifyContent: 'flex-end', position: 'relative'}}>
          <div className="user-profile" style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              style={{background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex'}}
            >
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div 
              className="avatar" 
              onClick={() => setShowProfile(!showProfile)}
              style={{cursor: 'pointer'}}
            >H</div>
          </div>
          
          {showProfile && (
            <div style={{
              position: 'absolute', top: 60, right: 20, 
              background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', 
              borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100, minWidth: 250
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
                <div className="avatar" style={{width: 40, height: 40}}>H</div>
                <div>
                  <div style={{fontWeight: 600}}>Harsh Patel</div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>harshpatel080503@gmail.com</div>
                </div>
              </div>
              <div style={{height: 1, background: 'var(--border-color)', margin: '12px 0'}}></div>
              <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer'}}>Sign Out</div>
            </div>
          )}
        </header>

        <div className="content-area">
          {currentScreen === 'home' && <HomeDashboard setScreen={setCurrentScreen} />}
          {currentScreen === 'upload' && (
            <UploadScreen 
              setFilePath={setFilePath} 
              isUploading={isUploading} 
              setIsUploading={setIsUploading}
              onUploadSuccess={(fileName) => {
                setThreads(threads.map(t => t.id === threadId ? {...t, name: fileName} : t))
                setCurrentScreen('workspace')
              }}
            />
          )}
          {currentScreen === 'workspace' && (
            <WorkspaceScreen 
              filePath={filePath}
              threadId={threadId} 
              appState={appState}
              fetchState={fetchState}
              agentProgress={agentProgress}
              setAgentProgress={setAgentProgress}
            />
          )}


        </div>
      </main>
    </div>
  )
}

function HomeDashboard({ setScreen }) {
  return (
    <>
      <div className="hero-section">
        <div className="hero-text">
          <h1>Ask your Excel.<br /><span>Get intelligent insights.</span></h1>
          <p>AI-powered multi-agent analysis for deeper insights, faster decisions.</p>
          <div className="action-buttons">
            <button className="btn-primary" onClick={() => setScreen('upload')}>
              <Upload size={18} /> Upload Excel
            </button>
            <button className="btn-secondary">Try an Example</button>
          </div>
        </div>
      </div>
      <h2 className="section-title">Explore what you can analyze</h2>
      <div className="explore-grid">
        <div className="explore-card">
          <div className="explore-icon" style={{backgroundColor: '#EFF6FF', color: '#3B82F6'}}><TrendingUp /></div>
          <h3>Analyze sales trends</h3>
          <p>Find trends and patterns</p>
        </div>
        <div className="explore-card">
          <div className="explore-icon" style={{backgroundColor: '#ECFDF5', color: '#10B981'}}><PieChart /></div>
          <h3>Compare regions</h3>
          <p>Compare performance</p>
        </div>
        <div className="explore-card">
          <div className="explore-icon" style={{backgroundColor: '#FEF2F2', color: '#EF4444'}}><AlertTriangle /></div>
          <h3>Find anomalies</h3>
          <p>Detect unusual patterns</p>
        </div>
        <div className="explore-card">
          <div className="explore-icon" style={{backgroundColor: '#F5F3FF', color: '#8B5CF6'}}><Users /></div>
          <h3>Segment customers</h3>
          <p>Group and analyze</p>
        </div>
      </div>
    </>
  )
}

function UploadScreen({ setFilePath, isUploading, setIsUploading, onUploadSuccess }) {
  const fileInputRef = useRef(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData)
      setFilePath(response.data.file_path)
      setIsUploading(false)
      onUploadSuccess(file.name)
    } catch (error) {
      console.error("Upload failed", error)
      setIsUploading(false)
      alert("Failed to upload file")
    }
  }

  return (
    <>
      <h2 className="section-title" style={{fontSize: '2rem'}}>Upload your workbook</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '32px'}}>Drag and drop your Excel file here or browse your computer.</p>
      
      <div className="upload-container">
        <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{display: 'none'}} 
            accept=".csv,.xlsx,.xls"
          />
          <FileSpreadsheet size={64} className="upload-icon" />
          <h3 style={{marginBottom: 8}}>{isUploading ? "Uploading..." : "Drop your file here"}</h3>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24}}>.xlsx, .xls, .xlsm, .csv (Max 50MB)</p>
          <button className="btn-primary" disabled={isUploading}>{isUploading ? "Please wait" : "Browse Files"}</button>
        </div>
        
        <div className="capabilities-box">
          <h3>What ExcelMind can do</h3>
          <div className="capability-list">
            <div className="capability-item"><CheckCircle2 size={20} /> Understand workbook structure</div>
            <div className="capability-item"><CheckCircle2 size={20} /> Detect missing values</div>
            <div className="capability-item"><CheckCircle2 size={20} /> Analyze trends and patterns</div>
            <div className="capability-item"><CheckCircle2 size={20} /> Generate visualizations</div>
            <div className="capability-item"><CheckCircle2 size={20} /> Build predictive models</div>
            <div className="capability-item"><CheckCircle2 size={20} /> Answer follow-up questions</div>
          </div>
        </div>
      </div>
    </>
  )
}



function WorkspaceScreen({ filePath, threadId, appState, fetchState, agentProgress, setAgentProgress }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [followup, setFollowup] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isAnalyzing = 
    agentProgress.planner === 'progress' || 
    agentProgress.coder === 'progress' || 
    agentProgress.insight === 'progress'

  const handleFollowup = async () => {
    if (!followup.trim()) return
    
    setIsProcessing(true)
    setAgentProgress({
      inspector: 'completed',
      planner: 'progress',
      coder: 'pending',
      visualizer: 'pending',
      insight: 'pending'
    })
    
    try {
      const formData = new URLSearchParams()
      formData.append('prompt', followup)
      formData.append('thread_id', threadId)
      if (filePath) {
        formData.append('file_path', filePath)
      }

      setFollowup('') // clear input

      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let buffer = ''

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          // Look for event completion
          if (buffer.includes('workflow_complete')) {
            fetchState()
            buffer = ''
          } else if (buffer.includes('"node": "planner"')) {
            setAgentProgress(p => ({...p, planner: 'completed', coder: 'progress'}))
            fetchState()
            buffer = ''
          } else if (buffer.includes('"node": "coding_agent"')) {
            setAgentProgress(p => ({...p, coder: 'completed', insight: 'progress'}))
            fetchState()
            buffer = ''
          }
        }
      }
    } finally {
      setIsProcessing(false)
      fetchState()
    }
  }



  const handleExport = () => {
    if (!appState || !appState.messages || appState.messages.length === 0) {
      alert("No analysis data to export yet.");
      return;
    }
    const content = appState.messages.map(m => `### ${m.role.toUpperCase()}\n${m.content}\n`).join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analysis_Export_${threadId.substring(0,8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Analysis link copied to clipboard!");
  };

  const artifacts = appState?.artifacts || []
  const plots = artifacts.filter(a => a.type === 'plot')
  const tables = artifacts.filter(a => a.type === 'table')
  const codeArtifacts = artifacts.filter(a => a.type === 'code')
  
  // Create mock DataFrame preview for Screen 7
  const colNames = appState?.data_context?.summary?.column_names || []
  const types = appState?.data_context?.summary?.column_types || {}

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: 600}}>Analysis Results</h2>
          <span style={{background: '#ECFDF5', color: '#10B981', padding: '4px 12px', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 600}}>
            Completed
          </span>
        </div>
        <div style={{display: 'flex', gap: 12}}>
          <button onClick={() => alert("Analysis saved securely to LocalStorage!")} className="btn-secondary" style={{padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center'}}><Save size={16}/> Save</button>
          <button onClick={handleExport} className="btn-secondary" style={{padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center'}}><Download size={16}/> Export</button>
          <button onClick={handleShare} className="btn-secondary" style={{padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center'}}><Share2 size={16}/> Share</button>
        </div>
      </div>



      <div className="tabs-container">
        <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Data Analysis</div>
        <div className={`tab ${activeTab === 'visualizations' ? 'active' : ''}`} onClick={() => setActiveTab('visualizations')}>Visualizations</div>
        <div className={`tab ${activeTab === 'forecast' ? 'active' : ''}`} onClick={() => setActiveTab('forecast')}>Forecast</div>
        <div className={`tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>Python Code</div>
      </div>

      {activeTab === 'summary' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          {appState?.messages?.map((msg, idx) => (
             <div key={idx} style={{
               background: msg.role === 'user' ? 'var(--surface-color)' : 'var(--sidebar-bg)',
               padding: 24,
               borderRadius: 12,
               border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
               overflowX: 'auto'
             }}>
               <strong style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--primary)'}}>
                 {msg.role === 'user' ? <Sun size={18}/> : <BarChart2 size={18}/>} 
                 {msg.role === 'user' ? 'You' : 'ExcelMind AI'}
               </strong>
               <div className="markdown-body">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
               </div>
             </div>
          ))}
        </div>
      )}

      {activeTab === 'visualizations' && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
          {plots.map((plot, idx) => (
            <div key={idx} style={{background: 'var(--sidebar-bg)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)'}}>
              <h3 style={{marginBottom: 16}}>{plot.description || 'Visualization'}</h3>
              <img src={`http://localhost:8000/plots/${plot.content.split(/[/\\]/).pop()}`} alt="plot" style={{width: '100%', borderRadius: 8, border: '1px solid var(--border-color)'}} />
            </div>
          ))}
          {plots.length === 0 && (
            <div style={{gridColumn: '1 / -1', padding: 48, textAlign: 'center', background: 'var(--sidebar-bg)', borderRadius: 12, border: '1px dashed var(--border-color)'}}>
              <PieChart size={48} style={{color: 'var(--border-color)', margin: '0 auto 16px'}} />
              <h3>No visualizations generated yet.</h3>
              <p style={{color: 'var(--text-secondary)', marginTop: 8}}>Ask a question that requires a chart, like "Plot revenue over time".</p>
            </div>
          )}
        </div>
      )}



      {activeTab === 'forecast' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          {artifacts.filter(a => a.type === 'forecast').length > 0 ? (
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 24}}>
              {artifacts.filter(a => a.type === 'forecast').map((forecast, idx) => (
                <div key={idx} style={{background: 'var(--sidebar-bg)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)'}}>
                  <h3 style={{marginBottom: 16}}>{forecast.description || 'Forecast Result'}</h3>
                  {forecast.content.endsWith('.png') || forecast.content.endsWith('.jpg') || forecast.content.endsWith('.svg') ? (
                    <img src={`http://localhost:8000/plots/${forecast.content.split(/[/\\]/).pop()}`} alt="forecast plot" style={{width: '100%', borderRadius: 8, border: '1px solid var(--border-color)'}} />
                  ) : (
                    <div className="markdown-body" style={{overflowX: 'auto'}}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{forecast.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{background: 'var(--sidebar-bg)', padding: 48, borderRadius: 12, border: '1px dashed var(--border-color)', textAlign: 'center'}}>
              <TrendingUp size={48} style={{color: 'var(--border-color)', margin: '0 auto 16px'}} />
              <h3>Forecast Not Generated</h3>
              <p style={{color: 'var(--text-secondary)', marginTop: 8}}>To generate a forecast, ask the AI a predictive question like:<br/>"Forecast sales for the next 6 months using Prophet."</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'code' && (
        <div style={{background: '#1E293B', color: '#E2E8F0', padding: 24, borderRadius: 12, overflowX: 'auto'}}>
          {codeArtifacts.map((c, i) => (
            <div key={i}>
              <div style={{fontSize: '0.75rem', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase'}}>{c.description || 'Python Execution'}</div>
              <pre style={{margin: 0, fontFamily: 'monospace'}}><code style={{whiteSpace: 'pre-wrap'}}>{c.content}</code></pre>
              {i < codeArtifacts.length -1 && <hr style={{borderColor: '#334155', margin: '24px 0'}}/>}
            </div>
          ))}
          {codeArtifacts.length === 0 && <p>No code artifacts available. Code will appear here when the Coding Agent executes Python.</p>}
        </div>
      )}

      {/* Persistent Chat Input */}
      {true && (
        <div className="chat-input-area">
          <input 
            type="text" 
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
            placeholder="Ask a follow-up question..." 
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleFollowup()}
            disabled={isProcessing}
          />
          <button 
            style={{background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: followup ? 1 : 0.5}}
            onClick={handleFollowup}
            disabled={!followup || isProcessing}
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      )}
    </div>
  )
}

export default App

function HistoryScreen() {
  return (
    <>
      <h2 className='section-title' style={{fontSize: '2rem'}}>Analysis History</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '32px'}}>Review your past AI-driven data explorations.</p>
      
      <div style={{background: 'white', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
          <thead style={{background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)'}}>
            <tr>
              <th style={{padding: '16px 24px', fontWeight: 600}}>Analysis Name</th>
              <th style={{padding: '16px 24px', fontWeight: 600}}>Dataset</th>
              <th style={{padding: '16px 24px', fontWeight: 600}}>Date</th>
              <th style={{padding: '16px 24px', fontWeight: 600}}>Status</th>
              <th style={{padding: '16px 24px', fontWeight: 600, textAlign: 'right'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              {name: 'Q3 Sales Trend Analysis', dataset: 'sales_q3.xlsx', date: 'Oct 1, 2026', status: 'Completed'},
              {name: 'Customer Segmentation', dataset: 'customers.csv', date: 'Sep 28, 2026', status: 'Completed'},
              {name: 'Inventory Forecast', dataset: 'inventory_2026.xlsx', date: 'Sep 25, 2026', status: 'Failed'},
              {name: 'Marketing Campaign ROI', dataset: 'campaign_data.csv', date: 'Sep 20, 2026', status: 'Completed'},
            ].map((item, idx) => (
              <tr key={idx} style={{borderBottom: '1px solid var(--border-color)'}}>
                <td style={{padding: '16px 24px', fontWeight: 500}}>{item.name}</td>
                <td style={{padding: '16px 24px', color: 'var(--text-secondary)'}}>{item.dataset}</td>
                <td style={{padding: '16px 24px', color: 'var(--text-secondary)'}}>{item.date}</td>
                <td style={{padding: '16px 24px'}}>
                  <span style={{
                    padding: '4px 12px', 
                    borderRadius: 100, 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: item.status === 'Completed' ? '#ECFDF5' : '#FEF2F2',
                    color: item.status === 'Completed' ? '#10B981' : '#EF4444'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{padding: '16px 24px', textAlign: 'right'}}>
                  <button style={{background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500}}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

