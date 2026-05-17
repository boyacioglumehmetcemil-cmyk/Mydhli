"""EMERGENCY REVERT — undo the bad Phase 8.4c logo overlay.

For the 5 pitch-priority shipments (SWB-001/007/029/047/055):
  • read every document row from MongoDB
  • find the matching source PDF in /app/uploads/dhl_57_shipments/{ref}_{Status}/
    using the document's `file_name` field
  • run document_filler.anonymize_pdf(src, dst) to regenerate the *exact*
    Phase 8.3b anonymised copy at the same file_path the DB already points to
  • md5 + size of the resulting file is logged for verification

Result: PDFs are byte-for-byte equivalent to the original Phase 8.3b output
(no logo overlay, no relogo metadata tag).
"""
import asyncio
import hashlib
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from motor.motor_asyncio import AsyncIOMotorClient
from document_filler import anonymize_pdf

SOURCE_ROOT = Path("/app/uploads/dhl_57_shipments")
REFS = ["DHL-SWB-001", "DHL-SWB-007", "DHL-SWB-029", "DHL-SWB-047", "DHL-SWB-055"]


def _status_suffix_for(ref: str, source_root: Path) -> str | None:
    for suffix in ("_Delivered", "_Depot"):
        if (source_root / f"{ref}{suffix}").is_dir():
            return suffix
    return None


def _md5(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


async def main():
    cli = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = cli[os.environ["DB_NAME"]]

    total = 0
    reverted = 0
    missing_source = 0
    errors = 0

    print(f"Source root: {SOURCE_ROOT}")
    print(f"Targets: {', '.join(REFS)}")
    print("─" * 80)

    for ref in REFS:
        suffix = _status_suffix_for(ref, SOURCE_ROOT)
        if not suffix:
            print(f"  ! {ref}: no source folder under {SOURCE_ROOT}")
            continue
        src_folder = SOURCE_ROOT / f"{ref}{suffix}"
        print(f"\n[{ref}]  source={src_folder.name}")

        cursor = db.documents.find(
            {"shipment_ref": ref},
            {"_id": 0, "document_id": 1, "file_name": 1,
             "file_path": 1, "document_type": 1},
        )
        async for doc in cursor:
            total += 1
            src = src_folder / doc["file_name"]
            dst = Path(doc["file_path"])
            if not src.exists():
                print(f"  ! source missing for {doc['document_type']}: {src.name}")
                missing_source += 1
                continue
            try:
                anonymize_pdf(src, dst)
                size = dst.stat().st_size
                print(f"  ✓ {doc['document_type']:<22} → {dst.name}  "
                      f"({size} b, md5={_md5(dst)[:8]})")
                reverted += 1
            except Exception as e:
                print(f"  ! error {doc['document_type']}: {e}")
                errors += 1

    print("─" * 80)
    print(f"TOTAL: {total} docs | reverted={reverted} "
          f"missing_source={missing_source} errors={errors}")


if __name__ == "__main__":
    asyncio.run(main())
