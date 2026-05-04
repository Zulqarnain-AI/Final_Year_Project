import os
from datetime import timedelta


class Config:
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/breathewell_db")
    SECRET_KEY = os.environ.get(
        "SECRET_KEY",
        "breathewell_dev_secret_key_2026_please_change_me_32_plus_bytes",
    )
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "breathewell_dev_jwt_secret_key_2026_please_change_me_32_plus_bytes",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)