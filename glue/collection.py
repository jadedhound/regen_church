import os
import requests
import json
from constants import Remote


def get_collection(remote: Remote, collection, dir):
    print("--------------------------------")
    print(f"Collection: '{collection}'")
    records = _get_collection_records(remote, collection)

    print(f"Found {len(records)} records")

    for i, record in enumerate(records, 1):
        # Save record as JSON
        record_id = record.get("id", f"record_{i}")
        json_path = os.path.join(dir, f"{record_id}.json")

        with open(json_path, "w") as f:
            json.dump(record, f, indent=2)

        # Find and download images
        image_urls = _extract_image_urls(record)
        img_dir = os.path.join(dir, "images")

        if len(image_urls) > 0:
            os.makedirs(img_dir, exist_ok=True)

        for img_url in image_urls:
            img_url = f"{remote.url}/api/files/{collection}/{record_id}/{img_url}"

            # Get filename from URL
            filename = os.path.basename(img_url.split("?")[0])  # Remove query params
            img_path = os.path.join(img_dir, filename)

            print(f"Downloading image {img_path}")
            if not _download_file(img_url, img_path, remote.token):
                print("Download failed")


def _get_collection_records(remote: Remote, collection):
    """
    Fetch all records from the given collection.
    """

    records = []
    page = 1
    per_page = 100
    headers = {"Authorization": remote.token}

    while True:
        url = f"{remote.url}/api/collections/{collection}/records?page={page}&perPage={per_page}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        records.extend(data.get("items", []))

        if len(data.get("items", [])) < per_page:
            break

        page += 1

    return records


def _download_file(url, destination, token):
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


def _extract_image_urls(record):
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
