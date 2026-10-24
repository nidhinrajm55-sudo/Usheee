"""
Generic Read-Only Tool Layer for Tracer (Section 7.2).
Enforces:
1. Returns ONLY metadata and aggregates, NEVER raw records (enforced in code).
2. JSON schema definitions for each tool.
3. Every tool execution produces a unique tool_result_id and SHA-256 hash for citation verification.
"""
import hashlib
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.environment import SimulatedEnvironment

class ToolRegistry:
    def __init__(self, env: SimulatedEnvironment, pack_loader):
        self.env = env
        self.pack_loader = pack_loader
        self.execution_history: List[Dict[str, Any]] = []

    def _hash_payload(self, obj: Any) -> str:
        s = json.dumps(obj, sort_keys=True, default=str)
        return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]

    def _record_result(self, tool_name: str, inputs: Dict[str, Any], output_data: Dict[str, Any]) -> Dict[str, Any]:
        result_id = f"TR_{tool_name}_{len(self.execution_history) + 1:03d}"
        res_hash = self._hash_payload(output_data)
        record = {
            "id": result_id,
            "tool": tool_name,
            "inputs": inputs,
            "output": output_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hash": res_hash
        }
        self.execution_history.append(record)
        return record

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Returns JSON schemas for all 13 generic read-only tools."""
        return [
            {
                "name": "get_metric_history",
                "description": "Fetch aggregated time-series metrics for an asset (e.g. latency, throughput). Returns aggregates only.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"},
                        "metric_name": {"type": "string"},
                        "time_window_minutes": {"type": "integer", "default": 60}
                    },
                    "required": ["asset_id", "metric_name"]
                }
            },
            {
                "name": "compare_to_baseline",
                "description": "Compare today's ingested counts/volume against trailing 30-day baseline average. Returns delta and percentage deviation.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_freshness",
                "description": "Check when an asset last updated vs expected schedule or SLA cutoff.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_counts",
                "description": "Get row or message counts, breakdowns, and processed status.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_checksum_totals",
                "description": "Reconciliation total comparison: sum totals on upstream vs downstream sides, and delta.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_change_log",
                "description": "Get recent deploys, config edits, mapping updates, and schema migrations.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"},
                        "limit": {"type": "integer", "default": 5}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_schema_diff",
                "description": "Inspect schema versions and column differences for an asset.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_error_histogram",
                "description": "Aggregated error and rejection codes over time buckets.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_dependency_graph",
                "description": "Retrieve upstream sources and downstream consumers for an asset from the active pack.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_job_status",
                "description": "Check orchestrator scheduler status (SUCCESS, FAILED, RUNNING), duration, and exit info.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_logs_summary",
                "description": "Redacted log patterns, frequencies, and first-seen timestamps. No raw record data.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_duplicate_stats",
                "description": "Check duplicate key rates, primary key collision counts, and idempotency leaks.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            },
            {
                "name": "get_queue_state",
                "description": "Queue depth, oldest message age, pending acknowledgments (MSA/ACK), and retry rates.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "asset_id": {"type": "string"}
                    },
                    "required": ["asset_id"]
                }
            }
        ]

    # --- Tool Implementations (Metadata and aggregates ONLY) ---

    def compare_to_baseline(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT row_or_msg_count, expected_baseline_count FROM counts_and_totals WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        if not row:
            out = {"asset_id": asset_id, "status": "NO_RECORD", "deviation_percent": 0.0}
        else:
            current, baseline = row["row_or_msg_count"], row["expected_baseline_count"]
            delta = current - baseline
            pct = round((delta / baseline) * 100.0, 2) if baseline > 0 else 0.0
            z_flag = "NORMAL" if abs(pct) <= 15.0 else ("SEVERE_DEFICIT" if pct < -15.0 else "SURGE")
            out = {
                "asset_id": asset_id,
                "current_count": current,
                "baseline_expected": baseline,
                "delta": delta,
                "deviation_percent": pct,
                "z_score_flag": z_flag,
                "is_abnormal": abs(pct) > 15.0
            }
        return self._record_result("compare_to_baseline", {"asset_id": asset_id}, out)

    def get_counts(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT row_or_msg_count, expected_baseline_count FROM counts_and_totals WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        count = row["row_or_msg_count"] if row else 0
        expected = row["expected_baseline_count"] if row else 0
        out = {
            "asset_id": asset_id,
            "total_count": count,
            "expected_baseline": expected,
            "ratio_of_normal": round(count / expected, 3) if expected > 0 else 1.0
        }
        return self._record_result("get_counts", {"asset_id": asset_id}, out)

    def get_checksum_totals(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT cleared_total, expected_total, difference FROM counts_and_totals WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        if row:
            cleared, expected, diff = row["cleared_total"], row["expected_total"], row["difference"]
            is_matched = abs(diff) < 0.01
            out = {
                "asset_id": asset_id,
                "source_cleared_total": cleared,
                "ledger_expected_total": expected,
                "net_difference": diff,
                "is_matched": is_matched,
                "status": "BALANCED" if is_matched else "BREAK_MISMATCH"
            }
        else:
            out = {"asset_id": asset_id, "status": "NO_TOTALS_FOUND"}
        return self._record_result("get_checksum_totals", {"asset_id": asset_id}, out)

    def get_job_status(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT * FROM job_status WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        if row:
            out = {
                "asset_id": asset_id,
                "job_name": row["job_name"],
                "scheduler_status": row["scheduler_status"],
                "exit_code": row["exit_code"],
                "duration_seconds": row["duration_seconds"],
                "last_run_timestamp": row["last_run_timestamp"],
                "details": row["details"]
            }
        else:
            out = {"asset_id": asset_id, "scheduler_status": "UNKNOWN", "exit_code": -1}
        return self._record_result("get_job_status", {"asset_id": asset_id}, out)

    def get_change_log(self, asset_id: str, limit: int = 5) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT * FROM change_log WHERE asset_id = ? ORDER BY timestamp DESC LIMIT ?", (asset_id, limit))
        rows = cursor.fetchall()
        changes = []
        for r in rows:
            changes.append({
                "id": r["id"],
                "timestamp": r["timestamp"],
                "author": r["author"],
                "change_type": r["change_type"],
                "summary": r["summary"],
                "details": r["details"],
                "is_benign": bool(r["is_benign"])
            })
        out = {
            "asset_id": asset_id,
            "change_count": len(changes),
            "recent_changes": changes
        }
        return self._record_result("get_change_log", {"asset_id": asset_id, "limit": limit}, out)

    def get_schema_diff(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT * FROM schema_versions WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        if row:
            curr_cols = json.loads(row["current_columns"]) if row["current_columns"] else []
            prev_cols = json.loads(row["previous_columns"]) if row["previous_columns"] else []
            added = [c for c in curr_cols if c not in prev_cols]
            removed = [c for c in prev_cols if c not in curr_cols]
            out = {
                "asset_id": asset_id,
                "current_version": row["current_version"],
                "previous_version": row["previous_version"],
                "columns_added": added,
                "columns_removed": removed,
                "has_schema_break": len(added) > 0 or len(removed) > 0,
                "diff_summary": row["diff_summary"]
            }
        else:
            out = {"asset_id": asset_id, "has_schema_break": False, "diff_summary": "No schema versioning record"}
        return self._record_result("get_schema_diff", {"asset_id": asset_id}, out)

    def get_error_histogram(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT rejection_count, rejection_rate FROM queue_state WHERE asset_id = 'interface_message_queue'")
        q_row = cursor.fetchone()
        cursor.execute("SELECT * FROM logs_summary WHERE asset_id = ? AND level = 'ERROR'", (asset_id,))
        log_rows = cursor.fetchall()
        patterns = []
        for lr in log_rows:
            patterns.append({
                "pattern": lr["pattern"],
                "count": lr["count"],
                "first_seen": lr["first_seen"]
            })
        rejection_rate = q_row["rejection_rate"] if q_row else 0.0
        rejection_count = q_row["rejection_count"] if q_row else (sum(lr["count"] for lr in log_rows))
        out = {
            "asset_id": asset_id,
            "rejection_rate_percent": rejection_rate,
            "rejection_count": rejection_count,
            "error_patterns": patterns,
            "is_elevated": rejection_rate > 2.0 or len(patterns) > 0
        }
        return self._record_result("get_error_histogram", {"asset_id": asset_id}, out)

    def get_queue_state(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT * FROM queue_state WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        if row:
            out = {
                "asset_id": asset_id,
                "queue_depth": row["queue_depth"],
                "oldest_message_age_seconds": row["oldest_message_age_seconds"],
                "pending_acks": row["pending_acks"],
                "rejection_rate": row["rejection_rate"],
                "is_backed_up": row["queue_depth"] > 50 or row["oldest_message_age_seconds"] > 600
            }
        else:
            out = {"asset_id": asset_id, "queue_depth": 0, "is_backed_up": False}
        return self._record_result("get_queue_state", {"asset_id": asset_id}, out)

    def get_logs_summary(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT level, pattern, count, first_seen FROM logs_summary WHERE asset_id = ?", (asset_id,))
        rows = cursor.fetchall()
        entries = [{"level": r["level"], "pattern": r["pattern"], "count": r["count"], "first_seen": r["first_seen"]} for r in rows]
        out = {
            "asset_id": asset_id,
            "entry_count": len(entries),
            "patterns": entries
        }
        return self._record_result("get_logs_summary", {"asset_id": asset_id}, out)

    def get_freshness(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT last_run_timestamp, scheduler_status FROM job_status WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        last_ts = row["last_run_timestamp"] if row else "2026-10-23T19:00:00Z"
        status = row["scheduler_status"] if row else "UNKNOWN"
        out = {
            "asset_id": asset_id,
            "last_arrival_timestamp": last_ts,
            "scheduler_status": status,
            "sla_cutoff_met": status == "SUCCESS",
            "is_stale": status == "FAILED"
        }
        return self._record_result("get_freshness", {"asset_id": asset_id}, out)

    def get_duplicate_stats(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT duplicate_count, duplicate_rate FROM counts_and_totals WHERE asset_id = ?", (asset_id,))
        row = cursor.fetchone()
        count = row["duplicate_count"] if row else 0
        rate = row["duplicate_rate"] if row else 0.0
        out = {
            "asset_id": asset_id,
            "duplicate_count": count,
            "duplicate_rate_percent": rate,
            "has_duplicates": count > 0 or rate > 0.0
        }
        return self._record_result("get_duplicate_stats", {"asset_id": asset_id}, out)

    def get_dependency_graph(self, asset_id: str) -> Dict[str, Any]:
        pack = self.pack_loader(self.env.active_pack_id)
        assets = {a["id"]: a for a in pack.get("assets", [])}
        node = assets.get(asset_id, {})
        upstreams = node.get("dependencies", [])
        downstreams = [a_id for a_id, a_data in assets.items() if asset_id in a_data.get("dependencies", [])]
        out = {
            "asset_id": asset_id,
            "name": node.get("name", asset_id),
            "upstreams": upstreams,
            "downstreams": downstreams,
            "all_village_nodes": [a["id"] for a in pack.get("assets", [])]
        }
        return self._record_result("get_dependency_graph", {"asset_id": asset_id}, out)

    def get_metric_history(self, asset_id: str, metric_name: str, time_window_minutes: int = 60) -> Dict[str, Any]:
        # Returns synthetic time-series aggregates
        out = {
            "asset_id": asset_id,
            "metric_name": metric_name,
            "time_window_minutes": time_window_minutes,
            "series": [
                {"t_minus_m": 45, "value": 99.8},
                {"t_minus_m": 30, "value": 99.7},
                {"t_minus_m": 15, "value": 95.2},
                {"t_minus_m": 0, "value": 81.4}
            ],
            "current_value": 81.4,
            "baseline_value": 99.8
        }
        return self._record_result("get_metric_history", {"asset_id": asset_id, "metric_name": metric_name}, out)

    def execute_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        if not hasattr(self, tool_name):
            raise ValueError(f"Unknown generic tool: {tool_name}")
        func = getattr(self, tool_name)
        return func(**kwargs)
