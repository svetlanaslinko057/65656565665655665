"""
BlockView Backend - Supervisor Compatibility Layer

❌ Python backend REMOVED (January 2025)
✅ TypeScript backend is the ONLY execution layer

This file exists ONLY for supervisor/uvicorn compatibility.
It launches TypeScript on port 8002 and proxies requests from 8001.

ALL business logic is in TypeScript:
- Bootstrap Worker, Resolver, Indexers, Attribution, ENS, WebSocket
"""

import os
import subprocess
import asyncio
import atexit
import httpx
from pathlib import Path
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
import websockets

ROOT_DIR = Path(__file__).parent
TS_PORT = 8002
TS_URL = f"http://127.0.0.1:{TS_PORT}"

ts_process = None
http_client = None

app = FastAPI(title="BlockView Proxy", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def cleanup():
    global ts_process
    if ts_process:
        ts_process.terminate()
        try:
            ts_process.wait(timeout=5)
        except:
            ts_process.kill()

atexit.register(cleanup)

@app.on_event("startup")
async def startup():
    global ts_process, http_client
    
    env = os.environ.copy()
    env['PORT'] = str(TS_PORT)
    env['MONGODB_URI'] = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/blockview')
    env['NODE_ENV'] = os.environ.get('NODE_ENV', 'development')
    env['LOG_LEVEL'] = os.environ.get('LOG_LEVEL', 'info')
    env['WS_ENABLED'] = os.environ.get('WS_ENABLED', 'true')
    env['CORS_ORIGINS'] = os.environ.get('CORS_ORIGINS', '*')
    env['INDEXER_ENABLED'] = os.environ.get('INDEXER_ENABLED', 'false')
    
    if os.environ.get('INFURA_RPC_URL'):
        env['INFURA_RPC_URL'] = os.environ.get('INFURA_RPC_URL')
    
    if os.environ.get('ANKR_RPC_URL'):
        env['ANKR_RPC_URL'] = os.environ.get('ANKR_RPC_URL')
    
    if os.environ.get('TELEGRAM_BOT_TOKEN'):
        env['TELEGRAM_BOT_TOKEN'] = os.environ.get('TELEGRAM_BOT_TOKEN')
    
    tsx = str(ROOT_DIR / 'node_modules' / '.bin' / 'tsx')
    server = str(ROOT_DIR / 'src' / 'server.ts')
    
    print("=" * 60)
    print("BlockView Backend")
    print("❌ Python logic REMOVED — this is only a proxy")
    print("✅ TypeScript is the ONLY execution layer")
    print("=" * 60)
    
    ts_process = subprocess.Popen([tsx, server], cwd=str(ROOT_DIR), env=env)
    http_client = httpx.AsyncClient(timeout=60.0)
    await asyncio.sleep(3)

@app.on_event("shutdown")
async def shutdown():
    global http_client
    cleanup()
    if http_client:
        await http_client.aclose()

# Proxy all API requests to TypeScript
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    url = f"{TS_URL}/{path}"
    if request.url.query:
        url += f"?{request.url.query}"
    
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ('host', 'content-length')}
    
    try:
        resp = await http_client.request(
            method=request.method,
            url=url,
            content=body or None,
            headers=headers,
        )
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers={k: v for k, v in resp.headers.items() if k.lower() not in ('transfer-encoding', 'connection')},
        )
    except httpx.ConnectError:
        return JSONResponse(status_code=503, content={"error": "Backend starting..."})

# WebSocket proxy
@app.websocket("/ws")
async def ws_proxy(websocket: WebSocket):
    await websocket.accept()
    try:
        async with websockets.connect(f"ws://127.0.0.1:{TS_PORT}/ws") as ts_ws:
            async def to_client():
                async for msg in ts_ws:
                    await websocket.send_text(msg)
            async def to_backend():
                while True:
                    data = await websocket.receive_text()
                    await ts_ws.send(data)
            await asyncio.gather(to_client(), to_backend(), return_exceptions=True)
    except:
        pass
    finally:
        try:
            await websocket.close()
        except:
            pass
