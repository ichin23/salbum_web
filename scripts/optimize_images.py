#!/usr/bin/env python3
"""
Optimize images in an Oracle Cloud Object Storage bucket and/or
delete orphaned images not referenced in a PostgreSQL database.

Modes:
  1) Optimize — downloads images > threshold, compresses (resize + quality),
     re-uploads in place.
  2) Cleanup — finds images in the bucket that have no matching row in
     the database and deletes them.

Usage:
    # Optimize
    python scripts/optimize_images.py --bucket my-bucket --prefix albums/

    # Cleanup orphans (dry-run first)
    python scripts/optimize_images.py --bucket my-bucket --cleanup --db-url postgresql://user:pass@host/db --dry-run

    # Cleanup for real
    python scripts/optimize_images.py --bucket my-bucket --cleanup --db-url postgresql://user:pass@host/db

    # Both: optimize first, then cleanup
    python scripts/optimize_images.py --bucket my-bucket --cleanup --db-url postgresql://user:pass@host/db
"""

import argparse
import io
import os
import re
import sys
import concurrent.futures
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Set

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Install Pillow: pip install Pillow")
    sys.exit(1)

try:
    import oci
except ImportError:
    print("Install OCI SDK: pip install oci")
    sys.exit(1)

try:
    import psycopg2
except ImportError:
    print("Install psycopg2: pip install psycopg2-binary")
    sys.exit(1)


# ─── Config ───────────────────────────────────────────────────────────────────

@dataclass
class Config:
    bucket: str
    namespace: Optional[str]
    prefix: str
    max_width: int
    max_height: int
    quality: int
    max_file_size_mb: int
    output_format: str
    concurrency: int
    dry_run: bool
    profile: str
    config_file: str
    skip_webp: bool
    delete_original: bool
    cleanup: bool
    db_url: Optional[str]
    image_query: Optional[str]
    url_prefix: str


COLUMN_NAME_PATTERNS = [
    "image_url", "photo_url", "picture_url",
    "avatar_url", "cover_url", "profile_image",
    "background_image", "thumbnail_url", "banner_url",
]


def parse_args() -> Config:
    p = argparse.ArgumentParser(
        description="Optimize and/or clean up images in OCI Object Storage",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/optimize_images.py --bucket my-bucket --prefix albums/
  python scripts/optimize_images.py --bucket my-bucket --cleanup --db-url postgresql://user:pass@host/db --dry-run
  python scripts/optimize_images.py --bucket my-bucket --cleanup --db-url $DATABASE_URL
        """,
    )

    # ── OCI ──
    p.add_argument("--bucket", required=True, help="Bucket name")
    p.add_argument("--namespace", help="Object storage namespace (default: auto-detect)")
    p.add_argument("--prefix", default="", help="Prefix filter (e.g. albums/)")
    p.add_argument("--profile", default=os.environ.get("OCI_PROFILE", "DEFAULT"), help="OCI config profile")
    p.add_argument("--config-file", default=os.environ.get("OCI_CONFIG_FILE", str(Path.home() / ".oci" / "config")), help="OCI config file path")

    # ── Optimize ──
    p.add_argument("--max-width", type=int, default=1200, help="Max width in px (default: 1200)")
    p.add_argument("--max-height", type=int, default=1200, help="Max height in px (default: 1200)")
    p.add_argument("--quality", type=int, default=80, help="JPEG/WebP quality 1-100 (default: 80)")
    p.add_argument("--max-file-size-mb", type=int, default=1, help="Only optimize files above this size in MB (default: 1)")
    p.add_argument("--output-format", choices=["jpeg", "png", "webp", "keep"], default="webp", help="Output format (default: webp)")
    p.add_argument("--skip-webp", action="store_true", help="Skip files ending in .webp")
    p.add_argument("--delete-original", action="store_true", help="Delete original after converting (only if format changes)")

    # ── Cleanup ──
    p.add_argument("--cleanup", action="store_true", help="Delete orphaned images not referenced in the database")
    p.add_argument("--db-url", default=os.environ.get("DATABASE_URL"), help="PostgreSQL connection string")
    p.add_argument("--image-query", help="Override auto-discovered query. SQL returning all image URLs/paths from the DB")
    p.add_argument("--url-prefix", default="", help="URL prefix to strip from DB paths to get the OCI object key (e.g. https://bucket.objectstorage.region.oraclecloud.com/)")

    # ── General ──
    p.add_argument("--concurrency", type=int, default=5, help="Parallel operations (default: 5)")
    p.add_argument("--dry-run", action="store_true", help="List what would be done without modifying")

    args = p.parse_args()

    if args.cleanup and not args.db_url:
        p.error("--db-url (or DATABASE_URL env) is required when --cleanup is set")

    return Config(
        bucket=args.bucket,
        namespace=args.namespace,
        prefix=args.prefix,
        max_width=args.max_width,
        max_height=args.max_height,
        quality=args.quality,
        max_file_size_mb=args.max_file_size_mb,
        output_format=args.output_format,
        concurrency=args.concurrency,
        dry_run=args.dry_run,
        profile=args.profile,
        config_file=args.config_file,
        skip_webp=args.skip_webp,
        delete_original=args.delete_original,
        cleanup=args.cleanup,
        db_url=args.db_url,
        image_query=args.image_query,
        url_prefix=args.url_prefix,
    )


# ─── OCI Helpers ──────────────────────────────────────────────────────────────

def get_os_client(cfg: Config) -> oci.object_storage.ObjectStorageClient:
    try:
        config = oci.config.from_file(cfg.config_file, cfg.profile)
    except Exception as e:
        print(f"Failed to load OCI config from {cfg.config_file} [{cfg.profile}]: {e}")
        sys.exit(1)
    return oci.object_storage.ObjectStorageClient(config)


def get_namespace(client: oci.object_storage.ObjectStorageClient, cfg: Config) -> str:
    if cfg.namespace:
        return cfg.namespace
    return client.get_namespace().data


def list_all_objects(
    client: oci.object_storage.ObjectStorageClient,
    namespace: str,
    cfg: Config,
):
    """List every object under prefix (any extension)."""
    objects = []
    next_start = None
    while True:
        resp = client.list_objects(
            namespace,
            cfg.bucket,
            prefix=cfg.prefix,
            start=next_start,
            fields="size",
        )
        objects.extend(resp.data.objects)
        if resp.data.next_start_with is None:
            break
        next_start = resp.data.next_start_with
    return objects


def list_images(client: oci.object_storage.ObjectStorageClient, namespace: str, cfg: Config):
    """List image files >= max_file_size_mb."""
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    objects = []
    next_start = None

    while True:
        resp = client.list_objects(
            namespace,
            cfg.bucket,
            prefix=cfg.prefix,
            start=next_start,
            fields="size",
        )
        for obj in resp.data.objects:
            ext = Path(obj.name).suffix.lower()
            if ext in image_extensions:
                if cfg.skip_webp and ext == ".webp":
                    continue
                size_mb = (obj.size or 0) / (1024 * 1024)
                if size_mb >= cfg.max_file_size_mb:
                    objects.append(obj)
        if resp.data.next_start_with is None:
            break
        next_start = resp.data.next_start_with

    return objects


# ─── Database Helpers ─────────────────────────────────────────────────────────

def discover_image_columns(conn) -> list[tuple[str, str]]:
    """Auto-discover tables and columns likely to hold image URLs.

    Returns list of (schema.table, column_name).
    """
    pattern_sql = " OR ".join(
        f"c.column_name ILIKE '{p}'" for p in COLUMN_NAME_PATTERNS
    )
    sql = f"""
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns c
        WHERE ({pattern_sql})
          AND c.data_type IN ('text', 'character varying', 'varchar')
          AND c.table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    if not rows:
        print("  No image columns auto-discovered. Use --image-query to specify manually.")
        return []

    print(f"  Discovered {len(rows)} image column(s):")
    for sch, tbl, col in rows:
        t = f"{sch}.{tbl}" if sch != "public" else tbl
        print(f"    - {t}.{col}")

    return [(r[0], r[1], r[2]) for r in rows]


def build_auto_query(columns: list[tuple[str, str, str]]) -> str:
    """Build a UNION query from discovered (schema, table, column) tuples."""
    parts = []
    for sch, tbl, col in columns:
        full_table = f"{sch}.{tbl}" if sch != "public" else tbl
        parts.append(f"SELECT {col} FROM {full_table} WHERE {col} IS NOT NULL AND {col} != ''")
    return " UNION ".join(parts)


def fetch_db_image_keys(cfg: Config) -> Set[str]:
    """Return the set of OCI object keys that are referenced in the database."""
    print(f"Connecting to database ...")
    try:
        conn = psycopg2.connect(cfg.db_url)
    except Exception as e:
        print(f"Database connection failed: {e}")
        sys.exit(1)

    keys: Set[str] = set()
    try:
        if cfg.image_query:
            sql = cfg.image_query
            print(f"  Using manual --image-query")
        else:
            cols = discover_image_columns(conn)
            if not cols:
                return keys
            sql = build_auto_query(cols)

        with conn.cursor() as cur:
            cur.execute(sql)
            for row in cur.fetchall():
                raw = row[0]
                if not raw:
                    continue
                key = _url_to_key(raw, cfg.url_prefix)
                if key:
                    keys.add(key)
    except Exception as e:
        print(f"Query failed: {e}")
        sys.exit(1)
    finally:
        conn.close()

    print(f"Found {len(keys)} image references in the database")
    return keys


def _url_to_key(url: str, prefix: str) -> Optional[str]:
    """Convert a URL like 'https://bucket.oci.com/albums/abc.jpg' to 'albums/abc.jpg'."""
    if prefix and url.startswith(prefix):
        return url[len(prefix):].lstrip("/")

    # Try to extract the path portion if it looks like an OCI object URL
    # e.g. 'https://bucket.namespace.objectstorage.region.oraclecloud.com/n/b/o/img.jpg'
    m = re.search(r"/o/(.+)", url)
    if m:
        path = m.group(1)
        return path.split("?")[0]  # strip query params

    # If it's already a relative path, return as-is
    if not url.startswith("http"):
        return url.lstrip("/")

    # Last resort: take everything after the last /o/ or just the path component
    parsed = url.split("/")
    return "/".join(parsed[3:]) if len(parsed) > 3 else None


# ─── Image Optimization ───────────────────────────────────────────────────────

def optimize_image_bytes(data: bytes, cfg: Config) -> Optional[bytes]:
    try:
        img = Image.open(io.BytesIO(data))
    except Exception as e:
        print(f"  Could not open image: {e}")
        return None

    original_format = img.format or "JPEG"

    if cfg.output_format == "jpeg" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    if img.width > cfg.max_width or img.height > cfg.max_height:
        img = ImageOps.contain(img, (cfg.max_width, cfg.max_height), Image.LANCZOS)

    fmt = cfg.output_format if cfg.output_format != "keep" else original_format

    buf = io.BytesIO()
    kwargs: dict = {}

    if fmt.upper() == "JPEG":
        kwargs["format"] = "JPEG"
        kwargs["quality"] = cfg.quality
        kwargs["optimize"] = True
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
    elif fmt.upper() == "PNG":
        kwargs["format"] = "PNG"
        kwargs["optimize"] = True
    elif fmt.upper() == "WEBP":
        kwargs["format"] = "WEBP"
        kwargs["quality"] = cfg.quality
    else:
        kwargs["format"] = original_format
        kwargs["quality"] = cfg.quality

    try:
        img.save(buf, **kwargs)
    except Exception as e:
        print(f"  Failed to save optimized image: {e}")
        return None

    optimized = buf.getvalue()
    return optimized if len(optimized) < len(data) else None


# ─── Optimize Worker ──────────────────────────────────────────────────────────

@dataclass
class OptResult:
    name: str
    original_size: int
    optimized_size: int
    skipped: bool
    error: Optional[str]


def process_optimize(
    obj,
    client: oci.object_storage.ObjectStorageClient,
    namespace: str,
    cfg: Config,
) -> OptResult:
    name = obj.name
    original_size = obj.size or 0

    if cfg.dry_run:
        mb = original_size / (1024 * 1024)
        print(f"  Would optimize: {name} ({mb:.1f} MB)")
        return OptResult(name, original_size, 0, skipped=False, error=None)

    try:
        resp = client.get_object(namespace, cfg.bucket, name)
        data = resp.data.content
    except Exception as e:
        msg = f"Download failed: {e}"
        print(f"  {msg}")
        return OptResult(name, original_size, 0, skipped=False, error=msg)

    optimized = optimize_image_bytes(data, cfg)
    if optimized is None:
        mb_orig = original_size / (1024 * 1024)
        print(f"  Skipped {name} ({mb_orig:.1f} MB, not smaller)")
        return OptResult(name, original_size, 0, skipped=True, error=None)

    out_format = cfg.output_format if cfg.output_format != "keep" else (Image.open(io.BytesIO(data)).format or "jpeg").lower()
    new_name = str(Path(name).with_suffix(f".{out_format}"))

    try:
        client.put_object(
            namespace,
            cfg.bucket,
            new_name,
            optimized,
            content_type=f"image/{out_format}",
        )
    except Exception as e:
        msg = f"Upload failed: {e}"
        print(f"  {msg}")
        return OptResult(name, original_size, 0, skipped=False, error=msg)

    mb_orig = original_size / (1024 * 1024)
    mb_opt = len(optimized) / (1024 * 1024)
    pct = 100 - (len(optimized) / original_size * 100) if original_size else 0
    print(f"  Optimized {name} → {new_name} ({mb_orig:.1f} MB → {mb_opt:.1f} MB, -{pct:.0f}%)")

    if cfg.delete_original and new_name != name:
        try:
            client.delete_object(namespace, cfg.bucket, name)
            print(f"  Deleted original {name}")
        except Exception as e:
            print(f"  Warning: could not delete original {name}: {e}")

    return OptResult(name, original_size, len(optimized), skipped=False, error=None)


# ─── Cleanup Workers ──────────────────────────────────────────────────────────

def process_delete(
    obj,
    client: oci.object_storage.ObjectStorageClient,
    namespace: str,
    cfg: Config,
) -> OptResult:
    name = obj.name
    size = obj.size or 0
    mb = size / (1024 * 1024)

    if cfg.dry_run:
        print(f"  Would delete: {name} ({mb:.1f} MB)")
        return OptResult(name, size, 0, skipped=False, error=None)

    try:
        client.delete_object(namespace, cfg.bucket, name)
        print(f"  Deleted: {name} ({mb:.1f} MB)")
    except Exception as e:
        msg = f"Delete failed: {e}"
        print(f"  {msg}")
        return OptResult(name, size, 0, skipped=False, error=msg)

    return OptResult(name, size, 0, skipped=False, error=None)


# ─── Main ─────────────────────────────────────────────────────────────────────

def run_optimize(client, namespace, cfg):
    print(f"\n=== OPTIMIZE ===\n")
    print(f"Listing images in oci://{namespace}/{cfg.bucket}/{cfg.prefix} ...")
    objects = list_images(client, namespace, cfg)
    print(f"Found {len(objects)} images >= {cfg.max_file_size_mb} MB")

    if not objects:
        return

    if cfg.dry_run:
        print("\nDRY RUN — no changes will be made\n")

    total_original = 0
    total_optimized = 0
    total_skipped = 0
    errors = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=cfg.concurrency) as exec:
        fut_map = {
            exec.submit(process_optimize, obj, client, namespace, cfg): obj
            for obj in objects
        }
        for fut in concurrent.futures.as_completed(fut_map):
            r = fut.result()
            if r.error:
                errors += 1
            elif r.skipped:
                total_skipped += 1
            else:
                total_original += r.original_size
                total_optimized += r.optimized_size

    if not cfg.dry_run:
        mb_orig = total_original / (1024 * 1024)
        mb_opt = total_optimized / (1024 * 1024)
        saved = mb_orig - mb_opt
        pct = 100 - (mb_opt / mb_orig * 100) if mb_orig else 0
        print(f"\nOptimize done. {len(objects) - total_skipped - errors} optimized, "
              f"{total_skipped} skipped, {errors} errors")
        print(f"Total: {mb_orig:.1f} MB → {mb_opt:.1f} MB ({saved:.1f} MB saved, -{pct:.0f}%)")


def run_cleanup(client, namespace, cfg):
    print(f"\n=== CLEANUP ORPHANS ===\n")

    db_keys = fetch_db_image_keys(cfg)

    print(f"Listing all objects in oci://{namespace}/{cfg.bucket}/{cfg.prefix} ...")
    all_objects = list_all_objects(client, namespace, cfg)
    print(f"Total objects in bucket: {len(all_objects)}")

    orphan_objects = [o for o in all_objects if o.name not in db_keys]
    total_mb = sum((o.size or 0) for o in orphan_objects) / (1024 * 1024)

    print(f"Orphans to delete: {len(orphan_objects)} ({total_mb:.1f} MB)")

    if not orphan_objects:
        print("Nothing to clean up!")
        return

    if cfg.dry_run:
        print("\nDRY RUN — no deletions will be made\n")
        for o in orphan_objects[:20]:
            mb = (o.size or 0) / (1024 * 1024)
            print(f"  {o.name} ({mb:.1f} MB)")
        if len(orphan_objects) > 20:
            print(f"  ... and {len(orphan_objects) - 20} more")
        return

    confirm = input(f"\nDelete {len(orphan_objects)} orphan images ({total_mb:.1f} MB)? [y/N] ")
    if confirm.lower() != "y":
        print("Aborted.")
        return

    errors = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=cfg.concurrency) as exec:
        fut_map = {
            exec.submit(process_delete, obj, client, namespace, cfg): obj
            for obj in orphan_objects
        }
        for fut in concurrent.futures.as_completed(fut_map):
            r = fut.result()
            if r.error:
                errors += 1

    print(f"\nCleanup done. {len(orphan_objects) - errors} deleted, {errors} errors")


def main():
    cfg = parse_args()
    client = get_os_client(cfg)
    namespace = get_namespace(client, cfg)

    if cfg.cleanup:
        run_cleanup(client, namespace, cfg)
    else:
        run_optimize(client, namespace, cfg)


if __name__ == "__main__":
    main()
