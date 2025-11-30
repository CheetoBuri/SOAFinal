#!/bin/bash

# Cafe POS System - Start Script
# Usage: ./start.sh or bash start.sh

set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║   ☕ Cafe POS System - Docker Runner ☕       ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✓ Docker found"
echo ""

# Determine the command
COMMAND="${1:-up}"

case $COMMAND in
    "up")
        echo "🚀 Starting Cafe POS System..."
        echo ""
        docker-compose up --build
        ;;
    "down")
        echo "⛔ Stopping Cafe POS System..."
        docker-compose down
        echo "✓ Stopped"
        ;;
    "restart")
        echo "🔄 Restarting Cafe POS System..."
        docker-compose restart
        echo "✓ Restarted"
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose logs -f
        ;;
    "shell")
        echo "🔧 Opening shell..."
        docker-compose exec cafe-pos bash
        ;;
    "clean")
        echo "🧹 Cleaning up..."
        docker-compose down -v
        echo "✓ Cleaned"
        ;;
    *)
        echo "Usage: ./start.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up        - Start the system (default)"
        echo "  down      - Stop the system"
        echo "  restart   - Restart the system"
        echo "  logs      - Show logs"
        echo "  shell     - Open shell in container"
        echo "  clean     - Remove containers and volumes"
        ;;
esac
