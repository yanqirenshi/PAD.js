import { useEffect, useState } from 'react'
import './App.css'
import init, { parse_rust_code } from '../../backend/pkg/backend'
import { PadRenderer } from './components/PadRenderer';
import { D3PadRenderer } from './components/D3PadRenderer';
// Force reload trigger
import { calculateLayout } from './utils/layout';
import type { PadNode } from './types'

function App() {
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
  const [rendererType, setRendererType] = useState<'css' | 'svg'>('svg')

  useEffect(() => {
    init()
  }, [])

  const handleParse = () => {
    try {
      const result = parse_rust_code(inputCode)
      const parsed: PadNode = JSON.parse(result)
      setPadNode(parsed)
      setError(null)
    } catch (e) {
      setError(`Error: ${e}`)
    }
  }

  return (
    <div className="card">
      <h1>Rust to PAD Parser & Renderer</h1>
      <textarea
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        rows={10}
        style={{ width: '100%', fontFamily: 'monospace' }}
      />
      <br />
      <div style={{ margin: '10px 0' }}>
        <button onClick={handleParse} style={{ marginRight: '10px' }}>Parse & Render</button>
        <label>
          Renderer:
          <select
            value={rendererType}
            onChange={(e) => setRendererType(e.target.value as 'css' | 'svg')}
            style={{ marginLeft: '5px', padding: '5px' }}
          >
            <option value="css">CSS (Flexbox)</option>
            <option value="svg">SVG (D3-like)</option>
          </select>
        </label>
      </div>

      <div className="pad-container-wrapper" style={{ marginTop: '20px', padding: '10px', overflowX: 'auto' }}>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {padNode && (
          rendererType === 'css' ? (
            <div className="pad-container">
              <PadRenderer node={padNode} />
            </div>
          ) : (
            <D3PadRenderer node={padNode} />
          )
        )}
      </div>
    </div>
  )
}

export default App
