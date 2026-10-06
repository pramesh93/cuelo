const MAX_BYTES = 44 + 16000 * 2 * 20;

export function validateQuestionAudio(audio: ArrayBuffer): number {
  if (audio.byteLength < 44 + 1600 * 2 || audio.byteLength > MAX_BYTES) {
    throw new Error("Speak for between 0.1 and 20 seconds. Longer audio is not accepted.");
  }
  const view = new DataView(audio);
  const text = (offset: number, count: number) => String.fromCharCode(...new Uint8Array(audio, offset, count));
  if (text(0,4) !== "RIFF" || text(8,4) !== "WAVE" || text(12,4) !== "fmt " || text(36,4) !== "data" ||
      view.getUint32(4,true) !== audio.byteLength - 8 || view.getUint32(16,true) !== 16 ||
      view.getUint16(20,true) !== 1 || view.getUint16(22,true) !== 1 || view.getUint32(24,true) !== 16000 ||
      view.getUint32(28,true) !== 32000 || view.getUint16(32,true) !== 2 || view.getUint16(34,true) !== 16 ||
      view.getUint32(40,true) !== audio.byteLength - 44 || (audio.byteLength - 44) % 2 !== 0) {
    throw new Error("The microphone audio could not be read. Try speaking again in desktop Chrome.");
  }
  return (audio.byteLength - 44) / 32000;
}
