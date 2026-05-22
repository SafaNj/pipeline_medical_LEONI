import React from 'react';

const Icon = ({ name, size = 20 }) => {
  const paths = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    list: <><line x1="8" y1="6" x2="21" y2="6" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /><line x1="8" y1="12" x2="21" y2="12" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /><line x1="8" y1="18" x2="21" y2="18" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /><circle cx="3" cy="6" r="1.2" fill="currentColor" /><circle cx="3" cy="12" r="1.2" fill="currentColor" /><circle cx="3" cy="18" r="1.2" fill="currentColor" /></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" /><circle cx="9" cy="7" r="4" strokeWidth="1.5" fill="none" stroke="currentColor" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" /></>,
    folder: <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /><polyline points="16 17 21 12 16 7" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /></>,
    check: <polyline points="20 6 9 17 4 12" strokeWidth="2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /></>,
    search: <><circle cx="11" cy="11" r="8" strokeWidth="1.5" fill="none" stroke="currentColor" /><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /></>,
    stethoscope: <><path d="M4.5 9.5a5.5 5.5 0 0011 0v-3a1 1 0 00-1-1h-9a1 1 0 00-1 1v3z" strokeWidth="1.5" fill="none" stroke="currentColor" /><path d="M10 9.5V17a4 4 0 008 0v-1" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" /><circle cx="18" cy="16" r="1.5" fill="currentColor" /></>,
    clock: <><circle cx="12" cy="12" r="10" strokeWidth="1.5" fill="none" stroke="currentColor" /><polyline points="12 6 12 12 16 14" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" /></>,
    chevronRight: <polyline points="9 18 15 12 9 6" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    trash: <><polyline points="3 6 5 6 21 6" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></>,
    syringe: <><path d="M18 2l4 4-4 4" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 6l6 6" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" /><path d="M11 9L3 17l2 2 8-8" strokeWidth="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /><line x1="9" y1="11" x2="7" y2="13" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /><line x1="11" y1="13" x2="9" y2="15" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
};

export default Icon;
