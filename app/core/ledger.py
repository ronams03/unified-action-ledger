import hashlib
import json
from typing import Any, Dict


def compute_entry_hash(payload: Dict[str, Any], prev_hash: str | None) -> str:
	data = {
		"prev_hash": prev_hash or "",
		"payload": payload,
	}
	encoded = json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
	return hashlib.sha256(encoded).hexdigest()