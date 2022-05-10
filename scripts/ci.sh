#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR=${DIR}/..

LAMBDA_DIR="$ROOT_DIR/projects/globe-phan"
GLOBE_PHAN_DATA_BUCKET_NAME=globe-phan-data

function setupNvm {
  export NVM_DIR="$HOME/.nvm"
  [[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"  # This loads nvm

  nvm install
  nvm use
}

function setupGlobephanLambda {
  cd $LAMBDA_DIR
  docker-compose up -d
  # Ensure localstack is up, and relevant resources have been created
  for attempt in {1..5}
  do
    AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local aws s3 ls $GLOBE_PHAN_DATA_BUCKET_NAME --endpoint-url http://localhost:4566 \
      && break
    sleep 5
  done

  setupNvm
  npm i
  npm run test
  npm run build
  npm run deploy
}

function teardownEventApiLambda {
  cd $LAMBDA_DIR
  docker-compose down
}

function setup {
  setupGlobephanLambda
}

function teardown {
  teardownEventApiLambda
}

trap teardown EXIT

setup
teardown
