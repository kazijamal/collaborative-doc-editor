#!bin/bash

LB="root@209.151.155.199"
Mongo="root@209.151.152.38"
Clusters=("root@209.94.59.121" "root@209.151.153.139" "root@209.151.154.176" "root@209.151.149.56" "root@209.151.150.86" "root@209.151.152.20" "root@209.151.151.250" "root@194.113.75.115" "root@209.94.58.143" "root@209.151.152.145" "root@209.94.59.181" "root@209.151.154.70" "root@209.151.149.193" "root@209.151.152.214" "root@209.151.149.231" "root@194.113.73.235" "root@209.94.59.109")

MainCluster=$Clusters
scp $MainCluster:/root/App/App.js ./App.js

ssh $LB "pm2 reload App; redis-cli flushall"
for Cluster in ${Clusters[@]}; do
        echo $Cluster
    scp App.js $Cluster:/root/App/App.js
    ssh $Cluster "rm -rf /root/App/leveldb; pm2 reload App"
done
