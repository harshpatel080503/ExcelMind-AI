import os
from my_agent.core.execution_var import Environment, Secrets
from my_agent.core.logging_config import setup_logging

logger = setup_logging()

def get_infisical_client():
    pass

def get_secret(secret_name):
    try:
        # Fallback to local environment variable
        secret = os.getenv(secret_name)
        if not secret:
            logger.warning(f"Secret {secret_name} not found in environment")
        return secret
    except Exception as e:
        logger.error("Retrieving Secret Failed", secret_name=secret_name, error=e)
        return None