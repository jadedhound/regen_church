import os
import json


def write_filenames(path, filename="filenames.json"):
    entries = os.listdir(path)

    files = [entry for entry in entries if os.path.isfile(os.path.join(path, entry))]
    if filename in files:
        files.remove(filename)

    output_path = os.path.join(path, filename)

    with open(output_path, "w") as json_file:
        json.dump(files, json_file, indent=4)

    return
