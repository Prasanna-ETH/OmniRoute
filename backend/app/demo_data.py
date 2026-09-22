import os
import cv2
import json
import uuid
import numpy as np
import subprocess
from datetime import datetime
from pathlib import Path
from app.config import VIDEOS_DIR, FRAMES_DIR, THUMBNAILS_DIR, AUDIO_DIR
from app.core.database import get_connection, init_db
from app.indexing.video_ingest import get_ffmpeg_path
from app.embeddings.embedding_service import embedding_service
from app.retrieval.vector_index import vector_index

def create_demo_video_1(output_path: str, audio_path: str):
    """Generates presentation_battery.mp4: slides with Q4 Battery Savings."""
    width, height, fps, duration = 1280, 720, 24, 25
    total_frames = fps * duration
    temp_video = str(output_path).replace(".mp4", "_temp.mp4")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_video, fourcc, fps, (width, height))

    for f in range(total_frames):
        t = f / fps
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Gradient dark background
        for y in range(height):
            v = int(18 + 12 * (y / height))
            frame[y, :] = (v, v, v + 8)

        # Slide banner
        cv2.rectangle(frame, (60, 40), (width - 60, 110), (32, 35, 45), -1)
        cv2.putText(frame, "iQOO TECH LABS // ARCHITECTURE REVIEW", (80, 85), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (254, 229, 0), 2, cv2.LINE_AA)

        if t < 6.0:
            # Intro slide
            cv2.putText(frame, "PROJECT OMNIROUTE: KEYNOTE 2026", (140, 280),
                        cv2.FONT_HERSHEY_DUPLEX, 1.4, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, "On-Device Neural Efficiency & Multimodal Search", (140, 360),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (180, 190, 205), 2, cv2.LINE_AA)
        elif t < 18.0:
            # THE BATTERY SAVINGS MOMENT (peak at 14s)
            cv2.rectangle(frame, (100, 160), (width - 100, 620), (24, 28, 38), -1)
            cv2.rectangle(frame, (100, 160), (width - 100, 620), (254, 229, 0), 2)
            
            cv2.putText(frame, "Q4 BATTERY SAVINGS", (140, 240),
                        cv2.FONT_HERSHEY_DUPLEX, 1.6, (254, 229, 0), 3, cv2.LINE_AA)
            cv2.putText(frame, "+32% Energy Efficiency across NPU Workloads", (140, 310),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Draw battery icon chart
            cv2.rectangle(frame, (140, 370), (460, 520), (50, 55, 70), -1)
            cv2.rectangle(frame, (150, 380), (380, 510), (0, 220, 120), -1)
            cv2.rectangle(frame, (460, 420), (480, 470), (50, 55, 70), -1)
            cv2.putText(frame, "82% CHARGE SAVINGS", (520, 460),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 220, 120), 2, cv2.LINE_AA)
            cv2.putText(frame, "Measured under continuous AI video indexing", (520, 505),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (160, 170, 185), 1, cv2.LINE_AA)
        else:
            # Summary slide
            cv2.putText(frame, "SYSTEM SUMMARY & BENCHMARKS", (140, 260),
                        cv2.FONT_HERSHEY_DUPLEX, 1.4, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, "Complete privacy - Zero cloud dependencies", (140, 350),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (180, 190, 205), 2, cv2.LINE_AA)

        # Timestamp watermark
        cv2.putText(frame, f"TIME: {t:04.1f}s", (width - 240, height - 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 130, 145), 1, cv2.LINE_AA)
        out.write(frame)

    out.release()

    # Re-encode with ffmpeg to standard H.264 MP4 with silent/tone audio
    ffmpeg_exe = get_ffmpeg_path()
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", temp_video,
        "-f", "lavfi", "-i", f"sine=frequency=440:duration={duration}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest",
        output_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if os.path.exists(temp_video):
        try: os.remove(temp_video)
        except: pass


def create_demo_video_2(output_path: str, audio_path: str):
    """Generates tech_talk_cybersecurity.mp4: speaker talking about cybersecurity."""
    width, height, fps, duration = 1280, 720, 24, 20
    total_frames = fps * duration
    temp_video = str(output_path).replace(".mp4", "_temp.mp4")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_video, fourcc, fps, (width, height))

    for f in range(total_frames):
        t = f / fps
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Deep blue-gray gradient
        for y in range(height):
            v = int(14 + 10 * (y / height))
            frame[y, :] = (v + 12, v + 4, v)

        # Slide header
        cv2.rectangle(frame, (60, 40), (width - 60, 110), (35, 30, 45), -1)
        cv2.putText(frame, "SECURITY SUMMIT 2026 // THREAT INTELLIGENCE", (80, 85), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 229, 255), 2, cv2.LINE_AA)

        if t < 5.0:
            cv2.putText(frame, "SESSION: CLOUD & PERIMETER DEFENSES", (140, 280),
                        cv2.FONT_HERSHEY_DUPLEX, 1.4, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, "Speaker: Principal Security Architect", (140, 360),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (180, 190, 205), 2, cv2.LINE_AA)
        elif t < 15.0:
            # THE CYBERSECURITY MOMENT (at 8s)
            cv2.rectangle(frame, (100, 160), (width - 100, 620), (22, 24, 35), -1)
            cv2.rectangle(frame, (100, 160), (width - 100, 620), (0, 229, 255), 2)

            cv2.putText(frame, "CYBERSECURITY & ENCRYPTED ENCLAVES", (140, 240),
                        cv2.FONT_HERSHEY_DUPLEX, 1.4, (0, 229, 255), 3, cv2.LINE_AA)
            cv2.putText(frame, "Zero-Trust Architecture for Personal Media", (140, 310),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Shield illustration
            cv2.circle(frame, (260, 460), 70, (0, 180, 255), 3)
            cv2.putText(frame, "SHIELD ACTIVE", (370, 450),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 229, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, "AES-256 hardware accelerated key management", (370, 495),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (170, 180, 195), 1, cv2.LINE_AA)
        else:
            cv2.putText(frame, "Q&A AND PRACTICAL RECOMMENDATIONS", (140, 280),
                        cv2.FONT_HERSHEY_DUPLEX, 1.4, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.putText(frame, f"TIME: {t:04.1f}s", (width - 240, height - 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 130, 145), 1, cv2.LINE_AA)
        out.write(frame)

    out.release()

    ffmpeg_exe = get_ffmpeg_path()
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", temp_video,
        "-f", "lavfi", "-i", f"sine=frequency=520:duration={duration}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest",
        output_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if os.path.exists(temp_video):
        try: os.remove(temp_video)
        except: pass


def create_demo_video_3(output_path: str, audio_path: str):
    """Generates outdoor_adventure.mp4: red car at 6s, playful dog at 12s."""
    width, height, fps, duration = 1280, 720, 24, 20
    total_frames = fps * duration
    temp_video = str(output_path).replace(".mp4", "_temp.mp4")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_video, fourcc, fps, (width, height))

    for f in range(total_frames):
        t = f / fps
        frame = np.zeros((height, width, 3), dtype=np.uint8)

        # Sky and ground
        frame[:420, :] = [210, 175, 120]  # Light sky
        frame[420:, :] = [40, 120, 45]    # Green field / road

        if t < 4.0:
            # Park scene
            cv2.putText(frame, "WEEKEND TRIP // HIGHLAND ROAD", (80, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.circle(frame, (1000, 140), 50, (0, 220, 255), -1) # Sun
        elif t < 10.0:
            # VISUAL MOMENT: RED CAR PASSING BY (peak at 6s)
            car_x = int(100 + (t - 4.0) * 160)
            cv2.rectangle(frame, (420, 460), (width, 580), (70, 75, 80), -1) # Asphalt road
            
            # Draw sleek RED CAR
            cv2.rectangle(frame, (car_x, 460), (car_x + 360, 530), (30, 30, 220), -1) # Red body
            cv2.rectangle(frame, (car_x + 60, 410), (car_x + 280, 460), (40, 40, 235), -1) # Cabin
            cv2.rectangle(frame, (car_x + 80, 420), (car_x + 260, 455), (200, 220, 240), -1) # Window
            # Wheels
            cv2.circle(frame, (car_x + 80, 530), 32, (20, 20, 20), -1)
            cv2.circle(frame, (car_x + 280, 530), 32, (20, 20, 20), -1)

            cv2.putText(frame, "RED SPORTS CAR ON COASTAL HIGHWAY", (80, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
        else:
            # VISUAL MOMENT: PLAYFUL DOG RUNNING (peak at 12s)
            dog_x = int(200 + (t - 10.0) * 80)
            # Draw golden retriever representation
            cv2.ellipse(frame, (dog_x + 80, 500), (90, 45), 0, 0, 360, (70, 160, 215), -1) # Golden fur body
            cv2.circle(frame, (dog_x + 180, 460), 35, (70, 160, 215), -1) # Head
            cv2.circle(frame, (dog_x + 195, 455), 6, (10, 10, 10), -1) # Eye
            cv2.ellipse(frame, (dog_x + 205, 470), (12, 8), 0, 0, 360, (10, 10, 10), -1) # Nose
            # Legs
            cv2.line(frame, (dog_x + 40, 530), (dog_x + 30, 580), (70, 160, 215), 14)
            cv2.line(frame, (dog_x + 70, 530), (dog_x + 85, 580), (70, 160, 215), 14)
            cv2.line(frame, (dog_x + 120, 530), (dog_x + 110, 580), (70, 160, 215), 14)
            cv2.line(frame, (dog_x + 150, 530), (dog_x + 165, 580), (70, 160, 215), 14)

            cv2.putText(frame, "GOLDEN RETRIEVER DOG RUNNING IN PARK", (80, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.putText(frame, f"TIME: {t:04.1f}s", (width - 240, height - 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (240, 240, 240), 1, cv2.LINE_AA)
        out.write(frame)

    out.release()

    ffmpeg_exe = get_ffmpeg_path()
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", temp_video,
        "-f", "lavfi", "-i", f"sine=frequency=380:duration={duration}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest",
        output_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if os.path.exists(temp_video):
        try: os.remove(temp_video)
        except: pass


def seed_demo_dataset():
    """
    Creates real demo videos and pre-indexes them into SQLite & LocalVectorIndex.
    Guarantees instant demo experience for hackathon presentation!
    """
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM videos")
    count = cursor.fetchone()["cnt"]
    conn.close()

    if count > 0:
        print("[Demo Data] Existing videos found. Skipping seed.")
        vector_index.load_from_db()
        return

    print("[Demo Data] Generating high-fidelity sample videos and multimodal indexes...")

    # 1. Video 1: presentation_battery.mp4
    v1_id = "demo_video_001"
    v1_path = str(VIDEOS_DIR / "presentation_battery.mp4")
    v1_audio = str(AUDIO_DIR / f"{v1_id}.wav")
    if not os.path.exists(v1_path) or os.path.getsize(v1_path) < 1000:
        create_demo_video_1(v1_path, v1_audio)

    # 2. Video 2: tech_talk_cybersecurity.mp4
    v2_id = "demo_video_002"
    v2_path = str(VIDEOS_DIR / "tech_talk_cybersecurity.mp4")
    v2_audio = str(AUDIO_DIR / f"{v2_id}.wav")
    if not os.path.exists(v2_path) or os.path.getsize(v2_path) < 1000:
        create_demo_video_2(v2_path, v2_audio)

    # 3. Video 3: outdoor_adventure.mp4
    v3_id = "demo_video_003"
    v3_path = str(VIDEOS_DIR / "outdoor_adventure.mp4")
    v3_audio = str(AUDIO_DIR / f"{v3_id}.wav")
    if not os.path.exists(v3_path) or os.path.getsize(v3_path) < 1000:
        create_demo_video_3(v3_path, v3_audio)

    # Now register & index demo video 1
    _index_demo_item(
        video_id=v1_id,
        filename="presentation_battery.mp4",
        path=v1_path,
        duration=25.0,
        transcripts=[
            (2.0, 6.0, "Welcome everyone to our iQOO multimodal architecture review."),
            (11.0, 17.5, "Our new system reduces battery consumption and delivers 32 percent battery savings across on-device workloads."),
            (20.0, 24.5, "This concludes our summary of energy benchmarks and private local indexing.")
        ],
        ocr_moments=[
            (14.0, "Q4 BATTERY SAVINGS - 32% Energy Efficiency across NPU Workloads", [140, 240, 800, 100]),
            (4.0, "PROJECT OMNIROUTE: KEYNOTE 2026", [140, 280, 600, 80]),
            (22.0, "SYSTEM SUMMARY & BENCHMARKS", [140, 260, 600, 80])
        ],
        visual_descriptions=[
            (4.0, "Presentation slide showing keynote title and multimodal search intro"),
            (14.0, "Presentation slide showing battery savings icon and 32% green energy efficiency chart"),
            (22.0, "Presentation slide showing summary benchmarks")
        ]
    )

    # Register & index demo video 2
    _index_demo_item(
        video_id=v2_id,
        filename="tech_talk_cybersecurity.mp4",
        path=v2_path,
        duration=20.0,
        transcripts=[
            (1.0, 5.0, "Today we will examine zero-trust defenses in edge hardware."),
            (7.0, 13.5, "Someone here was asking about cybersecurity threats and encrypted enclaves for private personal video search."),
            (16.0, 19.5, "Hardware isolated keys keep all biometrics and embeddings on device.")
        ],
        ocr_moments=[
            (8.0, "CYBERSECURITY & ENCRYPTED ENCLAVES - Zero-Trust Architecture", [140, 240, 850, 100]),
            (2.0, "SECURITY SUMMIT 2026 // THREAT INTELLIGENCE", [80, 85, 600, 60])
        ],
        visual_descriptions=[
            (2.0, "Security summit keynote opening slide"),
            (8.0, "Cybersecurity slide displaying active security shield and encrypted hardware enclave"),
            (17.0, "Questions and answers recommendation slide")
        ]
    )

    # Register & index demo video 3
    _index_demo_item(
        video_id=v3_id,
        filename="outdoor_adventure.mp4",
        path=v3_path,
        duration=20.0,
        transcripts=[
            (1.0, 4.0, "Taking a nice scenic drive along the coastal highway."),
            (5.5, 9.0, "Look at that fast red car driving down the road!"),
            (11.0, 15.0, "Now the dog is running happily across the open green park.")
        ],
        ocr_moments=[
            (6.0, "RED SPORTS CAR ON COASTAL HIGHWAY", [80, 100, 650, 80]),
            (12.0, "GOLDEN RETRIEVER DOG RUNNING IN PARK", [80, 100, 700, 80])
        ],
        visual_descriptions=[
            (2.0, "Sunny sky and open countryside landscape"),
            (6.0, "Vibrant red sports car cruising on asphalt road"),
            (12.0, "Golden retriever dog playfully running on green grass field")
        ]
    )

    vector_index.load_from_db()
    print("[Demo Data] Successfully seeded 3 videos with multimodal index!")


def _index_demo_item(video_id: str, filename: str, path: str, duration: float, transcripts, ocr_moments, visual_descriptions):
    conn = get_connection()
    cursor = conn.cursor()

    # Generate thumbnail
    thumb_path = THUMBNAILS_DIR / f"{video_id}_thumb.jpg"
    cap = cv2.VideoCapture(path)
    cap.set(cv2.CAP_PROP_POS_MSEC, 2000)
    ret, frame = cap.read()
    if ret and frame is not None:
        cv2.imwrite(str(thumb_path), frame)
    cap.release()

    # Save video metadata
    cursor.execute(
        """
        INSERT INTO videos 
        (id, filename, path, duration, resolution, fps, file_size, thumbnail_path, created_at, is_indexed, indexing_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'completed')
        """,
        (
            video_id, filename, path, duration, "1280x720", 24.0,
            os.path.getsize(path), str(thumb_path), datetime.now().isoformat()
        )
    )

    # Transcripts
    for start, end, text in transcripts:
        tid = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO transcripts (id, video_id, start_time, end_time, text, confidence) VALUES (?, ?, ?, ?, ?, ?)",
            (tid, video_id, start, end, text, 0.96)
        )
        emb = embedding_service.embed_text(text).tolist()
        vector_index.add_vector(f"speech_{tid}", video_id, start, "speech", text, emb, conn=conn)

    # OCR
    for ts, text, bbox in ocr_moments:
        oid = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO ocr_detections (id, video_id, timestamp, text, bbox_json, confidence) VALUES (?, ?, ?, ?, ?, ?)",
            (oid, video_id, ts, text, json.dumps(bbox), 0.98)
        )
        emb = embedding_service.embed_text(text).tolist()
        vector_index.add_vector(f"ocr_{oid}", video_id, ts, "ocr", text, emb, conn=conn)

    # Keyframes & Visual
    for ts, desc in visual_descriptions:
        kid = str(uuid.uuid4())
        frame_path = str(FRAMES_DIR / f"{video_id}_frame_{ts:.1f}.jpg")
        cap = cv2.VideoCapture(path)
        cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000.0)
        ret, frame = cap.read()
        if ret and frame is not None:
            cv2.imwrite(frame_path, frame)
        cap.release()

        cursor.execute(
            "INSERT INTO keyframes (id, video_id, timestamp, frame_path) VALUES (?, ?, ?, ?)",
            (kid, video_id, ts, frame_path)
        )
        # Embed visual concept
        emb = embedding_service.embed_text(desc).tolist()
        vector_index.add_vector(f"visual_{kid}", video_id, ts, "visual", desc, emb, conn=conn)

    conn.commit()
    conn.close()
