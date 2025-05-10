import os
import sys
from constants import OUTPUT_DIR, COLLECTIONS
from post_process import write_filenames
from update_checker import should_update
from client import get_client
from collection import get_collection


def main():
    if len(sys.argv) < 2:
        print("Error: No passphrase provided.")
        return

    passphrase = sys.argv[1]

    try:
        client = get_client(passphrase)
        if client is None:
            print("Unable to access server.")
            return

        os.makedirs(OUTPUT_DIR, exist_ok=True)

        if not should_update(client):
            print("No changes in remote.")
            return

        for collection in COLLECTIONS:
            get_collection(client, collection)
            write_filenames(dir)

    except Exception as e:
        print(f"An error occurred: {str(e)}")


main()
