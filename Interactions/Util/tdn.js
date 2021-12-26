const Interaction = require('../../Structures/Interaction.js')
const { MessageActionRow, MessageButton, Permissions } = require("discord.js")
const { createCanvas, loadImage, registerFont } = require('canvas')
const { applyText } = require('../../Util/canvasUtil.js')
const options = require('./json/optionsTdn.json')

module.exports = class TdnInteraction extends Interaction {
  constructor() {
    super("tdn", {
      type: 1,
      defaultPermission: true,
      options,
      description: "Calcular FC, IC, IR, PR, PS, PB, PL, conversão_de_medidas, PL_ (pcoz/ic)",
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, args }) {

    const canvas = createCanvas(200, 200)
    const ctx = canvas.getContext('2d')
    registerFont(process.cwd() + '/Files/Fonts/Robgraves-lKYV.ttf', { family: 'Robgraves' })

    const image = await loadImage(process.cwd() + '/Files/Images/quadro-vazio.png')
    ctx.drawImage(image, 0, 0, 200, 200)

    ctx.fillStyle = interaction.member.displayHexColor
    ctx.strokeStyle = 'black'
  
    let [value1, value2] = args._hoistedOptions
    console.log(value1, value2)

    let name1 = args.getSubcommand()
    value1 = value1.value
    value2 = value2?.value
    
    let t;
    switch(name1) {
      case 'fc':
        if (value1 < value2) return await interaction.reply({ // pl > pb
          content: `Como é possívelo \`pl\` (${value2}) ser maior que o \`pb\` (${value1})?`,
          ephemeral: true
        })
  
        t = (value1/value2).toFixed(2)
        break;
      case 'pl':
        if (value1 < value2) return await interaction.reply({ // pb > fc
          content: `Como é possível o \`FC\` (${value2}) for maior que o \`pb\` (${value1})?`,
          ephemeral: true
        })

        t = (value1/value2).toFixed(2)
        break;
      case 'pb':
        if (value1 < value2) return await interaction.reply({ // pl < fc
          content: `Como é possível o \`FC\` (${value2}) for maior que o \`pl\` (${value1})?`,
          ephemeral: true
        })

        t = (value1*value2).toFixed(2)
        break;
      case 'pcoz':
      case 'pr':
      case 'rendimento':
        t = (value1*value2).toFixed(2)
        break;
      case 'pl_':
      case 'ic':
      case 'ir':
      case 'ps':
      case 'per_capta_liquído':
      case 'per_capta_bruto':
        t = (value1/value2).toFixed(2)
        break;
      case 'conversão_de_medidas':
        switch (value1) {
          case 'quilograma_para_grama':
          case 'grama_para_miligrama':
            t = value1*1000
            break;
          case 'grama_para_quilograma':
          case 'miligrama_para_grama':
            t = value1/1000
            break;
          case 'miligrama_para_quilograma':
            t = value1/1e+6
            break;
          case 'quilograma_para_miligrama':
            t = value1*1e+6
            break
          default:
            await interaction.reply({ content: 'Ocorreu algum erro!', ephemeral: true})
        }
        break;
      default:
        await interaction.reply({ content: 'Ocorreu algum erro ao pegar a interação', ephemeral: true })
    }

    ctx.font = applyText(canvas, ctx, t, 'Robgraves', 40)
    ctx.fillText(t, 50, 100)
    ctx.lineWidth = 0.5
    ctx.strokeText(t, 50, 100)
    
    interaction.deferReply()
    return await interaction.followUp({
      files: [
        {
          attachment: canvas.toBuffer(),
          name: `${name1 ? name1 : args.name}.png`
        }
      ]
    })
  }
}