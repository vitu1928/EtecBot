const { Client, Collection, Permissions } = require('discord.js')
const { readdirSync } = require('fs')

module.exports = class EtecClient extends Client {
  constructor() {
    super({
      partials: ['MESSAGE', 'CHANNEL', 'GUILD_MEMBER'],
      intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_MEMBERS",
        "GUILD_INTEGRATIONS"
      ],
      allowedMentions: { parse: ['roles', 'users'] },
      presence: {
        status: 'online',
        activities: [
          {
            name: 'Com os brothis da recuperação',
            applicationId: '922548022427156502',
            type: 'PLAYING',
            assets: {
              largeImage: 'recuperacao',
              largeText: "I em física",
              smallImage: 'recuperacao_2',
              smallText: "I em química"
            },
            buttons: [
              { label: "Ir para a rec", url: "url" },
              { label: "Sair da rec", url: "url "}
            ]
          }
        ]
      }
    })
    
    this.events = new Collection()
    this.interactions = new Collection()

    this.amores = new Collection()
  }

  async loadEvents() {
    const eventFiles = readdirSync(process.cwd() + '/Events/').filter(file => file.endsWith('.js'))

    eventFiles.forEach(event => {
      let e = require(`../Events/${event}`)
      e = new e(this)
      const eventName = event.slice(0, -3)
      this.events.set(eventName, e)

      if (e.once) {
        this.once(eventName, function (...args) {
          e.execute(...args, this)
        })
      } else {
        this.on(eventName, function (...args) {
          e.execute(...args, this)
        })
      }
    })
  }

  async loadInteractions() {
    try {
      const interactionFolders = readdirSync(process.cwd() + '/Interactions/')
      let guilda = this.guilds.cache.get('810845854796873739')

      for (const folder of interactionFolders) {
        const interactionFiles = readdirSync(`./Interactions/${folder}`).filter(file => file.endsWith('.js'))
        for (const file of interactionFiles) {
          let interact = require(`../Interactions/${folder}/${file}`)
          interact = new interact()

          this.interactions.set(interact.name, interact)
          const inter = await guilda.commands.create(interact)
          
          if (interact.beta) {
            inter.permissions.set({
              permissions: [
                {
                  id: '731522255133081650',
                  type: 'USER',
                  permission: true
                },
                {
                  id: '589068449544929281',
                  type: 'USER',
                  permission: true
                },
                {
                  id: '416738506291806220',
                  type: 'USER', 
                  permission: true
                },
                {
                  id: '810845854796873739',
                  type: 'ROLE',
                  permission: false
                }
              ]
            })
          }
        }
      }
      console.log("Interações carregadas")
    } catch(e) {
      console.error(e)
    }
  }
}