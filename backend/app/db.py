"""Truy cập Supabase qua PostgREST (REST) — không cần thư viện nặng."""

from typing import Any

import httpx

from app.config import settings

_headers = {
    "apikey": settings.supabase_secret_key,
    "Authorization": f"Bearer {settings.supabase_secret_key}",
    "Content-Type": "application/json",
}

base = settings.supabase_url.rstrip("/") + "/rest/v1"


def _query(
    table: str,
    method: str,
    *,
    params: dict[str, Any] | None = None,
    json: Any = None,
    prefer: str | None = None,
) -> list[dict[str, Any]]:
    headers = dict(_headers)
    if prefer:
        headers["Prefer"] = prefer
    with httpx.Client(timeout=15) as client:
        res = client.request(method, f"{base}/{table}", params=params, json=json, headers=headers)
        res.raise_for_status()
        return res.json() if res.content else []


def select(table: str, **filters: Any) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"select": "*"}
    for key, value in filters.items():
        params[key] = value
    return _query(table, "GET", params=params)


def select_one(table: str, **filters: Any) -> dict[str, Any] | None:
    rows = select(table, **filters, limit="1")
    return rows[0] if rows else None


def insert(table: str, data: dict[str, Any]) -> dict[str, Any] | None:
    rows = _query(table, "POST", json=data, prefer="return=representation")
    return rows[0] if rows else None


def update(table: str, data: dict[str, Any], **filters: Any) -> list[dict[str, Any]]:
    return _query(table, "PATCH", params=filters, json=data, prefer="return=representation")


def rpc(fn: str, data: dict[str, Any]) -> Any:
    with httpx.Client(timeout=15) as client:
        res = client.post(
            f"{base}/rpc/{fn}",
            json=data,
            headers=_headers,
        )
        res.raise_for_status()
        return res.json() if res.content else None
