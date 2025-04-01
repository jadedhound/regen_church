#!/bin/bash

DIRECTORIES=(
  "build_only/images"
  "build_only/sermons"
  "static/bin"
)
SELECTED=""

download() {
  for DIR in "${DIRECTORIES[@]}"; do
      echo "------------------------------------"
      echo "Downloading: $DIR"
      mkdir -p "$DIR"
      curl -u "$USERNAME:$PASSWORD" \
        -X PROPFIND "$WEBDAV_URL/$DIR/" \
        -H "Depth: 1" \
        --output - 2>/dev/null | \
        grep -oP '<D:href>[^<]+</D:href>' | \
        sed 's#<D:href>\(.*\)</D:href>#\1#' | \
        while read -r path; do
          file="${path##*/}"
          [[ -z "$file" ]] && continue  # Skip directory entries
  
          echo "Downloading $file..."
          curl -f -u "$USERNAME:$PASSWORD" \
               -o "$DIR/$file" \
               "$WEBDAV_URL/$DIR/$file" 2>/dev/null
        done
  done
}

select_dir() {
  # Display menu
  echo "Which directory do you want to clean?"
  echo "------------------------------------"
  for i in "${!DIRECTORIES[@]}"; do
    echo "$((i+1)). ${DIRECTORIES[$i]}"
  done
  echo "------------------------------------"

  # Get user input
  read -p "Enter number (1-${#DIRECTORIES[@]}): " CHOICE

  # Validate input
  if [[ ! "$CHOICE" =~ ^[1-9][0-9]*$ ]] || (( CHOICE > ${#DIRECTORIES[@]} )); then
    echo "Invalid selection. Exiting."
    exit 1
  fi

  # Return the selected directory (adjusting for zero-based array)
  SELECTED="${DIRECTORIES[$((CHOICE-1))]}"
}

upload() {
  select_dir
  echo "Processing: $SELECTED"
  # Recursively upload each file.
  for FILE in "$SELECTED"/*; do
      if [ -f "$FILE" ]; then
          curl -X PUT -u "$USERNAME:$PASSWORD" -T "$FILE" "$WEBDAV_URL/$SELECTED/$(basename "$FILE")"
          echo "Uploaded: $FILE"
      fi
  done
}

clean() {
  select_dir
  # Confirm deletion
  read -p "Are you sure you want to delete '$SELECTED'? [y/N] " CONFIRM
  if [[ "$CONFIRM" != [yY] ]]; then
    echo "Aborted."
    exit 0
  fi

  curl -X DELETE -u "$USERNAME:$PASSWORD" "$WEBDAV_URL/$SELECTED"
  curl -X MKCOL -u "$USERNAME:$PASSWORD" "$WEBDAV_URL/$SELECTED"
}

get_credentials() {
  SECRETS_FILE="./secrets.env"
  SECRETS_GPG="./secrets.env.gpg"
  if [[ -f "$SECRETS_FILE" ]]
  then
    source "$SECRETS_FILE"
  else
    echo "Decrypting $SECRETS_GPG..."
    gpg --quiet --pinentry-mode loopback --decrypt "$SECRETS_GPG" > "$SECRETS_FILE"
    if [[ -f "$SECRETS_FILE" ]]
    then
      source "$SECRETS_FILE"
    else
      echo "Unable to source secrets. Exiting."
      exit 1
    fi
  fi
}

main() {
  get_credentials

  # Check if an argument was provided
  if [ -z "$1" ]; then
      echo "Error: No argument provided. Usage: $0 [download|upload|clean]"
      exit 1
  fi

  # Check if the argument is "download" or "upload"
  case "$1" in
      download)
          download
          ;;
      upload)
          upload
          ;;
      clean)
          clean
          ;;
      *)
          echo "Error: Invalid argument. Must be 'download', 'upload' or 'clean'."
          exit 1
          ;;
  esac

  exit 0
}

main $1
