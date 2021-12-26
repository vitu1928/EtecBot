const Interaction = require('../../Structures/Interaction.js')
const { MessageEmbed } = require('discord.js')
module.exports = class CuDoCauanInteraction extends Interaction {
  constructor() {
    super("cu_do_cauan", {
      type: 1,
      description: 'flushed',
      defaultPermission: true,
      options: [],
      channelTypes: ["GUILD_TEXT", "DM"]
    })
  }

  async execute({ interaction, args, client }) {
    interaction.deferReply()
    interaction.followUp({
      embeds: [
        new MessageEmbed()
          .setTitle("Oi gata kk interessada rsrs")
          .setColor("#36393F")
          .setImage('https://images-ext-2.discordapp.net/external/LVtDjq7ywu31iz7INJu-jY9vGueyRjVG_r1iqt3CsWU/%3Fwidth%3D228%26height%3D406/https/media.discordapp.net/attachments/843643647094292501/885992726624100382/IMG-20210901-WA0054.jpeg?width=205&height=365')
      ]
    })
  }
}