from fastapi import APIRouter, HTTPException, BackgroundTasks, Header
from models.schemas import ScanRequest, ScanReport, Vulnerability
from scanner.engine import ScannerEngine
from models.database import SessionLocal, ScanReportModel
import uuid
from datetime import datetime
import httpx
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class OAuthRequest(BaseModel):
    code: str

@router.post("/auth/github")
async def github_auth(req: OAuthRequest):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": req.code
            }
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Invalid OAuth code returned from provider.")
            
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_data = user_res.json()
        
        return {
            "token": access_token,
            "username": user_data.get("login"),
            "avatar": user_data.get("avatar_url")
        }

@router.get("/github/repos")
async def get_github_repos(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session state.")
        
    token = authorization.split(" ")[1]
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.github.com/user/repos?sort=updated&per_page=100",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"}
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to hook user repository list.")
        repos = res.json()
        return [{"name": r["full_name"], "private": r["private"], "url": r["html_url"]} for r in repos]

@router.post("/scan", response_model=ScanReport)
async def submit_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    if not request.target_url and not request.target_repo:
        raise HTTPException(status_code=400, detail="Must provide target_url or target_repo")
    
    scan_id = str(uuid.uuid4())
    target = str(request.target_url) if request.target_url else request.target_repo
    
    db = SessionLocal()
    db_scan = ScanReportModel(
        id=scan_id,
        target_url=target,
        status="running",
        risk_score=0,
        report_json={}
    )
    db.add(db_scan)
    db.commit()
    db.close()

    report = ScanReport(scan_id=scan_id, status="running", target=target, risk_score=0, vulnerabilities=[])
    
    engine = ScannerEngine(scan_id, target)
    background_tasks.add_task(engine.run_scan)
    
    return report

@router.get("/scan/{scan_id}", response_model=ScanReport)
async def get_scan_status(scan_id: str):
    db = SessionLocal()
    db_scan = db.query(ScanReportModel).filter(ScanReportModel.id == scan_id).first()
    db.close()
    
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan not found in database")
    
    vulnerabilities = []
    if db_scan.report_json and "vulnerabilities" in db_scan.report_json:
        vulnerabilities = [Vulnerability(**v) for v in db_scan.report_json["vulnerabilities"]]
        
    rep_json = db_scan.report_json or {}
        
    return ScanReport(
        scan_id=db_scan.id,
        status=db_scan.status,
        target=db_scan.target_url,
        risk_score=db_scan.risk_score,
        overall_risk_level=rep_json.get("overall_risk_level", "Low"),
        scan_duration=rep_json.get("scan_duration", "0s"),
        start_time=db_scan.created_at,
        finish_time=datetime.utcnow() if db_scan.status == "completed" else None,
        tests_performed=rep_json.get("tests_performed", 0),
        vulnerabilities=vulnerabilities
    )
