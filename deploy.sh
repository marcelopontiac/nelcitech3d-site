#!/bin/bash
# Deploy NELCi Tech 3D para servidor
# Rode no seu PC local

SERVER="root@192.168.1.183"
REMOTE_DIR="/var/www/nelcitech3d"
LOCAL_DIR="/home/marcelotech/nelcitech3d-site"

echo "Copiando arquivos para o servidor..."
scp -r "$LOCAL_DIR/index.html" "$LOCAL_DIR/demo.html" "$LOCAL_DIR/projeto-fotos/" "$SERVER:$REMOTE_DIR/"

echo "Reiniciando web server no servidor..."
ssh "$SERVER" "cd $REMOTE_DIR && pkill -f 'python3 -m http.server 8080'; nohup python3 -m http.server 8080 > /dev/null 2>&1 &"

echo "Reiniciando cloudflared..."
ssh "$SERVER" "pkill cloudflared; sleep 1; nohup cloudflared tunnel --config /etc/cloudflared/config.yml > /dev/null 2>&1 &"

echo "Deploy concluído!"
echo "Acesse: https://nelcitech3d.com.br"
