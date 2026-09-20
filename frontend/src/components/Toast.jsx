import { useState, useEffect, useCallback } from 'react';

let _dispatch = null;

export const toast = {
  success: (msg, duration = 3500) => _dispatch?.({ type: 'success', msg, duration }),
  error:   (msg, duration = 4000) => _dispatch?.({ type: 'error',   msg, duration }),
  info:    (msg, duration = 3500) => _dispatch?.({ type: 'info',    msg, duration }),
};

const icons = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{color:'#22c55e',width:18,height:18}}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{color:'#ef4444',width:18,height:18}}>
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{color:'#c9a84c',width:18,height:18}}>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
    </svg>
  ),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    _dispatch = ({ type, msg, duration }) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, type, msg }]);
      setTimeout(() => remove(id), duration);
    };
    return () => { _dispatch = null; };
  }, [remove]);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{icons[t.type]}</span>
          <span style={{flex:1}}>{t.msg}</span>
          <button
            onClick={() => remove(t.id)}
            style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:16,lineHeight:1,padding:'0 0 0 8px'}}
          >×</button>
        </div>
      ))}
    </div>
  );
}
