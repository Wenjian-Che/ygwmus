export async function createRealtimeVoiceSession({ mode, localVoice, cloudVoice }) {
  if (mode === "wake") return { provider: "local", session: localVoice.createSession({ mode }) };
  if (cloudVoice.status().asr.available) {
    try {
      return { provider: "tencent", session: await cloudVoice.createRecognitionSession(), fallback: false };
    } catch (error) {
      console.warn("Tencent realtime ASR connection unavailable; using local fallback:", error.providerCode || error.code || error.message);
      return { provider: "local", session: localVoice.createSession({ mode }), fallback: true };
    }
  }
  return { provider: "local", session: localVoice.createSession({ mode }), fallback: false };
}
