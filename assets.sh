#!/bin/bash

directories=(
  "build_only/images"
  "build_only/sermons"
  "static/bin"
)
branch=$(git rev-parse --abbrev-ref HEAD)

download() {
  mode="copy"
  if [ "$1" = "--sync" ]; then
      mode="sync"
  fi
  for dir in "${directories[@]}"; do
    rclone "$mode" "regen:/$branch/$dir" "$dir" \
      --config="./rclone.conf" \
      --verbose \
      --size-only 
  done
}

upload() {
  mode="copy"
  if [ "$1" = "--sync" ]; then
      mode="sync"
  fi
  for dir in "${directories[@]}"; do
    rclone "$mode" "$dir" "regen:/$branch/$dir" \
      --config="./rclone.conf" \
      --verbose \
      --size-only 
  done
}

main() {
  # Check if an argument was provided
  if [ -z "$1" ]; then
      echo "Error: No argument provided. Usage: $0 [download|upload] (--sync)"
      exit 1
  fi

  # Check if the argument is "download" or "upload"
  case "$1" in
      download)
        download "$2"
          ;;
      upload)
        upload "$2"
          ;;
      *)
        echo "Error: Invalid argument. Must be 'download' or 'upload'."
        exit 1
        ;;
  esac

  exit 0
}

decrypt_conf() {
  config="./rclone.conf"
  config_gpg="./rclone.conf.gpg"

  if [[ ! -f "$config" ]]; then
    echo "Decrypting $config_gpg..."

    # Check if a passphrase is given in the environment (usually because of CI)
    if [ -z "$GPG_PASSPHRASE" ]; then
      gpg --quiet --pinentry-mode loopback --decrypt "$config_gpg" > "$config"
    else
      gpg --quiet --pinentry-mode loopback --passphrase "$GPG_PASSPHRASE" --decrypt "$config_gpg" > "$config"
    fi

    if [[ ! -f "$config" ]]; then
      echo "Unable to source config. Exiting."
      exit 1
    fi
  fi
}

rclone_check() {
  # Check if rclone is installed
  if ! command -v rclone &> /dev/null; then
      echo "ERROR: rclone is not installed. Please install rclone first."
      exit 1
  fi
}


rclone_check
decrypt_conf
main $1
