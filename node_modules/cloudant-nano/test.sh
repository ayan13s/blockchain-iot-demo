#!/bin/bash
export TRAVIS=true
npm test

#scripts/run_couchdb_on_travis.sh
#npm run mocha
#docker stop $(docker ps -a -q)
#docker rm $(docker ps -a -q)
