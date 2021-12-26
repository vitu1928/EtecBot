const Interaction = require('../../Structures/Interaction.js')
const { MessageActionRow, MessageButton, Permissions, MessageEmbed } = require("discord.js")
const dateFrom = require('../../Util/util.js').dateFrom

module.exports = class WarnInteraction extends Interaction {
  constructor() {
    super("Warn author", {
      type: 3,
      defaultPermission: true
    })
  }

  async execute({ interaction, client }) {
    const message = interaction.options.resolved.messages?.first()
    const aSerAvisado = interaction.member.guild.members.cache.get(message.author.id)
    if (!message || !aSerAvisado) return interaction.reply({ content: 'Houve algum erro na hora de pegar o author da mensagem', ephemeral: true })

     if (!interaction.member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) {
      return interaction.reply({ content: 'Você não tem permissão para avisar membros!', ephemeral: true })
    } else if (!interaction.member.guild.me.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) {
      return interaction.reply({ content: 'Eu não tenho permissão para avisar membros!', ephemeral: true })
    } else if (aSerAvisado.user.id === client.user.id) {
      return interaction.reply({ content: 'Eu não tenho como me avisar!', ephemeral: true })
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

    let i = await interaction.reply({ 
      ephemeral: true,
      content: `Quer mesmo avisar **${aSerAvisado.user.username}** (${aSerAvisado.user.id})?`,
      components: [row]
    })

    const filter = (interactionE) => (['sim', 'não'].includes(interactionE.customId)) && interactionE.user.id === interaction.user.id
    
    let channel = interaction.channel
    const collector = channel?.createMessageComponentCollector({
      filter, max: 1
    })

    collector.on('collect', async i => {
      collector.stop()
      if (i.customId === 'sim') {
        await i.update({
          content: 'Envie o aviso',
          components: []
        })

        let filter = m => m.author.id === interaction.user.id
        let messageWarn = await interaction.channel.awaitMessages({ filter, max: 1, idle: 10000 })
        if (!messageWarn.first()) return;

        let aviso = messageWarn.first()?.content

        client.warns.set(aSerAvisado.user.id, {
          avisos: client.warns.get(aSerAvisado.id)?.warns+1 ?? 1,
          aviso: aviso
        })
    
        let dmChannel = await aSerAvisado.createDM()
        return dmChannel.send({
          embeds: [
            new MessageEmbed()
              .setTitle("⚠ Aviso")
              .setURL(message.url)
              .setDescription(`Aviso:\n${aviso}`)
              .setAuthor(interaction.user.username, interaction.user.displayAvatarURL({
                size: 16,
                dynamic: true,
                format: 'png'
              }), `https://discord.com/users/${interaction.user.id}`)
              .setColor('#2F3136')
          ]
        })
          .then(async () =>
            await messageWarn.first().reply({
              content: "Avisado!",
              components: [],
              ephemeral: true
            })
          )
          .catch(async () =>
            await messageWarn.first().reply({
              content: "Ocorreu algum erro quando fui avisar",
              components: [],
              ephemeral: true
            })
          )
      } else if (i.customId === 'não') {
        return await i.update({
          content: "Cancelado :x:",
          components: []
        })
      }
    })
  }
}