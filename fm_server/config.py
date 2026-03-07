import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

MUSIC_PATH = os.getenv("MUSIC_PATH", "/library/music")
DB_PATH = os.getenv("DB_PATH", "/data/music.db")

Path(MUSIC_PATH).mkdir(parents=True, exist_ok=True)
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
