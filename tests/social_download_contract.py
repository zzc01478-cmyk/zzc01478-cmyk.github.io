"""Offline gateway contracts. Run with the pinned MeTube environment's Python."""

import importlib.util
import asyncio
import json
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("social_download", ROOT / "services/social-download/server.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)
PLUGIN_SPEC = importlib.util.spec_from_file_location(
    "douyin_share", ROOT / "services/social-download/yt_dlp_plugins/extractor/douyin_share.py",
)
plugin = importlib.util.module_from_spec(PLUGIN_SPEC)
PLUGIN_SPEC.loader.exec_module(plugin)


class DouyinPlugin(unittest.TestCase):
    def test_only_enabled_for_douyin_when_configured(self):
        with patch.dict("os.environ", {"SOCIAL_DOWNLOAD_PARSER_PYTHON": "/test/python"}):
            self.assertTrue(plugin.DouyinShareIE.suitable("https://www.douyin.com/video/123"))
            self.assertTrue(plugin.DouyinShareIE.suitable("https://v.douyin.com/abc/"))
            self.assertFalse(plugin.DouyinShareIE.suitable("https://x.com/a/status/123"))
        with patch.dict("os.environ", {"SOCIAL_DOWNLOAD_PARSER_PYTHON": ""}):
            self.assertFalse(plugin.DouyinShareIE.suitable("https://www.douyin.com/video/123"))

    def test_media_host_allowlist(self):
        self.assertEqual(plugin.validate_media_url("https://v95-sz-default.365yg.com/video"), "https://v95-sz-default.365yg.com/video")
        self.assertEqual(plugin.validate_media_url("https://v3-dy-o.zjcdn.com/video"), "https://v3-dy-o.zjcdn.com/video")
        for url in ("http://127.0.0.1/video", "file:///tmp/video", "https://365yg.com.evil.test/video",
                    "https://zjcdn.com.evil.test/video", "https://evilzjcdn.com/video",
                    "https://user:password@365yg.com/video", "https://365yg.com:9999/video"):
            with self.assertRaises(ValueError):
                plugin.validate_media_url(url)

    def test_bridge_result_keeps_original_page_url(self):
        from types import SimpleNamespace
        result = SimpleNamespace(stdout=json.dumps({"url": "https://media.365yg.com/video", "title": "sample"}))
        with patch.dict("os.environ", {"SOCIAL_DOWNLOAD_PARSER_PYTHON": "/test/python"}), patch.object(plugin.subprocess, "run", return_value=result) as run:
            data = plugin.DouyinShareIE()._real_extract("https://www.douyin.com/video/123")
        self.assertEqual(data["id"], "123")
        self.assertEqual(data["webpage_url"], "https://www.douyin.com/video/123")
        self.assertEqual(run.call_args.kwargs["timeout"], 45)


class Links(unittest.TestCase):
    def test_six_platforms_and_share_text(self):
        cases = [
            ("复制打开抖音 https://v.douyin.com/abc/。", "抖音"),
            ("https://www.tiktok.com/@someone/video/123456789", "TikTok"),
            ("https://www.instagram.com/reel/ABC_123/", "Instagram"),
            ("https://youtu.be/BaW_jenozKc", "YouTube"),
            ("http://xhslink.com/a/abc", "小红书"),
            ("https://x.com/example/status/123456789", "X"),
        ]
        for text, expected in cases:
            self.assertEqual(module.normalize(text)[1], expected)

    def test_reject_private_tricky_and_collection_urls(self):
        for url in [
            "https://127.0.0.1/video/1", "http://169.254.169.254/",
            "https://youtube.com.evil.test/watch?v=BaW_jenozKc",
            "https://youtube.com@evil.test/watch?v=BaW_jenozKc",
            "https://name:secret@youtube.com/watch?v=BaW_jenozKc",
            "file:///etc/passwd", "https://youtube.com:9999/watch?v=BaW_jenozKc",
            "https://youtube.com/playlist?list=PLabc", "https://youtube.com/@creator",
            "https://instagram.com/creator", "https://tiktok.com/@creator/live",
            "https://www.douyin.com/user/foo", "https://x.com/creator",
            "https://youtu.be/BaW_jenozKc https://x.com/a/status/123",
            None, [], "x" * 4097,
        ]:
            with self.subTest(url=url):
                with self.assertRaises(module.Problem):
                    module.normalize(url)

    def test_youtube_playlist_and_clip_parameters_cannot_reach_engine(self):
        url, _ = module.normalize("https://youtube.com/watch?v=BaW_jenozKc&list=PLabc&t=3m#anything")
        self.assertEqual(url, "https://www.youtube.com/watch?v=BaW_jenozKc")

    def test_error_messages_do_not_leak_raw_details(self):
        self.assertNotIn("secret", module.error_message("cookie secret=123"))
        self.assertIn("登录", module.error_message("fresh cookies"))
        self.assertIn("限制", module.error_message("HTTP 403"))
        self.assertIn("超时", module.error_message("connection timed out"))
        self.assertIn("格式", module.error_message("[Douyin] 6961737553342991651: No video formats found!"))
        self.assertNotIn("地区", module.error_message("video id 123429456 extraction failed"))

    def test_runtime_options_keep_dangerous_features_disabled(self):
        with tempfile.TemporaryDirectory() as root:
            env = module.engine_environment(Path(root), Path("/unused"), 18081, "")
            self.assertEqual(env["ALLOW_PRIVATE_ADDRESSES"], "false")
            self.assertEqual(env["ALLOW_YTDL_OPTIONS_OVERRIDES"], "false")
            self.assertEqual(env["DOWNLOAD_DIRS_INDEXABLE"], "false")
            self.assertEqual(env["DELETE_FILE_ON_TRASHCAN"], "true")
            options = json.loads(env["YTDL_OPTIONS"])
            self.assertNotIn("match_filter", options, "yt-dlp Python API requires a callable, not a string")
            self.assertTrue(options["noplaylist"])
            presets = json.loads(env["YTDL_OPTIONS_PRESETS"])
            self.assertEqual(presets["quality_480"]["format_sort"], ["res:480"])
            self.assertTrue(presets["quality_best"]["format"].endswith("/bv"))

    def test_runtime_refuses_existing_files_and_symlink_directories(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root)
            unrelated = path / "keep.mp4"
            unrelated.write_bytes(b"do not adopt")
            with self.assertRaises(ValueError):
                module.prepare_runtime(path)
            self.assertEqual(unrelated.read_bytes(), b"do not adopt")
        with tempfile.TemporaryDirectory() as root, tempfile.TemporaryDirectory() as outside:
            path = Path(root)
            module.prepare_runtime(path)
            module.prepare_runtime(path)
            (path / "downloads").symlink_to(outside, target_is_directory=True)
            with self.assertRaises(ValueError):
                module.prepare_runtime(path)


class API(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.downloads = Path(self.temp.name)
        self.data = {"queue": [], "pending": [], "done": []}
        self.calls = []
        self.add_result = {"status": "ok"}
        self.engine_down = False

        async def history(request):
            if self.engine_down:
                return web.Response(status=503)
            return web.json_response(self.data)

        async def post(request):
            self.calls.append((request.path, await request.json()))
            return web.json_response(self.add_result if request.path == "/add" else {"status": "ok"})

        upstream = web.Application()
        upstream.router.add_get("/history", history)
        upstream.router.add_post("/{operation}", post)
        self.upstream = TestServer(upstream)
        await self.upstream.start_server()
        self.origin = "http://127.0.0.1:8766"
        self.app = module.create_app(str(self.upstream.make_url("")), self.downloads, self.origin, maintenance=False)
        self.client = TestClient(TestServer(self.app))
        await self.client.start_server()
        self.headers = {"Host": "127.0.0.1:8766", "Origin": self.origin, "X-Social-Download": "1"}

    async def asyncTearDown(self):
        await self.client.close()
        await self.upstream.close()
        self.temp.cleanup()

    async def post(self, path, body, headers=None):
        return await self.client.post(module.API + path, json=body, headers=headers or self.headers)

    def finished(self, filename="movie.mp4", status="finished"):
        return {
            "id": "test123", "url": "https://youtu.be/BaW_jenozKc", "title": "<script>not HTML</script>",
            "status": status, "filename": filename, "timestamp": time.time_ns(), "percent": 100,
            "entry": {"private": "never expose"}, "msg": "cookie secret=123",
        }

    async def test_maps_only_safe_parameters(self):
        result = await self.post("downloads", {"text": "https://youtu.be/BaW_jenozKc", "quality": "720"})
        self.assertEqual(result.status, 202)
        body = self.calls[0][1]
        self.assertEqual(body["quality"], "720")
        self.assertEqual(body["playlist_item_limit"], 1)
        self.assertEqual(body["format"], "mp4")
        self.assertEqual(body["custom_name_prefix"], module.task_id({"url": body["url"]})[:16] + "-")
        self.assertNotIn("ytdl_options_overrides", body)
        self.assertEqual(body["ytdl_options_presets"], ["quality_720"])
        again = await self.post("downloads", {"text": "https://youtu.be/BaW_jenozKc"})
        self.assertEqual(again.status, 429)

    async def test_rejects_extra_options_and_bad_json(self):
        result = await self.post("downloads", {"text": "https://youtu.be/BaW_jenozKc", "exec": "echo unsafe"})
        self.assertEqual(result.status, 400)
        result = await self.client.post(module.API + "downloads", data="{", headers={**self.headers, "Content-Type": "application/json"})
        self.assertEqual(result.status, 400)
        self.assertEqual(self.calls, [])

    async def test_csrf_host_and_production_auth(self):
        for headers in [
            {**self.headers, "Origin": "https://evil.test"},
            {**self.headers, "Host": "evil.test"},
            {"Host": "127.0.0.1:8766"},
        ]:
            result = await self.post("downloads", {"text": "https://youtu.be/BaW_jenozKc"}, headers)
            self.assertEqual(result.status, 403)
        self.app[module.GATEWAY_KEY].production = True
        result = await self.client.get(module.API + "status", headers=self.headers)
        self.assertEqual(result.status, 401)
        result = await self.client.get(module.API + "status", headers={**self.headers, "X-Authenticated-User": "test"})
        self.assertEqual(result.status, 200)

    async def test_backend_failure_and_platform_error_are_not_success(self):
        self.engine_down = True
        result = await self.client.get(module.API + "status", headers=self.headers)
        self.assertEqual(result.status, 503)
        self.engine_down = False
        self.add_result = {"status": "error", "msg": "fresh cookies required secret=123"}
        result = await self.post("downloads", {"text": "https://youtu.be/BaW_jenozKc"})
        self.assertEqual(result.status, 422)
        self.assertNotIn("secret", await result.text())

    async def test_tasks_redact_engine_details_and_missing_file(self):
        self.data["done"] = [self.finished()]
        result = await self.client.get(module.API + "status", headers=self.headers)
        body = await result.json()
        self.assertFalse(body["tasks"][0]["downloadable"])
        self.assertEqual(body["tasks"][0]["status"], "error")
        self.assertNotIn("entry", body["tasks"][0])
        self.assertNotIn("secret", json.dumps(body))
        (self.downloads / "movie.mp4").write_bytes(b"video fixture")
        result = await self.client.get(module.API + "status", headers=self.headers)
        self.assertTrue((await result.json())["tasks"][0]["downloadable"])

    async def test_file_download_range_traversal_and_expiration(self):
        (self.downloads / "movie.mp4").write_bytes(b"0123456789")
        self.data["done"] = [self.finished()]
        route = module.API + "files/" + module.task_id(self.finished())
        result = await self.client.get(route, headers={**self.headers, "Range": "bytes=2-5"})
        self.assertEqual(result.status, 206)
        self.assertEqual(await result.read(), b"2345")
        self.assertIn("attachment", result.headers["Content-Disposition"])
        self.assertEqual(result.headers["Cache-Control"], "no-store")
        self.data["done"][0]["filename"] = "../secret.mp4"
        result = await self.client.get(route, headers=self.headers)
        self.assertEqual(result.status, 404)
        self.data["done"][0] = self.finished()
        self.data["done"][0]["timestamp"] = int((time.time() - module.TTL - 1) * 1e9)
        result = await self.client.get(route, headers=self.headers)
        self.assertEqual(result.status, 404)

    async def test_retry_only_failed_tasks(self):
        self.data["done"] = [self.finished(status="error")]
        key = module.task_id(self.finished())
        result = await self.post("retry", {"id": key})
        self.assertEqual(result.status, 202)
        self.assertEqual(self.calls[-1], ("/retry", {"id": self.finished()["url"]}))
        self.data["done"][0]["status"] = "finished"
        result = await self.post("retry", {"id": key})
        self.assertEqual(result.status, 409)

    async def test_queue_limit_cancel_and_delete(self):
        self.data["queue"] = [dict(self.finished(status="downloading"), url=f"https://youtu.be/BaW_jenozK{i}") for i in range(module.MAX_ACTIVE)]
        result = await self.post("downloads", {"text": "https://youtu.be/BaW_jenozKc"})
        self.assertEqual(result.status, 429)
        result = await self.post("remove", {"id": module.task_id(self.data["queue"][0])})
        self.assertEqual(result.status, 200)
        self.assertEqual(self.calls[-1], ("/delete", {"ids": [self.data["queue"][0]["url"]], "where": "queue"}))
        self.data["done"] = [self.finished()]
        result = await self.post("remove", {"id": module.task_id(self.finished())})
        self.assertEqual(result.status, 200)
        self.assertEqual(self.calls[-1][1]["where"], "done")
        result = await self.post("remove", {"id": "missing"})
        self.assertEqual(result.status, 404)

    async def test_same_video_id_different_queue_keys_stays_distinct(self):
        self.data["done"] = [self.finished(), dict(self.finished(), url="https://youtu.be/YE7VzlLtp-4")]
        result = await self.client.get(module.API + "status", headers=self.headers)
        tasks = (await result.json())["tasks"]
        self.assertEqual(len(set(task["id"] for task in tasks)), 2)
        self.assertTrue(all(len(task["id"]) == 64 for task in tasks))

    async def test_maintenance_expires_owned_cache_not_fresh_files(self):
        stale = self.downloads / "old.part"
        stale.write_bytes(b"partial")
        old = time.time() - module.TTL - 1
        os.utime(stale, (old, old))
        fresh = self.downloads / "fresh.mp4"
        fresh.write_bytes(b"keep")
        self.data["done"] = [dict(self.finished(), timestamp=int(old * 1e9))]
        with patch.object(module.asyncio, "sleep", side_effect=[None, asyncio.CancelledError()]):
            with self.assertRaises(asyncio.CancelledError):
                await self.app[module.GATEWAY_KEY].maintain()
        self.assertFalse(stale.exists())
        self.assertEqual(fresh.read_bytes(), b"keep")
        self.assertEqual(self.calls[-1], ("/delete", {"ids": [self.finished()["url"]], "where": "done"}))

    async def test_maintenance_cancels_queue_over_runtime_limit(self):
        old = time.time() - module.MAX_SECONDS - 1
        self.data["queue"] = [dict(self.finished(status="downloading"), timestamp=int(old * 1e9))]
        with patch.object(module.asyncio, "sleep", side_effect=[None, asyncio.CancelledError()]):
            with self.assertRaises(asyncio.CancelledError):
                await self.app[module.GATEWAY_KEY].maintain()
        self.assertEqual(self.calls[-1], ("/delete", {"ids": [self.finished()["url"]], "where": "queue"}))

    async def test_private_files_and_engine_admin_routes_are_unreachable(self):
        for path in ["/.git/config", "/.env", "/services/social-download/server.py",
                     module.API + "upload-cookies", module.API + "subscribe", "/downloads/"]:
            result = await self.client.get(path, headers=self.headers)
            self.assertEqual(result.status, 404, path)
        result = await self.client.get(module.PREFIX, headers=self.headers)
        self.assertEqual(result.status, 200)


if __name__ == "__main__":
    unittest.main(verbosity=2)
