import os
import sys
from constants import OUTPUT_DIR, COLLECTIONS
from post_process import write_filenames
from update_checker import should_update
from remote import get_remote
from collection import get_collection


def main():
    if len(sys.argv) < 2:
        print("Error: No passphrase provided.")
        return

    passphrase = sys.argv[1]

    try:
        remote = get_remote(passphrase)
        if remote is None:
            print("Unable to access server.")
            return

        os.makedirs(OUTPUT_DIR, exist_ok=True)

        if not should_update(remote):
            print("No changes in remote.")
            return

        for collection in COLLECTIONS:
            dir = os.path.join(OUTPUT_DIR, collection)
            os.makedirs(dir, exist_ok=True)
            get_collection(remote, collection, dir)
            write_filenames(dir)

    except Exception as e:
        print(f"An error occurred: {str(e)}")


main()
