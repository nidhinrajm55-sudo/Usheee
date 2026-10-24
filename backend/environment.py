"""
Simulated Environment and Metadata Store for Tracer.
Implements ENV-1 through ENV-8.
"""
import sqlite3
import json
import time
import hashlib
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

class SimulatedEnvironment:
    def __init__(self, seed: int = 42):
        self.default_seed = seed
        self.current_seed = seed
        self.active_pack_id = "fintech"
        self.injected_incident: Optional[Dict[str, Any]] = None
        self.active_incident_id: Optional[str] = None
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()
        self.reset(seed=self.default_seed, pack_id="fintech")

    def _init_schema(self):
        cursor = self.conn.cursor()
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS metric_history (
                asset_id TEXT,
                metric_name TEXT,
                timestamp TEXT,
                metric_value REAL,
                status TEXT
            );

            CREATE TABLE IF NOT EXISTS job_status (
                asset_id TEXT PRIMARY KEY,
                job_name TEXT,
                scheduler_status TEXT, -- 'SUCCESS', 'FAILED', 'RUNNING'
                exit_code INTEGER,
                duration_seconds REAL,
                last_run_timestamp TEXT,
                details TEXT
            );

            CREATE TABLE IF NOT EXISTS counts_and_totals (
                asset_id TEXT PRIMARY KEY,
                row_or_msg_count INTEGER,
                expected_baseline_count INTEGER,
                cleared_total REAL,
                expected_total REAL,
                difference REAL,
                duplicate_count INTEGER,
                duplicate_rate REAL
            );

            CREATE TABLE IF NOT EXISTS change_log (
                id TEXT PRIMARY KEY,
                asset_id TEXT,
                timestamp TEXT,
                author TEXT,
                change_type TEXT, -- 'CONFIG', 'DEPLOY', 'SCHEMA', 'MAPPING'
                summary TEXT,
                details TEXT,
                is_benign BOOLEAN
            );

            CREATE TABLE IF NOT EXISTS schema_versions (
                asset_id TEXT PRIMARY KEY,
                current_version TEXT,
                previous_version TEXT,
                current_columns TEXT, -- JSON
                previous_columns TEXT, -- JSON
                diff_summary TEXT
            );

            CREATE TABLE IF NOT EXISTS queue_state (
                asset_id TEXT PRIMARY KEY,
                queue_depth INTEGER,
                oldest_message_age_seconds INTEGER,
                pending_acks INTEGER,
                rejection_count INTEGER,
                total_processed INTEGER,
                rejection_rate REAL
            );

            CREATE TABLE IF NOT EXISTS logs_summary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id TEXT,
                timestamp TEXT,
                level TEXT, -- 'INFO', 'WARN', 'ERROR'
                pattern TEXT,
                count INTEGER,
                first_seen TEXT
            );
        """)
        self.conn.commit()

    def reset(self, seed: Optional[int] = None, pack_id: str = "fintech"):
        """One-click reset: restores clean baseline in under 5 seconds (ENV-4)."""
        start_t = time.time()
        if seed is not None:
            self.current_seed = seed
        random.seed(self.current_seed)
        self.active_pack_id = pack_id
        self.injected_incident = None
        self.active_incident_id = None

        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM metric_history")
        cursor.execute("DELETE FROM job_status")
        cursor.execute("DELETE FROM counts_and_totals")
        cursor.execute("DELETE FROM change_log")
        cursor.execute("DELETE FROM schema_versions")
        cursor.execute("DELETE FROM queue_state")
        cursor.execute("DELETE FROM logs_summary")

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        if pack_id == "fintech":
            self._seed_fintech_baseline(now)
        elif pack_id == "healthcare":
            self._seed_healthcare_baseline(now)
        elif pack_id == "logistics":
            self._seed_logistics_baseline(now)

        self.conn.commit()
        duration_ms = (time.time() - start_t) * 1000
        return {
            "status": "RESET_COMPLETE",
            "seed": self.current_seed,
            "pack_id": pack_id,
            "duration_ms": round(duration_ms, 2)
        }

    def _seed_fintech_baseline(self, now: datetime):
        cursor = self.conn.cursor()
        now_iso = now.isoformat()

        # Job statuses - all green initially
        jobs = [
            ("bank_settlement_feed", "sftp_settlement_ingest", "SUCCESS", 0, 42.1, (now - timedelta(minutes=25)).isoformat(), "Batch 20261023-FED-01 processed without scheduler errors"),
            ("payment_ledger", "ledger_rebalance_stream", "SUCCESS", 0, 15.0, (now - timedelta(minutes=5)).isoformat(), "Double-entry balances reconciled"),
            ("reconciliation_table", "daily_recon_runner", "SUCCESS", 0, 88.4, (now - timedelta(minutes=20)).isoformat(), "Zero break variance across all clearing banks"),
            ("settlement_dashboard", "metabase_cube_refresh", "SUCCESS", 0, 12.0, (now - timedelta(minutes=10)).isoformat(), "Dashboard aggregations up-to-date"),
            ("regulatory_extract", "rbi_fincen_batch_builder", "SUCCESS", 0, 64.0, (now - timedelta(hours=2)).isoformat(), "Cryptographic audit seals verified")
        ]
        cursor.executemany("INSERT INTO job_status VALUES (?,?,?,?,?,?,?)", jobs)

        # Baseline counts and totals
        counts = [
            ("bank_settlement_feed", 12540, 12500, 4821950.00, 4821950.00, 0.00, 0, 0.0),
            ("payment_ledger", 12540, 12500, 4821950.00, 4821950.00, 0.00, 0, 0.0),
            ("reconciliation_table", 12540, 12500, 4821950.00, 4821950.00, 0.00, 0, 0.0)
        ]
        cursor.executemany("INSERT INTO counts_and_totals VALUES (?,?,?,?,?,?,?,?)", counts)

        # Schema versions
        cols_fintech = json.dumps(["settlement_id", "clearing_batch_id", "account_ref", "tx_amt", "currency", "settlement_ts", "auth_code"])
        cursor.execute("INSERT INTO schema_versions VALUES (?,?,?,?,?,?)", (
            "payment_ledger", "v3.0.0", "v2.9.4", cols_fintech, cols_fintech, "No active diff"
        ))
        cursor.execute("INSERT INTO schema_versions VALUES (?,?,?,?,?,?)", (
            "bank_settlement_feed", "v1.4.0", "v1.3.9", cols_fintech, cols_fintech, "No active diff"
        ))

        # Change log (including harmless benign changes as distractors/red herrings)
        cursor.execute("INSERT INTO change_log VALUES (?,?,?,?,?,?,?,?)", (
            "chg_benign_01", "settlement_dashboard", (now - timedelta(hours=3)).isoformat(),
            "Alex Rivera", "DEPLOY", "v2.14.0 UI theme & Metabase widget styling update",
            "Updated front-end CSS color scheme and liquidity chart tooltips. No data transformation touched.", True
        ))
        cursor.execute("INSERT INTO change_log VALUES (?,?,?,?,?,?,?,?)", (
            "chg_benign_02", "regulatory_extract", (now - timedelta(hours=6)).isoformat(),
            "Vikram Malhotra", "CONFIG", "Updated quarterly reporting email recipient list in vault",
            "Added secondary audit inbox to notification group.", True
        ))

        # Logs summary
        cursor.execute("INSERT INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen) VALUES (?,?,?,?,?,?)", (
            "settlement_dashboard", (now - timedelta(minutes=45)).isoformat(), "WARN",
            "Metabase cache warm-up timeout warning on non-critical historical tab", 3, (now - timedelta(minutes=45)).isoformat()
        ))
        cursor.execute("INSERT INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen) VALUES (?,?,?,?,?,?)", (
            "bank_settlement_feed", (now - timedelta(minutes=25)).isoformat(), "INFO",
            "SFTP TLS session established with Central Clearing Bank endpoint", 1, (now - timedelta(minutes=25)).isoformat()
        ))

    def _seed_healthcare_baseline(self, now: datetime):
        cursor = self.conn.cursor()

        jobs = [
            ("adt_feed", "mirth_adt_listener", "SUCCESS", 0, 10.0, (now - timedelta(minutes=3)).isoformat(), "Listening on port 6001 for MSH^ADT messages"),
            ("lab_results_feed", "hl7_oru_channel", "SUCCESS", 0, 12.0, (now - timedelta(minutes=2)).isoformat(), "ORU_R01 observation channel active"),
            ("interface_message_queue", "rabbitmq_hl7_broker", "SUCCESS", 0, 5.0, (now - timedelta(minutes=1)).isoformat(), "Broker nodes balanced"),
            ("pharmacy_orders", "cpoe_order_dispenser", "SUCCESS", 0, 8.0, (now - timedelta(minutes=4)).isoformat(), "Dispenser workers active"),
            ("billing_adapter", "edi_837_generator", "SUCCESS", 0, 22.0, (now - timedelta(minutes=15)).isoformat(), "Claims batching normal")
        ]
        cursor.executemany("INSERT INTO job_status VALUES (?,?,?,?,?,?,?)", jobs)

        cursor.execute("INSERT INTO queue_state VALUES (?,?,?,?,?,?,?)", (
            "interface_message_queue", 8, 45, 2, 4, 18500, 0.02
        ))

        cursor.execute("INSERT INTO counts_and_totals VALUES (?,?,?,?,?,?,?,?)", (
            "lab_results_feed", 14200, 14000, 0, 0, 0, 0, 0.0
        ))

        # Benign changes in healthcare
        cursor.execute("INSERT INTO change_log VALUES (?,?,?,?,?,?,?,?)", (
            "chg_hl7_benign_01", "adt_feed", (now - timedelta(hours=5)).isoformat(),
            "Dave Miller", "DEPLOY", "Routine maintenance restart on ADT channel socket listener",
            "Standard scheduled socket buffer clearing.", True
        ))
        cursor.execute("INSERT INTO change_log VALUES (?,?,?,?,?,?,?,?)", (
            "chg_hl7_benign_02", "billing_adapter", (now - timedelta(hours=2)).isoformat(),
            "Siddharth Rao", "CONFIG", "Updated ICD-10 diagnostic code table for seasonal influenza",
            "Standard code lookup table refresh.", True
        ))

        cursor.execute("INSERT INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen) VALUES (?,?,?,?,?,?)", (
            "billing_adapter", (now - timedelta(minutes=30)).isoformat(), "WARN",
            "EDI 837 claim batch 9982 slow ack notice from regional payer clearinghouse", 2, (now - timedelta(minutes=30)).isoformat()
        ))

    def _seed_logistics_baseline(self, now: datetime):
        cursor = self.conn.cursor()
        jobs = [
            ("telematics_iot_stream", "mqtt_gps_ingest", "SUCCESS", 0, 15.0, (now - timedelta(minutes=2)).isoformat(), "GPS stream connected"),
            ("customs_manifest_engine", "customs_broker_reconciliation", "SUCCESS", 0, 30.0, (now - timedelta(minutes=10)).isoformat(), "All tare weights matching")
        ]
        cursor.executemany("INSERT INTO job_status VALUES (?,?,?,?,?,?,?)", jobs)
        cursor.execute("INSERT INTO counts_and_totals VALUES (?,?,?,?,?,?,?,?)", (
            "customs_manifest_engine", 5200, 5200, 1420500.0, 1420500.0, 0.0, 0, 0.0
        ))

    def inject_incident(self, incident_type: str, seed: Optional[int] = None) -> Dict[str, Any]:
        """
        Injects a seeded incident (ENV-3).
        Critical Rule (ENV-8): Injecting changes ONLY environment data.
        The village shows a fire ONLY when the agent's check fails, never directly from the inject button.
        """
        if seed is not None:
            self.current_seed = seed
        random.seed(self.current_seed)

        now = datetime.now(timezone.utc)
        incident_id = f"inc_{int(time.time())}_{random.randint(1000, 9999)}"
        self.active_incident_id = incident_id
        cursor = self.conn.cursor()

        if incident_type == "incident_1_fintech_partial_file":
            # Fintech Incident 1 (P0): Partial Settlement File (Silent Failure)
            self.active_pack_id = "fintech"
            # Scheduler reports "SUCCESS" while data is corrupt (ENV-7)!
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'SUCCESS', exit_code = 0,
                    details = 'Batch 20261023-FED-01 processed without scheduler errors (Ingested 3,842 lines)'
                WHERE asset_id = 'bank_settlement_feed'
            """)
            # Data corruption: row count is only 3,842 (expected 12,500, a ~69.3% drop!)
            # Total bank cleared is only $4,580,100.00 while ledger expects $4,821,950.00 -> $241,850.00 mismatch!
            cursor.execute("""
                UPDATE counts_and_totals
                SET row_or_msg_count = 3842,
                    cleared_total = 4580100.00,
                    expected_total = 4821950.00,
                    difference = 241850.00
                WHERE asset_id = 'bank_settlement_feed'
            """)
            cursor.execute("""
                UPDATE counts_and_totals
                SET cleared_total = 4580100.00,
                    expected_total = 4821950.00,
                    difference = 241850.00
                WHERE asset_id = 'reconciliation_table'
            """)
            # Red herring log
            cursor.execute("""
                INSERT INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("settlement_dashboard", (now - timedelta(minutes=15)).isoformat(), "WARN", "Metabase cache warm-up timeout warning on tab 'Regional Breakdown'", 4, (now - timedelta(minutes=15)).isoformat()))

            self.injected_incident = {
                "id": incident_id,
                "type": "incident_1_fintech_partial_file",
                "pack": "fintech",
                "target_asset": "bank_settlement_feed",
                "title": "Fintech: Partial Settlement File Ingest (Silent Failure)",
                "summary": "Bank settlement file was truncated mid-transfer on SFTP. Ingest job reported SUCCESS, but ledger shows $241,850 mismatch and row count dropped 69%.",
                "ground_truth": {
                    "root_cause": "Incomplete source file ingestion: upstream SFTP batch was truncated mid-transfer at byte offset 4,194,304",
                    "failing_check": "settlement_file_row_count",
                    "supporting_evidence": ["counts_and_totals:bank_settlement_feed", "checksum_totals:reconciliation_table"],
                    "rejected_hypotheses": [
                        "Ingestion scheduler or container crashed (Rejected: scheduler exit code is 0 / SUCCESS)",
                        "Mapping or schema migration broke parsing (Rejected: zero schema diffs or recent mapping changes on bank_settlement_feed)"
                    ],
                    "recommended_action": "reload_from_corrected_source",
                    "target_asset": "bank_settlement_feed",
                    "expected_owner_id": "owner_sarah",
                    "expected_owner_name": "Sarah Chen",
                    "expected_owner_role": "Reconciliation Ops Analyst"
                }
            }

        elif incident_type == "incident_2_healthcare_mapping_reject":
            # Healthcare Incident 2 (P0): Mapping Change Causes Rejections
            self.active_pack_id = "healthcare"
            now_iso = (now - timedelta(minutes=14)).isoformat()

            # Corrupting change: mapping update that breaks OBX observation parsing
            cursor.execute("""
                INSERT OR REPLACE INTO change_log VALUES (?,?,?,?,?,?,?,?)
            """, (
                "chg_faulty_hl7_map", "lab_results_feed", now_iso,
                "Integration Team (Dave Miller)", "MAPPING",
                "Update hl7_v2_to_fhir_map.json to v1.8.2 for strict OBX-5 observation types",
                "Strict validation on OBX-5 observation values caused type-casting exceptions for non-standard lab prefixes.",
                False
            ))
            # Spiking error rate and queue depth
            cursor.execute("""
                UPDATE queue_state
                SET queue_depth = 428,
                    oldest_message_age_seconds = 1080, -- 18 minutes
                    pending_acks = 94,
                    rejection_count = 312,
                    rejection_rate = 18.6
                WHERE asset_id = 'interface_message_queue'
            """)
            # Error log histogram
            cursor.execute("""
                INSERT INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("lab_results_feed", now_iso, "ERROR", "HL7_ERR_042: Invalid observation value datatype casting for OBX segment in hl7_v2_to_fhir_map.json", 312, now_iso))

            self.injected_incident = {
                "id": incident_id,
                "type": "incident_2_healthcare_mapping_reject",
                "pack": "healthcare",
                "target_asset": "lab_results_feed",
                "title": "Healthcare: Mapping Change Causes Mass HL7 Rejections",
                "summary": "Recent mapping change to hl7_v2_to_fhir_map v1.8.2 is rejecting stat lab results. Queue depth spiked to 428 messages and retry duplication risk is elevated.",
                "ground_truth": {
                    "root_cause": "Faulty field transformation in hl7_v2_to_fhir_map.json v1.8.2 throwing datatype errors on OBX-5 segments",
                    "failing_check": "message_rejection_rate",
                    "supporting_evidence": ["change_log:lab_results_feed", "error_histogram:lab_results_feed", "queue_state:interface_message_queue"],
                    "rejected_hypotheses": [
                        "Hospital network gateway or socket connectivity drop (Rejected: listener socket active and accepting frames)",
                        "Database connection pool exhaustion (Rejected: DB health checks green with 0 connection timeouts)"
                    ],
                    "recommended_action": "revert_change",
                    "secondary_action": "replay_with_dedupe",
                    "target_asset": "lab_results_feed",
                    "expected_owner_id": "owner_dave",
                    "expected_owner_name": "Dave Miller",
                    "expected_owner_role": "Senior Integration Engineer"
                }
            }

        elif incident_type == "incident_3_fintech_malformed_escalation":
            # Fintech Incident 3 (P0): Malformed Upstream File (Escalation)
            self.active_pack_id = "fintech"
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'FAILED', exit_code = 137,
                    details = 'Corrupt record formatting in clearing batch FED_20261023_MALFORMED.dat: invalid record delimiter 0x00 on line 124'
                WHERE asset_id = 'bank_settlement_feed'
            """)
            cursor.execute("""
                INSERT INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("bank_settlement_feed", (now - timedelta(minutes=5)).isoformat(), "ERROR", "FATAL: Upstream bank file FED_20261023_MALFORMED.dat failed PGP checksum and contains malformed binary null characters", 1, (now - timedelta(minutes=5)).isoformat()))

            self.injected_incident = {
                "id": incident_id,
                "type": "incident_3_fintech_malformed_escalation",
                "pack": "fintech",
                "target_asset": "bank_settlement_feed",
                "title": "Fintech: Malformed External Bank File (Escalation Path)",
                "summary": "Upstream correspondent bank transmitted an unparseable, binary-corrupted settlement file. No internal write action can fix this; agent must escalate with evidence and zero writes.",
                "ground_truth": {
                    "root_cause": "External partner corruption: upstream bank sent structurally malformed binary file failing cryptographic integrity checks",
                    "failing_check": "settlement_arrival_freshness",
                    "supporting_evidence": ["job_status:bank_settlement_feed", "logs_summary:bank_settlement_feed"],
                    "rejected_hypotheses": [
                        "Local internal ETL parser bug (Rejected: error originates in external file framing before ingestion)",
                        "Replay or reload previous file (Rejected: would double-book previous settlement batch)"
                    ],
                    "recommended_action": "escalate_to_human",
                    "target_asset": "bank_settlement_feed",
                    "expected_owner_id": "owner_sarah",
                    "expected_owner_name": "Sarah Chen",
                    "expected_owner_role": "Reconciliation Ops Analyst"
                }
            }

        elif incident_type == "incident_4_fintech_column_rename":
            # Stretch Incident 4 (P2): Column rename two hops upstream
            self.active_pack_id = "fintech"
            # Upstream column rename in payment ledger
            old_cols = json.dumps(["settlement_id", "clearing_batch_id", "account_ref", "tx_amt", "currency", "settlement_ts", "auth_code"])
            new_cols = json.dumps(["settlement_id", "clearing_batch_id", "account_ref", "transaction_amount", "currency", "settlement_ts", "auth_code"])
            cursor.execute("""
                UPDATE schema_versions
                SET current_version = 'v3.1.0',
                    previous_version = 'v3.0.0',
                    current_columns = ?,
                    previous_columns = ?,
                    diff_summary = 'Column tx_amt renamed to transaction_amount'
                WHERE asset_id = 'payment_ledger'
            """, (new_cols, old_cols))

            cursor.execute("""
                INSERT OR REPLACE INTO change_log VALUES (?,?,?,?,?,?,?,?)
            """, (
                "chg_rename_01", "payment_ledger", (now - timedelta(minutes=40)).isoformat(),
                "Alex Rivera", "SCHEMA", "Rename tx_amt to transaction_amount for naming standardization",
                "Renamed column in payment_ledger DDL without updating reconciliation_table query alias.", False
            ))

            cursor.execute("""
                UPDATE counts_and_totals
                SET difference = 4821950.00
                WHERE asset_id = 'reconciliation_table'
            """)

            self.injected_incident = {
                "id": incident_id,
                "type": "incident_4_fintech_column_rename",
                "pack": "fintech",
                "target_asset": "payment_ledger",
                "title": "Fintech: Upstream Column Rename Breaks Downstream Recon",
                "summary": "Core ledger renamed column 'tx_amt' to 'transaction_amount' two hops upstream, breaking Daily Recon Table aggregations.",
                "ground_truth": {
                    "root_cause": "Upstream schema mutation: payment_ledger renamed 'tx_amt' to 'transaction_amount' breaking downstream join queries",
                    "failing_check": "ledger_vs_bank_total_match",
                    "supporting_evidence": ["schema_versions:payment_ledger", "change_log:payment_ledger"],
                    "recommended_action": "revert_change",
                    "target_asset": "payment_ledger",
                    "expected_owner_id": "owner_alex",
                    "expected_owner_name": "Alex Rivera",
                    "expected_owner_role": "Ledger Platform Engineer"
                }
            }

        elif incident_type == "incident_5_healthcare_acks_stopped":
            # Stretch Incident 5 (P2): Healthcare Acks Stop
            self.active_pack_id = "healthcare"
            cursor.execute("""
                UPDATE queue_state
                SET pending_acks = 340,
                    oldest_message_age_seconds = 1440,
                    queue_depth = 340
                WHERE asset_id = 'interface_message_queue'
            """)
            cursor.execute("""
                UPDATE job_status
                SET details = 'Receiver socket stalled; TCP connection open but 0 ACK/MSA frames received in last 24m'
                WHERE asset_id = 'interface_message_queue'
            """)

            self.injected_incident = {
                "id": incident_id,
                "type": "incident_5_healthcare_acks_stopped",
                "pack": "healthcare",
                "target_asset": "interface_message_queue",
                "title": "Healthcare: Silent Interface Stall (Acks Ceased)",
                "summary": "Mirth channel reports RUNNING and port open, but downstream partner stopped sending MSA acks, causing 340 unacknowledged frames to stall the queue.",
                "ground_truth": {
                    "root_cause": "Deadlock in interface channel socket receiver thread causing complete cessation of MSA acknowledgment frames",
                    "failing_check": "missing_acknowledgments",
                    "supporting_evidence": ["queue_state:interface_message_queue", "job_status:interface_message_queue"],
                    "recommended_action": "restart_channel",
                    "target_asset": "interface_message_queue",
                    "expected_owner_id": "owner_dave",
                    "expected_owner_name": "Dave Miller",
                    "expected_owner_role": "Senior Integration Engineer"
                }
            }

        elif incident_type == "incident_6_fintech_recon_break":
            # Dynamic Fintech Break: Daily Recon Table Break ($318,500 Discrepancy on Node 3)
            self.active_pack_id = "fintech"
            cursor.execute("""
                UPDATE counts_and_totals
                SET cleared_total = 4503450.00,
                    expected_total = 4821950.00,
                    difference = 318500.00
                WHERE asset_id = 'reconciliation_table'
            """)
            self.injected_incident = {
                "id": incident_id,
                "type": "incident_6_fintech_recon_break",
                "pack": "fintech",
                "target_asset": "reconciliation_table",
                "title": "Fintech: Daily Recon Table Break ($318,500 Discrepancy)",
                "summary": "Daily reconciliation engine detected a $318,500 mismatch between clearing records and core ledger post.",
                "ground_truth": {
                    "root_cause": "Reconciliation engine partition mismatch: daily batch failed to align clearing timestamp window, leaving $318,500 in unposted transactions",
                    "failing_check": "ledger_vs_bank_total_match",
                    "supporting_evidence": ["checksum_totals:reconciliation_table"],
                    "recommended_action": "reload_from_corrected_source",
                    "target_asset": "reconciliation_table",
                    "expected_owner_id": "owner_sarah",
                    "expected_owner_name": "Sarah Chen",
                    "expected_owner_role": "Reconciliation Ops Analyst"
                }
            }

        elif incident_type == "incident_7_healthcare_adt_stale":
            # Dynamic Healthcare Break: ADT Patient Stream Heartbeat Stalled on Node 1
            self.active_pack_id = "healthcare"
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'FAILED',
                    details = 'Inbound MLLP socket listener stale: last ADT admission received 22 minutes ago (SLA: 5m)'
                WHERE asset_id = 'adt_feed'
            """)
            self.injected_incident = {
                "id": incident_id,
                "type": "incident_7_healthcare_adt_stale",
                "pack": "healthcare",
                "target_asset": "adt_feed",
                "title": "Healthcare: ADT Patient Stream Heartbeat Stalled",
                "summary": "Patient admission stream missed 5-minute freshness SLA. Hospital bed roster is stale.",
                "ground_truth": {
                    "root_cause": "Hospital admission MLLP listener socket hung after network gateway glitch, dropping inbound ADT messages",
                    "failing_check": "adt_message_freshness",
                    "supporting_evidence": ["freshness:adt_feed", "job_status:adt_feed"],
                    "recommended_action": "restart_channel",
                    "target_asset": "adt_feed",
                    "expected_owner_id": "owner_rachel",
                    "expected_owner_name": "Dr. Rachel Kim",
                    "expected_owner_role": "Clinical Systems Director"
                }
            }

        elif incident_type == "incident_8_fintech_dashboard_stale_cache":
            # Fintech Node 4: Settlement Dashboard Stale Redis Cache
            self.active_pack_id = "fintech"
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'FAILED', exit_code = 143,
                    details = 'Redis cluster connection timeout during Metabase cube refresh: liquidity aggregations stale by 34 minutes'
                WHERE asset_id = 'settlement_dashboard'
            """)
            cursor.execute("""
                INSERT OR REPLACE INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("settlement_dashboard", (now - timedelta(minutes=15)).isoformat(), "ERROR", "Redis lock timeout on key cube:treasury:net_settlement_v2", 12, (now - timedelta(minutes=15)).isoformat()))
            self.injected_incident = {
                "id": incident_id,
                "type": "incident_8_fintech_dashboard_stale_cache",
                "pack": "fintech",
                "target_asset": "settlement_dashboard",
                "title": "Fintech: Treasury Dashboard Cube Cache Stalled",
                "summary": "Metabase aggregation engine stalled due to Redis lock timeout. Real-time liquidity cockpit is showing stale numbers.",
                "ground_truth": {
                    "root_cause": "Redis aggregation cache lock contention caused metabase_cube_refresh job to fail with exit code 143",
                    "failing_check": "dashboard_scheduler_health",
                    "supporting_evidence": ["job_status:settlement_dashboard", "logs_summary:settlement_dashboard"],
                    "recommended_action": "restart_job",
                    "target_asset": "settlement_dashboard",
                    "expected_owner_id": "owner_elena",
                    "expected_owner_name": "Elena Rostova",
                    "expected_owner_role": "Head of Treasury Operations"
                }
            }

        elif incident_type == "incident_9_fintech_regulatory_seal_mismatch":
            # Fintech Node 5: Regulatory Compliance Extract Audit Seal Mismatch
            self.active_pack_id = "fintech"
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'FAILED', exit_code = 2,
                    details = 'Cryptographic audit seal verification failed: SHA-256 HMAC checksum mismatch on FinCEN CTR batch export'
                WHERE asset_id = 'regulatory_extract'
            """)
            cursor.execute("""
                INSERT OR REPLACE INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("regulatory_extract", (now - timedelta(minutes=20)).isoformat(), "ERROR", "HMAC mismatch on daily regulatory export seal block #409", 1, (now - timedelta(minutes=20)).isoformat()))
            self.injected_incident = {
                "id": incident_id,
                "type": "incident_9_fintech_regulatory_seal_mismatch",
                "pack": "fintech",
                "target_asset": "regulatory_extract",
                "title": "Fintech: Compliance Extract Audit Seal Mismatch",
                "summary": "Central bank regulatory export failed cryptographic audit verification with an HMAC seal mismatch.",
                "ground_truth": {
                    "root_cause": "Recent vault key rotation caused rbi_fincen_batch_builder to sign regulatory extract with mismatched KMS key alias",
                    "failing_check": "regulatory_seal_integrity",
                    "supporting_evidence": ["job_status:regulatory_extract", "logs_summary:regulatory_extract"],
                    "recommended_action": "revert_change",
                    "target_asset": "regulatory_extract",
                    "expected_owner_id": "owner_vikram",
                    "expected_owner_name": "Vikram Malhotra",
                    "expected_owner_role": "Compliance Officer"
                }
            }

        elif incident_type == "incident_10_healthcare_pharmacy_cpoe_deadlock":
            # Healthcare Node 4: Pharmacy CPOE Dispenser Deadlock
            self.active_pack_id = "healthcare"
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'FAILED', exit_code = 1,
                    details = 'CPOE order dispenser thread deadlock on STAT medication queue: worker thread hung > 18 minutes'
                WHERE asset_id = 'pharmacy_orders'
            """)
            cursor.execute("""
                INSERT OR REPLACE INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("pharmacy_orders", (now - timedelta(minutes=10)).isoformat(), "ERROR", "Deadlock detected on table cpoe_stat_prescriptions", 8, (now - timedelta(minutes=10)).isoformat()))
            self.injected_incident = {
                "id": incident_id,
                "type": "incident_10_healthcare_pharmacy_cpoe_deadlock",
                "pack": "healthcare",
                "target_asset": "pharmacy_orders",
                "title": "Healthcare: Pharmacy CPOE Dispenser Thread Deadlock",
                "summary": "Stat medication order router stalled due to locked database rows in the pharmacy dispenser service.",
                "ground_truth": {
                    "root_cause": "Database transaction deadlock on stat medication queue stalled cpoe_order_dispenser worker threads",
                    "failing_check": "pharmacy_dispenser_health",
                    "supporting_evidence": ["job_status:pharmacy_orders", "logs_summary:pharmacy_orders"],
                    "recommended_action": "restart_channel",
                    "target_asset": "pharmacy_orders",
                    "expected_owner_id": "owner_rachel",
                    "expected_owner_name": "Dr. Rachel Kim",
                    "expected_owner_role": "Clinical Systems Director"
                }
            }

        elif incident_type == "incident_11_healthcare_billing_edi_schema_drift":
            # Healthcare Node 5: Claims & Billing EDI Generator Fault
            self.active_pack_id = "healthcare"
            cursor.execute("""
                UPDATE job_status
                SET scheduler_status = 'FAILED', exit_code = 134,
                    details = 'EDI 837 claim batch generator syntax error: invalid ICD-10 encounter formatting in segment CLM05-1'
                WHERE asset_id = 'billing_adapter'
            """)
            cursor.execute("""
                INSERT OR REPLACE INTO logs_summary (asset_id, timestamp, level, pattern, count, first_seen)
                VALUES (?,?,?,?,?,?)
            """, ("billing_adapter", (now - timedelta(minutes=12)).isoformat(), "ERROR", "EDI 837 segment parsing exception on diagnosis code format in CLM05-1", 14, (now - timedelta(minutes=12)).isoformat()))
            self.injected_incident = {
                "id": incident_id,
                "type": "incident_11_healthcare_billing_edi_schema_drift",
                "pack": "healthcare",
                "target_asset": "billing_adapter",
                "title": "Healthcare: EDI 837 Billing Generator Syntax Fault",
                "summary": "Revenue cycle claims batch generator failed parsing invalid ICD-10 diagnostic segment codes.",
                "ground_truth": {
                    "root_cause": "Incompatible ICD-10 diagnosis code format update in EDI 837 claims translation adapter",
                    "failing_check": "claims_adapter_status",
                    "supporting_evidence": ["job_status:billing_adapter", "logs_summary:billing_adapter"],
                    "recommended_action": "revert_change",
                    "target_asset": "billing_adapter",
                    "expected_owner_id": "owner_siddharth",
                    "expected_owner_name": "Siddharth Rao",
                    "expected_owner_role": "Revenue Cycle Integration Lead"
                }
            }

        self.conn.commit()
        return {
            "incident_id": incident_id,
            "incident_type": incident_type,
            "pack": self.active_pack_id,
            "target_asset": self.injected_incident.get("target_asset") if self.injected_incident else None,
            "title": self.injected_incident.get("title") if self.injected_incident else None,
            "status": "INJECTED_INTO_ENVIRONMENT_DATA",
            "note": "Village remains in current state until patrol runs checks (ENV-8)."
        }

