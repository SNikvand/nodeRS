# NodeRS (Reverse Shell)
This is intended as a basic guide to use NodeRS
#
## Database Structure

### Users
```
{
    id,
    username,
    pasword, // hashed
    favourites[workstationids]
}
```
### Workstations
```
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
```
{
    webuser_sockid, // Socket ID of the admin on the web portal
    targetclient_id, // Client ID (not socket id) of the target workstation
    command_type, // Type of command, i.e. file transfer, sessions reset, exec...
    command // Command itself (can be null), i.e. 'pwd' or 'cd /var/usr'
}
```
#### from server back to web (socket.io)
```
{
    command_type, // type of command, i.e. new node connected, populate something on page
    result // additional data or display output to write
}
```

### Socket communication between server and client (net socket)
```
{
    command_type, // Type of command, i.e. file transfer, sessions reset, exec...
    command // Command itself (can be null), i.e. 'pwd' or 'cd /var/usr'
}
```

# Random Notes
Generating SSL key pair
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./host.key -out host.crt
c:\ProgramData\Microsoft\Wlansvc\Profiles\Interfaces
![color-pallet](https://user-images.githubusercontent.com/5490465/130366793-7ab4e05b-e3db-491b-85a8-164457079e80.png)
