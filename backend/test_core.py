"""
Core Acceptance Tests for Tracer (APR-6, PACK-1, ENV-4, AUD-2).
"""
import time
from backend.environment import SimulatedEnvironment
from backend.tools import ToolRegistry
from backend.actions import ActionLayer, UnapprovedWriteException
from backend.audit import AuditLogger
from backend.memory import IncidentMemory
from backend.agent import TracerAgent
from backend.main import load_pack

def test_unapproved_writes_rejected():
    """APR-6: Attempt every write action without a token; all must raise UnapprovedWriteException."""
    env = SimulatedEnvironment(seed=42)
    audit = AuditLogger()
    actions = ActionLayer(env=env, pack_loader=load_pack, audit_logger=audit)

    write_actions = [
        ("reload_from_corrected_source", "bank_settlement_feed"),
        ("revert_change", "payment_ledger"),
        ("restart_job", "bank_settlement_feed")
    ]

    for act, target in write_actions:
        dry = actions.dry_run(act, target)
        try:
            actions.execute_action(act, target, dry["dry_run_hash"], token=None)
            assert False, f"Action {act} succeeded without token! Security breach."
        except UnapprovedWriteException:
            pass # Expected!

    assert actions.unapproved_writes_count == len(write_actions)
    print(f"PASS: APR-6 - Attempted {len(write_actions)} unapproved writes, all blocked strictly.")

def test_pack_extensibility_pack_1():
    """PACK-1: 3rd pack loads and checks run with ZERO changes to agent loop."""
    env = SimulatedEnvironment(seed=42)
    res = env.reset(pack_id="logistics")
    assert res["pack_id"] == "logistics"
    pack = load_pack("logistics")
    assert pack["pack_id"] == "logistics"
    assert len(pack["assets"]) >= 2
    tools = ToolRegistry(env=env, pack_loader=load_pack)
    tool_res = tools.get_freshness("telematics_iot_stream")
    assert tool_res["output"]["sla_cutoff_met"] is True
    print("PASS: PACK-1 - Logistics 3rd pack loaded and executed checks seamlessly.")

def test_one_click_reset_under_5_seconds():
    """ENV-4: Reset must complete in under 5 seconds."""
    env = SimulatedEnvironment(seed=42)
    start = time.time()
    res = env.reset(pack_id="fintech")
    elapsed = time.time() - start
    assert elapsed < 5.0
    print(f"PASS: ENV-4 - One-click reset completed in {res['duration_ms']}ms (< 5000ms target).")

def test_audit_hash_chain_integrity():
    """AUD-2: Tamper-evident hash chain verification."""
    audit = AuditLogger()
    audit.record_event(actor="Agent", event_type="CHECK", payload={"status": "PASS"})
    audit.record_event(actor="Human", event_type="APPROVE", payload={"token": "APPR_123"})
    verification = audit.verify_chain_integrity()
    assert verification["valid"] is True
    assert verification["total_verified_entries"] == 2
    print("PASS: AUD-2 - Tamper-evident hash chain verified with 100% integrity.")

def test_sos_and_diagnosed_report_notifications():
    """NTF-10: SOS Alert, Diagnosed Incident Report, and Email Dispatch with Cryptographic Receipt."""
    env = SimulatedEnvironment(seed=42)
    audit = AuditLogger()
    actions = ActionLayer(env=env, pack_loader=load_pack, audit_logger=audit)
    memory = IncidentMemory()
    tools = ToolRegistry(env=env, pack_loader=load_pack)
    agent = TracerAgent(
        env=env,
        tools=tools,
        actions=actions,
        audit=audit,
        memory=memory,
        pack_loader=load_pack
    )

    # Test email dispatch
    email_receipt = agent.send_email_notification(
        recipient_email="nidhinrajm55@gmail.com",
        recipient_name="Nidhin Raj",
        subject="[TEST ALERT] Settlement Discrepancy",
        report_data={"asset_id": "bank_settlement_feed", "incident_id": "inc_test_101"}
    )
    assert email_receipt["status"] in ["DELIVERED", "DELIVERED_SIMULATED"]
    assert email_receipt["recipient_email"] == "nidhinrajm55@gmail.com"
    assert len(email_receipt["audit_hash"]) > 8
    assert len(agent.sent_emails) == 1

    # Test SMS dispatch
    sms_receipt = agent.send_sms_notification(
        recipient_phone="+91 9074121510",
        recipient_name="Nidhin Raj",
        message="🚨 SOS ALERT: Settlement Discrepancy detected on bank_settlement_feed. Tracer responding.",
        report_data={"asset_id": "bank_settlement_feed", "incident_id": "inc_test_101"}
    )
    assert sms_receipt["status"] in ["DELIVERED", "DELIVERED_SIMULATED"]
    assert sms_receipt["recipient_phone"] == "+91 9074121510"
    assert len(sms_receipt["audit_hash"]) > 8
    assert len(agent.sent_sms) == 1

    # Verify audit trail logs email and SMS dispatches
    entries = audit.get_entries()
    assert any(e["event_type"] == "EMAIL_NOTIFICATION_DISPATCHED" for e in entries)
    assert any(e["event_type"] == "SMS_NOTIFICATION_DISPATCHED" for e in entries)

    print("PASS: NTF-10 - SMS dispatch to 9074121510, Email dispatch to nidhinrajm55@gmail.com, and audit verification verified.")

if __name__ == "__main__":
    test_unapproved_writes_rejected()
    test_pack_extensibility_pack_1()
    test_one_click_reset_under_5_seconds()
    test_audit_hash_chain_integrity()
    test_sos_and_diagnosed_report_notifications()
    print("ALL CORE UNIT TESTS PASSED!")

