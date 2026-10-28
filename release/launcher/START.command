#!/bin/bash
# This script must keep LF line endings and executable mode in the ZIP.
cd "$(dirname "$0")" || exit 1
if [ "$(uname -s)" != "Darwin" ]; then
  echo "This package is for macOS. Use the Windows package on Windows."
  exit 1
fi
if [ ! -x "./runtime/node" ]; then
  echo "The bundled runtime is missing or not executable. Extract the entire ZIP with Archive Utility."
  read -r -p "Press Return to close. "
  exit 1
fi
./runtime/node ./server.mjs "$@"
status=$?
if [ "$status" -ne 0 ]; then
  echo "Check that you downloaded the package matching your Mac processor."
  read -r -p "Press Return to close. "
fi
exit "$status"
