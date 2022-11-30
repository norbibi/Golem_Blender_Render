import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-input-range/lib/css/index.css';

const container = document.getElementById('root');
const root = createRoot(container!);

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?:string;
  }
}

root.render(
  <App />
);