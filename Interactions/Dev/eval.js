const Interaction = require('../../Structures/Interaction.js'),
{ inspect } = require('util'),
{ MessageEmbed } = require('discord.js'),
{ MongoClient } = require('mongodb'),
{ writeFileSync, unlinkSync } = require('fs');

module.exports = class EvalInteraction extends Interaction {
  constructor() {
    super("eval", {
      type: 1,
      description: 'Executar códigos, apenas devs podem usar isso',
      defaultPermission: true,
      options: [
        {
          name: 'código',
          description: 'Código a ser executado',
          type: "STRING",
          required: true
        },
        {
          name: 'discord',
          description: 'Declarar as variaveis do discord (MessageEmbed, MessageAttachment ...)',
          type: "BOOLEAN",
          required: false
        },
        {
          name: 'database',
          description: 'Conectar ao mongoClient criando a variavel "mongoClient"',
          type: "BOOLEAN",
          required: false
        },
        {
          name: 'mobile',
          description: 'Caso seja muito grande a resposta e você esteja no celular isso pode ajudar',
          type: "BOOLEAN",
          required: false
        }
      ],
      beta: true,
      channelTypes: ["GUILD_TEXT", "DM"]
    })
  }

  async execute({ interaction, args, client }) {
    const embedEval = new MessageEmbed()
    let attachment = Boolean

    try {
      let execute = ''
      if (args.getBoolean('discord')) execute += '\nrequire("discord.js")'
      if (args.getBoolean('database')) execute += `\nconst mongoClient = new MongoClient('${process.env["mongoToken"]}')\n`
      let retorno = inspect(eval(`${execute}\n${args.getString('código')}`))

      if (retorno.length > 999) {
        attachment = true
        writeFileSync(`${interaction.user.username}.js`, retorno)
        if (args.getBoolean('mobile')) embedEval.addField("Retorno", `\`\`\`js\n${retorno.slice(0, 999)}\`\`\``)
      } else {
        attachment = false
        embedEval.addField("Retorno", `\`\`\`js\n${retorno}\`\`\``)
      }
      embedEval
        .setTitle("Eval")
        .setColor("#2F3136")
    } catch (e) {

      if (e.message.length > 999) {
        attachment = true
        writeFileSync(`${interaction.user.username}.js`, e.message)
        if (args[3]?.value) embedEval.addField("Retorno", `\`\`\`js\n${e.message.slice(0, 999)}\`\`\``)
      } else {
        attachment = false
        embedEval.addField("Retorno", `\`\`\`js\n${e.message}\`\`\``)
      }

      embedEval 
        .setTitle(e.name)
        .setColor("#FF0000")

    } finally {
      interaction.reply({
        files: attachment ? [`${interaction.user.username}.js`] : [],
        embeds: [embedEval]
      })
        .then(() => {
          if (attachment) unlinkSync(`${interaction.user.username}.js`)
        })
    }
  }
}