import os
import gnupg
import requests
import json
import yaml
import sys
from urllib.parse import urljoin

OUTPUT_DIR = "../pb"
COLLECTIONS = ["Leaders", "MC"]
SECRETS = "secrets.yml.gpg"


def decrypt_secrets(passphrase):
    """
    Decrypt the secrets file using GPG.
    """
    gpg = gnupg.GPG()

    if not os.path.exists(SECRETS):
        print(f"Error: {SECRETS} not found!")
        return None

    with open(SECRETS, "rb") as f:
        decrypted_data = gpg.decrypt_file(f, passphrase=passphrase)

    if not decrypted_data.ok:
        print(f"Decryption failed: {decrypted_data.stderr}")
        return None

    return yaml.safe_load(decrypted_data.data)


def authenticate(url, email, password):
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


def get_collection_records(url, token, collection):
    """
    Fetch all records from the given collection.
    """

    records = []
    page = 1
    per_page = 100
    headers = {"Authorization": token}

    while True:
        url = (
            f"{url}/api/collections/{collection}/records?page={page}&perPage={per_page}"
        )
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        records.extend(data.get("items", []))

        if len(data.get("items", [])) < per_page:
            break

        page += 1

    return records


def download_file(url, destination, token):
    """
    Download a file from a URL to a destination path
    """
    try:
        headers = {"Authorization": token}
        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()

        with open(destination, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False


def extract_image_urls(record):
    """
    Extract all image URLs (jpg/png) from a record
    """
    image_urls = []

    def scan_value(value):
        if isinstance(value, str):
            if value.lower().endswith((".jpg", ".jpeg", ".png")):
                image_urls.append(value)
        elif isinstance(value, dict):
            for v in value.values():
                scan_value(v)
        elif isinstance(value, list):
            for item in value:
                scan_value(item)

    for value in record.values():
        scan_value(value)

    return image_urls


def get_collection(url, token, collection, dir):
    print("--------------------------------")
    print(f"Collection: '{collection}'")
    records = get_collection_records(url, token, collection)

    print(f"Found {len(records)} records")

    for i, record in enumerate(records, 1):
        # Save record as JSON
        record_id = record.get("id", f"record_{i}")
        json_path = os.path.join(dir, f"{record_id}.json")

        with open(json_path, "w") as f:
            json.dump(record, f, indent=2)

        # Find and download images
        image_urls = extract_image_urls(record)
        img_dir = os.path.join(dir, "images")

        if len(image_urls) > 0:
            os.makedirs(img_dir, exist_ok=True)

        for img_url in image_urls:
            img_url = f"{url}/api/files/{collection}/{record_id}/{img_url}"

            # Get filename from URL
            filename = os.path.basename(img_url.split("?")[0])  # Remove query params
            img_path = os.path.join(img_dir, filename)

            print(f"Downloading image {img_path}")
            if not download_file(img_url, img_path, token):
                print("Download failed")


def main():
    # Make sure there is a passphrase given
    if len(sys.argv) < 2:
        print("Error: No passphrase provided.")
        return

    # Read passphrase from user
    passphrase = sys.argv[1]

    try:
        # Decrypt secrets.yml.gpg
        secrets = decrypt_secrets(passphrase)
        if not secrets:
            print("Failed to decrypt secrets or secrets are empty.")
            return

        # Read variables from secrets
        url = secrets.get("url")
        email = secrets.get("email")
        password = secrets.get("password")

        if not all([url, email, password]):
            print("Missing required credentials in secrets file.")
            return

        # Authenticate with PocketBase
        token = authenticate(url, email, password)
        if not token:
            print("Authentication failed.")
            return

        # Create output directory if it doesn't exist
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Download all collections
        for collection in COLLECTIONS:
            dir = os.path.join(OUTPUT_DIR, collection)
            os.makedirs(dir, exist_ok=True)
            get_collection(url, token, collection, dir)

    except Exception as e:
        print(f"An error occurred: {str(e)}")


if __name__ == "__main__":
    main()
