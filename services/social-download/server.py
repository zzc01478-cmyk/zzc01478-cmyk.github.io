"""Same-origin, single-video gateway for an unmodified, pinned MeTube checkout."""

import argparse
import asyncio
import contextlib
import hashlib
import json
import math
import os
from pathlib import Path
import re
import resource
import signal
import socket
import subprocess
import time
from urllib.parse import parse_qs, urlsplit, urlunsplit

from aiohttp import ClientError, ClientSession, ClientTimeout, web

PIN = "6708a882294a6e8c5ffe097354c7eee42eb0f309"
PARSER_PIN = "5fcf87256edb5ffcdebf0e4aac2a5a41745da76e"
ROOT = Path(__file__).resolve().parents[2]
PREFIX = "/tools/social-download/"
API = PREFIX + "api/"
TTL = 24 * 3600
MAX_FILE = 500 * 1024**2
MAX_CACHE = 2 * 1024**3
MAX_ACTIVE = 6
MAX_SECONDS = 600
PLATFORMS = {
    "抖音": ("douyin.com", "iesdouyin.com"),
    "TikTok": ("tiktok.com",),
    "Instagram": ("instagram.com",),
    "YouTube": ("youtube.com", "youtu.be"),
    "小红书": ("xiaohongshu.com", "xhslink.com", "rednote.com"),
    "X": ("x.com", "twitter.com"),
}
MEDIA = {".mp4", ".webm", ".mkv", ".mov"}


class Problem(Exception):
    def __init__(self, message, status=400):
        self.message, self.status = message, status


def normalize(text):
    if not isinstance(text, str) or len(text) > 4096:
        raise Problem("分享文字过长，请只粘贴一条视频链接。")
    links = re.findall(r"https?://[^\s<>\"'，。！？；（）【】]+", text)
    links = list(dict.fromkeys(link.rstrip(".,;!?)\\]}>") for link in links))
    if len(links) != 1:
        raise Problem("请粘贴一条完整的 http 或 https 视频链接，一次只处理一条。")
    try:
        url = urlsplit(links[0])
        host = (url.hostname or "").lower()
        if url.username or url.password or url.port not in (None, 80, 443):
            raise ValueError()
    except ValueError:
        raise Problem("链接包含不支持的账号、端口或地址格式。") from None
    platform = next((name for name, domains in PLATFORMS.items()
                     if any(host == d or host.endswith("." + d) for d in domains)), None)
    if not platform or "\\" in links[0] or "%" in url.netloc:
        raise Problem("仅接受抖音、TikTok、Instagram、YouTube、小红书和 X 的视频链接。")
    path = url.path.rstrip("/")
    queries = parse_qs(url.query)
    patterns = {
        "抖音": r"/(?:video|note)/\d+|/share/(?:video|slides)/\d+",
        "TikTok": r"/@[^/]+/video/\d+|/t/[^/]+",
        "Instagram": r"/(?:p|reel|reels|tv)/[^/]+",
        "YouTube": r"/(?:shorts|embed)/[A-Za-z0-9_-]{11}",
        "小红书": r"/(?:explore|discovery/item)/[A-Za-z0-9]+",
        "X": r"/[^/]+/status/\d+(?:/video/\d+)?",
    }
    short_host = host in ("v.douyin.com", "vm.tiktok.com", "vt.tiktok.com", "xhslink.com", "www.xhslink.com")
    is_video = bool(re.fullmatch(patterns[platform], path))
    if platform == "YouTube":
        is_video = is_video or (host == "youtu.be" and bool(re.fullmatch(r"/[\w-]{11}", path)))
        is_video = is_video or (path == "/watch" and bool(re.fullmatch(r"[\w-]{11}", queries.get("v", [""])[0])))
    if not is_video and not (short_host and len(path) > 1):
        raise Problem("请使用单条视频的分享链接，不支持主页、搜索、直播和播放列表。")
    if platform == "YouTube":
        video_id = queries["v"][0] if path == "/watch" else path.rsplit("/", 1)[-1]
        return "https://www.youtube.com/watch?v=" + video_id, platform
    return urlunsplit((url.scheme, url.netloc, url.path, url.query, "")), platform


def error_message(raw):
    text = str(raw or "").lower()
    if "cancel" in text:
        return "任务已取消，或触发了运行时间与缓存限制。"
    if any(word in text for word in ("no video formats", "requested format", "no formats")):
        return "当前解析器未能获取可下载的视频格式，请使用新的分享链接或更新解析器。"
    if any(word in text for word in ("cookie", "login", "sign in", "log in", "authentication", "fresh cookies")):
        return "平台要求有效登录状态，当前未能获取视频。请勿在分享链接里填写 Cookie 或密码。"
    if re.search(r"\b(?:429|403)\b", text) or any(word in text for word in ("blocked", "captcha", "bot", "geo-restrict", "region")):
        return "平台限制了本次访问，可能涉及风控或地区限制。请稍后再试。"
    if any(word in text for word in ("private", "not available", "unavailable", "not found", "404", "deleted")):
        return "视频不可访问，可能已删除、设为私密，或当前网络无法访问。"
    if any(word in text for word in ("size", "large", "duration", "match_filter")):
        return "视频超过限制，或不是可下载的单条视频。"
    if any(word in text for word in ("timeout", "timed out", "connection", "resolve", "ssl", "certificate")):
        return "连接平台失败或超时。请检查服务的网络出口后再试。"
    return "当前解析器未能获取视频。请确认是有效视频链接；也可能需要更新平台解析器。"


def timestamp(task):
    value = task.get("timestamp", 0)
    return value / 1e9 if isinstance(value, (int, float)) and value > 0 else time.time()


def task_id(task):
    # MeTube queues are keyed by URL, not DownloadInfo.id. Keep URLs server-side.
    return hashlib.sha256(task["url"].encode()).hexdigest()


def media_file(directory, task):
    name = task.get("filename")
    if task.get("status") != "finished" or not isinstance(name, str):
        return None
    candidate = directory / name
    resolved = candidate.resolve()
    if (not resolved.is_relative_to(directory.resolve()) or candidate.is_symlink()
            or resolved.suffix.lower() not in MEDIA or not resolved.is_file()):
        return None
    return resolved if 0 < resolved.stat().st_size <= MAX_FILE else None


class Gateway:
    def __init__(self, engine, downloads, origin):
        self.engine = engine.rstrip("/")
        self.downloads = Path(downloads).resolve()
        self.origin = origin.rstrip("/")
        self.production = urlsplit(origin).hostname not in {"127.0.0.1", "localhost", "::1"}
        self.session = None
        self.submitting = asyncio.Lock()
        self.last_submit = 0.0

    async def call(self, path, body=None, timeout=12):
        try:
            async with self.session.request(
                "GET" if body is None else "POST", self.engine + "/" + path,
                json=body, timeout=ClientTimeout(total=timeout), allow_redirects=False,
            ) as response:
                if response.status != 200:
                    raise Problem("下载引擎暂不可用，请稍后刷新任务列表。", 503)
                return await response.json(content_type=None)
        except (ClientError, asyncio.TimeoutError, ValueError):
            raise Problem("下载引擎连接失败，请检查服务后刷新任务列表。", 503) from None

    async def history(self):
        data = await self.call("history")
        if not isinstance(data, dict) or not all(isinstance(data.get(k), list) for k in ("queue", "pending", "done")):
            raise Problem("下载引擎返回了不兼容的任务数据。", 503)
        return data

    def cache_size(self):
        return sum(p.stat().st_size for p in self.downloads.rglob("*") if p.is_file() and not p.is_symlink())

    async def status(self, request):
        history = await self.history()
        result = []
        for task in history["queue"] + history["pending"] + history["done"]:
            try:
                _, platform = normalize(task.get("url", ""))
            except Problem:
                platform = "视频"
            file = media_file(self.downloads, task)
            if time.time() - timestamp(task) >= TTL:
                file = None
            state = task.get("status", "pending")
            message = error_message(task.get("msg")) if state == "error" else ""
            if state == "finished" and file is None:
                state, message = "error", "成品文件不存在、已过期或超过大小限制，请重新获取。"
            percent = task.get("percent")
            if not isinstance(percent, (int, float)) or not math.isfinite(percent):
                percent = None
            result.append({
                "id": task_id(task), "title": str(task.get("title", "视频"))[:300],
                "platform": platform, "status": state, "percent": percent,
                "size": file.stat().st_size if file else None, "message": message,
                "downloadable": file is not None, "created": timestamp(task),
            })
        return web.json_response({"tasks": sorted(result, key=lambda t: t["created"], reverse=True)})

    async def enqueue(self, operation, body):
        if self.submitting.locked() or time.monotonic() - self.last_submit < 2:
            raise Problem("上一条链接仍在处理，请稍后再提交。", 429)
        async with self.submitting:
            self.last_submit = time.monotonic()
            history = await self.history()
            if len(history["queue"]) + len(history["pending"]) >= MAX_ACTIVE:
                raise Problem("下载队列已满，请等待现有任务完成。", 429)
            if await asyncio.to_thread(self.cache_size) >= MAX_CACHE:
                raise Problem("视频缓存空间已满，请先移除已保存的任务。", 507)
            try:
                result = await self.call(operation, body, timeout=120)
            except Problem:
                # No automatic resubmission: the engine may already have accepted it.
                with contextlib.suppress(Problem):
                    await self.call("cancel-add", {})
                raise Problem("提交结果尚未确认，请先刷新任务列表，避免重复提交。", 504) from None
            if result.get("status") != "ok":
                raise Problem(error_message(result.get("msg")), 422)
        return web.json_response({"status": "accepted"}, status=202)

    async def add(self, request):
        data = await request.json()
        if not isinstance(data, dict) or set(data) - {"text", "quality"}:
            raise Problem("请求包含不支持的下载参数。")
        url, _ = normalize(data.get("text"))
        quality = data.get("quality", "best")
        if quality not in ("best", "1080", "720", "480"):
            raise Problem("请选择有效画质。")
        return await self.enqueue("add", {
            "url": url, "quality": quality, "download_type": "video",
            "codec": "h264", "format": "mp4", "playlist_item_limit": 1,
            "auto_start": True, "folder": "", "custom_name_prefix": hashlib.sha256(url.encode()).hexdigest()[:16] + "-",
            "ytdl_options_presets": ["quality_" + quality],
        })

    async def retry(self, request):
        data = await request.json()
        if not isinstance(data, dict) or set(data) != {"id"} or not isinstance(data["id"], str):
            raise Problem("任务标识无效。")
        history = await self.history()
        task = next((t for t in history["done"] if task_id(t) == data["id"] and t.get("status") == "error"), None)
        if not task:
            raise Problem("只能重新获取未完成的任务。", 409)
        normalize(task.get("url"))
        return await self.enqueue("retry", {"id": task["url"]})

    async def remove(self, request):
        data = await request.json()
        if not isinstance(data, dict) or set(data) != {"id"} or not isinstance(data["id"], str):
            raise Problem("任务标识无效。")
        history = await self.history()
        target = next(((group, task) for group, tasks in history.items()
                       for task in tasks if task_id(task) == data["id"]), None)
        if not target:
            raise Problem("任务已不存在，请刷新列表。", 404)
        group, task = target
        result = await self.call("delete", {"ids": [task["url"]], "where": "done" if group == "done" else "queue"})
        if result.get("status") != "ok":
            raise Problem("操作未完成，请刷新任务列表后检查。", 502)
        return web.json_response({"status": "ok"})

    async def file(self, request):
        history = await self.history()
        task = next((t for t in history["done"] if task_id(t) == request.match_info["id"]), None)
        path = media_file(self.downloads, task or {})
        if not path or time.time() - timestamp(task) >= TTL:
            raise Problem("文件不存在或已经过期，请重新获取视频。", 404)
        response = web.FileResponse(path)
        mode = "inline" if request.query.get("inline") == "1" else "attachment"
        from urllib.parse import quote
        response.headers["Content-Disposition"] = mode + "; filename*=UTF-8''" + quote(path.name)
        return response

    async def maintain(self):
        while True:
            await asyncio.sleep(15)
            try:
                history = await self.history()
                now = time.time()
                over_quota = await asyncio.to_thread(self.cache_size) >= MAX_CACHE
                cancel = [t["url"] for t in history["queue"] + history["pending"]
                          if over_quota or now - timestamp(t) > MAX_SECONDS]
                if cancel:
                    await self.call("delete", {"ids": cancel, "where": "queue"})
                expired = [t["url"] for t in history["done"] if now - timestamp(t) > TTL]
                if expired:
                    await self.call("delete", {"ids": expired, "where": "done"})
                # Only this dedicated runtime's stale media/partials are eligible.
                if not history["queue"] and not history["pending"] and not self.submitting.locked():
                    for path in self.downloads.rglob("*"):
                        if path.is_file() and not path.is_symlink() and now - path.stat().st_mtime > TTL:
                            path.unlink()
            except (Problem, OSError):
                pass


def create_app(engine, downloads, origin, maintenance=True):
    gateway = Gateway(engine, downloads, origin)

    @web.middleware
    async def guard(request, handler):
        try:
            if request.host != urlsplit(gateway.origin).netloc:
                raise Problem("不允许的访问地址。", 403)
            if request.path.startswith(PREFIX) and gateway.production and not request.headers.get("X-Authenticated-User"):
                raise Problem("请通过网站登录后访问。", 401)
            if request.path.startswith(API):
                if request.headers.get("Origin", gateway.origin) != gateway.origin:
                    raise Problem("不允许跨站请求。", 403)
                if request.headers.get("Sec-Fetch-Site") == "cross-site":
                    raise Problem("不允许跨站请求。", 403)
                if request.method == "POST" and (
                    request.headers.get("X-Social-Download") != "1"
                    or request.headers.get("Origin") != gateway.origin
                    or request.content_type != "application/json"
                ):
                    raise Problem("请求校验失败，请从本站页面提交。", 403)
            response = await handler(request)
        except Problem as error:
            response = web.json_response({"message": error.message}, status=error.status)
        except (json.JSONDecodeError, UnicodeDecodeError):
            response = web.json_response({"message": "请求内容不是有效 JSON。"}, status=400)
        except web.HTTPException as error:
            response = web.json_response({"message": "请求路径、方法或大小不受支持。"}, status=error.status)
        response.headers.update({
            "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer", "X-Frame-Options": "SAMEORIGIN",
        })
        return response

    app = web.Application(middlewares=[guard], client_max_size=8192)
    app[GATEWAY_KEY] = gateway

    async def lifecycle(app):
        async with ClientSession(trust_env=False) as session:
            gateway.session = session
            task = asyncio.create_task(gateway.maintain()) if maintenance else None
            yield
            if task:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task

    app.cleanup_ctx.append(lifecycle)
    app.router.add_get(API + "status", gateway.status)
    app.router.add_post(API + "downloads", gateway.add)
    app.router.add_post(API + "retry", gateway.retry)
    app.router.add_post(API + "remove", gateway.remove)
    app.router.add_get(API + "files/{id}", gateway.file)

    async def static(request):
        route = request.path
        public = {"", "works", "methods", "about", "resume", "contact", "privacy", "terms", "thanks", "tools"}
        if route == "/404.html":
            path = ROOT / "404.html"
        elif route.strip("/") in public:
            path = ROOT / route.strip("/") / "index.html"
        elif route in (PREFIX, PREFIX + "index.html"):
            path = ROOT / "tools/social-download/index.html"
        elif route.startswith(PREFIX) and route[len(PREFIX):] in {"app.js", "app.css", "icons.svg"}:
            path = ROOT / route.lstrip("/")
        elif route.startswith("/assets/"):
            path = (ROOT / route.lstrip("/")).resolve()
            if not path.is_relative_to((ROOT / "assets").resolve()):
                raise web.HTTPNotFound()
        else:
            raise web.HTTPNotFound()
        if not path.is_file():
            raise web.HTTPNotFound()
        return web.FileResponse(path)

    app.router.add_get("/{path:.*}", static)
    return app


GATEWAY_KEY = web.AppKey("gateway", Gateway)


def prepare_runtime(runtime):
    marker = runtime / ".social-download-runtime"
    signature = "social-download-runtime-v1\n"
    runtime.mkdir(parents=True, exist_ok=True, mode=0o700)
    if marker.is_symlink():
        raise ValueError("Runtime ownership marker must not be a symlink.")
    if marker.exists():
        if marker.read_text() != signature:
            raise ValueError("Runtime ownership marker does not match.")
    else:
        if any(runtime.iterdir()):
            raise ValueError("Choose a new, empty runtime directory; existing files are not adopted.")
        marker.write_text(signature)
    for name in ("downloads", "state", "frontend"):
        if (runtime / name).is_symlink():
            raise ValueError("Runtime directories must not be symlinks.")


def engine_environment(runtime, source, port, proxy):
    prepare_runtime(runtime)
    downloads = runtime / "downloads"
    for path in (downloads, runtime / "state", runtime / "frontend/ui/dist/metube"):
        path.mkdir(parents=True, exist_ok=True, mode=0o700)
    ui = runtime / "frontend/ui/dist/metube/browser"
    if not ui.exists():
        ui.symlink_to(ROOT / "tools/social-download", target_is_directory=True)
    options = {
        "proxy": proxy, "socket_timeout": 15, "retries": 1, "fragment_retries": 1,
        "extractor_retries": 1, "max_filesize": MAX_FILE, "noplaylist": True,
        "playlistend": 1,
        "cachedir": False, "quiet": True, "no_warnings": True,
    }
    # A silent post is still a video. Prefer, rather than require, a resolution.
    presets = {
        "quality_" + quality: {
            "format": "bv[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv[ext=mp4]/bv+ba/b/bv",
            "format_sort": ["res" if quality == "best" else "res:" + quality],
            "format_sort_force": True,
            "merge_output_format": "mp4/mkv",
        } for quality in ("best", "1080", "720", "480")
    }
    env = dict(os.environ)
    env.update({
        "PYTHONDONTWRITEBYTECODE": "1",
        "PATH": str(source / ".venv/bin") + os.pathsep + os.environ.get("PATH", ""),
        "HOST": "127.0.0.1", "PORT": str(port),
        "BASE_DIR": str(runtime / "frontend"),
        "DOWNLOAD_DIR": str(downloads), "TEMP_DIR": str(downloads),
        "STATE_DIR": str(runtime / "state"), "URL_PREFIX": "/",
        "PUBLIC_HOST_URL": "download/", "PUBLIC_HOST_AUDIO_URL": "audio_download/",
        "YTDL_OPTIONS": json.dumps(options), "YTDL_OPTIONS_FILE": "",
        "YTDL_OPTIONS_PRESETS": json.dumps(presets), "YTDL_OPTIONS_PRESETS_FILE": "",
        "ALLOW_PRIVATE_ADDRESSES": "false", "ALLOW_YTDL_OPTIONS_OVERRIDES": "false",
        "CUSTOM_DIRS": "false", "CREATE_CUSTOM_DIRS": "false",
        "DOWNLOAD_DIRS_INDEXABLE": "false", "CORS_ALLOWED_ORIGINS": "",
        "MAX_CONCURRENT_DOWNLOADS": "2", "DEFAULT_OPTION_PLAYLIST_ITEM_LIMIT": "1",
        "DELETE_FILE_ON_TRASHCAN": "true", "CLEAR_COMPLETED_AFTER": "0",
        "YTDL_NIGHTLY_UPDATE_TIME": "", "HTTPS": "false",
        "OUTPUT_TEMPLATE": "%(extractor_key)s-%(id)s-%(height)sp.%(ext)s",
        "OUTPUT_TEMPLATE_PLAYLIST": "", "OUTPUT_TEMPLATE_CHANNEL": "",
        "LOGLEVEL": "WARNING", "ENABLE_ACCESSLOG": "false",
    })
    return env


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metube-root", type=Path, required=True)
    parser.add_argument("--runtime-root", type=Path, required=True)
    parser.add_argument("--parser-root", type=Path, help="Optional pinned parse-video-py checkout for Douyin.")
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--engine-port", type=int, default=18081)
    parser.add_argument("--origin", default=None)
    args = parser.parse_args()
    source, runtime = args.metube_root.resolve(), args.runtime_root.resolve()
    if runtime.is_relative_to(ROOT):
        parser.error("Runtime files must live outside the website repository.")
    commit = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    if commit != PIN:
        parser.error("MeTube checkout does not match the reviewed commit " + PIN)
    os.umask(0o077)
    for port in (args.port, args.engine_port):
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            probe.bind(("127.0.0.1", port))
    try:
        env = engine_environment(runtime, source, args.engine_port, os.environ.get("SOCIAL_DOWNLOAD_PROXY", ""))
    except ValueError as error:
        parser.error(str(error))
    if args.parser_root:
        parser_root = args.parser_root.resolve()
        parser_commit = subprocess.check_output(
            ["git", "-C", str(parser_root), "rev-parse", "HEAD"], text=True,
        ).strip()
        if parser_commit != PARSER_PIN:
            parser.error("parse-video-py checkout does not match the reviewed commit " + PARSER_PIN)
        interpreter = parser_root / ".venv/bin/python"
        if not interpreter.is_file():
            parser.error("Install the parser's separate virtual environment first.")
        env["SOCIAL_DOWNLOAD_PARSER_PYTHON"] = str(interpreter)
        env["PARSE_VIDEO_PROXY"] = os.environ.get("SOCIAL_DOWNLOAD_PROXY", "")
        env["PYTHONPATH"] = str(Path(__file__).parent)
    log = open(runtime / "engine.log", "ab")
    engine = subprocess.Popen(
        [str(source / ".venv/bin/python"), str(source / "app/main.py")],
        cwd=source, env=env, stdout=log, stderr=log, start_new_session=True,
        preexec_fn=lambda: resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_FILE, MAX_FILE)),
    )
    try:
        app = create_app(
            f"http://127.0.0.1:{args.engine_port}", runtime / "downloads",
            args.origin or f"http://127.0.0.1:{args.port}",
        )
        web.run_app(app, host="127.0.0.1", port=args.port, access_log=None)
    finally:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(engine.pid, signal.SIGTERM)
        try:
            engine.wait(timeout=10)
        except subprocess.TimeoutExpired:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(engine.pid, signal.SIGKILL)
            engine.wait()
        log.close()


if __name__ == "__main__":
    main()
