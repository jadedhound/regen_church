from typing import NamedTuple

OUTPUT_DIR = "../pb"
COLLECTIONS = ["Leaders", "MC"]
SECRETS_FILE = "secrets.yml.gpg"
DB_SHA = "db.sha256"


class Remote(NamedTuple):
    url: str
    token: str
