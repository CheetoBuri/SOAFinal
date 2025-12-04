# 🐳 Docker Deployment Guide

## Prerequisites
- Docker Desktop installed on macOS
- Docker Desktop running
- Project files ready

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

**Build and run with one command:**
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
docker-compose up -d
```

**Wait a few seconds, then open:**
```
http://localhost:3000
```

**Stop the container:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

---

### Option 2: Manual Docker Commands

**Build the image:**
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
docker build -t cafe-ordering:latest .
```

**Run the container:**
```bash
docker run -d \
  --name cafe-ordering \
  -p 3000:3000 \
  -e GMAIL_ADDRESS=huynhnhattien0411@gmail.com \
  -e GMAIL_PASSWORD=rqdbmyhpfglksotn \
  -v $(pwd)/cafe_orders.db:/app/cafe_orders.db \
  -v $(pwd)/backups:/app/backups \
  cafe-ordering:latest
```

**Stop the container:**
```bash
docker stop cafe-ordering
```

**View logs:**
```bash
docker logs -f cafe-ordering
```

---

## 📊 Check Container Status

**See running containers:**
```bash
docker ps
```

**See all containers (including stopped):**
```bash
docker ps -a
```

**See images:**
```bash
docker images
```

---

## 🔧 Common Docker Desktop Operations

### Access Docker Desktop UI:
1. Open **Docker Desktop** app (Applications → Docker)
2. Click "Containers" tab
3. Find "cafe-ordering-system"
4. Click to see logs and status

### View container logs in Docker Desktop:
- Right-click container → View logs
- Or click container name → see logs in bottom panel

### Stop/Start/Remove:
- Right-click container → Stop/Start/Remove
- Or use terminal commands

---

## ✅ Verify Container is Running

**Check health:**
```bash
curl http://localhost:3000/health
```

Should see:
```json
{"status":"online","message":"Cafe API is running"}
```

**Check if port 3000 is listening:**
```bash
lsof -i :3000
```

---

## 🗂️ Files Involved

```
.
├── Dockerfile              ← Container image definition
├── docker-compose.yml      ← Docker Compose config
├── app.py                 ← Backend
├── index.html             ← Frontend entry
├── frontend/              ← Frontend assets (CSS/JS)
├── schema.sql             ← Database schema
├── .env                   ← Environment variables
├── requirements.txt       ← Python dependencies
└── cafe_orders.db         ← SQLite database (persisted)
```

---

## 📝 What docker-compose.yml does:

1. **Build:** Creates Docker image from Dockerfile
2. **Run:** Starts container with:
   - Port mapping: 3000:3000
   - Environment variables (Gmail config)
   - Volume mounts (database persistence)
   - Health check
   - Auto-restart policy
3. **Network:** Creates isolated network for services

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill local process
lsof -i :3000 | xargs kill -9

# Or use different port in docker-compose.yml
# Change: "3000:3000" to "3001:3000"
```

### "Container exits immediately"
```bash
# View detailed logs
docker-compose logs cafe-ordering

# Or check container logs
docker logs cafe-ordering-system
```

### "Cannot connect to Docker daemon"
- Make sure Docker Desktop is running
- Click Docker icon → Open Docker Desktop

### "File not found in container"
- Ensure files are in correct directory
- Use absolute paths or `$(pwd)`

---

## 📚 Useful Commands

```bash
# Build image
docker build -t cafe-ordering:latest .

# Run container
docker run -d -p 3000:3000 cafe-ordering:latest

# View running containers
docker ps

# View container logs
docker logs container_name

# Stop container
docker stop container_name

# Remove container
docker rm container_name

# Remove image
docker rmi cafe-ordering:latest

# Compose operations
docker-compose up -d      # Start
docker-compose down       # Stop & remove
docker-compose logs -f    # View logs
docker-compose ps         # Status
```

---

## ✨ Benefits of Docker Deployment

✅ Works same everywhere (macOS, Linux, Windows)
✅ No need to install Python dependencies locally
✅ Easy to share (send Dockerfile + code)
✅ Easy to scale
✅ Clean separation of concerns
✅ Can run multiple containers
✅ Environment is isolated

---

## 🎯 Next Steps

1. **Build:** `docker-compose up -d`
2. **Verify:** Open http://localhost:3000
3. **Check logs:** `docker-compose logs -f`
4. **Stop:** `docker-compose down`

---

**Ready to deploy on Docker! 🚀**
