const Interaction = require('../../Structures/Interaction.js')
const aulas = require('./json/aula.json')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js')
const { Menu } = require('../../Util/util.js')

module.exports = class ClassInteraction extends Interaction {
  constructor() {
    super("aula", {
      type: 1,
      description: 'Ver a aula atual',
      defaultPermission: true,
      options: [
        {
          name: 'dia_da_semana',
          description: 'Dia para ver as aulas',
          required: false,
          type: 'STRING',
          choices: [
            {
              name: 'segunda',
              value: '1'
            },
            {
              name: 'terça',
              value: '2'
            },
            {
              name: 'quarta',
              value: '3'
            },
            {
              name: 'quinta',
              value: '4'
            },
            {
              name: 'sexta',
              value: '5'
            }
          ]
        }
      ],
      beta: false,
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, args, client }) {
    return await interaction.reply({
      content: "Férias amigão?!",
      ephemeral: true
    })

    let date = new Date()
    let dia = date.getDay()
    args = args.getString('dia_da_semana')

    if ((dia == 6 || dia == 0) && !args) return interaction.reply({
      content: "Hoje tem aula?",
      ephemeral: true
    })

    let fnDate = (h=date.getHours()-3, m=date.getMinutes(),s=0) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), h+3, m, s) // UTCHours?

    let aula1 = [fnDate(7, 30), fnDate(8, 20)],
    aula2 = [fnDate(8, 20), fnDate(9, 10)],
    aula3 = [fnDate(9, 10), fnDate(10, 0)],
    // interavalo
    aula4 = [fnDate(10, 20), fnDate(11, 10)],
    aula5 = [fnDate(11, 10), fnDate(12, 0)],
    aula6 = [fnDate(12, 0), fnDate(12, 50)],
    arr = [aula1, aula2, aula3, aula4, aula5, aula6];

    let classe = arr.findIndex(aula => {
      return fnDate() > aula[0] && fnDate() < aula[1]
    })

    let aulaDiaHoje = aulas[dia]
    if (args) aulaDiaHoje = aulas[args]
    let numDefaultEmbed;

    const embeds = aulaDiaHoje.map(a => {
      const { value, name } = a

      let numIni = value[0]
      let numEnd = value[1] 
      let fn = (n, n2) => (Date.parse(arr[n][n2])).toString().slice(0, -3);
      
      numIni = fn(numIni, 0)
      numEnd = fn(numEnd, 1)

      let desc = a.description
      if (classe >= value[0] && classe <= value[1] && !args) desc += `\n(Aula de agora :bangbang: Volta pra aula)`

      return new MessageEmbed()
        .setTitle(`\`${name}\``)
        .setDescription(`${desc}\nDura das <t:${numIni}:T> até <t:${numEnd}:T>`)
        .setColor('#2F3136')
        .setTimestamp()
    })

    const menu = new MessageSelectMenu({
      customId: 'aula',
      placeholder: "Aula",
      options: aulaDiaHoje.map((a, index) => {
        const { name, value } = a
        let _default = false
        if (classe >= value[0] && classe <= value[1]) _default = true, numDefaultEmbed = index;

        return {
          value: `${index}`,
          label: name,
          description: a.description,
          emoji: a.emoji
        }
      })
    })

    const row = new MessageActionRow()
      .addComponents([menu])

    let message = await interaction.reply({
      components: [
        row
      ],
      embeds: [
        embeds[numDefaultEmbed]
      ]
    })
    
    message = await interaction.fetchReply()

    const filter = (i) => {
      if (i.user.id != interaction.user.id) i.reply({
        content: "Utilize o comando para poder interagir!",
        ephemeral: true
      })
       return i.customId == 'aula' && interaction.user.id === i.user.id
    }

    const collector = message.createMessageComponentCollector({
      filter,
      idle: 30000
    })

    let last;
    collector.on('collect', async (i) => {
      let value = parseInt(i.values[0])
      last = value
      await i.update({
        embeds: [
          embeds[value]
        ],
        components: [
          row
        ]
      })
    })

    collector.on('end', async () => {
      row.components[0].setDisabled(true)
      await message.edit({
        components: [
          row
        ]
      })
    })
  }
}
