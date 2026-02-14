import random
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing_extensions import Any

from .database import SessionLocal
from .models import Music, init_db
from .scanner import scan_and_print

# from fastapi.staticfiles import StaticFiles


init_db()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

unique_counter = 0

# app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {"message": "Pivlab FM"}


@app.post("/api/scan")
def scan_library():
    scan_and_print("../library/music")
    return {"status": "scan completed"}


@app.get("/api/tracks")
def get_tracks():
    db = SessionLocal()
    tracks = db.query(Music).all()
    db.close()
    return tracks


@app.get("/api/stream/{track_id}")
async def stream_track(track_id: int, request: Request):
    db = SessionLocal()
    try:
        track = db.query(Music).filter(Music.id == track_id).first()

        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        file_path = Path(track.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")

        file_size = file_path.stat().st_size
        range_header = request.headers.get("range")

        headers = {
            "Accept-Ranges": "bytes",
            "Content-Type": "audio/mpeg",
            "X-Content-Duration": str(track.duration),
        }

        # if Range request
        if range_header:
            # parsing Range header
            range_values = range_header.replace("bytes=", "").split("-")
            start = int(range_values[0])
            end = int(range_values[1]) if range_values[1] else file_size - 1

            if start >= file_size or end >= file_size:
                return StreamingResponse(
                    content="Range Not Satisfiable", status_code=416, headers=headers
                )

            # reading part of file
            def iterfile():
                with open(file_path, "rb") as f:
                    f.seek(start)
                    remaining = end - start + 1
                    while remaining > 0:
                        chunk_size = min(64 * 1024, remaining)
                        data = f.read(chunk_size)
                        if not data:
                            break
                        yield data
                        remaining -= len(data)

            # part-content headers
            headers.update(
                {
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Content-Length": str(end - start + 1),
                }
            )

            return StreamingResponse(
                iterfile(),
                status_code=206,  # Partial Content
                headers=headers,
                media_type="audio/mpeg",
            )

        # in no range - let full file
        headers["Content-Length"] = str(file_size)

        def iterfile():
            with open(file_path, "rb") as f:
                yield from f

        return StreamingResponse(iterfile(), headers=headers, media_type="audio/mpeg")

    finally:
        db.close()


@app.get("/api/next")
def get_next_track() -> dict[str, Any]:
    global unique_counter
    unique_counter += 1

    db = SessionLocal()
    try:
        if unique_counter % 8 == 0:
            unplayed_tracks: list[Music] = (
                db.query(Music).filter(Music.last_played.is_(None)).all()
            )

            if unplayed_tracks:
                tracks = unplayed_tracks
            else:
                tracks = db.query(Music).all()
        else:
            tracks = db.query(Music).all()

        if not tracks:
            raise HTTPException(
                status_code=404, detail="No tracks found. Please scan library first."
            )

        if len(tracks) == 1:
            track = tracks[0]
        else:
            # sorting by last_played (oldest - first)
            # never played tracks (last_played = None) on list start
            sorted_tracks = sorted(tracks, key=lambda t: t.last_played or datetime.min)

            available_tracks: list[Music] = sorted_tracks[:-1]

            weights: list[float] = []

            for track in available_tracks:
                # weight = 1 + (rating/10). rating from -10 to 10
                # minimal weight 0.1 for very low raiting
                weight: float = 1 + (track.rating / 10)
                if weight <= 0:
                    weight = 0.1  # non zero weight
                weights.append(weight)
            track = random.choices(available_tracks, weights=weights)[0]

        # track: Music = random.choice(tracks)  # type: ignore

        track.play_count = (track.play_count or 0) + 1  # type: ignore
        track.last_played = datetime.now()  # type: ignore

        db.commit()
        db.refresh(track)

        return {
            "id": track.id,
            "title": track.title,
            "artist": track.artist,
            "duration": track.duration,
            "play_count": track.play_count,
            "last_played": track.last_played.isoformat() if track.last_played else None,  # type: ignore
            "rating": track.rating or 0,
        }
    finally:
        db.close()


@app.post("/api/tracks/{track_id}/like")
def like_track(track_id: int) -> dict[str, Any]:
    db = SessionLocal()
    try:
        track: Music | None = db.query(Music).filter(Music.id == track_id).first()
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        track.rating += 1 if track.rating < 10 else 0  # type: ignore
        db.commit()

        return {"id": track.id, "rating": track.rating, "action": "like"}
    finally:
        db.close()


@app.post("/api/tracks/{track_id}/dislike")
def dislike_track(track_id: int) -> dict[str, Any]:
    db = SessionLocal()
    try:
        track = db.query(Music).filter(Music.id == track_id).first()
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        track.rating -= 1 if track.rating > -10 else 0  # type: ignore
        db.commit()

        return {"id": track.id, "rating": track.rating, "action": "dislike"}
    finally:
        db.close()


@app.get("/api/info")
def get_info():
    db = SessionLocal()
    try:
        count = db.query(Music).count()
        return {"tracks_count": count}
    finally:
        db.close()
