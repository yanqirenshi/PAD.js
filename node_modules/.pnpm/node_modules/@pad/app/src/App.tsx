import { useEffect, useState, useRef, useCallback } from 'react'
import './App.css'
import init, { parse_rust_code } from '../../../backend/pkg/backend'
import { parse_js_code, D3PadRenderer } from '@pad/core'
import type { PadNode } from '@pad/core'

type Language = 'rust' | 'javascript';

const PANEL_MIN_WIDTH = 222;
const PANEL_MAX_WIDTH = 555;
const PANEL_DEFAULT_WIDTH = 333;

function App() {
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

  const handleParse = () => {
    try {
      let result = "";
      if (language === 'rust') {
        result = parse_rust_code(inputCode);
      } else {
        result = parse_js_code(inputCode);
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
  }

  return (
    <>
      {/* フローティング入力パネル */}
      <div style={{
        position: 'fixed',
        top: '20px',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        width: `${panelWidth}px`,
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden'
      }}>
        <div style={{ marginBottom: '10px', textAlign: 'left' }}>
          <label style={{ marginRight: '10px' }}>言語:</label>
          <select value={language} onChange={handleLanguageChange} style={{ padding: '5px' }}>
            <option value="rust">Rust</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          style={{ width: '100%', fontFamily: 'monospace', boxSizing: 'border-box', flex: 1, resize: 'none' }}
        />
        <div style={{ margin: '10px 0' }}>
          <button onClick={handleParse}>変換 & 描画</button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {/* リサイズハンドル */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '6px',
            height: '100%',
            cursor: 'ew-resize',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        />
      </div>

      {/* 全画面SVG表示エリア */}
      {padNode && (
        <D3PadRenderer node={padNode} />
      )}
    </>
  )
}

export default App
