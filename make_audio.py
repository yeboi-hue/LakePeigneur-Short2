"""Create narration, a restrained original score, sound effects and shot timing.
Requires: edge-tts, numpy, ffmpeg, and espeak-ng as the offline fallback.
"""
import asyncio
import json
import os
import subprocess
import wave
from pathlib import Path

import numpy as np

FPS, SR = 30, 48000
VOICE, RATE = os.getenv("VOICE", "en-US-GuyNeural"), os.getenv("RATE", "-5%")
LINES = [
    "A lake once swallowed an oil rig, eleven barges, and itself. Then it came back as a completely different lake.",
    "November twentieth, nineteen eighty. Lake Peigneur in Louisiana is calm, shallow, and dotted with boats.",
    "But nearly fifteen hundred feet below, a salt mine stretches beneath the lake. Fifty miners are working underground.",
    "Above them, a Texaco drilling crew searches for oil from a platform floating on the water. Then the drill gets stuck.",
    "The crew notices something is badly wrong. Their platform starts tilting, so they scramble to shore just in time.",
    "Then the lake begins spinning. A huge whirlpool opens, and the drilling rig slides toward the growing hole.",
    "The drill has broken into the salt mine. Water pours into the tunnels, flooding the mine and forcing it to close.",
    "The current becomes so powerful that the nearby canal reverses direction, pulling water in from the Gulf of Mexico.",
    "The lake drains away, taking barges, a tugboat, equipment, and part of the shoreline. But all fifty miners escape safely.",
    "Over the next days, the canal refills the basin. Nine barges even rise back to the surface. The lake is now far deeper, and salty.",
]
LEAD, GAP, TAIL, VLEAD = 0.22, 0.20, 1.0, 0.08
ROOT = Path(__file__).resolve().parents[1]
TMP, PUBLIC = ROOT / "tmp", ROOT / "public"
TMP.mkdir(exist_ok=True)
PUBLIC.mkdir(exist_ok=True)


async def edge_voice(index: int, text: str):
    import edge_tts
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(TMP / f"line-{index}.mp3"))


def synth(index: int, text: str) -> Path:
    target = TMP / f"line-{index}.mp3"
    try:
        asyncio.run(edge_voice(index, text))
        return target
    except Exception as exc:
        print(f"edge-tts unavailable ({exc}); using espeak-ng fallback")
        fallback = TMP / f"line-{index}.wav"
        subprocess.run(["espeak-ng", "-s", "180", "-v", "en-us", "-w", str(fallback), text], check=True)
        return fallback


def read_audio(path: Path) -> np.ndarray:
    normalized = TMP / f"{path.stem}-48k.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(path), "-ar", str(SR), "-ac", "1", str(normalized)], check=True)
    with wave.open(str(normalized), "rb") as audio:
        return np.frombuffer(audio.readframes(audio.getnframes()), "<i2").astype(np.float32) / 32768.0


def lowpass(signal: np.ndarray, width: int) -> np.ndarray:
    kernel = np.ones(width, dtype=np.float32) / width
    return np.convolve(np.convolve(signal, kernel, mode="same"), kernel, mode="same").astype(np.float32)


clips = [read_audio(synth(i, line)) for i, line in enumerate(LINES)]
line_starts, cursor = [], LEAD
for clip in clips:
    line_starts.append(cursor)
    cursor += len(clip) / SR + GAP
end_seconds = cursor - GAP + TAIL
sample_count = int(end_seconds * SR)
rng = np.random.default_rng(19801120)
voice = np.zeros(sample_count, dtype=np.float32)
for start, clip in zip(line_starts, clips):
    offset = int(start * SR)
    voice[offset:offset + len(clip)] += clip
voice *= 0.92 / max(1e-8, float(np.max(np.abs(voice))))

# Original atmospheric score: low sustained harmony, a slow pulse, and a restrained high shimmer.
time = np.arange(sample_count, dtype=np.float32) / SR
fade_in = np.minimum(1.0, time / 1.4)
fade_out = np.minimum(1.0, np.maximum(0.0, (end_seconds - time) / 1.5))
score = np.zeros(sample_count, dtype=np.float32)
for freq, gain in [(55.0, 0.34), (82.4, 0.19), (110.0, 0.12), (164.8, 0.055)]:
    score += np.sin(2 * np.pi * freq * time) * gain
pulse = np.maximum(0.0, np.sin(2 * np.pi * 0.72 * time)) ** 7
score += pulse * (0.035 + 0.015 * np.sin(2 * np.pi * 0.08 * time))
noise = lowpass(rng.standard_normal(sample_count).astype(np.float32), 80)
noise /= max(1e-8, float(np.max(np.abs(noise))))
score += noise * 0.018 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.045 * time))
score *= 0.13 * fade_in * fade_out

# Short custom effects: low impact, metallic strain, rushing water and a rising reverse-current sweep.
sfx = np.zeros(sample_count, dtype=np.float32)

def add_sfx(at: float, duration: float, kind: str, gain: float):
    start = int(at * SR)
    count = min(int(duration * SR), sample_count - start)
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float32) / SR
    if kind == "impact":
        wavelet = np.sin(2 * np.pi * (48 - 12 * t) * t) * np.exp(-t * 7.0)
    elif kind == "metal":
        wavelet = (np.sin(2 * np.pi * 430 * t) + 0.5 * np.sin(2 * np.pi * 690 * t)) * np.exp(-t * 4.5)
    elif kind == "water":
        wavelet = lowpass(rng.standard_normal(count).astype(np.float32), 5) * np.sin(np.pi * np.minimum(1, t / max(0.01, duration)))
    else:
        carrier = np.sin(2 * np.pi * (90 + 75 * t / max(0.01, duration)) * t)
        wavelet = (carrier + 0.5 * noise[start:start + count]) * np.sin(np.pi * np.minimum(1, t / max(0.01, duration)))
    wavelet /= max(1e-8, float(np.max(np.abs(wavelet))))
    sfx[start:start + count] += gain * wavelet

add_sfx(line_starts[1] - 0.08, 0.8, "impact", 0.16)
add_sfx(line_starts[3] + 0.65, 1.6, "metal", 0.10)
add_sfx(line_starts[5] + 0.15, 3.5, "water", 0.12)
add_sfx(line_starts[6] + 0.2, 4.0, "riser", 0.10)
add_sfx(line_starts[7] + 0.15, 3.0, "water", 0.08)

mix = voice + score + sfx
peak = max(1e-8, float(np.max(np.abs(mix))))
mix *= min(1.0, 0.96 / peak)
with wave.open(str(PUBLIC / "narration.wav"), "wb") as out:
    out.setnchannels(1)
    out.setsampwidth(2)
    out.setframerate(SR)
    out.writeframes((mix * 32767).astype("<i2").tobytes())

frame_starts = [0] + [max(1, int(round((sec - VLEAD) * FPS))) for sec in line_starts[1:]]
total_frames = int(round(end_seconds * FPS))
(PUBLIC / "timing.json").write_text(json.dumps({"fps": FPS, "starts": frame_starts + [total_frames], "total": total_frames, "audio": "narration.wav"}, indent=2))
print(f"Audio ready: {end_seconds:.2f}s, {total_frames} frames, {len(LINES)} timed story beats")
print("Shot starts:", frame_starts)
