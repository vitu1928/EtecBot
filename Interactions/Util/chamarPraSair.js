const Interaction = require('../../Structures/Interaction.js')
const { MessageActionRow, MessageButton, MessageEmbed, MessageAttachment } = require('discord.js')
const { drawHeart, applyText } = require('../../Util/canvasUtil.js');
const { createCanvas, loadImage, registerFont } = require('canvas')

module.exports = class ChamaPraSairInteraction extends Interaction {
  constructor() {
    super("Chamar para sair", {
      type: 2,
      defaultPermission: true,
      options: [],
      beta: false
    })
  }
  
  async execute({ interaction, args, client }) {
    await interaction.deferReply({ ephemeral: true })

    const { amores } = client
    const authorId = interaction.user.id 
    
    if (authorId == args.getUser('user').id) return await interaction.followUp("a")

    if (amores.has(authorId)) return await interaction.followUp(`Tu já tem uma pessoa em espera (<@${amores.get(authorId)[1]}>), seu safado, sempre dando em cima de vários`)

    try {
      const urlUser = `https://discord.com/users/${authorId}`
      const avatarUser = (user) => user.displayAvatarURL({
        format: 'png',
        size: 512,
        dynamic: false
      })

      const userInvitado = await client.users.cache.get(args.getUser('user').id)
      
      const canvas = createCanvas(455, 258)
      const ctx = canvas.getContext('2d')
      registerFont(process.cwd() + '/Files/Fonts/Filxgirl.TTF', { family: 'Filxgirl' })


      const arrLove = ['amor.jpg', 'amor background.jpg', 'love amor.jpg', 'love background.jpg']
      const backgroundLove = await loadImage(process.cwd() + `/Files/Images/${arrLove[~~(Math.random() * arrLove.length)]}`)
      ctx.drawImage(backgroundLove, 0, 0, canvas.width, canvas.height)

      function loadAvatar(circleX, circleY, avatarImage, avatarPositionX, avatarPositionY, avatarW, avatarH) {
        ctx.save()
        ctx.beginPath()

        ctx.arc(circleX, circleY, 50, 0, Math.PI*2, true)
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 15; 
        ctx.strokeStyle = 'pink'

        ctx.closePath()
        ctx.clip()

        ctx.drawImage(avatarImage, avatarPositionX, avatarPositionY, avatarW, avatarH)

        
        ctx.beginPath()
        ctx.arc(0, 0, 2, 0, Math.PI*2, true)
        ctx.clip()
        ctx.closePath()
        ctx.restore()
      }

      loadAvatar(100, 120, await loadImage(avatarUser(interaction.user)), 50, 70, 100, 100)
      loadAvatar(350, 120, await loadImage(avatarUser(userInvitado)), 300, 70, 100, 100)

      drawHeart(220, 70, 100, 100, '#f29df5', ctx, interaction.member.displayHexColor)

      ctx.fillStyle = interaction.member.displayHexColor
      ctx.strokeStyle = 'black'
      ctx.font = applyText(canvas, ctx, interaction.user.username, 'Filxgirl', 40)
      ctx.fillText(interaction.user.username, 50, 50)
      ctx.fillText(userInvitado.username, 300, 50)

      const invitadoDm = await userInvitado.createDM()

      const buttonSim = new MessageButton()
        .setCustomId("sim")
        .setEmoji("💌")
        .setLabel("Queroh")
        .setStyle("SUCCESS")

      const buttonNão = new MessageButton()
        .setCustomId("não")
        .setEmoji("🤢")
        .setLabel("Ecah")
        .setStyle("DANGER")

      const buttonLink = new MessageButton()
        .setLabel("Safado que tá te chamando")
        .setStyle("LINK")
        .setURL(urlUser)

      const invitadoMessage = await userInvitado.send({
        content: "Oieh gata",
        embeds: [
          new MessageEmbed()
            .setTitle("Estão te chamando pra sair :flushed: :heart:")
            .setDescription("Aceitás esse convite para sair :point_right::point_left:")
            .setThumbnail("https://discord.com/assets/cf61cc6cbb5934d4d0e9c426f5b17d8a.svg")
            .setColor('#ffcbdb')
            .setAuthor(interaction.user.username, avatarUser(interaction.user), urlUser)
            .setImage('attachment://canvasAmor.jpg')
        ],
        components: [
          new MessageActionRow().addComponents(
            buttonSim, buttonNão, buttonLink,              
          )
        ],
        files: [new MessageAttachment(canvas.toBuffer(), 'canvasAmor.jpg')]
      })
      amores.set(authorId, [authorId, userInvitado.id])
      await interaction.followUp({
        content: "Enviado :flushed:📨"
      })
      
      const invitadoFilter = (inter) => {
        inter.deferUpdate()
        return ["sim", "não"].includes(inter.customId)
      }

      const collectorInvitado = invitadoMessage.createMessageComponentCollector({
        filter: invitadoFilter,
        max: 1,
        idle: 12e5,
        componentType: 'BUTTON'
      })
      
      collectorInvitado.on('collect', async i => {
        switch(i.customId) {
          case 'sim':
            await i.followUp({
              content: "Gasoso, acabei de fala pra elx que sinnnh",
            })
            await interaction.channel.send(`Iiii vai ter saidinha de amor do ${interaction.user} e ${userInvitado}`)
            break;
          case 'não':
            await i.followUp({
              content: "Nossa, grosso",
            })
            await interaction.channel.send(`Cuidado gente, temos um quebra romances entre nós || ${userInvitado} ||`)
            break;
        }
        collectorInvitado.stop()
      })

      collectorInvitado.on('end', async () => {
        amores.delete(authorId)
        await invitadoMessage.edit({
            content: "Demorastes? Ligue para ele de volta antes que seja tarde ... 💔",
            components: [
              new MessageActionRow().addComponents(
                buttonSim.setDisabled(),
                buttonNão.setDisabled(),
                buttonLink
              )
            ]
          })
      })
    } catch (e) {
      interaction.followUp({
        content: "Não consegui convida-lo para sair :cry::x::love_letter: Coyta, talvez a dm esteja fechada",
        ephemeral: true
      })

      console.log(e)
    }
  }
}