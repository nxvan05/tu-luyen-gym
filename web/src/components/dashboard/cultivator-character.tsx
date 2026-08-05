"use client";

/**
 * Nhân vật tu sĩ 2D vẽ bằng SVG thuần — không cần asset.
 * Đổi màu đạo bào theo cảnh giới, đổi pose theo hoạt động.
 */

export type CharPose = "idle" | "train" | "meditate" | "sleep";

const ROBE_TIERS = [
  { robe: "#94a3b8", dark: "#64748b", name: "Luyện Khí" },
  { robe: "#3b82f6", dark: "#1d4ed8", name: "Trúc Cơ" },
  { robe: "#14b8a6", dark: "#0f766e", name: "Kim Đan" },
  { robe: "#eab308", dark: "#a16207", name: "Nguyên Anh" },
  { robe: "#f97316", dark: "#c2410c", name: "Hóa Thần" },
  { robe: "#ef4444", dark: "#b91c1c", name: "Hợp Thể" },
  { robe: "#a855f7", dark: "#7e22ce", name: "Đại Thừa" },
  { robe: "#f8fafc", dark: "#cbd5e1", name: "Độ Kiếp" },
  { robe: "#fde047", dark: "#ca8a04", name: "Chân Tiên" },
];

export function robeTier(level: number) {
  return ROBE_TIERS[Math.min(ROBE_TIERS.length - 1, Math.floor(level / 10))];
}

const STYLE = `
  .char-body, .char-head, .char-arm-l, .char-arm-r { transition: transform .45s ease; }
  .pose-idle .char-body { animation: tlg-breathe 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
  @keyframes tlg-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
  .pose-train .char-arm-r { animation: tlg-punch .55s ease-in-out infinite; transform-origin: 50% 12%; }
  .pose-train .char-arm-l { transform: rotate(-12deg); transform-origin: 50% 12%; }
  @keyframes tlg-punch { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(-74deg); } }
  .pose-meditate .char-body { transform: translateY(26px) scaleY(.92); transform-origin: 50% 100%; }
  .pose-meditate .char-arm-l { transform: rotate(-60deg); transform-origin: 50% 12%; }
  .pose-meditate .char-arm-r { transform: rotate(60deg); transform-origin: 50% 12%; }
  .pose-meditate .char-head { transform: translateY(10px); }
  .pose-sleep .char-head { transform: rotate(7deg) translateY(2px); }
  .char-aura { animation: tlg-aura 2.4s ease-in-out infinite; }
  @keyframes tlg-aura { 0%,100% { opacity: .22; } 50% { opacity: .5; } }
`;

interface Props {
  level: number;
  pose: CharPose;
}

export function CultivatorCharacter({ level, pose }: Props) {
  const tier = robeTier(level);
  const silver = level >= 70;
  const hair = silver ? "#e2e8f0" : "#1e293b";
  const awake = pose === "idle" || pose === "train";

  return (
    <div className={`relative h-full ${pose === "sleep" ? "pose-sleep" : pose === "train" ? "pose-train" : pose === "meditate" ? "pose-meditate" : "pose-idle"}`}>
      <svg viewBox="0 0 120 150" className="h-full w-auto drop-shadow-[0_0_14px_oklch(0.82_0.14_85/25%)]">
        <style>{STYLE}</style>

        {pose === "meditate" && (
          <ellipse className="char-aura" cx="60" cy="96" rx="38" ry="15" fill={tier.robe} />
        )}

        <ellipse cx="60" cy="143" rx="26" ry="5" fill="rgba(0,0,0,.28)" />

        {/* chân trong tà áo */}
        <g className="char-body">
          <path d="M38 74 L82 74 L88 118 Q60 129 32 118 Z" fill={tier.robe} stroke={tier.dark} strokeWidth="2" />
          <path d="M43 116 Q60 124 77 116 L79 128 Q60 134 41 128 Z" fill={tier.dark} />
          <rect x="36" y="67" width="48" height="7" rx="3.5" fill="#d4a017" />
          <circle cx="60" cy="70.5" r="3.6" fill="#f59e0b" />
          <path d="M52 58 L60 69 L68 58 L60 63 Z" fill={tier.dark} />
        </g>

        {/* tay */}
        <g className="char-arm-l">
          <rect x="37" y="70" width="12" height="36" rx="6" fill={tier.robe} stroke={tier.dark} strokeWidth="2" />
          <circle cx="43" cy="108" r="5.5" fill="#e8b48c" />
        </g>
        <g className="char-arm-r">
          <rect x="71" y="70" width="12" height="36" rx="6" fill={tier.robe} stroke={tier.dark} strokeWidth="2" />
          <circle cx="77" cy="108" r="5.5" fill="#e8b48c" />
        </g>

        {/* đầu */}
        <g className="char-head">
          <circle cx="60" cy="40" r="17" fill={hair} />
          <circle cx="60" cy="45" r="13.5" fill="#e8b48c" />
          <circle cx="60" cy="22" r="6" fill={hair} />
          <rect x="56" y="27" width="8" height="5" rx="2" fill="#d4a017" />
          <rect x="47" y="37" width="26" height="5" rx="2.5" fill="#dc2626" />
          {awake ? (
            <>
              <circle cx="54.5" cy="46" r="1.9" fill="#1e293b" />
              <circle cx="65.5" cy="46" r="1.9" fill="#1e293b" />
              <path d="M56 53 q4 3 8 0" stroke="#1e293b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M51 46 q3.5 3.5 7 0" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M62 46 q3.5 3.5 7 0" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </>
          )}
        </g>
      </svg>
      {pose === "sleep" && (
        <span className="animate-twinkle absolute -top-1 right-1 text-sm text-white/70">💤</span>
      )}
    </div>
  );
}
