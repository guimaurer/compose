#!/bin/bash

TAG="v1.2.1"

if [ ! -d "./repo" ]; then
    # For tags, clone first then checkout (--branch doesn't work well with tags in shallow clones)
    git clone --depth 10 https://github.com/makeplane/plane.git repo
    cd repo
    git fetch origin --tags
    git checkout "$TAG"
    cd ..
else
    cd repo
    git fetch origin --tags
    git checkout "$TAG"
    cd ..
fi

# Check which directory structure exists (v1.2.1 may have changed structure)
if [ -d "./repo/deploy/selfhost" ]; then
    cp -r ./repo/deploy/selfhost/. ./code
elif [ -d "./repo/deployments/cli/community" ]; then
    cp -r ./repo/deployments/cli/community/. ./code
else
    echo "Error: Neither deploy/selfhost nor deployments/cli/community found in repository"
    exit 1
fi

# Check which variables file exists and rename it
if [ -f "./code/variables.env" ]; then
    mv ./code/variables.env ./code/.env.example
elif [ -f "./code/plane.env" ]; then
    mv ./code/plane.env ./code/.env.example
fi

# Remove container names and ports from docker-compose.yml (if yq is available)
if command -v yq &> /dev/null; then
    if [ -f "./code/docker-compose.yml" ]; then
        echo "Removing container names and ports from docker-compose.yml..."
        yq eval 'del(.services[].container_name)' -i ./code/docker-compose.yml
        yq eval 'del(.services[].ports)' -i ./code/docker-compose.yml
    fi
elif [ -f "./code/docker-compose.yml" ]; then
    echo "Warning: yq not found. Container names and ports were not removed from docker-compose.yml"
    echo "Install yq (https://github.com/mikefarah/yq) or use update.js instead"
fi


