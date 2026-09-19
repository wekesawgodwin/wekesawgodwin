import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class RateLimiter:
    """Small in-memory sliding-window limiter for public write endpoints.

    Good enough for a single-instance deployment; use Redis if you scale out.
    """

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def __call__(self, request: Request) -> None:
        # The proxy in front of us (Railway's edge) appends the real client IP, so the
        # rightmost entry is trustworthy; earlier entries can be forged by the client.
        forwarded = request.headers.get("x-forwarded-for", "")
        ip = forwarded.split(",")[-1].strip() or (request.client.host if request.client else "unknown")
        now = time.monotonic()
        hits = self.hits[ip]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if not hits:
            # A new or returning visitor: drop visitors whose hits have all expired so the
            # table doesn't grow forever.
            for stale in [k for k, v in self.hits.items() if not v or now - v[-1] > self.window]:
                del self.hits[stale]
            hits = self.hits[ip]
        if len(hits) >= self.limit:
            raise HTTPException(status_code=429, detail="Too many requests, please try again later.")
        hits.append(now)


comment_limiter = RateLimiter(limit=5, window_seconds=600)
contact_limiter = RateLimiter(limit=5, window_seconds=600)
review_limiter = RateLimiter(limit=5, window_seconds=600)
login_limiter = RateLimiter(limit=10, window_seconds=600)
