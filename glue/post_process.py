import os
import json
from pathlib import Path


def write_filenames(dir: Path, filename="filenames.json"):
    files: list[str] = []
    for entry in dir.iterdir():
        if entry.is_file() and entry.name != filename:
            files.append(entry.relative_to('../').__str__())

    output_path = Path(f"{dir}/{filename}")

    with open(output_path, "w") as json_file:
        json.dump(files, json_file)
