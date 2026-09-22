import os
import subprocess
from pathlib import Path
from app.config import VIDEOS_DIR, AUDIO_DIR
from app.indexing.video_ingest import get_ffmpeg_path

def generate_speech_audio(text_segments: list, duration: float, output_wav: str):
    """
    Generates a full audio WAV track with real spoken English voices
    at exact timestamps using Windows built-in SpeechSynthesizer.
    """
    temp_files = []
    ffmpeg_exe = get_ffmpeg_path()
    
    # 1. Generate individual segment wavs via PowerShell SAPI
    for i, (ts, text) in enumerate(text_segments):
        seg_wav = str(Path(output_wav).parent / f"temp_seg_{i}.wav")
        clean_seg_wav = seg_wav.replace("\\", "/")
        clean_text = text.replace('"', '`"')
        
        ps_cmd = (
            'Add-Type -AssemblyName System.Speech; '
            '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; '
            f'$synth.SetOutputToWaveFile("{clean_seg_wav}"); '
            f'$synth.Speak("{clean_text}"); '
            '$synth.Dispose();'
        )
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        temp_files.append((ts, seg_wav))

    # 2. Build filter_complex to mix them into a silent background of exact duration
    inputs = ["-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo"]
    filter_parts = []
    
    for idx, (ts, wav_path) in enumerate(temp_files):
        inputs.extend(["-i", wav_path])
        delay_ms = int(ts * 1000)
        filter_parts.append(f"[{idx+1}:a]adelay={delay_ms}|{delay_ms}[a{idx+1}];")

    mix_inputs = "".join([f"[a{i+1}]" for i in range(len(temp_files))])
    filter_str = "".join(filter_parts) + f"[0:a]{mix_inputs}amix=inputs={len(temp_files)+1}:duration=first:dropout_transition=2[outa]"

    cmd = [
        ffmpeg_exe, "-y",
        *inputs,
        "-filter_complex", filter_str,
        "-map", "[outa]",
        "-t", str(duration),
        "-c:a", "pcm_s16le",
        output_wav
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Clean up temp segment files
    for _, seg_wav in temp_files:
        try: os.remove(seg_wav)
        except: pass

def upgrade_demo_videos():
    ffmpeg_exe = get_ffmpeg_path()
    
    # 1. Video 1: presentation_battery.mp4
    v1_video = str(VIDEOS_DIR / "presentation_battery.mp4")
    v1_audio = str(AUDIO_DIR / "demo_video_001.wav")
    v1_segments = [
        (2.0, "Welcome everyone to our iQOO multimodal architecture review."),
        (11.0, "Our new system reduces battery consumption and delivers 32 percent battery savings across on-device workloads."),
        (20.0, "This concludes our summary of energy benchmarks and private local indexing.")
    ]
    print("Generating real speech audio for Video 1...")
    generate_speech_audio(v1_segments, 25.0, v1_audio)
    
    temp_v1 = v1_video.replace(".mp4", "_remux.mp4")
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", v1_video,
        "-i", v1_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        temp_v1
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    os.replace(temp_v1, v1_video)

    # 2. Video 2: tech_talk_cybersecurity.mp4
    v2_video = str(VIDEOS_DIR / "tech_talk_cybersecurity.mp4")
    v2_audio = str(AUDIO_DIR / "demo_video_002.wav")
    v2_segments = [
        (1.0, "Today we will examine zero-trust defenses in edge hardware."),
        (7.0, "Someone here was asking about cybersecurity threats and encrypted enclaves for private personal video search."),
        (16.0, "Hardware isolated keys keep all biometrics and embeddings on device.")
    ]
    print("Generating real speech audio for Video 2...")
    generate_speech_audio(v2_segments, 20.0, v2_audio)
    
    temp_v2 = v2_video.replace(".mp4", "_remux.mp4")
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", v2_video,
        "-i", v2_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        temp_v2
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    os.replace(temp_v2, v2_video)

    # 3. Video 3: outdoor_adventure.mp4
    v3_video = str(VIDEOS_DIR / "outdoor_adventure.mp4")
    v3_audio = str(AUDIO_DIR / "demo_video_003.wav")
    v3_segments = [
        (1.0, "Taking a nice scenic drive along the coastal highway."),
        (5.5, "Look at that fast red car driving down the road!"),
        (11.0, "Now the dog is running happily across the open green park.")
    ]
    print("Generating real speech audio for Video 3...")
    generate_speech_audio(v3_segments, 20.0, v3_audio)
    
    temp_v3 = v3_video.replace(".mp4", "_remux.mp4")
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", v3_video,
        "-i", v3_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        temp_v3
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    os.replace(temp_v3, v3_video)

    print("[SUCCESS] All 3 demo videos now have real spoken English audio tracks!")

if __name__ == "__main__":
    upgrade_demo_videos()
