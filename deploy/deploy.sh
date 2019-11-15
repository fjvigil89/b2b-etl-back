#!/bin/bash

set -e

eval $(ssh-agent -s)
echo "$PEM_KEY" | tr -d '\r' | ssh-add - > /dev/null

# disable the host key checking.
./deploy/hostKeyChecking.sh

# Exec script in $SERVER_IP
echo "deploying to ${SERVER_IP}"

# Put GITLAB TOKEN into server
echo "$GITLAB_TOKEN" | ssh ec2-user@${SERVER_IP} -T "cat > /home/ec2-user/GITLAB_TOKEN.txt"

# Exec updateRemote
ssh ec2-user@${SERVER_IP} 'bash' < ./deploy/updateRemote.sh
