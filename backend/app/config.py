import os
from datetime import timedelta


class Config:
    # MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://rhadestew123_db_user:XW5cYAykiP2bprWN@breathwell.cprxemv.mongodb.net/?appName=BreathWell/breathewell_db")
    MONGO_URI=os.environ.get("MONGO_URI","mongodb+srv://zulqarnainhassan101_db_user:i5K6arbBBCDgDsCA@cluster0.tszdaka.mongodb.net/")
    SECRET_KEY = os.environ.get(
        "SECRET_KEY",
        "breathewell_dev_secret_key_2026_please_change_me_32_plus_bytes",
    )
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "breathewell_dev_jwt_secret_key_2026_please_change_me_32_plus_bytes",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)