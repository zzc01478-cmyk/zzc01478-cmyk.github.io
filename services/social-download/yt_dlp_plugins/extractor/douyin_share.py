"""Bridge the pinned Douyin parser into yt-dlp without modifying either upstream."""

import asyncio
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlsplit


def validate_media_url(url):
    parsed = urlsplit(url)
    host = parsed.hostname or ""
    if (parsed.scheme not in {"http", "https"} or parsed.username or parsed.password
            or parsed.port not in {None, 80, 443}
            or not any(host == domain or host.endswith("." + domain)
                       for domain in ("365yg.com", "douyinvod.com", "zjcdn.com"))):
        raise ValueError("Unrecognized Douyin media host.")
    return url


if __name__ == "__main__":
    from parse_video_py import parse_video_share_url

    async def parse():
        result = await asyncio.wait_for(parse_video_share_url(sys.argv[1]), timeout=35)
        print(json.dumps({
            "url": validate_media_url(result.video_url),
            "title": result.title or "抖音视频",
        }))

    asyncio.run(parse())
else:
    from yt_dlp.extractor.common import InfoExtractor
    from yt_dlp.utils import ExtractorError

    class DouyinShareIE(InfoExtractor):
        IE_NAME = "DouyinShare"
        _VALID_URL = r"https?://(?:(?:www\.)?(?:iesdouyin|douyin)\.com/(?:share/)?(?:video|note|slides)/(?P<id>\d+)|v\.douyin\.com/[^/?#]+)"

        @classmethod
        def suitable(cls, url):
            return bool(os.environ.get("SOCIAL_DOWNLOAD_PARSER_PYTHON")) and super().suitable(url)

        def _real_extract(self, url):
            try:
                result = subprocess.run(
                    [os.environ["SOCIAL_DOWNLOAD_PARSER_PYTHON"], "-B", str(Path(__file__).resolve()), url],
                    capture_output=True, text=True, timeout=45, check=True,
                )
                data = json.loads(result.stdout)
                media = validate_media_url(data["url"])
            except (OSError, subprocess.SubprocessError, ValueError, KeyError):
                raise ExtractorError("Douyin share parser could not obtain a video; try a fresh share link.", expected=True) from None
            match = self._match_valid_url(url)
            return {
                "id": match.group("id") or hashlib.sha256(url.encode()).hexdigest()[:16],
                "title": str(data.get("title") or "抖音视频")[:300],
                "formats": [{"url": media, "ext": "mp4", "format_id": "share"}],
                "webpage_url": url,
            }
