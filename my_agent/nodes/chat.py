"""Chat node for handling generic non-analysis queries."""

from typing import Any, Dict

from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from my_agent.core.infisical_client import get_secret
from my_agent.models.state import ExcelAnalysisState
from my_agent.prompts.prompts import CHAT_SYS_PROMPT, CHAT_USER_PROMPT


async def chat_node(state: ExcelAnalysisState) -> Dict[str, Any]:
    """
    Chat Node - Handles generic conversational queries.

    This node:
    1. Responds to non-data-analysis queries (greetings, general questions, etc.)
    2. Can provide guidance on how to use the system
    3. Maintains friendly, helpful tone
    
    Args:
        state: Current state containing messages
    
    Returns:
        Dictionary with messages update
    """
    print("🔵 Starting Chat Node : Handling general query...")

    # Intialize LLM
    import os
    llm = init_chat_model(
        model="gpt-oss:120b-cloud",
        model_provider="openai",
        api_key=os.environ.get("OLLAMA_API_KEY", "dummy"),
        base_url="https://ollama.com/v1",
        temperature=0.7
    )

    # Get the user's query
    user_messages = [msg for msg in state["messages"] if isinstance(msg, HumanMessage)]
    user_query = user_messages[-1].content if user_messages else "Hello"

    # Create prompts
    system_prompt = SystemMessage(content=CHAT_SYS_PROMPT)
    user_prompt = HumanMessage(
        content=CHAT_USER_PROMPT.format(user_query=user_query)
    )

    # Get response
    response = await llm.ainvoke([system_prompt, user_prompt])

    print(f"Chat: Response Generated")

    # Create AI Message
    chat_message = AIMessage(
        content=response.content,
        name="ChatAssistant"
    )

    return {
        "messages": [chat_message]
    }