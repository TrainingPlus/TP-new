import React, { useEffect, useState } from 'react';

export default function AppFooter() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <footer className="bg-footer text-footer-foreground text-center py-2 text-xs fixed bottom-0 left-0 w-full z-30">
      <p>{dateStr} &nbsp;|&nbsp; {timeStr}</p>
    </footer>
  );
}
