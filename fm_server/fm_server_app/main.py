import random
from datetime import datetime, UTC
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import asc, nullsfirst
from fastapi.responses import StreamingResponse
from typing_extensions import Any

from .database import get_db, engine
from .models import Music, init_db
from .scanner import scan_and_print
from .config import MUSIC_PATH

init_db(engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Pivlab FM"}


@app.post("/api/scan")
def scan_library():
    scan_and_print(MUSIC_PATH)
    return {"status": "scan completed"}


@app.get("/api/tracks")
def get_tracks(db: Session = Depends(get_db)):
    tracks = db.query(Music).all()
    db.close()
    return tracks


@app.get("/api/stream/{track_id}")
async def stream_track(track_id: int, request: Request, db: Session = Depends(get_db)):
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
def get_next_track(db: Session = Depends(get_db)) -> dict[str, Any]:
    # pool = db.query(Music).order_by(nullsfirst(Music.last_played.asc())).limit(20).all()

    # if not pool:
    #     raise HTTPException(
    #         status_code=404, detail="No tracks found. Please scan library first."
    #     )

    pool = db.query(Music)
    track: Music = random.choice(pool)

    track.last_played = datetime.now(UTC)
    track.play_count += 1
    db.commit()
    db.refresh(track)

    return {
        "id": track.id,
        "title": track.title,
        "artist": track.artist,
        "duration": track.duration,
        "play_count": track.play_count,
        "last_played": track.last_played.isoformat() if track.last_played else None,
        "rating": track.rating or 0,
    }


@app.get("/api/info")
def get_info(db: Session = Depends(get_db)):
    try:
        count = db.query(Music).count()
        return {"tracks_count": count}
    finally:
        db.close()
