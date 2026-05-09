from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
import asyncio
from playwright.async_api import async_playwright
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Mebbis Sync Service")

class SyncRequest(BaseModel):
    tckn: str
    username: str = os.getenv("MEBBIS_USERNAME")
    password: str = os.getenv("MEBBIS_PASSWORD")

class MEBBISNavigator:
    async def login(self, page, username, password):
        print(f"[MEBBIS] Attempting login for {username}...")
        await page.goto("https://mebbis.meb.gov.tr/")
        
        # This is a simplified pattern; actual MEBBIS selector IDs would go here
        await page.fill("#txtKullaniciAd", username)
        await page.fill("#txtSifre", password)
        
        # Handle CAPTCHA if needed (manual/AI)
        # await page.click("#btnGiris")
        # await page.wait_for_selector(".main-menu")
        return True

    async def get_student_report(self, tckn, username, password):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                # 1. Login
                await self.login(page, username, password)
                
                # 2. Navigate to RAM Module (Mocked navigation)
                # await page.goto("https://mebbis.meb.gov.tr/OzelEgitim/OgrenciRaporSorgu.aspx")
                # await page.fill("#txtOgrenciTC", tckn)
                # await page.click("#btnSorgula")
                
                # 3. Extract Data (Mocked extraction for MVP)
                await asyncio.sleep(2) # Simulate processing
                
                return {
                    "success": True,
                    "data": {
                        "tckn": tckn,
                        "fullName": "Öğrenci Adı (MEBBİS)",
                        "diagnosis": "Zihinsel Yetersizlik",
                        "category": "ZİHİNSEL",
                        "endDate": "2027-05-20",
                        "targets": [
                            "Özbakım becerilerini geliştirir.",
                            "Günlük yaşam becerilerini bağımsız yapar.",
                            "Basit toplama işlemlerini kavrar."
                        ]
                    }
                }
            except Exception as e:
                print(f"[MEBBIS] Error: {e}")
                return {"success": False, "error": str(e)}
            finally:
                await browser.close()

navigator = MEBBISNavigator()

@app.get("/")
def read_root():
    return {"status": "online", "service": "mebbis-sync", "engine": "playwright"}

@app.post("/api/v1/sync/pull-student")
async def pull_student(req: SyncRequest):
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="MEBBIS credentials missing")
    
    result = await navigator.get_student_report(req.tckn, req.username, req.password)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)
