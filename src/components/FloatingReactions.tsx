import { useEffect, useRef, useState } from "react";

type Particle = { id: number; emoji: string; x: number };

type FloatingReactionsProps = {
  incomingEmoji: string | null;
  onReact?: (emoji: string) => void;
};

const REACTION_EMOJIS = ["❤️", "🔥", "👑", "😍", "💯", "🎉"];

export function FloatingReactions({ incomingEmoji, onReact }: FloatingReactionsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const counter = useRef(0);

  const spawnParticle = (emoji: string) => {
    const id = ++counter.current;
    const x  = 15 + Math.random() * 65;
    setParticles((p) => [...p, { id, emoji, x }]);
    setTimeout(() => setParticles((p) => p.filter((pt) => pt.id !== id)), 2200);
  };

  useEffect(() => {
    if (incomingEmoji) spawnParticle(incomingEmoji);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingEmoji]);

  const handleTap = (emoji: string) => {
    spawnParticle(emoji);
    onReact?.(emoji);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleTap(emoji)}
            className="h-10 w-10 flex-shrink-0 rounded-full glass text-xl grid place-items-center active:scale-75 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Floating particles — fixed overlay above everything */}
      <div className="fixed inset-0 pointer-events-none z-[115] overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute bottom-28 text-2xl animate-float-up select-none"
            style={{ left: `${p.x}%` }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </>
  );
}
