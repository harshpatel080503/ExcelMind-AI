import streamlit as st
import os
import asyncio
import uuid
from langchain_core.messages import HumanMessage, AIMessage

# Make sure we don't hit event loop issues in streamlit
import nest_asyncio
nest_asyncio.apply()

from my_agent.agent import graph

st.set_page_config(page_title="ExcelMind AI", page_icon="📊", layout="wide")

st.title("ExcelMind AI - Data Analyst")

# Initialize session state for LangGraph memory
if "thread_id" not in st.session_state:
    st.session_state.thread_id = str(uuid.uuid4())
if "messages" not in st.session_state:
    st.session_state.messages = []
if "excel_file_path" not in st.session_state:
    st.session_state.excel_file_path = None
if "pending_approval" not in st.session_state:
    st.session_state.pending_approval = False
if "artifacts" not in st.session_state:
    st.session_state.artifacts = []

def sync_state_from_graph():
    """Syncs Streamlit session state with the actual LangGraph checkpointer state"""
    config = {"configurable": {"thread_id": st.session_state.thread_id}}
    current_state = graph.get_state(config)
    if current_state.values:
        st.session_state.messages = current_state.values.get("messages", [])
        st.session_state.artifacts = current_state.values.get("artifacts", [])
        
        # Check if we are paused at human-in-the-loop
        if current_state.next and "coding_agent" in current_state.next:
            st.session_state.pending_approval = True
        else:
            st.session_state.pending_approval = False

# Sidebar for controls
with st.sidebar:
    st.header("Session Management")
    
    # Thread ID selection (Conversation Memory)
    new_thread_id = st.text_input("Session ID (Change to load past sessions)", value=st.session_state.thread_id)
    if new_thread_id != st.session_state.thread_id:
        st.session_state.thread_id = new_thread_id
        sync_state_from_graph()
        st.rerun()
        
    st.markdown("---")
    
    st.header("Upload Data")
    uploaded_file = st.file_uploader("Upload an Excel or CSV file", type=["csv", "xlsx", "xls"])
    
    if uploaded_file is not None:
        os.makedirs(".uploads", exist_ok=True)
        file_path = os.path.join(os.getcwd(), ".uploads", uploaded_file.name)
        with open(file_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.session_state.excel_file_path = file_path
        st.success(f"File uploaded successfully: {uploaded_file.name}")
        
    st.markdown("---")
    if st.button("Clear Current Conversation"):
        st.session_state.thread_id = str(uuid.uuid4())
        st.session_state.messages = []
        st.session_state.artifacts = []
        st.session_state.pending_approval = False
        st.rerun()

    # Export functionality
    if st.session_state.artifacts or st.session_state.messages:
        st.markdown("---")
        st.header("Export")
        
        # Build simple markdown report
        report = "# ExcelMind AI Analysis Report\n\n"
        for msg in st.session_state.messages:
            role = "User" if isinstance(msg, HumanMessage) else "AI"
            report += f"### {role}\n{msg.content}\n\n"
            
        st.download_button(
            label="📄 Download Analysis Report",
            data=report,
            file_name=f"analysis_report_{st.session_state.thread_id[:8]}.md",
            mime="text/markdown"
        )

# Display chat messages
for msg in st.session_state.messages:
    if isinstance(msg, HumanMessage):
        with st.chat_message("user"):
            st.markdown(msg.content)
    elif isinstance(msg, AIMessage):
        with st.chat_message("assistant"):
            st.markdown(msg.content)

# Display any global artifacts at the end
if not st.session_state.pending_approval and st.session_state.artifacts:
    st.markdown("### Generated Artifacts")
    cols = st.columns(min(3, len(st.session_state.artifacts)))
    for i, artifact in enumerate(st.session_state.artifacts):
        if artifact.get("type") == "plot":
            cols[i % 3].image(artifact.get("content"), caption=artifact.get("description", "Generated Plot"))

# Handle Human-in-the-loop Approval UI
if st.session_state.pending_approval:
    st.warning("⚠️ The agent has created an analysis plan and is waiting for your approval to execute it.")
    
    config = {"configurable": {"thread_id": st.session_state.thread_id}}
    current_state = graph.get_state(config)
    plan_text = current_state.values.get("analysis_plan", "No plan found")
    st.info(f"**Proposed Plan:**\n\n{plan_text}")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("✅ Approve & Execute", use_container_width=True):
            with st.spinner("Executing plan..."):
                loop = asyncio.get_event_loop()
                # Run with streaming for progress updates
                status_text = st.empty()
                async def stream_resume():
                    async for event in graph.astream(None, config, stream_mode="updates"):
                        for node, state_update in event.items():
                            status_text.info(f"🔄 Agent working: Finished {node}...")
                loop.run_until_complete(stream_resume())
                status_text.empty()
                sync_state_from_graph()
                st.rerun()
                
    with col2:
        modification = st.text_input("Or type modifications to the plan:")
        if st.button("🔄 Send Modification", use_container_width=True) and modification:
            with st.spinner("Re-planning..."):
                new_msg = HumanMessage(content=f"Wait, please modify the plan: {modification}")
                graph.update_state(config, {"messages": [new_msg]}, as_node="supervisor")
                
                loop = asyncio.get_event_loop()
                status_text = st.empty()
                async def stream_replan():
                    async for event in graph.astream(None, config, stream_mode="updates"):
                        for node, state_update in event.items():
                            status_text.info(f"🔄 Agent replanning: Finished {node}...")
                loop.run_until_complete(stream_replan())
                status_text.empty()
                sync_state_from_graph()
                st.rerun()

# Normal Chat Input
elif prompt := st.chat_input("Ask a question about your data..."):
    with st.chat_message("user"):
        st.markdown(prompt)
        
    with st.chat_message("assistant"):
        config = {"configurable": {"thread_id": st.session_state.thread_id}}
        
        input_state = {"messages": [HumanMessage(content=prompt)]}
        if st.session_state.excel_file_path:
            input_state["excel_file_path"] = st.session_state.excel_file_path
            
        try:
            loop = asyncio.get_event_loop()
            status_text = st.empty()
            
            # Use streaming to show progress
            async def stream_query():
                async for event in graph.astream(input_state, config, stream_mode="updates"):
                    for node, state_update in event.items():
                        status_text.info(f"🔄 Processing: Finished {node}...")
            
            loop.run_until_complete(stream_query())
            status_text.empty()
            
            sync_state_from_graph()
            st.rerun()
            
        except Exception as e:
            st.error(f"An error occurred: {str(e)}")
