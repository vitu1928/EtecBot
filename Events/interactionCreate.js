const Event = require('../Structures/Event.js')
const { db } = require('../Util/util.js')
const { CommandInteractionOptionResolver } = require('discord.js')

module.exports = class extends Event {
  constructor(client) {
    super("interactionCreate", client)
  }

  async execute(interaction, client) {
    let interactionCommand = client.interactions.get(interaction.commandName)
    if (!interactionCommand) return;
    let args = interaction?.options
    await interactionCommand.execute({ interaction, args, client, db })
  }
}