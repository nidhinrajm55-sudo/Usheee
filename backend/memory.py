"""
Incident Memory and Similar Incident Retrieval for Tracer (Section 7.11).
Implements MEM-1 through MEM-4.
Stores symptom signatures on resolution, retrieves them on repeat incidents,
and surfaces them as prioritized hypotheses with speedup benchmarking.
"""
from typing import Dict, Any, List, Optional
import time

class IncidentMemory:
    def __init__(self):
        self.records: List[Dict[str, Any]] = []

    def clear(self):
        """MEM-4: Cleared on reset."""
        self.records = []

    def store_resolution(
        self,
        incident_id: str,
        pack: str,
        symptom_signature: Dict[str, Any],
        root_cause: str,
        fix_action: str,
        target_asset: str,
        time_to_resolve_seconds: float,
        outcome: str = "RESOLVED"
    ):
        """MEM-1: Store resolution signature upon incident closure."""
        rec = {
            "incident_id": incident_id,
            "pack": pack,
            "symptom_signature": symptom_signature,
            "root_cause": root_cause,
            "fix_action": fix_action,
            "target_asset": target_asset,
            "time_to_resolve_seconds": round(time_to_resolve_seconds, 2),
            "outcome": outcome,
            "timestamp": time.time()
        }
        self.records.append(rec)
        return rec

    def find_similar_incident(self, pack: str, current_symptom: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        MEM-2: Retrieve similar past incidents based on structured signature matching.
        Surfaced as a hypothesis to test, NOT as an unverified answer.
        """
        if not self.records:
            return None

        best_match = None
        highest_score = 0.0

        target_asset = current_symptom.get("target_asset")
        failing_check = current_symptom.get("failing_check")
        symptom_type = current_symptom.get("symptom_type")

        for r in self.records:
            if r["pack"] != pack:
                continue
            score = 0.0
            r_sig = r["symptom_signature"]
            if r["target_asset"] == target_asset:
                score += 0.45
            if r_sig.get("failing_check") == failing_check:
                score += 0.35
            if r_sig.get("symptom_type") == symptom_type:
                score += 0.20

            if score > highest_score and score >= 0.5:
                highest_score = score
                best_match = r

        if best_match:
            return {
                "similarity_score": round(highest_score, 2),
                "prior_incident_id": best_match["incident_id"],
                "prior_root_cause": best_match["root_cause"],
                "prior_fix": best_match["fix_action"],
                "prior_time_to_resolve_s": best_match["time_to_resolve_seconds"],
                "suggested_hypothesis": f"Prior incident {best_match['incident_id']} resolved via '{best_match['fix_action']}': test '{best_match['root_cause']}' first."
            }
        return None
