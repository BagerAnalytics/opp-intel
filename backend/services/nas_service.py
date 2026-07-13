import os
from dotenv import load_dotenv
import smbclient

load_dotenv()

class NASService:
    def __init__(self):
        self.ip = os.getenv("NAS_IP")
        self.username = os.getenv("WEBDAV_USERNAME")
        self.password = os.getenv("WEBDAV_PASSWORD")
        
        # Register the credentials with smbclient
        if self.ip and self.username and self.password:
            smbclient.register_session(self.ip, username=self.username, password=self.password)

    def list_compliance_documents(self, share_name=r"PremierAgric\Compliance"):
        """List all documents in the NAS Compliance folder."""
        if not self.ip:
            return []
        
        try:
            # The path format for SMB is \\server\share
            path = rf"\\{self.ip}\{share_name}"
            files = smbclient.listdir(path)
            return files
        except Exception as e:
            print(f"Error reading NAS SMB share: {e}")
            return []

nas_service = NASService()
