from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import ScanRequest, ScanReport
from scanner.engine import ScannerEngine
import uuid

router = APIRouter()
scans_db = {}

@router.post("/scan", response_model=ScanReport)
async def submit_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    if not request.target_url and not request.target_repo:
        raise HTTPException(status_code=400, detail="Must provide target_url or target_repo")
    
    scan_id = str(uuid.uuid4())
    target = str(request.target_url) if request.target_url else request.target_repo
    
    report = ScanReport(
        scan_id=scan_id,
        status="pending",
        target=target,
        risk_score=0,
        vulnerabilities=[]
    )
    scans_db[scan_id] = report
    
    engine = ScannerEngine(scan_id, target, scans_db)
    background_tasks.add_task(engine.run_scan)
    
    report.status = "running"
    return report

@router.get("/scan/{scan_id}", response_model=ScanReport)
async def get_scan_status(scan_id: str):
    if scan_id not in scans_db:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scans_db[scan_id]
