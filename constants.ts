export const TOPICS = [
  "Kinh doanh & Khởi nghiệp", "Du lịch & Khám phá", "Ẩm thực & Văn hóa", "Công nghệ AI & IT", "Sức khỏe & Y khoa", 
  "Giáo dục & Đào tạo", "Môi trường & Trái đất", "Đời sống & Xã hội", "Chính trị & Ngoại giao", "Nghệ thuật & Điện ảnh", 
  "Khoa học & Vũ trụ", "Thể thao & Fitness", "Luật pháp & Pháp lý", "Tài chính & Đầu tư", "Tâm lý học"
];

export const LEVELS = ["A1 (Căn bản)", "A2 (Sơ cấp)", "B1 (Trung cấp)", "B2 (Trung cao)", "C1 (Cao cấp)", "C2 (Thành thạo)", "IELTS Band 6.0+", "IELTS Band 7.0+", "IELTS Band 8.0+", "TOEIC 500-700", "TOEIC 700-900"];

export const WORD_COUNTS = [5, 10, 15, 20];

// Improved Sound Engine using Web Audio API for Zero Latency
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.error(e));
  }
  return audioCtx;
};

export const playSound = (type: 'success' | 'error' | 'click' | 'pop') => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;

    if (type === 'success') {
      // Modern "Success" chime (Sine wave arpeggio)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'error') {
      // Soft "Error" thud (Triangle wave)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click') {
      // UI Click (High frequency blip)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // Pop (Bubble sound)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    // Fail silently in restricted environments
  }
};