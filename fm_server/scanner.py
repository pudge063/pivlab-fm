# app/scanner.py
from pathlib import Path

import mutagen
from sqlalchemy.orm import Session
from typing_extensions import Any

from .database import SessionLocal
from .models import Music

AUDIO_EXTENSIONS = {".mp3", ".flac", ".m4a", ".ogg", ".wav"}


def get_audio_files(music_dir: str) -> list[Path]:
    audio_files: list[Path] = []
    music_path = Path(music_dir)

    for file_path in music_path.rglob("*"):
        print(file_path)
        if file_path.suffix.lower() in AUDIO_EXTENSIONS:
            audio_files.append(file_path)

    return audio_files


def extract_metadata(
    file_path: Path,
) -> dict[str, Any] | None:
    try:
        audio = mutagen.File(file_path)  # type: ignore
        duration = int(audio.info.length) if audio.info else 0  # type: ignore

        filename = file_path.stem

        artist, title = filename.split("-")

        # title = file_path.stem

        return {
            "title": title,
            "artist": artist or "Unknown",
            "duration": duration,
            "file_path": str(file_path.absolute()),
        }
    except Exception as e:
        print(f"❌ reading error {file_path}: {e}")
        return None


def scan_library(music_dir: str, db: Session):
    print(f"🔍 scanning: {music_dir}")

    audio_files = get_audio_files(music_dir)
    print(f"📊 found audio: {len(audio_files)}")

    new_tracks = 0
    for file_path in audio_files:
        existing = (
            db.query(Music).filter(Music.file_path == str(file_path.absolute())).first()
        )

        if existing:
            continue

        metadata = extract_metadata(file_path)
        if not metadata:
            continue

        track = Music(
            title=metadata["title"],
            artist=metadata["artist"],
            file_path=metadata["file_path"],
            duration=metadata["duration"],
            rating=0,
            play_count=0,
        )

        db.add(track)
        new_tracks += 1
        print(f"  + {metadata['artist']} - {metadata['title']}")

    db.commit()
    print(f"✅ added new files: {new_tracks}")
    return new_tracks


def scan_and_print(music_dir: str):
    db = SessionLocal()
    try:
        scan_library(music_dir, db)
    finally:
        db.close()
