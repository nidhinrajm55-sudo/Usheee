"""
Append-Only, Hash-Chained Tamper-Evident Audit Log for Tracer (Section 7.8).
Implements AUD-1 through AUD-4.
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

class AuditLogger:
    def __init__(self):
        self.entries: List[Dict[str, Any]] = []
        self.genesis_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    def _compute_chained_hash(self, prev_hash: str, timestamp: str, actor: str, event_type: str, payload_str: str) -> str:
        s = f"{prev_hash}|{timestamp}|{actor}|{event_type}|{payload_str}"
        return hashlib.sha256(s.encode("utf-8")).hexdigest()

    def record_event(self, actor: str, event_type: str, payload: Dict[str, Any], incident_id: Optional[str] = None) -> Dict[str, Any]:
        """Appends an immutable audit entry chained to the previous entry hash (AUD-1, AUD-2)."""
        prev_hash = self.entries[-1]["entry_hash"] if self.entries else self.genesis_hash
        ts = datetime.now(timezone.utc).isoformat()
        payload_str = json.dumps(payload, sort_keys=True, default=str)

        entry_hash = self._compute_chained_hash(prev_hash, ts, actor, event_type, payload_str)
        entry = {
            "id": f"AUD_{len(self.entries) + 1:04d}",
            "incident_id": incident_id or "GENERAL",
            "timestamp": ts,
            "actor": actor,
            "event_type": event_type,
            "payload": payload,
            "prev_hash": prev_hash,
            "entry_hash": entry_hash
        }
        self.entries.append(entry)
        return entry

    def get_entries(self, incident_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if incident_id:
            return [e for e in self.entries if e.get("incident_id") == incident_id]
        return list(self.entries)

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """Validates that every single hash link in the chain is untampered."""
        prev = self.genesis_hash
        for idx, entry in enumerate(self.entries):
            payload_str = json.dumps(entry["payload"], sort_keys=True, default=str)
            expected_hash = self._compute_chained_hash(
                prev, entry["timestamp"], entry["actor"], entry["event_type"], payload_str
            )
            if entry["entry_hash"] != expected_hash or entry["prev_hash"] != prev:
                return {
                    "valid": False,
                    "tampered_at_index": idx,
                    "tampered_entry_id": entry["id"]
                }
            prev = entry["entry_hash"]
        return {"valid": True, "total_verified_entries": len(self.entries)}

    def export_json(self) -> str:
        return json.dumps(self.entries, indent=2)
