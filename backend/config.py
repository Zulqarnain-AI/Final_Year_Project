from datetime import timedelta

class Config:
    MONGO_URI = "mongodb://localhost:27017/breathewell_db"
    SECRET_KEY = "super_secret_key"
    JWT_SECRET_KEY = "jwt_super_secret_key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
