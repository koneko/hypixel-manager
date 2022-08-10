# hypixel-manager
recieves lobby info from hypixel and looks at whos in the lobby and who is not, and then sends a message to a discord channel  

## setup
1. clone this repo
2. create `users.json` and `config.json` in root directory
3. in users.json, put the following
```
{
    "channel": "",
    "users": [],
    "authorized": []
}
```
4. and in config.json, put the following (btw keep checker false, cant be bothered to rewrite)
```
{
    "token": "DISCORD-BOT-TOKEN",
    "prefix": "lm(you can change this)",
    "owner": "YOUR-DISCORD-ID",
    "checker": false 
}
```
5. create and invite a bot to your discord server and put its token in config.json
6. `npm start` when all is done
7. profit.
## commands
P.S - lm is the default prefix, so ill use that for this demonstration
```
    lm authorize add/remove <discord-id> - adds/removes a discord-id from the authorized list (remember to add yourself, because yes)
    lm add <mc-username> - adds a mc-username to the users list (authorized users only)
    lm remove <mc-username> - removes a mc-username from the users list (authorized users only)
    lm list - lists all users in the users list
    lm set - sets the channel to send messages to (authorized users only)
    lm send log/chat - sends log.txt or chat.txt file to the channel (authorized users only)
```