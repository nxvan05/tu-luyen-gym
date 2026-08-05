"use client";

const EVENTS = [
  { emoji: "🔥", title: "Thiên Địa Dị Hỏa", text: "Ngươi nhặt được một ngọn lửa lạ bên đường — nó hơi nóng trong tay, rồi vụt tắt." },
  { emoji: "🧙", title: "Cao nhân ẩn thế", text: "Một lão nhân râu bạc nhìn ngươi rồi gật đầu: 'Căn cốt cũng khá.' Rồi biến mất." },
  { emoji: "📜", title: "Bí tịch rách nát", text: "Trong góc phòng gym, ngươi thấy nửa trang bí tịch 'Thái Hư Kiếm Quyết'. Chữ đã mờ." },
  { emoji: "🍑", title: "Linh quả rơi", text: "Một quả đào tiên rơi ngay trước mặt — ngươi ăn thử, vị ngọt kỳ lạ, linh khí khẽ động." },
  { emoji: "🐢", title: "Linh thú thần bí", text: "Một con rùa cổ xưa bò ngang, liếc ngươi một cái rồi tiếp tục bò. Có lẽ nó biết gì đó." },
  { emoji: "⛰️", title: "Linh mạch lộ ra", text: "Ngươi cảm thấy dưới lòng đất có linh mạch đang chảy — mơ hồ, nhưng có thật." },
  { emoji: "🌙", title: "Nguyệt Hoa hạ lâm", text: "Đêm nay nguyệt hoa tràn xuống đất — tu luyện thêm chút nữa thì tốt." },
  { emoji: "💧", title: "Tẩy lễ thanh tuyền", text: "Một dòng suối trong vắt hiện ra giữa sân tập. Tắm qua, tinh thần tỉnh táo lạ thường." },
  { emoji: "🎋", title: "Trúc lâm thông đạo", text: "Ngươi mơ thấy một rừng trúc vô tận, gió lùa qua từng ống trúc nghe như đạo âm." },
  { emoji: "💎", title: "Linh thạch vụn", text: "Nhặt được mảnh linh thạch vỡ dưới ghế tập — nhỏ thôi, nhưng lành lạnh như ngọc." },
  { emoji: "🦅", title: "Tiên hạc bay qua", text: "Một con hạc trắng bay ngang bầu trời, để lại một chiếc lông — giữ lại nhé." },
  { emoji: "🗿", title: "Pháp tướng hiện ảnh", text: "Trên tường phản chiếu bóng một lão tiên nhân — ngươi quay lại thì không thấy ai." },
];

function dailyIndex(size: number): number {
  const seed = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const ch of seed) {
    h = (h * 31 + ch.charCodeAt(0)) % 9973;
  }
  return h % size;
}

export function KyNgo() {
  const event = EVENTS[dailyIndex(EVENTS.length)];

  return (
    <div className="card-glow relative overflow-hidden rounded-2xl border border-accent/25 bg-accent/5 p-4">
      <div className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-accent/15 blur-2xl animate-pop-glow" />
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
        ✨ Kỳ Ngộ hôm nay
      </p>
      <div className="mt-2 flex items-start gap-3">
        <span className="animate-float text-3xl">{event.emoji}</span>
        <div>
          <p className="text-sm font-bold">{event.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{event.text}</p>
        </div>
      </div>
    </div>
  );
}
