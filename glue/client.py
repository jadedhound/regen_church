import os
import gnupg
import yaml
from constants import SECRETS_FILE 
from pocketbase import PocketBase


def get_client(passphrase):
    if (secrets := _decrypt_secrets(passphrase)) is not None:
        url, email, password = secrets
    else:
        print("Failed to decrypt secrets or secrets are empty.")
        return None
    client = PocketBase(url)
    admin = client.admins.auth_with_password(email, password)
    if not admin.is_valid:
        print("Authentication failed.")
        return None

    return client


def _decrypt_secrets(passphrase):
    gpg = gnupg.GPG()

    if not os.path.exists(SECRETS_FILE):
        print(f"Error: {SECRETS_FILE} not found!")
        return None

    with open(SECRETS_FILE, "rb") as f:
        decrypted_data = gpg.decrypt_file(f, passphrase=passphrase)

    if not decrypted_data.ok:
        print(f"Decryption failed: {decrypted_data.stderr}")
        return None

    results = yaml.safe_load(decrypted_data.data)
    url = results.get("url")
    email = results.get("email")
    password = results.get("password")

    if not all([url, email, password]):
        print("Missing required credentials in secrets file.")
        return None

    return url, email, password
