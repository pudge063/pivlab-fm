# Pivlab FM

Personal music streaming server for home network.

## Features

- 🎵 Stream music directly in browser
- 📋 Smart queue with rating-based playback
- 👍 Like/dislike affects track frequency
- 📱 Responsive web interface
- 🔍 Search through your library
- 🐳 Docker support

## Quick Start

### Docker

```bash
docker-compose up -d
```

Open `http://localhost:80`

## Project Structure

```
pivlab-fm/
├── backend/          # FastAPI application
├── static/           # Frontend (HTML, CSS, JS)
├── library/          # Your music files
└── data/             # SQLite database
```

## API Endpoints

- `GET /api/tracks` — list all tracks
- `GET /api/next` — get next track
- `POST /api/tracks/{id}/like` — like track
- `POST /api/tracks/{id}/dislike` — dislike track
- `GET /stream/{id}` — stream track
- `POST /scan` — scan music library

## License

MIT
