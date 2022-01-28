const pt = require("periodic-table")
const translate = require('translate-google')
const Interaction = require('../../Structures/Interaction.js')
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js')
// Fazer um SelectMenu para cada tipo?

module.exports = class TabelaPeriodicaInteraction extends Interaction {
  constructor() {
    super("tabela_periódica", {
      type: 1,
      description: 'Ver informações sobre algum dado da tabela periódica',
      defaultPermission: true,
      options: [
        {
          name: 'elemento',
          description: 'Elemento ou símbolo da tabela periódica para pegar as infos',
          type: "STRING",
          required: false
        }
      ],
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, args, client }) {
    interaction.deferReply()
    
    Array.prototype.embed = function(embed) {
      return this.forEach(inf => embed.addField(inf[0], inf[1] != "" ? `\`${inf[1]}\`` : "*Nada*", true) )
    }

    let elemento = args.getString('elemento')?.toLowerCase()
    if (elemento) {
      let e = 'elements'

      if (elemento.length < 3) e = 'symbols'
      else elemento = await translate(elemento, { from: 'pt', to: 'en' })
      let infos = pt[e][elemento[0].toUpperCase() + elemento.slice(1)]
      if (!infos) return interaction.followUp(":x: Ocorreu um erro na hora de pegar o elemento!")
      infos = await translate(Object.entries(infos), { from: 'en', to: 'pt' })
      let embedpt = new MessageEmbed()
        .setColor('#2F3136')
      infos.embed(embedpt)

      return interaction.followUp({ embeds: [embedpt] })
    } else {
      let arrEmbed = [],
      elNum = 0,
      tr = false, rt = true;
      let row = () => new MessageActionRow()
        .addComponents([
          new MessageButton({
            customId: 'left',
            emoji: '⬅️',
            style: 'PRIMARY',
            disabled: rt
          }), new MessageButton({
            customId: 'rigth',
            emoji: '➡️',
            style: 'PRIMARY',
            disabled: tr
          })
        ])

      const arrpt = Object.entries(pt.all())

      for (let i = 0, arr = arrpt; i < arrpt.length; i++) {
        let a = arrpt[i]
        
        const embedP = new MessageEmbed()
        .setColor('RANDOM')
        .setFooter(`${i}/${arr.length}`)
        let res = await translate(Object.entries(a[1]), { from: 'en', to: 
        'pt' })
        res.embed(embedP)
        arrEmbed.push(embedP)
      }

      let message = await interaction.followUp({
        embeds: [arrEmbed[0]],
        components: [row()]
      })


      const collector = message.createMessageComponentCollector({ filter:  (i) => ['left', 'rigth'].includes(i.customId) && i.user.id == interaction.user.id, idle: 60000 })
      
      collector.on('collect', async (inter) => {
        switch(inter.customId) {
          case 'rigth':
            if (elNum >= 0) rt = false
            if (elNum == arrEmbed.length - 1) tr = true
            return await inter.update({
              embeds: [arrEmbed[++elNum]],
              components: [row()]
            });
            break;
          case 'left':
            if (elNum == 1) rt = true

            return await inter.update({
              embeds: [arrEmbed[--elNum]],
              components: [row()]
            });
            break;
          default:
            inter.deferUpdate()
        }
      })

      collector.on('end', () => {
        rt = true 
        tr = true
        message.edit({
          embeds: [arrEmbed[elNum]],
          components: [row()]
        })
      })
    }
  }
}