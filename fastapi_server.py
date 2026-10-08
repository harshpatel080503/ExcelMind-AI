from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import os
import uuid
import json
import asyncio
from typing import Optional, List
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, AIMessage
from my_agent.agent import graph
import sys
import io

# Force UTF-8 encoding for standard output to support emojis on Windows consoles
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

app = FastAPI(title="ExcelMind AI Backend")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

os.makedirs(".uploads", exist_ok=True)
os.makedirs(".sandbox/plots", exist_ok=True)

app.mount("/plots", StaticFiles(directory=".sandbox/plots"), name="plots")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload an Excel or CSV file"""
    try:
        file_path = os.path.join(os.getcwd(), ".uploads", file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        return {"filename": file.filename, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/state/{thread_id}")
async def get_state(thread_id: str):
    """Get the current state of a thread"""
    config = {"configurable": {"thread_id": thread_id}}
    state = graph.get_state(config)
    
    if not state or not state.values:
        return {"messages": [], "artifacts": [], "pending_approval": False}
        
    messages = []
    for msg in state.values.get("messages", []):
        if not msg.content:
            continue
        if isinstance(msg, HumanMessage):
            # Don't send internal prompts to the UI
            content_str = str(msg.content)
            if content_str.startswith("User Request:") or "Execute the following analysis plan" in content_str:
                continue
            messages.append({"role": "user", "content": content_str})
        elif isinstance(msg, AIMessage):
            messages.append({"role": "assistant", "content": str(msg.content)})
        
    is_paused = bool(state.next and "coding_agent" in state.next)
    
    return {
        "messages": messages,
        "data_context": state.values.get("data_context"),
        "artifacts": state.values.get("artifacts", []),
        "analysis_plan": state.values.get("analysis_plan"),
        "pending_approval": is_paused,
    }

class SearchRequest(BaseModel):
    query: str
    thread_ids: List[str]

@app.post("/api/search")
async def search_threads(req: SearchRequest):
    """Search thread contents for a specific query"""
    query = req.query.lower()
    if not query:
        return {"matching_threads": req.thread_ids}
        
    matching_threads = []
    
    for thread_id in req.thread_ids:
        config = {"configurable": {"thread_id": thread_id}}
        state = graph.get_state(config)
        
        if not state or not state.values:
            continue
            
        found = False
        for msg in state.values.get("messages", []):
            if not msg.content:
                continue
            if query in str(msg.content).lower():
                found = True
                break
                
        if found:
            matching_threads.append(thread_id)
            
    return {"matching_threads": matching_threads}

@app.post("/api/analyze")
async def analyze(
    prompt: str = Form(...),
    thread_id: str = Form(...),
    file_path: Optional[str] = Form(None)
):
    """Stream the analysis process via Server-Sent Events"""
    config = {"configurable": {"thread_id": thread_id}}
    
    input_state = {"messages": [HumanMessage(content=prompt)]}
    if file_path:
        input_state["excel_file_path"] = file_path

    async def event_generator():
        try:
            # Stream updates from graph
            async for event in graph.astream(input_state, config, stream_mode="updates"):
                for node, state_update in event.items():
                    # Send node completion event
                    yield f"data: {json.dumps({'event': 'node_complete', 'node': node})}\n\n"
                    
            # After streaming finishes, check if paused or done
            final_state = graph.get_state(config)
            is_paused = final_state.next and "coding_agent" in final_state.next
            
            yield f"data: {json.dumps({'event': 'workflow_complete', 'pending_approval': bool(is_paused)})}\n\n"
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/approve")
async def approve(
    thread_id: str = Form(...),
    modification: Optional[str] = Form(None)
):
    """Approve or modify a paused plan"""
    config = {"configurable": {"thread_id": thread_id}}
    
    if modification:
        # Update state with modification
        new_msg = HumanMessage(content=f"Wait, please modify the plan: {modification}")
        graph.update_state(config, {"messages": [new_msg]}, as_node="supervisor")

    async def event_generator():
        try:
            async for event in graph.astream(None, config, stream_mode="updates"):
                for node, state_update in event.items():
                    yield f"data: {json.dumps({'event': 'node_complete', 'node': node})}\n\n"
                    
            final_state = graph.get_state(config)
            yield f"data: {json.dumps({'event': 'workflow_complete', 'pending_approval': False})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_server:app", host="0.0.0.0", port=8000, reload=True)
