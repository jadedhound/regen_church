import os
import requests
import json

from pathlib import Path
from pocketbase import PocketBase
from pocketbase.models.record import Record
from constants import OUTPUT_DIR
from datetime import datetime


def get_collection(client: PocketBase, collection) -> Path :
    print("--------------------------------")
    print(f"Collection '{collection}'...", end=" ")
    records = client.collection(collection).get_full_list()
    if len(records) < 1:
        print("is Empty!")
    else:
        print(f"has {len(records)} records")

    dir = Path(f"{OUTPUT_DIR}/{collection}")
    dir.mkdir(exist_ok=True)
    image_dir = Path(f"{dir}/images")
    image_dir.mkdir(exist_ok=True)

    for record in records:
        json_path = os.path.join(dir, f"{record.id}.json")

        with open(json_path, 'w') as f:
            json.dump(record.__dict__, f, cls=_PBJsonEncoder)
            print(f"Fetched record: {record.id}")

        _download_any_images(client, image_dir, record)

    if not any(image_dir.iterdir()):
        image_dir.rmdir()

    return dir
    

def _download_any_images(client: PocketBase, image_dir: Path, record: Record):
    """Download all image URLs (jpg/png) from a record."""

    for value in record.__dict__.values():
        if isinstance(value, str) and value.lower().endswith((".jpg", ".jpeg", ".png")):
            print(f"   > Downloading record's image: {value}...", end=" ")
            url = f"{client.base_url}/api/files/{record.collection_id}/{record.id}/{value}"
            try:
                response = requests.get(url, stream=True)
                response.raise_for_status()

                img_path = os.path.join(image_dir, value)
                with open(img_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                print("Success!")
            except Exception as e:
                print("Failed!")
                raise Exception(f"Unable to download {url}: {e}")

class _PBJsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)
