const Interaction = require('../../Structures/Interaction.js')
const { MessageEmbed } = require('discord.js')
const { XMLHttpRequest } = require('xmlhttprequest')
const { regexLink } = require('../../Util/util.js')

module.exports = class YoutubeVideoInteraction extends Interaction {
  constructor() {
    super("youtube_downloader", {
      type: 1,
      description: 'Baixar vídeos do youtube',
      defaultPermission: true,
      options: [
        {
          name: 'link',
          description: 'Link do vídeo do youtube',
          type: "STRING",
          required: true
        }
      ],
      beta: true,
      channelTypes: ["GUILD_TEXT"]
    })
  }

  async execute({ interaction, args, client }) {
    const ephemeral = true
    interaction.deferReply({ ephemeral })
    const linkExample = args.getString('link')
    const regex = regexLink(linkExample)

    if (!regex || !regex.groups.dominio.startsWith('youtu')) return interaction.followUp({
      content: ":x: Link do youtube inválido",
      ephemeral
    })

    const videoId = regex.groups.caminho.replace("/", "").split(/(watch\?v=)/).pop()
    const head = {
      "accept": "*/*",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "Referer": "https://yt1s.com/pt4/youtube-to-mp3"
    }

    const httpRequest = new XMLHttpRequest()
    let open = httpRequest.open("POST", "https://yt1s.com/api/ajaxConvert/convert")
    console.log("Regex", videoId ?? "nada")
    console.log("httpRequest", httpRequest)
    console.log("open", open)

    Object.entries(head).forEach(h => httpRequest.setRequestHeader(h[0], h[1]))
    httpRequest.send(`vid=${videoId}&k=0LDuUBGFcevzRYKBCptrzxBmPRF1HVud5l7v3sVU68OOkTmIWvXo4muKJz2BjvhAzA%3D%3D`)

    httpRequest.onload = async function(res) {
      console.log("httpRequest onload", httpRequest)
      if (!res?.hasOwnProperty("target")) res = JSON.parse(httpRequest.responseText)
      console.log("res", res)
      if (!res?.hasOwnProperty("dlink")) return interaction.followUp({
        content: "Ocorreu algum erro na hora de pegar o link",
        ephemeral: true
      })

      await interaction.followUp({
        embeds: [
          new MessageEmbed()
            .setTitle("Link para download")
            .setURL(res.dlink)
        ]
      })
    }

    httpRequest.onerror = function() {
      return interaction.followUp({
        content: ":x: Ocorreu um erro!",
        ephemeral: true
      })
    }
  }
}