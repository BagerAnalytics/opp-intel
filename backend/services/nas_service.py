import os
from webdav3.client import Client
from dotenv import load_dotenv

load_dotenv()

class NASService:
    def __init__(self):
        nas_ip = os.getenv('NAS_IP', '100.77.182.88')
        options = {
            # Use Tailscale IP directly to bypass DNS/NAT loopback issues
            # UGREEN WebDAV mounts root shares directly on the port, no /webdav/ path needed
            'webdav_hostname': f'http://{nas_ip}:5005/',
            'webdav_login':    os.getenv('WEBDAV_USERNAME', ''),
            'webdav_password': os.getenv('WEBDAV_PASSWORD', '')
        }
        self.client = Client(options)
        self.base_dir = "/PremierAgric/Compliance" # Matches the original SMB path

    def upload_file(self, local_file_path: str, remote_file_name: str) -> bool:
        """Uploads a local file to the NAS."""
        try:
            # Check if base dir exists, create if not
            if not self.client.check(self.base_dir):
                self.client.mkdir(self.base_dir)
                
            remote_path = f"{self.base_dir}/{remote_file_name}"
            self.client.upload_sync(remote_path=remote_path, local_path=local_file_path)
            print(f"Successfully uploaded {remote_file_name} to NAS via WebDAV.")
            return True
        except Exception as e:
            print(f"WebDAV Upload Error: {e}")
            return False
            
    def list_files(self):
        """Lists all files in the compliance directory on the NAS."""
        try:
            if not self.client.check(self.base_dir):
                return []
            # list returns a list of items, usually the first item is the directory itself
            files = self.client.list(self.base_dir)
            return [f for f in files if f != self.base_dir + '/']
        except Exception as e:
            print(f"WebDAV List Error: {e}")
            return []

nas_service = NASService()
