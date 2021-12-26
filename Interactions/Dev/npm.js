const Interaction = require('../../Structures/Interaction.js')
const { exec } = require('child_process')
const { MessageEmbed } = require('discord.js')
const { randomColor } = require('../../Util/canvasUtil.js')
const { inspect } = require('util')

module.exports = class NpmInteraction extends Interaction {
  constructor() {
    super("npm", {
      type: 1,
      description: 'Baixar um pacote ou desinstalar um pacote npm.',
      defaultPermission: true,
      options: [
        {
          name: 'ação',
          description: 'Escolher a ação para a lib, instalar ou desinstalar',
          type: "STRING",
          required: true,
          choices: [
           {
              name: "Instalar",
              value: "install"
           },
           {
              name: "Desinstalar",
              value: "uninstall"
           }
          ]
        },
        {
          name: 'lib',
          description: 'Nome da lib para ser instalada/desinstalada.',
          type: "STRING",
          required: true
        },
      ],
      beta: true,
      channelTypes: ["GUILD_TEXT", "DM"]
    })
  }

  async execute({ interaction, args, client }) {
    interaction.deferReply({ ephemeral: true })

    exec('ls node_modules', (e, libs, sder) => {
      const iU = args.getString('ação')
      const lib = args.getString('lib')

      libs = libs.split('\n')
      if (iU === 'uninstall' && !libs.includes(lib)) return interaction.followUp({
        content: ":x: Não tenho essa lib baixada"
      })

      exec(`npm ${iU} ${lib}`, (error, stdout, stderr) => {
        const embedChild = new MessageEmbed()
          .setTitle(`\`npm ${iU} ${lib}\``)
          .setColor(randomColor())
          .setDescription(`\`\`\`js\n${stdout}\`\`\``)

        if(error) embedChild
          .setDescription(`\`\`\`js\n${error}\`\`\``)
          .addField('code', `\`\`\`py\n${stderr}\`\`\``)

        interaction.followUp({
          embeds: [embedChild]
        })
      })
    })
  }
}