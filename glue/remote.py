import os
import gnupg
import requests
import yaml
from urllib.parse import urljoin
from constants import SECRETS_FILE, Remote


def get_remote(passphrase):
    if (secrets := _decrypt_secrets(passphrase)) is not None:
        url, email, password = secrets
    else:
        print("Failed to decrypt secrets or secrets are empty.")
        return None

    token = _authenticate(url, email, password)
    if not token:
        print("Authentication failed.")
        return None

    return Remote(url, token)


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


def _authenticate(url, email, password):
    """
    Authenticate with PocketBase and return the auth token.
    """
    auth_url = urljoin(url, "/api/collections/users/auth-with-password")
    try:
        response = requests.post(
            auth_url, json={"identity": email, "password": password}
        )
        response.raise_for_status()
        return response.json().get("token")
    except requests.exceptions.RequestException as e:
        print(f"Authentication error: {str(e)}")
        return None
