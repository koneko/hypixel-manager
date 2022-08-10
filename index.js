require("isomorphic-fetch")


const bodyParser = require("body-parser")
const fs = require("fs")
const Discord = require("discord.js")
const config = require("./config.json")
const { spawn } = require("child_process")


const client = new Discord.Client({ intents: ["GuildMessages", "Guilds", "GuildVoiceStates", "MessageContent"] });
const app = require("express")()
const port = process.env.PORT || 3000
let loadedUsers = []
let chat = 0

function log (input) {
    console.log(input)
    // if input is an object, convert to string
    typeof input === "object" && (input = JSON.stringify(input))

    // get timestamp
    let timestamp = new Date().toLocaleString()
    // write to log file
    fs.appendFileSync("./log.txt", `${timestamp} - ${input}\n`)
}

function logChat (input) {
    chat++
    if (chat > 1000) {
        chat = 0
        log("Chat reset")
        fs.writeFilesync("./chat.txt", "")
    }
    // if input is an object, convert to string
    typeof input === "object" && (input = JSON.stringify(input))

    // get timestamp
    let timestamp = new Date().toLocaleString()
    // write to log file
    fs.appendFileSync("./chat.txt", `${timestamp} - ${input}\n`)
}

function resolveUuid (input) {
    for (let a = "", b = Buffer.from(input, "base64").toString(), i = 0; i < b.length; i++) {
        a += Number(b.charCodeAt(i)).toString(16).padStart(2, '0')
    }
    return a
}

function getUuidFromName (playername) {
    return fetch(`https://api.mojang.com/users/profiles/minecraft/${playername}`)
        .then(data => data.json())
        .then(player => player.id);
}

function getNameFromUuid (uuid) {
    return fetch(`https://api.mojang.com/user/profiles/${uuid}/names`)
        .then(data => data.json())
        .then(player => player[player.length - 1].name);
}
function loadUsers () {
    return JSON.parse(fs.readFileSync("./users.json", "utf8"))
}

function write (input) {
    fs.writeFileSync("./users.json", JSON.stringify(input))
}

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function badFind (input, arr) {
    // check whether 'input' is in 'arr'
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == input) return true
    }
    return false
}

function bold (uuid) {
    for (var a = "", i = 0; i < uuid.length; i++)
        a += String.fromCodePoint(uuid.charCodeAt(i) + 120205 + 559 * !isNaN(uuid[i]))
    return a
}

app.get("/", (req, res) => {
    res.send("Nothing to see here...")
})

app.post('/updateUsers', bodyParser.json({ extended: false }), async (req, res) => {
    let players = req.body.data,
        lobby = req.body.lobby ?? "N/A"

    let {users, _channel} = loadUsers()
    for (let i = 0; i < players.length; i++) {
        let {action, player, ts} = players[i]
        
        let name = player.name,
            uuid = resolveUuid(player.uuid)
        
        // check if user is in users.json
        if (!badFind(uuid, users)) continue
        log("FOUND USER!!")
        //check is player is in loadedUsers
        let old = loadedUsers.find(user => user.uuid === uuid)
        log(old)
        if (old) {
            log(old)
            if (old.action == action) continue // if action is the same, do nothing
            old.action = action
        } else {
            // if not, add player to loadedUsers
            loadedUsers.push({uuid, name, action})
        }
        // get channel from id
        let channel = client.channels.cache.find(channel => channel.id == _channel)
        if (!channel) return // channel not found
        let embed = new Discord.EmbedBuilder()
        embed.setAuthor({ name: action, iconURL: `https://minotar.net/helm/${uuid}.png`, url: `https://namemc.com/profile/${uuid}` })
        embed.setColor(action == "join" ? 0x03C564 : 0xFF0000)
        action = action == "join" ? "joined" : "left"
        console.log(uuid)
        embed.setDescription(`${name} has currently **${action}** lobby **${lobby}**.`)
        embed.setFooter({ text: `uuid: ${bold(uuid)}` })
        //send
        channel.send({ embeds: [embed] })
    }
    res.send("Recieved.")
})

app.post("/updateChat", bodyParser.json({ extended: false }), (req, res) => {
    logChat(req.body)
    res.send("got your chat, smh")
})

client.on("ready", () => {
    log(`Updater logged in as ${client.user.tag}!`)
    log("Loading commands and interactive client, please wait...")
    // spawn child process to run commands
    let child = spawn("node", ["bot.js"])
    child.stdout.on("data", data => {
        log(data.toString())
    }).on("error", err => {
        log(err)
    }).on("close", code => {
        log(`Interactive child process exited with code ${code}`)
    })
    // check if config.tracker is true
    if (config.checker == "true") {
        let checker = spawn("cd checker && node index.js")
        checker.stdout.on("data", data => {
            log(data.toString())
        }).on("error", err => {
            log(err)
        }).on("close", code => {
            log(`Tracker child process exited with code ${code}`)
        }).on("exit", code => {
            log(`Tracker child process exited with code ${code}`)
        })
    }
})


app.listen(port, () => console.log("Listening on port " + port))
client.login(config.token)