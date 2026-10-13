import { useEffect, useRef } from 'react';
import { Game } from './world/render/game';
import { Hud } from './ui/Hud';
import { TimeControls } from './ui/TimeControls';
import { ClonePanel } from './ui/ClonePanel';
import { HoverTag } from './ui/HoverTag';
import { AwayCard } from './ui/AwayCard';

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = new Game();
    game.init(hostRef.current!).catch((e) => console.error('Failed to start Many Me', e));
    return () => game.destroy();
  }, []);

  return (
    <>
      <div ref={hostRef} className="stage" />
      <Hud />
      <ClonePanel />
      <TimeControls />
      <HoverTag />
      <AwayCard />
      <div className="help">drag to pan · scroll to zoom · click a Justin or a room · space to pause</div>
    </>
  );
}
