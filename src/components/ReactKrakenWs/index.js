import { useEffect, useMemo, useRef, useState } from "react";

export const ReactKrakenTickersObject = {
  'BTC/USD': undefined,
  'ETH/USD': undefined,
  'SOL/USD': undefined,
}

export default function ReactKrakenWs() {
  const [isPaused, setPause] = useState(false);
  const [tickers, setTickers] = useState(ReactKrakenTickersObject);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket("wss://ws.kraken.com/v2");
    ws.current.onopen = () => {
      console.log("ws opened");

      const amin = ws.current.send(
        JSON.stringify({
          method: 'subscribe',
          params: {
            channel: 'ticker',
            symbol: Object.keys(ReactKrakenTickersObject),
          },
        }),
      );

      console.log("amin", amin);
    };
    ws.current.onclose = () => console.log("ws closed");

    const wsCurrent = ws.current;

    return () => {
      wsCurrent.close();
    };
  }, []);

  useEffect(() => {
    if (!ws.current) return;

    ws.current.onmessage = e => {
      if (isPaused) return;

      const message = JSON.parse(e.data);

      if (message.channel === 'ticker' && ['update', 'snapshot'].includes(message.type)) {
        try {
          let nextTickers = { ...tickers };

          message.data.forEach(t => { nextTickers[t.symbol] = t.last });

          setTickers(nextTickers);
        } catch (error) {
          console.error('Failed iterating tickers update entries: ', error)
        }
      }
    };
  }, [isPaused, tickers]);

  let tagsTickers = useMemo(() => {
    return Object.keys(tickers).map(ticker => (
      <li key={ticker}>
        <span>{ticker}</span>
        <span style={{ cursor: 'text' }}>
          {tickers[ticker] ?? 'Loading...'}
        </span>
      </li>
    ));
  }, [tickers]);

  return (
    <div>
      <button onClick={() => setPause(!isPaused)}>
        {isPaused ? "Resume" : "Pause"}
      </button>
      <div>
        <ul>
          {tagsTickers}
        </ul>
      </div>
    </div>
  );
}
