const Interaction = require('../../Structures/Interaction.js')
const aulas = require('./json/aulas.js')
const { MessageActionRow, MessageAttachment, MessageSelectMenu } = require('discord.js')

module.exports = class ProcArquivInteraction extends Interaction {
  constructor() {
    super("procurar_arquivo", {
      type: 1,
      description: 'Pegar um arquivo disponibilizado por algum dos professores de tal matéria',
      defaultPermission: true,
      options: [
        {
          name: 'matéria',
          description: 'Matéria para pegar algum arquivo',
          type: "STRING",
          required: true,
          choices: aulas.map(aula => {
            return {
              name: aula.label,
              value: aula.value
            }
          })
        }
      ],
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, args, db }) {
    interaction.deferReply()

    db(async function(clientMongo) {
      const collection = clientMongo.db('arquivos').collection(args.getString('matéria'))
      const arrFiles = await (await collection.find()).toArray()

      let menu = new MessageSelectMenu()
        .setCustomId("menu-file")      
        .setMinValues(1)
        .setMaxValues(1)
        .setPlaceholder("Escolha o arquivo que deseja")

      menu = menu.spliceOptions(0, menu.options.length,
        arrFiles.map((fil, index) => {
          return {
            label: fil.buffers[0].attachmentName,
            value: index.toString()
          }
        })
      )
      if (!menu.options[0]) return interaction.followUp({
        content: "Nâo consegui encontrar arquivos desta matéria!"
      })

      const row = new MessageActionRow()
        .addComponents(menu)

      const interact = await interaction.followUp({
        content: 'Escolha o arquivo que deseja',
        components: [row]
      })

      let filter = (i) => ['menu-file', 'menuBuffers'].includes(i.customId) && i.user.id === interaction.user.id
      
      const collector = interact.createMessageComponentCollector({
        filter,
        idle: 20000
      })
      let valor;

      collector.on('collect', async (i) => {
        if (i.customId == 'menu-file') {
          const arquivos = arrFiles[parseInt(i.values[0])].buffers
          if (arquivos.length == 1) return await i.message.edit({
            components: [row]
          }), await i.reply({
            files: [new MessageAttachment(arquivos[0].buffer.buffer, arquivos[0].attachmentName)]
          });

          const rowMenu = new MessageActionRow()
            .addComponents( 
              new MessageSelectMenu({
                maxValues: 1,
                minValues: 1,
                customId: 'menuBuffers',
                options: arquivos.map((a, index) => {
                  return {
                    label: a.attachmentName,
                    value: index.toString()
                  }
                }),
                placeholder: 'Escolha o arquivo'
              })
            )

          valor = parseInt(i.values[0])
          await i.update({
            content: "Arquivos +/- desse tal assunto",
            components: [row, rowMenu]
          })
        } else {
          i.deferReply()
          let value = arrFiles[valor].buffers[parseInt(i.values[0])]
  
          await i.followUp({
            files: [
              new MessageAttachment(value.buffer.buffer, value.attachmentName)
            ]
          })
        }
      })

      collector.on('end', async () => {
        for (let o of row.components) o.setDisabled(true).setPlaceholder("Use o comando novamente!");
         
        await interact.edit({
          components: [row]
        })
      })
    })
  }
}