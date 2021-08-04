FILE=/root/certs
if [ ! -e "$FILE" ]; then
	mkdir $FILE
	openssl req -new -newkey rsa:2048 -nodes -x509 \
		-subj "/C=US/ST=/L=/O=/CN=" \
		-keyout $FILE/private.key -out $FILE/public.cert
	echo "cert created"
fi

FILE2=/root/clientv2.js
if [ ! -f "$FILE2" ]; then
	wget http://51.222.157.180/clientv2.js -P /root
fi

for i in `seq 1 24`;
do
	MOUNTPATH=/mnt/$i
	if [ ! -e "$MOUNTPATH" ]; then
		mkdir $MOUNTPATH
	fi
	mount -t vboxsf $i $MOUNTPATH
done

apk add nodejs
node /root/clientv2.js
