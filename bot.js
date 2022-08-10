const Discord = require("discord.js")
const fs = require("fs")
require("isomorphic-fetch")
const client = new Discord.Client({ intents: ["GuildMessages", "Guilds", "GuildVoiceStates", "MessageContent"] });
const config = require("./config.json")


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

client.on("ready", () => console.log(`Lobby manager interactive client logged in to ${client.user.tag}!`))

client.on("messageCreate", async message => {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g) // prefix is lm
    const command = args.shift().toLowerCase()
    let users = loadUsers()
    if (message.author.bot) return
    if (command == "add") {
        let check = users.authorized.find(user => user == message.author.id)
        if (!check) return
        if (args[0]) {
            let name = args[0]
            let uuid = await getUuidFromName(name)
            if (uuid) {
                users.users.push(uuid)
                write(users)
                users = loadUsers()
                console.log(`${message.author.username} added ${name} to tracked users.`)
                message.channel.send(`${name} has been added to the tracked users.`)
            }
        }
    }

    if (command == "remove") {
        let check = users.authorized.find(user => user == message.author.id)
        if (!check) return
        if (args[0]) {
            let name = args[0]
            let uuid = await getUuidFromName(name)
            if (uuid) {
                if (!users.users.includes(uuid)) return
                users.users.splice(users.users.indexOf(uuid), 1)
                write(users)
                users = loadUsers()
                console.log(`${message.author.username} removed ${name} from tracked users.`)
                message.channel.send(`${name} has been removed from the tracked users.`)
            }
        }
    }

    if (command == "list") {
        let embed = new Discord.EmbedBuilder()
        embed.setTitle("List of managed players")
        embed.setColor(0x001F00)
        for (let i = 0; i < users.users.length; i++) {
            let name = await getNameFromUuid(users.users[i])
            embed.addFields({ name: name, value: users.users[i], inline: false })
        }
        message.channel.send({ embeds: [embed] })
    }

    if (command == "authorize") {
        if (message.author.id != config.owner) return
        if (args[1]) {
            let action = args[0]
            let id = args[1]
            if (action == "add") {
                users.authorized.push(id)
                write(users)
                users = loadUsers()
                console.log(`Added ${id} to authorized users.`)
            }
            if (action == "remove") {
                users.authorized.splice(users.authorized.indexOf(id), 1)
                write(users)
                users = loadUsers()
                console.log(`Removed ${id} from authorized users.`)
            }
        }
    }

    if (command == "set") {
        let check = users.authorized.find(user => user == message.author.id)
        if (!check) return
        // get channel id from message
        let channel = message.channel.id
        users.channel = channel
        write(users)
        users = loadUsers()
        console.log(`${message.author.username} set the channel to ${channel}.`)
        message.channel.send(`The logging channel has been set to this channel.`)
    }

    if (command == "send") {
        let check = users.authorized.find(user => user == message.author.id)
        if (!(check && args[0])) return

        if (args[0] == "log" || args[0] == "chat") {
            message.channel.send({ files: [`${args[0]}.txt`] })
        } else {
            message.channel.send("Invalid command.")
        }

    }
})
client.login(config.token)