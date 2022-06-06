#!/bin/bash

if [ $# -ne 1 ]; then
    echo "./build.sh version"
    exit
fi

mkdir _

deno compile -A -r --unstable --target x86_64-unknown-linux-gnu -o _/pps_linux_amd64 https://raw.githubusercontent.com/txthinking/pingpong/master/pps.js
deno compile -A -r --unstable --target x86_64-apple-darwin -o _/pps_darwin_amd64 https://raw.githubusercontent.com/txthinking/pingpong/master/pps.js
deno compile -A -r --unstable --target aarch64-apple-darwin -o _/pps_darwin_arm64 https://raw.githubusercontent.com/txthinking/pingpong/master/pps.js
deno compile -A -r --unstable --target x86_64-pc-windows-msvc -o _/pps_windows_amd64.exe https://raw.githubusercontent.com/txthinking/pingpong/master/pps.js

deno compile -A -r --unstable --target x86_64-unknown-linux-gnu -o _/ppc_linux_amd64 https://raw.githubusercontent.com/txthinking/pingpong/master/ppc.js
deno compile -A -r --unstable --target x86_64-apple-darwin -o _/ppc_darwin_amd64 https://raw.githubusercontent.com/txthinking/pingpong/master/ppc.js
deno compile -A -r --unstable --target aarch64-apple-darwin -o _/ppc_darwin_arm64 https://raw.githubusercontent.com/txthinking/pingpong/master/ppc.js
deno compile -A -r --unstable --target x86_64-pc-windows-msvc -o _/ppc_windows_amd64.exe https://raw.githubusercontent.com/txthinking/pingpong/master/ppc.js

nami release github.com/txthinking/pingpong $1 _

rm -rf _
