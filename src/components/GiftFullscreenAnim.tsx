import { useEffect, useState } from "react";

type GiftAnimProps = {
  emoji: string;
  giftName: string;
  senderName: string;
  onDone: () => void;
};

export function GiftFullscreenAnim({ emoji, giftName, senderName, onDone }: GiftAnimProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 2400);
    const t2 = setTimeout(onDone, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[120] pointer-events-none flex items-end justify-center pb-32 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Blurred glow behind gift */}
      <div
        className="absolute bottom-28 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-40 gradient-electric"
        style={{ animationDuration: "2s" }}
      />

      {/* Main gift card */}
      <div className="relative flex flex-col items-center animate-scale-in">
        {/* Emoji */}
        <div
          className="text-[90px] leading-none mb-3 drop-shadow-[0_0_24px_oklch(0.74_0.27_350/0.7)]"
          style={{
            animation: "float-bounce 0.6s ease-in-out infinite alternate",
          }}
        >
          {emoji}
        </div>

        {/* Gift info card */}
        <div className="glass-strong rounded-2xl px-5 py-3 text-center border border-white/15 shadow-card">
          <p className="font-bold text-base text-gradient">{giftName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            from <span className="text-white font-semibold">@{senderName}</span>
          </p>
        </div>

        {/* Star burst particles */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <span
            key={deg}
            className="absolute text-lg pointer-events-none"
            style={{
              transform: `rotate(${deg}deg) translateY(-70px)`,
              opacity: 0.7,
              animation: `float-up 1.2s ease-out ${deg * 3}ms forwards`,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      <style>{`
        @keyframes float-bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
