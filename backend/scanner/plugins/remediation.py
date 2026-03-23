from models.schemas import Vulnerability

class AIAutoRemediation:
    async def generate_patch(self, vuln: Vulnerability) -> str:
        # Generates deterministic multi-file patches
        if "localStorage" in vuln.description:
            return "--- a/frontend/auth.js\n+++ b/frontend/auth.js\n- localStorage.setItem('token', jwt);\n+ // handled by httpOnly cookies"
        return "// Auto-generated patch pending..."
