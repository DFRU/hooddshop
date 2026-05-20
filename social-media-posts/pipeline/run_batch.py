#!/usr/bin/env python3
"""
Hood'd Social Media Batch Runner
==================================
Spawns a fresh process per image to avoid state/memory issues.

Usage:
    python run_batch.py --test                    # Argentina only, all concepts
    python run_batch.py --test-all                # Argentina all concepts + both APIs
    python run_batch.py --nations Argentina,Mexico,USA --concepts meetup,beauty
    python run_batch.py --priority                # Tier 1 nations (opening match + biggest diasporas)
    python run_batch.py --full                    # All 48 nations, key concepts
    python run_batch.py --dry-run                 # Print what would run, no API calls
"""
import sys
import os
import subprocess
import time
import argparse
import json
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
SINGLE_SCRIPT = SCRIPT_DIR / "generate_social.py"
LOG_DIR = SCRIPT_DIR / "logs"

# Try to find Python — adjust if yours is different
PYTHON_CANDIDATES = [
    sys.executable,  # whatever is running this script
    r"C:\Python314\python.exe",
    r"C:\Python312\python.exe",
    r"C:\Python311\python.exe",
    "python",
]

def find_python():
    for p in PYTHON_CANDIDATES:
        try:
            result = subprocess.run([p, "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return p
        except Exception:
            continue
    return "python"

PYTHON = find_python()

# ── Nation priorities ──────────────────────────────────────────────────────

TIER_1 = [
    "Mexico",       # Opening match host city, massive US diaspora
    "USA",          # Co-host
    "Argentina",    # Defending champions
    "Brazil",       # Largest football culture
    "Colombia",     # Huge US diaspora (Miami, NJ, Houston)
    "England",      # Global following
    "France",       # Defending runners-up
    "Germany",      # Large fanbase
]

TIER_2 = [
    "Spain", "Portugal", "Netherlands", "Italy", "Japan", "South_Korea",
    "Morocco", "Egypt", "Nigeria", "Croatia", "Canada", "Ecuador",
]

ALL_48 = [
    "Algeria", "Argentina", "Australia", "Austria", "Belgium", "Bosnia",
    "Brazil", "Canada", "Cape_Verde", "Colombia", "Croatia", "Curacao",
    "Czech_Republic", "DR_Congo", "Ecuador", "Egypt", "England", "France",
    "Germany", "Ghana", "Haiti", "Iran", "Iraq", "Ivory_Coast", "Japan",
    "Jordan", "Mexico", "Morocco", "Netherlands", "New_Zealand", "Norway",
    "Panama", "Paraguay", "Portugal", "Qatar", "Saudi_Arabia", "Scotland",
    "Senegal", "South_Africa", "South_Korea", "Spain", "Sweden",
    "Switzerland", "Tunisia", "Turkey", "Uruguay", "USA", "Uzbekistan",
]

ALL_CONCEPTS = ["meetup", "meetup_cinematic", "landmark", "beauty", "matchday", "beforeafter", "collection"]
CORE_CONCEPTS = ["meetup_cinematic", "beauty", "landmark"]  # minimum viable set per nation

DELAY_BETWEEN = 5  # seconds between API calls


def build_manifest(nations, concepts, api="gemini", vehicle="sedan"):
    """Build list of jobs to run."""
    jobs = []
    for nation in nations:
        for concept in concepts:
            jobs.append({
                "nation": nation,
                "concept": concept,
                "vehicle": vehicle,
                "api": api,
            })
    return jobs


def run_job(job, dry_run=False):
    """Run a single generation job as a subprocess."""
    cmd = [
        PYTHON, str(SINGLE_SCRIPT),
        job["nation"], job["concept"],
        "--vehicle", job["vehicle"],
        "--api", job["api"],
    ]
    if dry_run:
        cmd.append("--dry-run")

    print(f"\n{'='*60}")
    print(f"[JOB] {job['nation']} / {job['concept']} / {job['vehicle']} / {job['api']}")
    print(f"  CMD: {' '.join(cmd)}")

    start = time.time()
    try:
        result = subprocess.run(
            cmd,
            capture_output=True, text=True, timeout=300,  # 5 min timeout per image
            encoding="utf-8", errors="replace",
        )
        elapsed = time.time() - start

        # Print output
        if result.stdout:
            for line in result.stdout.strip().splitlines():
                print(f"  {line}")
        if result.stderr:
            for line in result.stderr.strip().splitlines():
                print(f"  [stderr] {line}")

        success = result.returncode == 0
        status = "OK" if success else f"FAIL (exit {result.returncode})"
        print(f"  [{status}] {elapsed:.1f}s")
        return success

    except subprocess.TimeoutExpired:
        print(f"  [TIMEOUT] Killed after 300s")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Hood'd social media batch runner")
    parser.add_argument("--test", action="store_true",
                        help="Argentina only, all concepts, gemini")
    parser.add_argument("--test-all", action="store_true",
                        help="Argentina, all concepts, both APIs")
    parser.add_argument("--priority", action="store_true",
                        help="Tier 1 nations, core concepts")
    parser.add_argument("--full", action="store_true",
                        help="All 48 nations, core concepts")
    parser.add_argument("--nations", type=str, default=None,
                        help="Comma-separated nation names")
    parser.add_argument("--concepts", type=str, default=None,
                        help="Comma-separated concept names")
    parser.add_argument("--api", default="gemini", choices=["gemini", "openai", "both"])
    parser.add_argument("--vehicle", default="sedan", choices=["sedan", "suv", "truck", "coupe"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    # Determine nations and concepts
    if args.test:
        nations = ["Argentina"]
        concepts = ALL_CONCEPTS
        api = "gemini"
    elif args.test_all:
        nations = ["Argentina"]
        concepts = ALL_CONCEPTS
        api = "both"
    elif args.priority:
        nations = TIER_1
        concepts = CORE_CONCEPTS
        api = args.api
    elif args.full:
        nations = ALL_48
        concepts = CORE_CONCEPTS
        api = args.api
    elif args.nations:
        nations = [n.strip() for n in args.nations.split(",")]
        concepts = [c.strip() for c in args.concepts.split(",")] if args.concepts else CORE_CONCEPTS
        api = args.api
    else:
        parser.print_help()
        return

    # Build job manifest
    if api == "both":
        jobs = build_manifest(nations, concepts, "gemini", args.vehicle)
        jobs += build_manifest(nations, concepts, "openai", args.vehicle)
    else:
        jobs = build_manifest(nations, concepts, api, args.vehicle)

    # Summary
    print(f"Hood'd Social Media Pipeline")
    print(f"{'='*60}")
    print(f"  Nations:  {len(nations)} ({', '.join(nations[:5])}{'...' if len(nations)>5 else ''})")
    print(f"  Concepts: {len(concepts)} ({', '.join(concepts)})")
    print(f"  API:      {api}")
    print(f"  Vehicle:  {args.vehicle}")
    print(f"  Total:    {len(jobs)} images")
    print(f"  Est time: ~{len(jobs) * 45 // 60} min (at ~40s/image + {DELAY_BETWEEN}s delay)")
    print(f"  Python:   {PYTHON}")
    print(f"  Dry run:  {args.dry_run}")
    print(f"{'='*60}")

    # Confirm
    if not args.dry_run and len(jobs) > 3:
        answer = input(f"\nProceed with {len(jobs)} API calls? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted.")
            return

    # Execute
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOG_DIR / f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"

    results = {"ok": 0, "fail": 0, "total": len(jobs)}
    start_all = time.time()

    for i, job in enumerate(jobs):
        print(f"\n[{i+1}/{len(jobs)}]", end="")
        success = run_job(job, dry_run=args.dry_run)

        if success:
            results["ok"] += 1
        else:
            results["fail"] += 1

        # Log
        with open(log_file, "a") as f:
            f.write(json.dumps({**job, "success": success, "timestamp": datetime.now().isoformat()}) + "\n")

        # Delay between API calls (skip on dry run or last job)
        if not args.dry_run and i < len(jobs) - 1:
            print(f"  [WAIT] {DELAY_BETWEEN}s...")
            time.sleep(DELAY_BETWEEN)

    # Summary
    elapsed_all = time.time() - start_all
    print(f"\n{'='*60}")
    print(f"BATCH COMPLETE")
    print(f"  OK:      {results['ok']}/{results['total']}")
    print(f"  Failed:  {results['fail']}/{results['total']}")
    print(f"  Time:    {elapsed_all:.0f}s ({elapsed_all/60:.1f} min)")
    print(f"  Log:     {log_file}")
    print(f"  Output:  {Path(r'C:\\Dev\\hooddshop\\social-media-posts\\output')}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
