"""
Action Layer and Cryptographic Approval Gate for Tracer.
Implements ACT-1 through ACT-5 and APR-1 through APR-6.
Strictly guarantees unapproved_writes = 0.
"""
import hashlib
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from backend.environment import SimulatedEnvironment

class UnapprovedWriteException(Exception):
    """Raised whenever a write action is attempted without a valid, single-use approval token."""
    pass

class ActionWhitelistException(Exception):
    """Raised when an action is not permitted on the target asset by the active pack config."""
    pass

class ActionLayer:
    def __init__(self, env: SimulatedEnvironment, pack_loader, audit_logger):
        self.env = env
        self.pack_loader = pack_loader
        self.audit_logger = audit_logger
        # Token store: token -> {action, target_asset, dry_run_hash, issued_at, expires_at, used}
        self.active_tokens: Dict[str, Dict[str, Any]] = {}
        self.unapproved_writes_count: int = 0
        self.successful_writes_count: int = 0

    def compute_dry_run_hash(self, action: str, target_asset: str, dry_run_payload: Dict[str, Any]) -> str:
        s = f"{action}:{target_asset}:{json.dumps(dry_run_payload, sort_keys=True)}"
        return hashlib.sha256(s.encode("utf-8")).hexdigest()[:20]

    def mint_approval_token(self, action: str, target_asset: str, dry_run_hash: str, issued_by: str = "Human Operator") -> Dict[str, Any]:
        """Mint a cryptographic, single-use token bound to action, target, and dry-run hash (APR-2, APR-3)."""
        now = time.time()
        raw_seed = f"{action}:{target_asset}:{dry_run_hash}:{now}:{issued_by}"
        token = "APPR_" + hashlib.sha256(raw_seed.encode("utf-8")).hexdigest()[:24]
        self.active_tokens[token] = {
            "token": token,
            "action": action,
            "target_asset": target_asset,
            "dry_run_hash": dry_run_hash,
            "issued_by": issued_by,
            "issued_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": now + 300, # 5 minutes TTL
            "used": False
        }
        self.audit_logger.record_event(
            actor=issued_by,
            event_type="APPROVAL_TOKEN_MINTED",
            payload={"token": token, "action": action, "target_asset": target_asset, "dry_run_hash": dry_run_hash}
        )
        return self.active_tokens[token]

    def _verify_and_consume_token(self, token: Optional[str], action: str, target_asset: str, dry_run_hash: str):
        """APR-1 & APR-4 function guard: write actions are unreachable without valid token."""
        if not token or token not in self.active_tokens:
            self.unapproved_writes_count += 1
            raise UnapprovedWriteException(
                f"SECURITY VIOLATION (APR-1): Write action '{action}' on '{target_asset}' rejected. "
                f"No valid approval token was provided. Unapproved writes count: {self.unapproved_writes_count}"
            )
        rec = self.active_tokens[token]
        if rec["used"]:
            self.unapproved_writes_count += 1
            raise UnapprovedWriteException("REPLAY VIOLATION (APR-3): Approval token has already been consumed.")
        if time.time() > rec["expires_at"]:
            self.unapproved_writes_count += 1
            raise UnapprovedWriteException("EXPIRATION VIOLATION (APR-3): Approval token has expired.")
        if rec["action"] != action or rec["target_asset"] != target_asset or rec["dry_run_hash"] != dry_run_hash:
            self.unapproved_writes_count += 1
            raise UnapprovedWriteException("HASH MISMATCH (APR-4): Approval token was minted for a different dry-run specification.")

        # Single-use: mark consumed immediately
        rec["used"] = True

    def _check_pack_whitelist(self, action: str, target_asset: str):
        """ACT-3: Whitelist check per active pack."""
        pack = self.pack_loader(self.env.active_pack_id)
        asset_meta = next((a for a in pack.get("assets", []) if a["id"] == target_asset), None)
        if not asset_meta:
            raise ActionWhitelistException(f"Asset '{target_asset}' not registered in pack '{self.env.active_pack_id}'")
        allowed = asset_meta.get("allowed_actions", [])
        if action not in allowed:
            raise ActionWhitelistException(f"Action '{action}' is NOT in the allowed whitelist for '{target_asset}'. Allowed: {allowed}")

    # --- DRY RUNS (ACT-1: Changes nothing, returns predicted counts and diffs) ---

    def dry_run(self, action: str, target_asset: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self._check_pack_whitelist(action, target_asset)
        params = params or {}

        if action == "reload_from_corrected_source":
            # For partial file, predicted counts to replace
            dry_data = {
                "action": "reload_from_corrected_source",
                "target_asset": target_asset,
                "predicted_rows_to_add": 8698,
                "predicted_rows_to_replace": 3842,
                "target_expected_total_rows": 12540,
                "expected_cleared_total_usd": 4821950.00,
                "variance_after_reload": 0.00,
                "risks": "Brief ingest lock (est. 1.8s) while table swaps partitions. Non-destructive.",
                "trade_offs": "Replaces staging partition with validated banking SFTP batch 20261023-FED-01-CORRECTED."
            }
        elif action == "revert_change":
            dry_data = {
                "action": "revert_change",
                "target_asset": target_asset,
                "change_to_revert": "chg_faulty_hl7_map",
                "revert_target_version": "v1.8.1 (Known good)",
                "diff_summary": "- OBX-5 strict typecasting; + OBX-5 permissive string parser",
                "predicted_affected_streams": ["lab_results_feed", "interface_message_queue"],
                "risks": "Minor config reload latency. In-flight messages will route through reverted mapping.",
                "trade_offs": "Restores permissive observation field parsing; prevents downstream rejection spikes."
            }
        elif action == "replay_with_dedupe":
            dry_data = {
                "action": "replay_with_dedupe",
                "target_asset": target_asset,
                "messages_to_replay": 312,
                "duplicates_suppressed_by_msh_id": 14,
                "residual_duplicate_risk": "< 0.05% (Guaranteed by MSH-10 control UUID deduplication window)",
                "risks": "Downstream billing/pharmacy receivers might see reprocessing timestamps.",
                "trade_offs": "Clears 312 rejected lab messages; deduplication filter eliminates duplicate orders."
            }
        elif action == "restart_job" or action == "restart_channel":
            dry_data = {
                "action": action,
                "target_asset": target_asset,
                "service_affected": f"Socket listener / daemon for {target_asset}",
                "expected_downtime_seconds": 2.5,
                "expected_post_state": "RUNNING with cleared TCP buffers and zero deadlock locks",
                "risks": "Active TCP connection drops and client auto-reconnects in 500ms.",
                "trade_offs": "Flushes stuck socket threads without state loss."
            }
        elif action == "escalate_to_human":
            dry_data = {
                "action": "escalate_to_human",
                "target_asset": target_asset,
                "writes_to_data": 0,
                "note": "Read-only escalation record. No database writes or state changes.",
                "risks": "None. Zero system risk.",
                "trade_offs": "Requires human intervention from upstream correspondent partner."
            }
        else:
            dry_data = {"action": action, "target_asset": target_asset, "note": "Standard dry run completed"}

        dry_hash = self.compute_dry_run_hash(action, target_asset, dry_data)
        return {
            "action": action,
            "target_asset": target_asset,
            "dry_run_data": dry_data,
            "dry_run_hash": dry_hash,
            "is_whitelisted": True
        }

    # --- EXECUTE ACTION (Code-enforced approval token guard APR-1) ---

    def execute_action(self, action: str, target_asset: str, dry_run_hash: str, token: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes action in simulated environment.
        Guarded strictly: if token is missing/invalid, throws UnapprovedWriteException!
        """
        self._check_pack_whitelist(action, target_asset)
        params = params or {}

        # Capture pre-state snapshot (ACT-5)
        pre_state = self._capture_asset_snapshot(target_asset)

        # Non-write action: escalation requires no write token
        if action == "escalate_to_human":
            self.audit_logger.record_event(
                actor="TracerAgent",
                event_type="ACTION_EXECUTED",
                payload={"action": action, "target_asset": target_asset, "type": "ESCALATION_CALL"}
            )
            return {
                "action": action,
                "target_asset": target_asset,
                "status": "ESCALATED_SAFELY",
                "writes_performed": 0,
                "message": "Escalation logged. No data written to environment."
            }

        # Guard write actions!
        self._verify_and_consume_token(token, action, target_asset, dry_run_hash)

        # Perform sandboxed mutation in simulated environment (ACT-2)
        cursor = self.env.conn.cursor()

        if action == "reload_from_corrected_source":
            # Fix Incident 1: Restore correct full row count and checksum totals
            cursor.execute("""
                UPDATE counts_and_totals
                SET row_or_msg_count = 12540,
                    cleared_total = 4821950.00,
                    expected_total = 4821950.00,
                    difference = 0.00
                WHERE asset_id = 'bank_settlement_feed'
            """)
            cursor.execute("""
                UPDATE counts_and_totals
                SET cleared_total = 4821950.00,
                    expected_total = 4821950.00,
                    difference = 0.00
                WHERE asset_id = 'reconciliation_table'
            """)
            cursor.execute("""
                UPDATE job_status
                SET details = 'Reloaded from validated partner source FED_20261023_RELOADED.dat (12,540 rows verified)'
                WHERE asset_id = 'bank_settlement_feed'
            """)

        elif action == "revert_change":
            # Fix Incident 2, Incident 4, Incident 9, or Incident 11
            if target_asset == 'regulatory_extract':
                cursor.execute("""
                    UPDATE job_status
                    SET scheduler_status = 'SUCCESS',
                        exit_code = 0,
                        details = 'Cryptographic audit seal aligned with primary vault KMS key.'
                    WHERE asset_id = 'regulatory_extract'
                """)
            elif target_asset == 'billing_adapter':
                cursor.execute("""
                    UPDATE job_status
                    SET scheduler_status = 'SUCCESS',
                        exit_code = 0,
                        details = 'Restored standardized ICD-10 diagnostic formatting in claims generator.'
                    WHERE asset_id = 'billing_adapter'
                """)
            elif self.env.active_pack_id == "healthcare":
                cursor.execute("DELETE FROM change_log WHERE id = 'chg_faulty_hl7_map'")
                cursor.execute("""
                    UPDATE queue_state
                    SET rejection_rate = 0.05,
                        rejection_count = 0
                    WHERE asset_id = 'interface_message_queue'
                """)
            elif self.env.active_pack_id == "fintech":
                cursor.execute("DELETE FROM change_log WHERE id = 'chg_rename_01'")
                cols_fintech = json.dumps(["settlement_id", "clearing_batch_id", "account_ref", "tx_amt", "currency", "settlement_ts", "auth_code"])
                cursor.execute("""
                    UPDATE schema_versions
                    SET current_version = 'v3.0.0',
                        diff_summary = 'Reverted column renaming back to tx_amt'
                    WHERE asset_id = 'payment_ledger'
                """)
                cursor.execute("""
                    UPDATE counts_and_totals
                    SET difference = 0.00
                    WHERE asset_id = 'reconciliation_table'
                """)

        elif action == "replay_with_dedupe":
            # Clear queue depth and replayed errors
            cursor.execute("""
                UPDATE queue_state
                SET queue_depth = 4,
                    oldest_message_age_seconds = 22,
                    pending_acks = 0,
                    rejection_count = 0,
                    rejection_rate = 0.0
                WHERE asset_id = 'interface_message_queue'
            """)

        elif action == "restart_job" or action == "restart_channel":
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'SUCCESS',
                    exit_code = 0,
                    details = 'Service restarted cleanly. Health checks passing.'
                WHERE asset_id = ?
            """, (target_asset,))
            if self.env.active_pack_id == "healthcare":
                cursor.execute("""
                    UPDATE queue_state
                    SET pending_acks = 0,
                        oldest_message_age_seconds = 15,
                        queue_depth = 3
                    WHERE asset_id = 'interface_message_queue'
                """)

        self.env.conn.commit()
        self.successful_writes_count += 1
        post_state = self._capture_asset_snapshot(target_asset)

        self.audit_logger.record_event(
            actor="TracerAgent (Approved)",
            event_type="ACTION_EXECUTED",
            payload={
                "action": action,
                "target_asset": target_asset,
                "token_used": token,
                "pre_state": pre_state,
                "post_state": post_state
            }
        )

        return {
            "action": action,
            "target_asset": target_asset,
            "status": "EXECUTED_SUCCESSFULLY",
            "pre_state": pre_state,
            "post_state": post_state,
            "writes_performed": 1
        }

    def _capture_asset_snapshot(self, asset_id: str) -> Dict[str, Any]:
        cursor = self.env.conn.cursor()
        cursor.execute("SELECT * FROM counts_and_totals WHERE asset_id = ?", (asset_id,))
        c_row = cursor.fetchone()
        cursor.execute("SELECT * FROM job_status WHERE asset_id = ?", (asset_id,))
        j_row = cursor.fetchone()
        cursor.execute("SELECT * FROM queue_state WHERE asset_id = ?", (asset_id,))
        q_row = cursor.fetchone()
        return {
            "counts": dict(c_row) if c_row else None,
            "job": dict(j_row) if j_row else None,
            "queue": dict(q_row) if q_row else None
        }
