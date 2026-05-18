"""Turkish BIN (Bank Identification Number) lookup service.

Source: berkaybucan/turkey-bin-list (GitHub)
Identifies card network (Visa/Mastercard/Troy), type (Credit/Debit),
and issuer bank from first 6 digits of card number.

Data structure (1875 records):
  {"BIN": "405040", "Network": "VISA", "Type": "DEBIT",
   "Category": "CLASSIC", "Issuer": "FUPS BANK ANONIM SIRKETI"}
"""
from __future__ import annotations

import json
import logging
import os

log = logging.getLogger(__name__)

_BIN_DATA: dict[str, dict] = {}


def _load_bin_data() -> None:
    """Lazy-load BIN data from JSON file."""
    global _BIN_DATA
    if _BIN_DATA:
        return

    bin_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "01_raw", "turkey_bin_list.json"
    )
    if not os.path.exists(bin_path):
        log.warning("BIN data not found at %s", bin_path)
        return

    with open(bin_path, encoding="utf-8") as f:
        raw = json.load(f)

    # Index by BIN prefix for O(1) lookup
    if isinstance(raw, list):
        for entry in raw:
            bin_key = str(entry.get("BIN", entry.get("bin", "")))
            if bin_key:
                _BIN_DATA[bin_key] = entry
    elif isinstance(raw, dict):
        _BIN_DATA = raw

    log.info("Loaded %d BIN records", len(_BIN_DATA))


def lookup_bin(card_first_6: str) -> dict | None:
    """Lookup card info from first 6 digits.

    Returns: {"bin": "405040", "network": "VISA", "type": "DEBIT",
              "category": "CLASSIC", "issuer": "..."}
    or None if not found.
    """
    _load_bin_data()
    prefix = str(card_first_6).strip()[:6]
    entry = _BIN_DATA.get(prefix)
    if not entry:
        return None

    return {
        "bin": prefix,
        "network": entry.get("Network", entry.get("network", "Unknown")),
        "type": entry.get("Type", entry.get("type", "Unknown")),
        "category": entry.get("Category", entry.get("category", "Unknown")),
        "issuer": entry.get("Issuer", entry.get("issuer", "Unknown")),
    }
