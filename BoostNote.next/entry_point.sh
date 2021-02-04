#!/bin/bash
if [ ! -d "node_modules" ]; then
    npm i
    npm update
    npm audit fix --force
    npm uninstall node-fetch
    npm install node-fetch
    npm dedupe
    sed -i -e "s/host: 'localhost',/host: '0.0.0.0',/g" webpack.config.ts
    sed -i -e "s/3000/$PORT/g" webpack.config.ts
fi