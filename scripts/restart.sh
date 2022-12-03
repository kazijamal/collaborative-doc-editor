#!bin/bash

LB="root@209.151.155.199"
Mongo="root@209.151.152.38"
Clusters=("root@209.151.150.8")

MainCluster=$Clusters
scp $MainCluster:/root/App/App.js ./App.js

ssh $LB "pm2 reload App"
for Cluster in ${Clusters[@]}; do
    scp App.js $Cluster:/root/App/App.js
    ssh $Cluster "rm -rf /root/App/leveldb; pm2 reload App"
done
