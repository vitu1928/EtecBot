const Event = require('../Structures/Event.js')
const { MessageButton, MessageActionRow, Activity } = require('discord.js')

module.exports = class extends Event {
  constructor(client) {
    super("ready", client, true)
  }

  async execute(client) {
    console.log('O bot iniciou!')
    await client.loadInteractions()

    // let interacts = await client.guilds.cache.get('810845854796873739').commands.fetch()
    // interacts.each(c => {
    //   if (!client.interactions.has(c.name)) return c.delete()
    // })
  }
}
