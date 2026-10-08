Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'E:\Data Science Study\Project\venv\Scripts\python.exe' fastapi_server.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; & 'E:\Data Science Study\Project\venv\Scripts\python.exe' run_sandbox_server.py"
