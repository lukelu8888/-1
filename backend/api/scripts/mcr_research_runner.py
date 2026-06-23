#!/usr/bin/env python3
"""
MCR Research Runner
===================
Triggered by Laravel when a Research Run is started.

Usage:
    python3 mcr_research_runner.py \\
        --run-id <uuid> \\
        --supabase-url https://xxx.supabase.co \\
        --supabase-key <service_role_key>

Steps:
    1. Load run config from mcr_runs
    2. Fetch Google Trends data (pytrends) for the source category
    3. For each time window, compute score and store as TrendWindow JSON
    4. Generate CandidateCategory rows with scores
    5. Write Evidence rows (one per data source used)
    6. Mark run as 'completed' (or 'failed' on error)

Dependencies:
    pip install pytrends supabase requests
"""

import argparse
import hashlib
import json
import logging
import sys
import time
import traceback
import uuid
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [MCR] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("mcr")


# ─── Supabase REST helper ──────────────────────────────────────────────────────

class SupabaseClient:
    def __init__(self, url: str, key: str):
        import requests
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        self._requests = requests

    def select(self, table: str, filters: dict | None = None) -> list:
        params = {}
        if filters:
            for k, v in filters.items():
                params[f"{k}"] = f"eq.{v}"
        r = self._requests.get(f"{self.base}/{table}", headers=self.headers, params=params)
        r.raise_for_status()
        return r.json()

    def insert(self, table: str, row: dict) -> dict:
        r = self._requests.post(f"{self.base}/{table}", headers=self.headers, json=row)
        r.raise_for_status()
        result = r.json()
        return result[0] if isinstance(result, list) else result

    def update(self, table: str, row_id: str, data: dict) -> dict:
        headers = {**self.headers, "Prefer": "return=representation"}
        r = self._requests.patch(
            f"{self.base}/{table}",
            headers=headers,
            params={"id": f"eq.{row_id}"},
            json=data,
        )
        r.raise_for_status()
        result = r.json()
        return result[0] if isinstance(result, list) else result


# ─── Google Trends fetcher ─────────────────────────────────────────────────────

def fetch_trends(keyword: str, timeframe: str = "today 5-y", geo: str = "US") -> dict:
    """
    Returns { data: [{period, value}], yoy: float|None, peak_period: str|None }
    Falls back to empty result if pytrends is not installed or rate-limited.
    """
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 30), retries=2, backoff_factor=0.5)
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo=geo, gprop="")
        df = pytrends.interest_over_time()

        if df.empty or keyword not in df.columns:
            log.warning(f"No trends data for '{keyword}' ({timeframe})")
            return {"data": [], "yoy": None, "peak_period": None}

        series = df[keyword].dropna()
        data_points = []
        for ts, val in series.items():
            period = ts.strftime("%Y-%m") if hasattr(ts, "strftime") else str(ts)[:7]
            data_points.append({"period": period, "value": int(val)})

        # YoY: compare last 12 months vs prior 12 months average
        yoy = None
        if len(data_points) >= 24:
            recent  = [p["value"] for p in data_points[-12:]]
            prior   = [p["value"] for p in data_points[-24:-12]]
            avg_r   = sum(recent) / len(recent)
            avg_p   = sum(prior) / len(prior)
            if avg_p > 0:
                yoy = round(((avg_r - avg_p) / avg_p) * 100, 1)

        peak = max(data_points, key=lambda p: p["value"]) if data_points else None

        return {
            "data": data_points,
            "yoy": yoy,
            "peak_period": peak["period"] if peak else None,
        }

    except ImportError:
        log.warning("pytrends not installed — skipping Google Trends fetch.")
        return {"data": [], "yoy": None, "peak_period": None}
    except Exception as e:
        log.warning(f"Google Trends error for '{keyword}': {e}")
        return {"data": [], "yoy": None, "peak_period": None}


TIMEFRAME_MAP = {
    "10Y": "today 10-y",
    "5Y":  "today 5-y",
    "3Y":  "today 3-y",
    "1Y":  "today 12-m",
    "3M":  "today 3-m",
}


# ─── Score computation ────────────────────────────────────────────────────────

def compute_scores(keyword: str, trend_windows: list[dict], country: str) -> dict:
    """
    Simple heuristic scoring from trend data.
    In production, enrich with Merchant Center / Amazon OE data.
    """
    # Pick the 1Y window for primary scoring
    win_1y = next((w for w in trend_windows if w["window"] == "1Y"), None)
    data   = win_1y["data"] if win_1y else []
    yoy    = win_1y.get("yoy") if win_1y else None

    avg_value  = (sum(p["value"] for p in data) / len(data)) if data else 30
    trend_score = min(100, max(0, int(avg_value)))

    # YoY bonus
    yoy_bonus = 0
    if yoy is not None:
        yoy_bonus = max(-20, min(20, int(yoy / 2)))

    confidence  = min(100, max(20, trend_score + yoy_bonus))
    demand      = min(100, max(20, trend_score + 5))
    market_fit  = min(100, max(20, int(confidence * 0.9)))
    competition = min(100, max(20, int(trend_score * 0.7)))  # higher search = more competition
    seasonality = 0

    # Simple seasonality: check if peak is in Nov-Dec
    if win_1y and win_1y.get("data"):
        values = [p["value"] for p in win_1y["data"]]
        if len(values) >= 12:
            q4_avg   = sum(values[-3:]) / 3
            year_avg = sum(values) / len(values)
            if year_avg > 0:
                seasonality = min(100, int((q4_avg / year_avg - 1) * 100))

    return {
        "score_confidence":  confidence,
        "score_trend":       trend_score,
        "score_demand":      demand,
        "score_competition": competition,
        "score_market_fit":  market_fit,
        "score_seasonality": max(0, seasonality),
    }


def determine_risk(scores: dict) -> str:
    confidence = scores["score_confidence"]
    competition = scores["score_competition"]
    if confidence >= 80 and competition <= 70:
        return "low"
    if confidence >= 60:
        return "medium"
    return "high"


def infer_opportunity_types(scores: dict, yoy: float | None) -> list[str]:
    types = []
    if scores["score_trend"] >= 75:
        types.append("search_trend")
    if scores["score_demand"] >= 80:
        types.append("retailer_bestseller")
    if yoy and yoy >= 20:
        types.append("emerging_product")
    if scores["score_seasonality"] >= 40:
        types.append("seasonal_growth")
    if not types:
        types.append("manual_research")
    return types


# ─── Candidate name generator ─────────────────────────────────────────────────

def generate_candidate_names(source_category: str, level: str) -> list[str]:
    """
    Generate plausible sub-category candidate names from source_category.
    In production this would call an LLM or a product taxonomy API.
    Here we use a simple expansion heuristic.
    """
    base = source_category.strip()

    if level in ("L1", "L2"):
        return [base]

    # L3 / L4: generate sub-variants
    modifiers = [
        f"Smart {base}", f"Commercial {base}",
        f"Portable {base}", f"Wall-Mounted {base}",
        f"Energy-Efficient {base}",
    ]
    return modifiers[:3]


# ─── Main research pipeline ───────────────────────────────────────────────────

def run_research(run_id: str, db: SupabaseClient) -> None:
    # 1. Load run config
    rows = db.select("mcr_runs", {"id": run_id})
    if not rows:
        raise ValueError(f"Run {run_id} not found")
    run = rows[0]

    log.info(f"Starting research for run: {run['title']} ({run_id})")

    source_category  = run["source_category"]
    country          = run.get("country", "US")
    time_windows_raw = json.loads(run.get("time_windows", '["1Y","3M"]'))
    data_sources     = json.loads(run.get("data_sources", '["google_trends"]'))

    candidates_created = 0

    # 2. Generate candidate names
    candidate_names = generate_candidate_names(source_category, run.get("requested_level", "L2"))

    for name_en in candidate_names:
        log.info(f"  Processing candidate: {name_en}")

        # 3. Fetch Google Trends for each time window
        trend_windows = []
        primary_yoy   = None

        if "google_trends" in data_sources:
            for tw in time_windows_raw:
                timeframe = TIMEFRAME_MAP.get(tw, "today 12-m")
                log.info(f"    Fetching trends: {tw} ({timeframe})")
                result = fetch_trends(name_en, timeframe=timeframe, geo=country)
                time.sleep(1.5)  # Rate limit politeness

                tw_obj = {"window": tw, "data": result["data"], "yoy": result["yoy"]}
                if result.get("peak_period"):
                    tw_obj["peak_period"] = result["peak_period"]
                trend_windows.append(tw_obj)

                if tw == "1Y" and result["yoy"] is not None:
                    primary_yoy = result["yoy"]

        # 4. Compute scores
        scores   = compute_scores(name_en, trend_windows, country)
        risk     = determine_risk(scores)
        opp_types = infer_opportunity_types(scores, primary_yoy)

        # 5. Insert candidate
        candidate_id = str(uuid.uuid4())
        db.insert("mcr_candidates", {
            "id":               candidate_id,
            "run_id":           run_id,
            "name_en":          name_en,
            "name_zh":          "",   # placeholder — add translation step if needed
            "suggested_level":  run.get("requested_level", "L2"),
            "region":           run.get("region", "North America"),
            "country":          country,
            "audience":         run.get("audience", "both"),
            "score_confidence": scores["score_confidence"],
            "score_trend":      scores["score_trend"],
            "score_demand":     scores["score_demand"],
            "score_competition":scores["score_competition"],
            "score_market_fit": scores["score_market_fit"],
            "score_seasonality":scores["score_seasonality"],
            "risk_level":       risk,
            "status":           "candidate",
            "opportunity_types": json.dumps(opp_types),
            "trend_windows":    json.dumps(trend_windows),
            "evidence_count":   0,
            "created_at":       datetime.now(timezone.utc).isoformat(),
            "updated_at":       datetime.now(timezone.utc).isoformat(),
        })
        log.info(f"    Created candidate {candidate_id}")

        # 6. Write evidence records
        evidence_records = []

        if "google_trends" in data_sources and trend_windows:
            win = next((w for w in trend_windows if w["window"] == "1Y"), trend_windows[0])
            status = "cross_verified" if len(data_sources) >= 2 else "single_source"
            payload = {"trend_window": win["window"], "yoy": win.get("yoy")}
            evidence_records.append({
                "id":               str(uuid.uuid4()),
                "candidate_id":     candidate_id,
                "source":           "google_trends",
                "source_label":     "Google Trends",
                "title":            f"Search interest: \"{name_en}\" {country} {win['window']}",
                "summary":          f"YoY: {win.get('yoy', 'N/A')}%. Data points: {len(win['data'])}. Relative interest only — not sales volume.",
                "evidence_status":  status,
                "metrics":          json.dumps(payload),
                "url":              f"https://trends.google.com/trends/explore?q={name_en.replace(' ','%20')}&geo={country}",
                "raw_payload_hash": "sha256:" + hashlib.sha256(json.dumps(payload).encode()).hexdigest(),
                "fetched_at":       datetime.now(timezone.utc).isoformat(),
                "created_at":       datetime.now(timezone.utc).isoformat(),
            })

        if "manual" in data_sources:
            evidence_records.append({
                "id":               str(uuid.uuid4()),
                "candidate_id":     candidate_id,
                "source":           "manual",
                "source_label":     "Manual Research",
                "title":            f"Manual research note: {name_en}",
                "summary":          "Manually flagged during research run. Please add detailed notes.",
                "evidence_status":  "manual",
                "metrics":          None,
                "url":              None,
                "raw_payload_hash": "sha256:" + hashlib.sha256(name_en.encode()).hexdigest(),
                "fetched_at":       datetime.now(timezone.utc).isoformat(),
                "created_at":       datetime.now(timezone.utc).isoformat(),
            })

        for ev in evidence_records:
            db.insert("mcr_evidence", ev)
            log.info(f"    Evidence written: {ev['source_label']}")

        candidates_created += 1

    # 7. Mark run completed
    db.update("mcr_runs", run_id, {
        "status":       "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at":   datetime.now(timezone.utc).isoformat(),
    })
    log.info(f"Run {run_id} completed. {candidates_created} candidates created.")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="MCR Research Runner")
    parser.add_argument("--run-id",       required=True,  help="UUID of the mcr_run")
    parser.add_argument("--supabase-url", required=True,  help="Supabase project URL")
    parser.add_argument("--supabase-key", required=True,  help="Supabase service role key")
    args = parser.parse_args()

    db = SupabaseClient(args.supabase_url, args.supabase_key)

    try:
        run_research(args.run_id, db)
    except Exception:
        log.error(f"Research failed for run {args.run_id}:\n{traceback.format_exc()}")
        try:
            db.update("mcr_runs", args.run_id, {
                "status":     "failed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    main()
