const Interaction = require('../../Structures/Interaction.js')

module.exports = class DeleteInteraction extends Interaction {
  constructor() {
    super("deletar", {
      type: 1,
      description: 'Deletar mensagens do canal atual ou a escolha ...',
      defaultPermission: true,
      options: [
        {
          name: 'numero',
          description: 'Número de mensagens para serem deletadas',
          type: "INTEGER",
          required: true
        },
        {
          name: 'canal',
          description: 'Canal para deletar as mensagens',
          type: "CHANNEL",
          required: false
        }
      ],
      channelTypes: ["GUILD_TEXT"],
      beta: true
    })
  }

  async execute({ interaction, args, client }) {
    try {
      const canal = args.getChannel('canal') ?? interaction.channel
      const numDel = args.getInteger('numero')
      if (numDel > 100) return await interaction.reply({
        content: "Não é possível apagar mais de 100 mensagens",
        ephemeral: true
      })
      if (canal.type != 'GUILD_TEXT') return await interaction.reply({
        content: "O Canal preciso ser de texto para deletar as mensagens!",
        ephemeral: true
      })

      await canal.bulkDelete(numDel)
      await interaction.reply({
        content: `Deletado \`${numDel}\` mensagens no canal ${canal}`,
        ephemeral: true
      })
    } catch(e) {
      await interaction.reply({
        content: "Ocorreu algum erro!",
        ephemeral: true
      })
      console.error(e)
    }
  }
}