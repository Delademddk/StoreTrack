from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    JWT_SECRET: str = "storetrack-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 480
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8080"]
    BACKEND_PORT: int = 8000

    PRODUCT_IMAGE_UPLOAD_DIR: str = "uploads/products"
    PRODUCT_IMAGE_MAX_SIZE_MB: int = 5

    DATABASE_SERVER: str = "localhost"
    DATABASE_PORT: int = 1433
    DATABASE_NAME: str = "StoreTrack"
    DATABASE_USER: str = ""
    DATABASE_PASSWORD: str = ""
    DATABASE_DRIVER: str = "ODBC Driver 18 for SQL Server"
    DATABASE_TRUSTED_CONNECTION: str = "no"
    DATABASE_ENCRYPT: str = "yes"
    DATABASE_TRUST_SERVER_CERTIFICATE: str = "no"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def _encrypt_value(self) -> str:
        return "yes" if self.DATABASE_ENCRYPT.lower() == "yes" else "no"

    @property
    def _trust_cert_value(self) -> str:
        return "yes" if self.DATABASE_TRUST_SERVER_CERTIFICATE.lower() == "yes" else "no"

    @property
    def database_url(self) -> str:
        driver = self.DATABASE_DRIVER.replace(" ", "+")
        encrypt = f"Encrypt={self._encrypt_value}"
        trust_cert = f"TrustServerCertificate={self._trust_cert_value}"
        params = f"driver={driver}&{encrypt}&{trust_cert}"
        if self.DATABASE_TRUSTED_CONNECTION.lower() == "yes":
            return (
                f"mssql+pyodbc://{self.DATABASE_SERVER}:{self.DATABASE_PORT}"
                f"/{self.DATABASE_NAME}?{params}&trusted_connection=yes"
            )
        return (
            f"mssql+pyodbc://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_SERVER}:{self.DATABASE_PORT}"
            f"/{self.DATABASE_NAME}?{params}"
        )

    @property
    def pyodbc_connection_string(self) -> str:
        encrypt = f"Encrypt={self._encrypt_value}"
        trust_cert = f"TrustServerCertificate={self._trust_cert_value}"
        if self.DATABASE_TRUSTED_CONNECTION.lower() == "yes":
            return (
                f"DRIVER={{{self.DATABASE_DRIVER}}};"
                f"SERVER={self.DATABASE_SERVER},{self.DATABASE_PORT};"
                f"DATABASE={self.DATABASE_NAME};"
                f"Trusted_Connection=yes;"
                f"{encrypt};"
                f"{trust_cert};"
            )
        return (
            f"DRIVER={{{self.DATABASE_DRIVER}}};"
            f"SERVER={self.DATABASE_SERVER},{self.DATABASE_PORT};"
            f"DATABASE={self.DATABASE_NAME};"
            f"UID={self.DATABASE_USER};"
            f"PWD={self.DATABASE_PASSWORD};"
            f"{encrypt};"
            f"{trust_cert};"
        )


settings = Settings()
