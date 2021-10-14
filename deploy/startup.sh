FILE=/root/certs
if [ ! -e "$FILE" ]; then
	mkdir $FILE
	openssl req -new -newkey rsa:2048 -nodes -x509 \
		-subj "/C=US/ST=/L=/O=/CN=" \
		-keyout $FILE/host.key -out $FILE/host.crt
	echo "cert created"
fi

wget --no-check-certificate https://51.222.157.180:8443/clientLatest.js -O /root/clientLatest.js

for i in `seq 1 24`;
do
	MOUNTPATH=/mnt/$i
	if [ ! -e "$MOUNTPATH" ]; then
		mkdir $MOUNTPATH
	fi
	mount -t vboxsf $i $MOUNTPATH
done

apk add nodejs
node /root/clientLatest.js
