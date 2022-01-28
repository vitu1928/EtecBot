// Corrigir erros de defer
const Interaction = require('../../Structures/Interaction.js')
chalk = require('chalk'),
axios = require('axios'),
{ Buffer } = require('buffer'),
validator = require('../../Schemas/lições.js'),
{ MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, MessageSelectMenu, Collection } = require('discord.js'), { jsPDF } = require("jspdf");


module.exports = class PdfInteraction extends Interaction {
  constructor() {
    super("pdf", {
      type: 1,
      description: 'Fazer um pdf',
      defaultPermission: true,
      options: [],
      beta: false,
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, client, db }) {
    const authorId = interaction.user.id
    let nomeFile

    const threadChannel = await interaction.guild.channels.cache.find(c => c.topic?.includes(authorId) ? interaction.reply({
      content: `Você já tem uma thread aberta! <#${c.id}>`,
      ephemeral: true
    }) : null)

    if (threadChannel) return;

    let canalMembro = await interaction.guild.channels.create(`${interaction.user.username} - ${this.name}`,{
      type: 'GUILD_TEXT',
      topic: `Criar um pdf\n${authorId}`,
      nsfw: false,
      parent: threadChannel ?? "884425486166536295",
      reason: "Criar um pdf",
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
        .setLabel("Salvar")
        .setStyle('SUCCESS')
        .setEmoji("✅")
        .setDisabled(files.length > 0 ? false : true),

      new MessageButton()
        .setCustomId('cancel')
        .setLabel("Cancelar")
        .setStyle('DANGER')
        .setEmoji("❌")
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
          label: `${f.attachmentName.slice(0, 100)}`,
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
          .setDescription(`<@${authorId}> quando quiser mudar é só mudar no menu. Envie o(s) arquivos e quando terminar aperte em 'Fim'.\nO nome do arquivo vai ser o texto de qualquer mensagem que você enviar aqui, se mandar de novo vai sobrescrever o anterior (nome padrão = seu username).`)
          .addField("Reações", "✅: Arquivo salvo\n✔️: Nome alterado")
          .setColor('#2F3136')
          .setTimestamp()
      ],
      components: [rowButton()]
    })
    

    const collectorMenu = messageButton.createMessageComponentCollector({ filter: (i) =>  (i.customId === 'licaomenu') && i.user.id === authorId, componentType: "SELECT_MENU"})

    collectorMenu.on('collect', async interact => {
      interact.deferUpdate()
      let id = interact.customId
      try {
        files = files.filter(function(v, index) { 
          return !this.includes(index.toString())
        }, interact.values)
        
        return await interact.update({
          embeds: messageButton.embeds,
          components: [rowButton(), rowRemove()]
        })
      }catch(e) {
        console.error(e)
        return canalMembro.send({
          content: "Ocorreu um erro!"
        })
      }
    })
    
    const filterMessage = (m) => m.author.id === authorId
    const collectorMes = canalMembro.createMessageCollector({ filter: filterMessage, idle: 60000*2 })

    collectorMes.on('collect', async message => {
      try {
        if (message.content) nomeFile = message.content, await message.react('✔️');

        let arquivo = message.attachments
        if (arquivo.size === 0 && message.reference) arquivo = (await message.channel.messages.fetch(message.reference.messageId)).attachments;

        if (arquivo.size > 0) {
          if (arquivo.size > 16777216) throw new Error("Arquivo muito grande")

          if (!["jpg", "jpeg", "png", "webp"].includes(arquivo.first().url.slice(-3))) return await canalMembro.send({
            content: "Esse arquivo não é uma imagem!"
          }), await message.react('❌');


          const fileDownloader = async fileUrl => {
            return await axios.get(fileUrl, { responseType: 'arraybuffer' })
          }
           
          let i = 1
          let adicionando = new Promise(function (resolve, reject) {
            return arquivo.each(async f => {
              let { data } = await fileDownloader(f.url)
              
              files.push({
                attachmentName: f.name,
                buffer: data
              })

              if (i !== arquivo.size) ++i
              else return resolve(files)
            })
          })

          adicionando.then(async () => {
            await messageButton.edit({
              embeds: messageButton.embeds,
              components: [rowButton(), rowRemove()]
            })
          })

          await message.react('✅')
        }
      } catch (e) {
        console.error(e)
        return await message.react('❌')
      }
    })

    const filterButton = (interactionE) => 
    {
      const filtro = ['fim', 'cancel'].includes(interactionE.customId) && interactionE.user.id === authorId
      if (filtro) interactionE.deferUpdate()
      return filtro
    }

    const collectorButton = messageButton.createMessageComponentCollector({ filter: filterButton, componentType: "BUTTON" })

    collectorButton.on('collect', async i => {
      try {
        if (i.customId === 'fim') {
          const doc = new jsPDF("p", "mm")
          doc.addImage(files.shift().buffer, "JPEG", 15, 15, 180, 265)
          let page = 2

          if (files[0]) {
            files.forEach(file => {
              const { buffer } = file 
              doc.addPage()
                .setPage(page++)
                .addImage(buffer, "JPEG", 15, 15, 180, 265)
            })
          }
          await i.channel.send({
            files: [new MessageAttachment(Buffer.from(doc.output('arraybuffer')), `${nomeFile ?? interaction.user.username}.pdf`)]
          })

          return collectorMes.stop()
        } else if (i.customId === 'cancel') {
          await i.update({
            content: "\`Cancelado, canal será deletado em 30s\`", 
            components: []
          })
          return collectorMes.stop()
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
      else message = `foram enviados ${files.length} arquivo(s)`

      canalMembro.deleted ? null : await canalMembro.send(`Sessão encerrada, ${message}, esse canal será deletado em 30s`)

      await canalMembro.permissionOverwrites.edit(interaction.user, {
        SEND_MESSAGES: false
      })

      setTimeout(() => canalMembro.delete(), 30000)
    })
  }
}