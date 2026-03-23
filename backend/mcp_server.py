import asyncio
import uuid
import sys
import os

# Ensure the backend directory is in the path so imports work correctly when called by IDE via absolute path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mcp.server.fastmcp import FastMCP
from scanner.engine import ScannerEngine
from models.database import SessionLocal, ScanReportModel
import json

# Initialize the official FastMCP Server for Anthropic's Model Context Protocol
mcp = FastMCP("HerculesSec Pro")

@mcp.tool()
async def trigger_vulnerability_scan(target_url: str) -> str:
    """
    Triggers the elite HerculesSec Pro Dual-Layer scanning engine against a target URL.
    Returns the scan ID and a highly detailed summary of vulnerabilities detected, including CISA KEV and Exploit-DB metadata.
    """
    scan_id = str(uuid.uuid4())
    
    # Initialize DB record
    db = SessionLocal()
    db_scan = ScanReportModel(
        id=scan_id,
        target_url=target_url,
        status="running",
        risk_score=0,
        report_json={}
    )
    db.add(db_scan)
    db.commit()
    db.close()
    
    # Instantiate the scanning engine
    engine = ScannerEngine(scan_id, target_url)
    
    try:
        # We await the engine directly instead of pushing to background tasks 
        # because the IDE needs to wait for the synchronous string return format.
        await engine.run_scan()
        
        # Pull the structured results from the local SQLite persistence layer
        db = SessionLocal()
        completed_scan = db.query(ScanReportModel).filter(ScanReportModel.id == scan_id).first()
        
        if completed_scan and completed_scan.status == "completed":
            vulnerabilities = completed_scan.report_json.get('vulnerabilities', [])
            result_str = f"Scan {scan_id} successfully finalized.\nFinal Security Risk Score: {completed_scan.risk_score}/100\nDetected {len(vulnerabilities)} vulnerabilities.\n\n"
            
            for v in vulnerabilities:
                result_str += f"- [{v.get('severity')}] {v.get('title')}: {v.get('description')}\n"
                result_str += f"  Remediation: {v.get('remediation')}\n"
            
            db.close()
            return result_str
        else:
            db.close()
            return f"Scan failed to complete successfully."
            
    except Exception as e:
        return f"Critical error during MCP execution: {str(e)}"

if __name__ == "__main__":
    # Launch the stdio transport layer hook for IDEs like Cursor and Claude
    mcp.run(transport='stdio')
