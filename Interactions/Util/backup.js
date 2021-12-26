const Interaction = require('../../Structures/Interaction.js')
const { MessageEmbed } = require('discord.js')
const { fetch, load, create, setStorageFolder, list } = require('discord-backup')
setStorageFolder(process.mainModule.path + '/Backups/')

module.exports = class BackupInteraction extends Interaction {
  constructor() {
    super("backup", {
      type: 1,
      description: 'Fazer backup do server',
      defaultPermission: true,
      options: [
        {
          name: 'criar',
          description: 'Criar um backup',
          type: "SUB_COMMAND"
        },
        {
          name: 'informações',
          description: 'Ver informações sobre um backup',
          type: "SUB_COMMAND",
          options: [
            {
              name: "backup_id",
              description: "Id do backup para ver as informações",
              required: false,
              type: "STRING"
            }
          ]
        },
        {
          name: 'carregar',
          description: 'Carregar um backup no server, cuidado, isso destrói.',
          type: "SUB_COMMAND",
          options: [
            {
              name: "backup_id",
              description: "Id do backup para carregar",
              required: true,
              type: "STRING"
            }
          ]
        }
      ],
      beta: true,
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, args, client }) {
    interaction.deferReply({
      ephemeral: true
    })
    let backup_id = args?.getString('backup_id')

    try {
      switch (args.getSubcommand()) {
        case "criar":
          let _create = await create(interaction.guild, {
            maxMessagesPerChannel: 25,
            saveImages: "base64",
            jsonSave: true,
            jsonBeautify: true
          });

          if(!_create) throw new Error("`❌` Rolou um erro!")
          await interaction.followUp(`Backup Criado! Aqui está o seu ID: ${_create.id} (Guarde com carinho antes de ignorar essa mensagem)!\nUse \`/backup carregar backup_id:${_create.id}\` para carregar o backup em outro server!`)
          
        break;
        case "carregar":
          if (interaction.user.id != '589068449544929281') throw new Error('Não pode fazer isso amigão. Isso ainda está em fase de testes')
          let back = await fetch(backup_id)

          if (back) await load(backup_id, interaction.guild, {
            clearGuildBeforeRestore: true
          })
          else throw new Error(`\`❌\` ID: \`\`${backup_id}\`\` não é um backup...`)
          await interaction.user.send("O bakckup foi carreagado com sucesso!")
        break;
        case "informações":
          if (!backup_id) {
            const backupList = await list()
            return interaction.followUp({
              embeds: [
                new MessageEmbed()
                  .setTitle("Backups")
                  .addFields(backupList.map(a => {
                    return { name:`\`${a}\``, value: '\u200B', inline: false }
                  }))
                  .setColor('#2F3136')
              ]
            })
          } else {
            const info = await fetch(backup_id)
            if (!info) throw new Error(`\`❌\` ID: \`\`${backup_id}\`\` Não é um bakcup.`)

            const date = new Date(info.data.createdTimestamp)
            const yyyy = date.getFullYear().toString(), mm = (date.getMonth()+1).toString(), dd = date.getDate().toString();
            const formatedDate = `${(dd[1]?dd:"0"+dd[0])}/${(mm[1]?mm:"0"+mm[0])}/${yyyy}`;
            const embed = new MessageEmbed()
              .setAuthor("Backup Informações")
              // Backup ID
              .addField("❯ ID", `\`${info.id}\``, false)
              // Exibe o server de onde esse backup pertence
              .addField("❯ Server Nome/ID", `\`${info.data.name}\`,\`${info.data.guildID}\``, false)
              // Exibe o tamanho (em mb) do backup
              .addField("❯ Tamanho", `\`${info.size} Kb\` | \`${(info.size/1000).toFixed(2)} Mb\` | \`${(info.size/10000).toFixed(2)} Gb\``, false)
              // Exibe quando o backup foi criado
              .addField("❯ Criado em", `\`${formatedDate}\``, false)

              .setThumbnail(
                client.guilds.cache.find(guilda => guilda.name === info.data.name).iconURL({ dynamic: true })
              )
              .setColor('#2F3136')
            await interaction.followUp({
              embeds: [embed]
            })
          }
      }
    } catch(e) {
      return interaction.followUp(e.message)
    }
  }
}