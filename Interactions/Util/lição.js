const Interaction = require('../../Structures/Interaction.js')
chalk = require('chalk'),
axios = require('axios'),
{ Buffer } = require('buffer'),
validator = require('../../Schemas/lições.js'),
{ MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Collection } = require('discord.js'), aulas = require('./json/aulas.js');

module.exports = class LicaoInteraction extends Interaction {
  constructor() {
    super("lição", {
      type: 1,
      description: 'Tráfico de lições, enviar uma lição',
      defaultPermission: true,
      options: [],
      beta: false,
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, client, db }) {
    const authorId = interaction.user.id
    let materia

    const threadChannel = await interaction.guild.channels.cache.find(c => c.topic?.includes(authorId) ? interaction.reply({
      content: `Você já tem uma thread aberta! <#${c.id}>`,
      ephemeral: true
    }) : null)

    if (threadChannel) return;

    let canalMembro = await interaction.guild.channels.create(`${interaction.user.username} - ${this.name}`,{
      type: 'GUILD_TEXT',
      topic: `Nova lição po pai\n${authorId}`,
      nsfw: false,
      parent: threadChannel ?? "884425486166536295",
      reason: "Tráfico de lições",
      permissionOverwrites: [
        {
          id: '810845854796873739',
          type: 'role',
          deny: ["VIEW_CHANNEL"]
        },
        {
          id: authorId,
          type: 'member',
          allow: ["VIEW_CHANNEL"]
        },
      ]
    })

    await interaction.reply({
      content: `Thread criada! <#${canalMembro.id}>`,
      ephemeral: true
    })
    
    let files = []

    let rowButton = () => new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('fim')
        .setLabel("Fim")
        .setStyle('SUCCESS')
        .setEmoji("✅")
        .setDisabled(files.length > 0 ? false : true),

      new MessageButton()
        .setCustomId('cancel')
        .setLabel("Cancelar")
        .setStyle('DANGER')
        .setEmoji("❌")
    )

    let rowMateria = () => new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setMinValues(1)
        .setMaxValues(1)
        .setPlaceholder("Matéria")
        .setCustomId('materiamenu')
        .addOptions(
          aulas.map(op => {
          if (!materia) return op
          if (op.label == materia) return op.default = true, op;
          else return op.default = false, op;
          })
        )
    )

    let messs = () => new MessageSelectMenu()
      .setMinValues(1)
      .setMaxValues()
      .setPlaceholder("Arquivo para ser removido")
      .setCustomId('licaomenu')
      .setDisabled(files.length > 0 ? false : true)

    let rowRemove = () => new MessageActionRow().addComponents(
      messs().spliceOptions(0, messs().options.length, files[0] ? files.map((f, index) => {
        return {
          label: `${f.attachmentName}`,
          value: `${index}`
        }
      }) : {
        label: 'Nenhum arquivo',
        value: '-1'
      })
    )

    let messageButton = await canalMembro.send({
      embeds: [
        new MessageEmbed()
          .setDescription(`<@${authorId}> selecione o nome da matéria e quando quiser mudar é só mudar no menu. Envie o(s) arquivos e quando terminar aperte em 'Fim'.\nOs arquivos não podem ultrapassar \`16Mb\`.`)
          .addField("Reações", "✅: Arquivo salvo")
          .setColor('#2F3136')
          .setTimestamp()
      ],
      components: [rowButton(), rowMateria()]
    })

    const filterMenu = (i) => {
      return (i.customId === 'licaomenu' || i.customId === 'materiamenu') && i.user.id === authorId
    }

    const collectorMenu = messageButton.createMessageComponentCollector({ filter: filterMenu, componentType: "SELECT_MENU"})
    collectorMenu.on('collect', async interact => {
      let id = interact.customId
      try {
        if (id === 'licaomenu') {
          interact.deferUpdate()
          files = files.filter(function(v, index) { 
            return !this.includes(index.toString())
          }, interact.values)
          
          return await messageButton.edit({
            embeds: messageButton.embeds,
            components: [rowButton(), rowMateria(), rowRemove()]
          })

        } else if (id === 'materiamenu') {
          materia = interact.values[0] 
          interact.deferUpdate()
        }
      } catch(e) {
        console.error(e)
        return canalMembro.send({
          content: "Ocorreu um erro!"
        })
      }
    })
    
    const filterMessage = (m) => m.author.id === authorId
    const collectorMes = canalMembro.createMessageCollector({ filter: filterMessage, idle: 60000 })

    collectorMes.on('collect', async message => {
      try {
        let arquivo = message.attachments
        if (arquivo.size === 0 && message.reference) arquivo = (await message.channel.messages.fetch(message.reference.messageId)).attachments

        if (arquivo.size > 0) {
          if (arquivo.size > 16777216) throw new Error("Arquivo muito grande")
          
          const fileDownloader = async fileUrl => {
            return await axios.get(fileUrl, { responseType: 'arraybuffer' })
          }
           
          let i = 1
          let adicionando = new Promise(function (resolve, reject) {
            return arquivo.each(async f => {
              let { data } = await fileDownloader(f.url)
              
              files.push({
                attachmentName: f.name,
                buffer: Buffer.from(data)
              })

              if (i !== arquivo.size) ++i
              else return resolve(files)
            })
          })

          adicionando.then(async () => {
            await messageButton.edit({
              embeds: messageButton.embeds,
              components: [rowButton(), rowMateria(), rowRemove()]
            })
          })

          await message.react('✅')
        }
      } catch (e) {
        console.error(e)
        return await message.react('❌')
      }
    })

    const filterButton = (interactionE) =>{
      interactionE.deferUpdate()
      return ['fim', 'cancel'].includes(interactionE.customId) && interactionE.user.id === authorId
    }

    const collectorButton = messageButton.createMessageComponentCollector({ filter: filterButton, componentType: "BUTTON" })

    collectorButton.on('collect', async i => {
      try {
        if (i.customId === 'fim') {
          if (!materia) return await i.channel.send({
            content: ":x: Você ainda não selecionou uma matéria!"
          })

          db(async function(clientMongo) {
            let db = clientMongo.db("lições")
            let collectionUser = db.collection(authorId)
            if (!db.collection(authorId)) collectionUser = db.createCollection(authorId, validator)
          
            collectionUser.insertOne({
              buffers: files,
              materia
            }).then(() => clientMongo.close())
          })
            .then(async () => {
              collectorMes.stop()
              return await i.message.edit({
                content: "\`Salvo com sucesso, sessão encerrada. (canal será deletado em 15s)\`",
                components: []
              })
            })
        } else if (i.customId === 'cancel') {
          collectorMes.stop()
          return await i.message.edit({
            content: "\`Cancelado, canal será deletado em 15s\`", // 30?
            components: []
          })
        }
        collectorButton.stop("Sessão encerrada")
      } catch (e) {
        console.error(e)
        canalMembro.send({
          content: "Ocorreu um erro!"
        })
      }
    })

    collectorMes.on('end', async (m) => {
      let message
      if (files.length == 0) message = "você não enviou nenhum arquivo"
      else message = `foram enviado(s) ${files.length} arquivos`

      canalMembro.deleted ? null : await canalMembro.send(`Sessão encerrada, ${message}, esse canal será deletado em 15s`)

      await canalMembro.permissionOverwrites.edit(interaction.user, {
        SEND_MESSAGES: false
      })

      setTimeout(() => canalMembro.delete(), 15000)
    })
  }
}