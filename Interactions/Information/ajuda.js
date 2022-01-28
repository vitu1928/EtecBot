const Interaction = require('../../Structures/Interaction.js')
const { MessageEmbed, MessageSelectMenu, MessageActionRow } = require('discord.js')

module.exports = class HelpInteraction extends Interaction {
  constructor() {
    super("ajuda", {
      type: 1,
      description: 'Ajudar os membros em dúvidas em relação ao bot',
      defaultPermission: true,
      options: [
        {
          name: 'interação',
          description: 'Use o comando ajuda (sem nenhum argumento) para ver as interações',
          required: false,
          type: 'STRING'
        }
      ],
      channelTypes: ["GUILD_TEXT", "DM"]
    })
  }
  
  async execute({ interaction, args, client }) {
    if (args.getString('interação')) {
      const value = args.getString('interação')
      const interactCommand = client.interactions.get(value)

      if (!interactCommand) return await interaction.reply({
        content: ':x: Não consegui encontrar nenhuma interação com esse nome!',
        ephemeral: true
      })
        
      let desc = {
        "1": 'Slash commands, use \`/\` no chat para ver os slash disponíveis',
        "2": 'User, clique com o dedo direito do mouse em algum membro (se estiver no celular, clique em algum membro)',
        "3": 'Message, clique nos três pontinhos em alguma mensagem para ver as funções disponíveis'
      }

      return await interaction.reply({
        embeds: [
          new MessageEmbed({
            title: interactCommand.name,
            description: interactCommand.description,
            fields: [
              {
                name: "Uso",
                value: desc[interactCommand.type],
                inline: false
              },
              {
                name: "Opções",
                value: `\`\`\`md\n${interactCommand.options.map(int => `- ${int.name}: ${int.description}`).join('\n')}\`\`\``
              }
            ],
            color: '#393D52'
          })
        ],
        ephemeral: true
      })
    } else {
      const menu = new MessageSelectMenu({
        customId: 'menuAjuda',
        minValues: 1,
        maxValues: 1,
        placeholder: 'Escolha alguma das opções que precisa de ajuda',
        options: [
          {
            label: 'Interações',
            value: 'interacoes',
            description: 'Interações disponíveis no bot',
            emoji: '🤖'
          },
          {
            label: 'Serverinfo',
            value: 'serverinfo',
            description: 'Info sobre o server',
            emoji: 'ℹ️'
          }
        ]
      })

      const row = new MessageActionRow()
        .addComponents([
          menu
        ])

      await interaction.reply({
        embeds: [
          new MessageEmbed({
            title: "Etec bot ajudas",
            image: {
              url: 'https://www.etecsantaifigenia.com.br/wp-content/uploads/2017/07/etec-sta-ifigenia-420x232.jpg',
              proxyURL: "https://media.discordapp.net/attachments/852543234068709386/922539772042412062/etec-sta-ifigenia-420x232.png"
            },
            color: '#393D52'
          })
        ],
        components: [
          row
        ]
      })

      let message = await interaction.fetchReply()
      const checkEmptyString = (s) => { if (s != '') return s }
      const guild = await client.guilds.fetch(interaction.guild)
      const member = interaction.member
      const [emojiAnimated, emoji] = guild.emojis.cache.partition(e => e.animataed)
      let emptyLine = { inline: true, name: '\u200B', value: '\u200B' }

      const embeds = {
        serverinfo: new MessageEmbed({
          title: "Serverinfo",
          description: "\tServer inicialmente feito para anotações das aulas online como também para troca de ideias entre os manos, com o tempo foi ganhando novas funções como tráfico de lições (e fofocas?)\n\n\tHoje o server é utilizado para conversas",
          thumbnail: guild.iconURL({
            dynamic: true,
            size: 128
          }),
          /*
            x | • | x
            x | • | x
            x | • | x
            x | • | x
            x | • | x
          */
          fields: [
            {
              name: "Qntd. Membros",
              value: `\`\`\`py\n${guild.memberCount - guild.members.cache.filter(m => m.roles.botRole).size}\`\`\``,
              inline
            },
            emptyLine,
            {
              name: "Qntd. Emojis",
              value: `Animado: ${emojiAnimated.size}\nNão animados: ${emoji.size}`,
              inline
            },
            {
              name: "Qntd. Canais",
              value: `\`\`\`py\n${guild.channels.cache.size}\`\`\``,
              inline
            },
            emptyLine,
            {
              name: "Qntd. Banimentos",
              value: `\`\`\`py\n${guild.bans.cache.size ?? 0}\`\`\``,
              inline
            },
            {
              name: 'Qntd. Cargos',
              value: `\`\`\`py\n${guild.roles.cache.size}\`\`\``,
              inline
            },
            emptyLine,
            {
              name: 'Cargo mais alto',
              value: `<@&${guild.roles.highest.id}>`,
              inline
            },
            {
              name: "Adm",
              value: `<@!${guild.ownerId}>`,
              inline
            },
            emptyLine,
            {
              name: 'Entrou ',
              value: `<t:${parseInt(member.joinedTimestamp/1000)}:R>`,
              inline
            },
            {
              name: 'Invites',
              value: `${checkEmptyString(Array.from(guild.invites.cache.map((inv, index) => `[${inv.url}](Invite ${index} "Criado por ${inv.inviter.username}")`)).join('\n')) ?? "*Não há invites*"}`
            },
            {
              name: "Criado",
              value: `<t:${parseInt(guild.createdTimestamp/1000)}:R>`,
              inline
            }
          ],
          color: member.displayHexColor ?? '#393D52'
        }),
        interacoes: new MessageEmbed({
          title: "Interações",
          description: `\`\`\`fix\n${interaction.guild.commands.cache.map(c => c.name).join('\n')}\`\`\``,
          color: "#393D52"
        })
      }
      
      const filter = (i) => i.customId === 'menuAjuda';
      const collector = message.createMessageComponentCollector({
        idle: 60000*3,
        filter
      })

      collector.on('collect', async (i) => {
        let value = i.values[0]
        await i.reply({
          ephemeral: true,
          embeds: [
            embeds[value]
          ]
        })
      })

      collector.on('end', async () => {
        row.components[0].setDisabled(true)
        await message.edit({
          content: "Utilize o comando novamente!",
          components: [
            row
          ]
        })
      })
    }
  }
}
