import os

from dotenv import load_dotenv

load_dotenv()

class Secrets:
    INFISICAL_CLIENT_ID = os.environ["INFISICAL_CLIENT_ID"]
    INFISICAL_CLIENT_TOKEN = os.environ["INFISICAL_CLIENT_TOKEN"]
    INFISICAL_PROJECT_ID = "14edb24d-59ff-49cb-8a78-d4a70a1d7135"


class Environment:
    ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")