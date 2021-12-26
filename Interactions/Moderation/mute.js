const Interaction = require('../../Structures/Interaction.js')
const { MessageActionRow, MessageButton, Permissions } = require("discord.js")
const dateFrom = require('../../Util/util.js').dateFrom

module.exports = class MuteInteraction extends Interaction {
  constructor() {
    super("Mute author", {
      type: 3,
      defaultPermission: true
    })
  }

  async execute({ interaction, client }) {
    const message = interaction.options.resolved.messages?.first()
    const aSerMutado = interaction.member.guild.members.cache.get(message.author.id)
    if (!message || !aSerMutado) return interaction.reply({ content: 'Houve algum erro na hora de pegar o author da mensagem', ephemeral: true })

    if (aSerMutado.user.id === interaction.guild.ownerId) {
      return interaction.reply({ content: 'Não seja idiota! Ele é o adm', ephemeral: true })
    } else if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      return interaction.reply({ content: 'Você não tem permissão para mutar membros!', ephemeral: true })
    } else if (!interaction.member.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      return interaction.reply({ content: 'Eu não tenho permissão para mutar membros!', ephemeral: true })
    } else if (!aSerMutado.manageable) {
      return interaction.reply({ content: 'Meu cargo é inferior ao membro que você quer mutar!', ephemeral: true })
    }

    let row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('sim')
        .setLabel("Sim")
        .setStyle('SUCCESS')
        .setEmoji("✅"),

      new MessageButton()
        .setCustomId('não')
        .setLabel("Não")
        .setStyle('DANGER')
        .setEmoji("❌"),
    )

    let i = await interaction.reply({ ephemeral: true, content: `Quer mesmo mutar **${aSerMutado.user.username}** (${aSerMutado.user.id})?`, components: [row] })
    const filter = (interactionE) => (interactionE.customId === 'sim' || interactionE.customId === 'não') && interactionE.user.id === interaction.user.id
    
    let channel = interaction.channel
    const collector = channel?.createMessageComponentCollector({
      filter, max: 1
    })

    collector.on('collect', async i => {
      if (i.customId === 'sim') {
        await i.update({
          content: "Mutado com sucesso!",
          components: []
        })
        collector.stop()
        client.mutes.set(`${aSerMutado.user.id} - ${interaction.channel.id}`)

        return interaction.channel.permissionOverwrites.create(message.author, {
          SEND_MESSAGES: false,
          ATTACH_FILES: false
        })
      } else if (i.customId === 'não') {
        collector.stop()
        return await i.update({
          content: "Cancelado :x:",
          components: []
        })
      }
    })
  }
}