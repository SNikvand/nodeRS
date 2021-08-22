# NodeRS (Reverse Shell)
This is intended as a basic guide to use NodeRS
#
## Database Structure

### Users
```json
{
    id,
    username,
    pasword, // hashed
    favourites[workstationids]
}
```
### Workstations
```json
{
    database_id,
    workstation_id,
    last_ip,
    location {
        latitude,
        logitude
    },
    pretty_name, // custom name set on the device by admin
    encryption_key // Key used to run crypto locker on the computer
}
```
#
## Communication Structure
### Socket communication between web and server (socket.io)
#### From web to server
```json
{
    webuser_sockid, // Socket ID of the admin on the web portal
    targetclient_id, // Client ID (not socket id) of the target workstation
    command_type, // Type of command, i.e. file transfer, sessions reset, exec...
    command // Command itself (can be null), i.e. 'pwd' or 'cd /var/usr'
}
```
#### from server back to web (socket.io)
```json
{
    command_type, // type of command, i.e. new node connected, populate something on page
    result // additional data or display output to write
}
```

### Socket communication between server and client (net socket)
```json
{
    command_type, // Type of command, i.e. file transfer, sessions reset, exec...
    command // Command itself (can be null), i.e. 'pwd' or 'cd /var/usr'
}
```

# Random Notes
Generating SSL key pair
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt