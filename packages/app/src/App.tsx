import { useEffect, useState, useRef, useCallback } from 'react'
import './App.css'
import init, { parse_rust_code } from '../../../backend/pkg/backend'
import { parse_js_code, D3PadRenderer } from '@pad/core'
import type { PadNode } from '@pad/core'

import { GitHubPanel } from './components/GitHubPanel';

import { Box, Paper, Tabs, Tab, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

type Language = 'rust' | 'javascript';

const PANEL_MIN_WIDTH = 222;
const PANEL_MAX_WIDTH = 555;
const PANEL_DEFAULT_WIDTH = 333;

function App() {
  const [mode, setMode] = useState<'manual' | 'github'>('manual');
  const [language, setLanguage] = useState<Language>('rust');
  const [inputCode, setInputCode] = useState<string>(`fn main() {
    let i = 0;
    while i < 3 {
        print!("Count: {}", i);
        i = i + 1;
    }
    greet();
}

fn greet() {
    print!("Hello from function!");
}`)
  const [padNode, setPadNode] = useState<PadNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);
  const isResizing = useRef(false);

  useEffect(() => {
    init()
  }, [])

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - 20; // 20px is the left margin
    setPanelWidth(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, newWidth)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const lang = e.target.value as Language;
    setLanguage(lang);
    if (lang === 'javascript') {
      setInputCode(`function main() {
    let i = 0;
    while (i < 3) {
        console.log("Count: " + i);
        i++;
    }
    greet();
}

function greet() {
    console.log("Hello from JS!");
}`);
    } else {
      setInputCode(`fn main() {
    let i = 0;
    while i < 3 {
        print!("Count: {}", i);
        i = i + 1;
    }
    greet();
}

fn greet() {
    print!("Hello from function!");
}`);
    }
  };

  const processCode = (code: string, lang: Language) => {
    try {
      let result = "";
      if (lang === 'rust') {
        result = parse_rust_code(code);
      } else {
        result = parse_js_code(code);
      }

      const parsed: PadNode = JSON.parse(result)
      if (parsed.type === 'error') {
        setError(parsed.message);
        setPadNode(null);
      } else {
        setPadNode(parsed);
        setError(null);
      }
    } catch (e) {
      setError(`Error: ${e}`)
      setPadNode(null);
    }
  };

  const handleManualParse = () => {
    processCode(inputCode, language);
  }

  const handleModeChange = (event: React.SyntheticEvent, newValue: 'manual' | 'github') => {
    setMode(newValue);
  };

  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '6px',
    height: '100%',
    cursor: 'ew-resize',
    backgroundColor: 'transparent',
    zIndex: 1
  };

  return (
    <>
      {/* フローティング入力パネル */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          top: 20,
          bottom: 20,
          left: 20,
          zIndex: 1000,
          padding: 2,
          borderRadius: 2,
          width: panelWidth,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(5px)'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={mode} onChange={handleModeChange} aria-label="mode tabs" variant="fullWidth">
            <Tab label="手動入力" value="manual" />
            <Tab label="GitHub" value="github" />
          </Tabs>
        </Box>

        {mode === 'manual' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <Box sx={{ mb: 2, mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="language-select-label">言語</InputLabel>
                <Select
                  labelId="language-select-label"
                  value={language}
                  label="言語"
                  onChange={handleLanguageChange}
                >
                  <MenuItem value="rust">Rust</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              multiline
              minRows={10}
              variant="outlined"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              sx={{
                flex: 1,
                fontFamily: 'monospace',
                '& .MuiInputBase-root': {
                  height: '100%',
                  alignItems: 'flex-start',
                  fontFamily: 'monospace'
                }
              }}
              InputProps={{
                style: { fontFamily: 'monospace' }
              }}
            />

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleManualParse}
              >
                変換 & 描画
              </Button>
            </Box>
          </Box>
        ) : (
          <GitHubPanel onFileSelect={(code, lang) => {
            processCode(code, lang);
          }} />
        )}

        {error && <Box sx={{ color: 'error.main', mt: 2, fontSize: '0.875rem' }}>{error}</Box>}

        {/* リサイズハンドル */}
        <div
          onMouseDown={handleMouseDown}
          style={resizeHandleStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        />
      </Paper>

      {/* 全画面SVG表示エリア */}
      {padNode && (
        <D3PadRenderer node={padNode} />
      )}
    </>
  )
}

export default App
