from pydantic import BaseModel


class StoreSettings(BaseModel):
    storeName: str = "StoreTrack Demo Store"
    email: str = "admin@storetrack.com"
    phone: str = "+1 555 0123"
    currency: str = "USD"
    address: str = "123 Main Street, Nairobi, Kenya"


class InventorySettings(BaseModel):
    defaultLowStockThreshold: int = 10
    taxRate: float = 16.0
    receiptFooter: str = "Thank you for shopping with us!"
    barcodeScanning: bool = True
    lowStockAlerts: bool = True


class SecuritySettings(BaseModel):
    twoFactorAuth: bool = False
    sessionTimeout: bool = True


class BackupInfo(BaseModel):
    filename: str
    createdAt: str
    size: int


class SettingsResponse(BaseModel):
    store: StoreSettings
    inventory: InventorySettings
    security: SecuritySettings
