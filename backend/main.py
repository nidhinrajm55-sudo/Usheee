"""
FastAPI Server for Tracer: The Pipeline Village AI Incident-Investigation Agent.
Implements reference API surface (Section 11) with Server-Sent Events (SSE).
"""
import os
import json
import asyncio
import random
import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.environment import SimulatedEnvironment
from backend.tools import ToolRegistry
from backend.actions import ActionLayer
from backend.audit import AuditLogger
from backend.memory import IncidentMemory
from backend.agent import TracerAgent
from backend.evaluation import EvaluationHarness

app = FastAPI(title="Tracer: Pipeline Village AI Incident Agent", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pack Loader
PACKS_DIR = os.path.join(os.path.dirname(__file__), "packs")

def load_pack(pack_id: str) -> Dict[str, Any]:
    file_path = os.path.join(PACKS_DIR, f"{pack_id}_pack.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Pack '{pack_id}' not found.")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# Global State & Singletons
env = SimulatedEnvironment(seed=42)
audit = AuditLogger()
memory = IncidentMemory()
tools = ToolRegistry(env=env, pack_loader=load_pack)
actions = ActionLayer(env=env, pack_loader=load_pack, audit_logger=audit)

# Event subscribers for SSE
event_subscribers = []

def broadcast_sse(event_data: Dict[str, Any]):
    for queue in list(event_subscribers):
        try:
            queue.put_nowait(event_data)
        except Exception:
            pass

agent = TracerAgent(
    env=env,
    tools=tools,
    actions=actions,
    audit=audit,
    memory=memory,
    pack_loader=load_pack,
    event_broadcaster=broadcast_sse
)
evaluation_harness = EvaluationHarness(agent=agent, env=env, actions=actions)

# --- Request Models ---
class InjectRequest(BaseModel):
    incident_type: str
    seed: Optional[int] = None
    pack: Optional[str] = "fintech"

class ResetRequest(BaseModel):
    seed: Optional[int] = 42
    pack_id: Optional[str] = "fintech"

class ApproveRequest(BaseModel):
    approver: Optional[str] = "Human Operator"

class RejectRequest(BaseModel):
    reason: str
    rejected_by: Optional[str] = "Human Operator"

class SwitchPackRequest(BaseModel):
    pack_id: str

class EvalRequest(BaseModel):
    incident_type: str = "incident_1_fintech_partial_file"
    n_runs: int = 10

class SendEmailRequest(BaseModel):
    recipient_email: Optional[str] = "nidhinrajm55@gmail.com"
    recipient_name: Optional[str] = "Nidhin Raj"
    subject: Optional[str] = None
    report_id: Optional[str] = None

class SendSmsRequest(BaseModel):
    phone_number: Optional[str] = "+91 9074121510"
    recipient_name: Optional[str] = "Nidhin Raj"
    message: Optional[str] = None
    report_id: Optional[str] = None

class DispatchAllRequest(BaseModel):
    phone_number: Optional[str] = "+91 9074121510"
    recipient_email: Optional[str] = "nidhinrajm55@gmail.com"
    recipient_name: Optional[str] = "Nidhin Raj"
    subject: Optional[str] = None
    message: Optional[str] = None
    report_id: Optional[str] = None

# --- API Endpoints (Section 11) ---

@app.get("/packs")
def get_packs():
    """List loaded packs and their config."""
    loaded = {}
    for filename in os.listdir(PACKS_DIR):
        if filename.endswith("_pack.json"):
            p_id = filename.replace("_pack.json", "")
            loaded[p_id] = load_pack(p_id)
    return {
        "active_pack": env.active_pack_id,
        "available_packs": loaded
    }

@app.post("/packs/switch")
def switch_pack(req: SwitchPackRequest):
    """Switch active pack."""
    pack = load_pack(req.pack_id)
    env.reset(pack_id=req.pack_id)
    broadcast_sse({"event_type": "PACK_SWITCHED", "pack_id": req.pack_id})
    return {"status": "SWITCHED", "active_pack": req.pack_id, "pack_name": pack["name"]}

@app.post("/env/reset")
@app.post("/reset")
def reset_env(req: ResetRequest = ResetRequest()):
    """One-click reset: restores clean baseline in under 5 seconds (ENV-4)."""
    res = env.reset(seed=req.seed, pack_id=req.pack_id or env.active_pack_id)
    agent.worker_state = {
        "mode": "IDLE",
        "current_house": None,
        "target_house": None,
        "patrol_step": 0
    }
    agent.steps = []
    agent.current_proposal = None
    agent.approved_proposal = None
    agent.current_report = None
    agent.current_sos = None
    agent.current_diagnosed_report = None
    broadcast_sse({"event_type": "RESET_COMPLETED", "data": res})
    return res

@app.post("/env/inject")
def inject_incident(req: InjectRequest):
    """
    Inject seeded incident into simulated environment (ENV-3, ENV-8).
    Does NOT start fire automatically; fire starts when check fails.
    """
    if req.pack and req.pack != env.active_pack_id:
        env.reset(pack_id=req.pack)
    res = env.inject_incident(incident_type=req.incident_type, seed=req.seed)
    broadcast_sse({"event_type": "INCIDENT_INJECTED", "data": res})
    return res

@app.get("/owners")
def get_owners():
    """Owner directory for the active pack (NTF-1)."""
    pack = load_pack(env.active_pack_id)
    return {
        "pack_id": env.active_pack_id,
        "owners": pack.get("owners", [])
    }

@app.post("/patrol/start")
async def start_patrol():
    """Starts the firefighter-worker patrol inspecting village houses (AGT-0)."""
    async def patrol_gen():
        fire_found = False
        async for evt in agent.run_patrol():
            broadcast_sse(evt)
            if evt.get("type") == "FIRE_DISCOVERED":
                fire_found = True
        if fire_found:
            await asyncio.sleep(0.6)
            async for evt in agent.investigate_incident():
                broadcast_sse(evt)
    asyncio.create_task(patrol_gen())
    return {"status": "PATROL_LAUNCHED"}

@app.post("/agent/run-cycle")
async def run_full_cycle(req: InjectRequest):
    """One-click end-to-end incident cycle: Injects, patrols, discovers fire, and investigates (AGT-0 through AGT-10)."""
    pack_id = req.pack or env.active_pack_id
    env.reset(pack_id=pack_id)
    agent.worker_state = {
        "mode": "IDLE",
        "current_house": None,
        "target_house": None,
        "patrol_step": 0
    }
    agent.steps = []
    agent.current_proposal = None
    agent.approved_proposal = None
    agent.current_report = None
    agent.current_sos = None
    agent.current_diagnosed_report = None

    res = env.inject_incident(incident_type=req.incident_type, seed=req.seed)
    broadcast_sse({"event_type": "INCIDENT_INJECTED", "data": res})

    async def cycle_gen():
        fire_found = False
        async for evt in agent.run_patrol():
            broadcast_sse(evt)
            if evt.get("type") == "FIRE_DISCOVERED":
                fire_found = True
        if fire_found:
            await asyncio.sleep(0.6)
            async for evt in agent.investigate_incident():
                broadcast_sse(evt)
    asyncio.create_task(cycle_gen())
    return {"status": "CYCLE_STARTED", "incident": res}

@app.post("/agent/trigger-random-break")
async def trigger_random_break():
    """Randomly breaks a data pipeline endpoint and starts worker visiting every endpoint to find and fix it."""
    fintech_breaks = [
        "incident_1_fintech_partial_file",        # Node 1: Bank Settlement Feed (-69% rows, $241k break)
        "incident_4_fintech_column_rename",       # Node 2: Core Payment Ledger (tx_amt rename)
        "incident_6_fintech_recon_break",         # Node 3: Daily Recon Table ($318k clearing break)
        "incident_8_fintech_dashboard_stale_cache",# Node 4: Settlement Dashboard (Redis lock timeout)
        "incident_9_fintech_regulatory_seal_mismatch",# Node 5: Regulatory Compliance (HMAC audit seal mismatch)
        "incident_3_fintech_malformed_escalation" # Node 1: Partner Binary Corruption (0 writes safe escalation)
    ]
    healthcare_breaks = [
        "incident_7_healthcare_adt_stale",        # Node 1: ADT Inbound Feed (Stale 22m lag)
        "incident_2_healthcare_mapping_reject",   # Node 2: Lab Results Feed (Mapping error on OBX-5)
        "incident_5_healthcare_acks_stopped",     # Node 3: Interface Queue (Deadlock in socket listener)
        "incident_10_healthcare_pharmacy_cpoe_deadlock", # Node 4: Pharmacy Dispenser (Thread pool deadlock)
        "incident_11_healthcare_billing_edi_schema_drift" # Node 5: Billing Extractor (EDI 837 syntax drift)
    ]

    pack_id = env.active_pack_id
    pool = fintech_breaks if pack_id == "fintech" else healthcare_breaks
    current_inc = env.injected_incident.get("type") if env.injected_incident else None
    choices = [b for b in pool if b != current_inc] or pool
    chosen_break = random.choice(choices)

    # Reset environment cleanly
    env.reset(pack_id=pack_id)
    agent.worker_state = {
        "mode": "IDLE",
        "current_house": None,
        "target_house": None,
        "patrol_step": 0
    }
    agent.steps = []
    agent.current_proposal = None
    agent.approved_proposal = None
    agent.current_report = None
    agent.current_sos = None
    agent.current_diagnosed_report = None

    # Inject chosen break into the simulated environment data
    res = env.inject_incident(incident_type=chosen_break)
    broadcast_sse({"event_type": "INCIDENT_INJECTED", "data": res})

    # Launch worker visiting every endpoint in sequence!
    async def cycle_gen():
        fire_found = False
        async for evt in agent.run_patrol():
            broadcast_sse(evt)
            if evt.get("type") == "FIRE_DISCOVERED":
                fire_found = True
        if fire_found:
            await asyncio.sleep(0.6)
            async for evt in agent.investigate_incident():
                broadcast_sse(evt)

    asyncio.create_task(cycle_gen())
    return {
        "status": "RANDOM_BREAK_TRIGGERED",
        "incident_type": chosen_break,
        "target_asset": res.get("target_asset"),
        "title": res.get("title")
    }

@app.post("/incidents/{incident_id}/run")
async def run_incident_investigation(incident_id: str):
    """Launches full agent investigation loop."""
    async def run_gen():
        async for evt in agent.investigate_incident(incident_id=incident_id):
            broadcast_sse(evt)
    asyncio.create_task(run_gen())
    return {"status": "INVESTIGATION_STARTED", "incident_id": incident_id}

@app.post("/incidents/{incident_id}/approve")
async def approve_incident_fix(incident_id: str, req: ApproveRequest = ApproveRequest()):
    """Human approval gate: mints single-use token, executes fix, verifies, and delivers report (APR-2)."""
    if agent.current_proposal:
        agent.approved_proposal = agent.current_proposal
        agent.current_proposal = None

    async def approve_gen():
        async for evt in agent.approve_and_execute(approver_name=req.approver or "Sarah Chen (Recon Ops Lead)"):
            broadcast_sse(evt)
    asyncio.create_task(approve_gen())
    return {"status": "APPROVAL_ACCEPTED_EXECUTING"}

@app.post("/incidents/{incident_id}/reject")
async def reject_incident_fix(incident_id: str, req: RejectRequest):
    """Rejects the fix proposal with an audit-logged reason (APR-5)."""
    res = await agent.reject_fix_proposal(reason=req.reason, rejected_by=req.rejected_by)
    return res

@app.get("/incidents/{incident_id}")
def get_incident_status(incident_id: str):
    """Current state and conclusion."""
    return {
        "incident_id": incident_id,
        "active_pack": env.active_pack_id,
        "worker_state": agent.worker_state,
        "injected_incident": env.injected_incident,
        "steps": agent.steps,
        "proposal": agent.current_proposal,
        "report": agent.current_report,
        "sos_alert": getattr(agent, "current_sos", None),
        "diagnosed_report": getattr(agent, "current_diagnosed_report", None),
        "sent_emails": getattr(agent, "sent_emails", []),
    }

@app.get("/incidents/{incident_id}/report")
def get_incident_report(incident_id: str):
    """Returns the generated dual-view report (summary + technical) for the incident."""
    if not agent.current_report:
        raise HTTPException(status_code=404, detail="No report generated yet.")
    return agent.current_report

@app.get("/notifications/latest")
def get_latest_notifications():
    """Retrieve the latest SOS alert, diagnosed report, and all sent email and SMS records."""
    return {
        "sos_alert": getattr(agent, "current_sos", None),
        "diagnosed_report": getattr(agent, "current_diagnosed_report", None),
        "final_report": getattr(agent, "current_report", None),
        "sent_emails": getattr(agent, "sent_emails", []),
        "sent_sms": getattr(agent, "sent_sms", [])
    }

@app.post("/notifications/send-email")
def send_email_notification_endpoint(req: SendEmailRequest = SendEmailRequest()):
    """
    Triggers or retries sending official incident email notifications to the designated engineer.
    """
    rep = agent.current_diagnosed_report or agent.current_report
    sos = agent.current_sos
    target_asset = ""
    if rep:
        target_asset = rep.get("target_asset") or rep.get("asset_id", "")
    elif sos:
        target_asset = sos.get("asset_id", "")

    owner_info = agent._get_asset_owner(target_asset)
    recipient_email = req.recipient_email or owner_info.get("email", "nidhinrajm55@gmail.com")
    recipient_name = req.recipient_name or owner_info.get("name", "Nidhin Raj")

    if rep:
        msg_type = "DIAGNOSED_REPORT"
        asset_title = agent._get_asset_name(target_asset)
        subject = req.subject or f"📋 [DIAGNOSED INCIDENT REPORT] Root Cause Analysis: {asset_title}"
        report_data = rep
    elif sos:
        msg_type = "SOS_ALERT"
        asset_title = agent._get_asset_name(target_asset)
        subject = req.subject or f"🚨 [P0 SOS ALERT] Data Pipeline Break: {asset_title}"
        report_data = sos
    else:
        # Diagnostic test alert if no active break
        msg_type = "TEST_SOS_ALERT"
        asset_title = "Pipeline Village Core"
        subject = req.subject or f"🚨 [P0 SOS ALERT] Notification System Health Check: {asset_title}"
        report_data = {
            "id": f"SOS_TEST_{int(time.time())}",
            "target_asset": "pipeline_core",
            "message": "Routine health check notification from Tracer Incident Responder."
        }

    receipt = agent.send_email_notification(
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        subject=subject,
        report_data=report_data,
        notification_type=msg_type
    )
    return {
        "status": "EMAIL_DISPATCHED",
        "receipt": receipt,
        "recipient": recipient_email,
        "subject": subject
    }

@app.post("/notifications/send-sms")
def send_sms_notification_endpoint(req: SendSmsRequest = SendSmsRequest()):
    """
    Dispatches urgent cellular SMS / SOS alert to the designated engineer's phone (+91 9074121510).
    """
    rep = agent.current_diagnosed_report or agent.current_report
    sos = agent.current_sos
    target_asset = ""
    if rep:
        target_asset = rep.get("target_asset") or rep.get("asset_id", "")
    elif sos:
        target_asset = sos.get("asset_id", "")

    owner_info = agent._get_asset_owner(target_asset)
    phone_number = req.phone_number or owner_info.get("phone", "+91 9074121510")
    recipient_name = req.recipient_name or owner_info.get("name", "Nidhin Raj")

    if sos:
        msg_type = "SOS_SMS_ALERT"
        asset_title = agent._get_asset_name(target_asset)
        failing_check = sos.get("failing_check", "Critical Check Failure")
        message = req.message or f"🚨 [P0 SOS ALERT] Pipeline Break on '{asset_title}'! Check '{failing_check}' failed. Tracer responding immediately. Ref: {sos.get('id')}"
        report_data = sos
    elif rep:
        msg_type = "DIAGNOSED_SMS_SUMMARY"
        asset_title = agent._get_asset_name(target_asset)
        action = rep.get("proposed_solution", {}).get("action", "revert_change")
        message = req.message or f"📋 [DIAGNOSIS COMPLETE] Node '{asset_title}' diagnosed: {str(rep.get('root_cause_explanation'))[:80]}... Proposed fix: {action}. Sign-off needed."
        report_data = rep
    else:
        msg_type = "TEST_SOS_SMS"
        message = req.message or f"🚨 [P0 SOS ALERT] Tracer Mobile Pager Test dispatched to {recipient_name} ({phone_number}). All systems operational."
        report_data = {
            "id": f"SMS_TEST_{int(time.time())}",
            "target_asset": "pipeline_core",
            "message": "Routine SMS test from Tracer SRE Sentinel."
        }

    receipt = agent.send_sms_notification(
        recipient_phone=phone_number,
        recipient_name=recipient_name,
        message=message,
        report_data=report_data,
        notification_type=msg_type
    )
    return {
        "status": "SMS_DISPATCHED",
        "receipt": receipt,
        "phone_number": phone_number,
        "message": message
    }

@app.post("/notifications/dispatch-all")
def dispatch_all_notification_endpoint(req: DispatchAllRequest = DispatchAllRequest()):
    """
    Simultaneously dispatches both the urgent SMS to phone (+91 9074121510)
    and the detailed incident report to email (nidhinrajm55@gmail.com).
    """
    email_res = send_email_notification_endpoint(SendEmailRequest(
        recipient_email=req.recipient_email,
        recipient_name=req.recipient_name,
        subject=req.subject,
        report_id=req.report_id
    ))
    sms_res = send_sms_notification_endpoint(SendSmsRequest(
        phone_number=req.phone_number,
        recipient_name=req.recipient_name,
        message=req.message,
        report_id=req.report_id
    ))
    return {
        "status": "ALL_DISPATCHED",
        "email_receipt": email_res["receipt"],
        "sms_receipt": sms_res["receipt"],
        "recipient_email": email_res["recipient"],
        "recipient_phone": sms_res["phone_number"]
    }

class GatewayConfigRequest(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_pass: Optional[str] = None
    fast2sms_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_from_number: Optional[str] = None

@app.get("/notifications/gateway-config")
def get_gateway_config_endpoint():
    """Returns outbound SMS and SMTP gateway readiness."""
    from backend.gateway import get_gateway_config
    return get_gateway_config()

@app.post("/notifications/gateway-config")
def update_gateway_config_endpoint(req: GatewayConfigRequest):
    """Updates real SMTP credentials and SMS API keys for live transmission."""
    from backend.gateway import update_gateway_config
    data = {}
    if req.smtp_host: data["SMTP_HOST"] = req.smtp_host
    if req.smtp_port: data["SMTP_PORT"] = str(req.smtp_port)
    if req.smtp_user: data["SMTP_USER"] = req.smtp_user
    if req.smtp_pass: data["SMTP_PASS"] = req.smtp_pass
    if req.fast2sms_api_key: data["FAST2SMS_API_KEY"] = req.fast2sms_api_key
    if req.twilio_account_sid: data["TWILIO_ACCOUNT_SID"] = req.twilio_account_sid
    if req.twilio_auth_token: data["TWILIO_AUTH_TOKEN"] = req.twilio_auth_token
    if req.twilio_from_number: data["TWILIO_FROM_NUMBER"] = req.twilio_from_number

    cfg = update_gateway_config(data)
    return {"status": "CONFIG_SAVED", "gateway_config": cfg}

@app.get("/audit")
def get_audit_log(incident_id: Optional[str] = None):
    """Audit log entries with cryptographic tamper verification."""
    entries = audit.get_entries(incident_id=incident_id)
    integrity = audit.verify_chain_integrity()
    return {
        "entries": entries,
        "integrity": integrity,
        "unapproved_writes_count": actions.unapproved_writes_count,
        "successful_writes_count": actions.successful_writes_count
    }

@app.post("/eval/run")
def run_evaluation(req: EvalRequest):
    """Runs evaluation benchmark across N iterations comparing Tracer to Plain-LLM baseline."""
    res = evaluation_harness.run_benchmark(incident_type=req.incident_type, n_runs=req.n_runs)
    return res

@app.get("/eval/results")
def get_eval_results(format: Optional[str] = "json"):
    """Get latest evaluation benchmark results, with CSV export support."""
    if not evaluation_harness.benchmark_history:
        # Generate default benchmark if none exists yet
        res = evaluation_harness.run_benchmark("incident_1_fintech_partial_file", 10)
    else:
        res = evaluation_harness.benchmark_history[-1]

    if format == "csv":
        csv_str = evaluation_harness.export_csv(res)
        return Response(content=csv_str, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tracer_benchmark.csv"})
    return res

@app.get("/incidents/stream")
async def sse_event_stream(request: Request):
    """SSE endpoint streaming live agent steps, worker moves, fires, approvals, and report delivery."""
    queue = asyncio.Queue()
    event_subscribers.append(queue)

    async def event_generator():
        try:
            # Send initial greeting
            yield f"data: {json.dumps({'event_type': 'STREAM_CONNECTED', 'active_pack': env.active_pack_id})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                event = await queue.get()
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in event_subscribers:
                event_subscribers.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "TRACER_BACKEND_ACTIVE"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
