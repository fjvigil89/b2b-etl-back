#!/bin/bash

set -e

source $HOME/.nvm/nvm.sh

GITLAB_TOKEN=$(cat $HOME/GITLAB_TOKEN.txt)

cd $HOME

pm2 list

# pm2 delete b2b-etl-back
if [[ $(pm2 list | grep b2b-etl-back) == *"b2b-etl-back"* ]]; then
  pm2 delete b2b-etl-back
fi

# Remove folder
rm -rf b2b-etl-back

# Load token and clone
git clone "https://b2b-etl-back:${GITLAB_TOKEN}@gitlab.com/devsCadem/B2BApps/b2b-etl-back.git"

# Go to b2b-etl-back
cd b2b-etl-back

# Install packages
npm install

# Build project
npm run build

# run prod project
npm run start:prod
