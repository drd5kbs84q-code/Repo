// Helper to decode base64 to byte array
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Global AudioContext singleton to prevent mobile resource limits
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!globalAudioCtx) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            globalAudioCtx = new AudioContext({ sampleRate: 24000 });
        }
    }
    // Resume context if suspended (common on mobile)
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().catch(e => console.warn(e));
    }
    return globalAudioCtx;
};

// Decode raw PCM data (from Gemini) to AudioBuffer
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Main function to play PCM audio from base64 string
export async function playPCMAudio(base64String: string) {
  try {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const bytes = decodeBase64(base64String);
    const buffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    return new Promise((resolve) => {
      source.onended = resolve;
    });
  } catch (error) {
    console.error("Error playing audio", error);
  }
}